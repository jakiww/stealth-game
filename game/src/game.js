// Game: the state machine of The Quiet Gallery. One game object owns the
// level, the player, the guards, the score and the screen (title, playing,
// paused, caught, level clear, win), and turns input into all of it.

import {
  LEVELS, COIN_NOISE_RADIUS, COIN_START,
} from './config.js';
import { parseLevel } from './world.js';
import { createGuard, updateGuard, sendGuardToNoise } from './guard.js';
import { createPlayer, updatePlayer, throwCoin, playerNoiseRadius } from './player.js';
import { drawGame, WORLD_OY } from './render.js';
import { sfx, ensureAudio, toggleMute, isMuted } from './audio.js';

function formatTime(totalSeconds) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function createGame(canvas, input) {
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');

  const state = {
    screen: 'title',
    levelIndex: 0,
    levelCount: LEVELS.length,
    level: LEVELS[0],
    tiles: null,
    relics: [],
    exit: null,
    unlocked: false,
    relicTotal: 0,
    relicsTaken: 0,
    player: null,
    guards: [],
    coinsOnGround: [],
    coins: COIN_START,
    noiseRadius: 0,
    maxSuspicion: 0,
    elapsed: 0,
    totalElapsed: 0,
    score: 0,
    lastBonus: 0,
    totalTime: '00:00',
    spottedThisLevel: false,
    _buttons: [],
    _noiseCooldown: 0,
  };

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function loadLevel(index) {
    const def = LEVELS[index];
    const parsed = parseLevel(def);
    state.levelIndex = index;
    state.level = def;
    state.tiles = parsed.tiles;
    state.relics = parsed.relics;
    state.exit = parsed.exit;
    state.unlocked = false;
    state.relicTotal = parsed.relics.length;
    state.relicsTaken = 0;
    state.player = createPlayer(parsed.playerStart);
    state.player.coins = COIN_START;
    state.coins = COIN_START;
    state.guards = def.guards.map(createGuard);
    state.coinsOnGround = [];
    state.noiseRadius = 0;
    state.maxSuspicion = 0;
    state.elapsed = 0;
    state.spottedThisLevel = false;
    state.screen = 'playing';
    setStatus(`${def.name}. ${def.intro}`);
  }

  function restartAll() {
    state.score = 0;
    state.totalElapsed = 0;
    loadLevel(0);
  }

  function levelClear() {
    const timeBonus = Math.max(0, 600 - Math.floor(state.elapsed) * 5);
    const ghostBonus = state.spottedThisLevel ? 0 : 500;
    const coinBonus = state.coins * 50;
    state.lastBonus = timeBonus + ghostBonus + coinBonus;
    state.score += state.lastBonus;
    state.totalElapsed += state.elapsed;
    sfx.levelClear();
    if (state.levelIndex + 1 >= LEVELS.length) {
      state.totalTime = formatTime(state.totalElapsed);
      state.screen = 'win';
      sfx.win();
      setStatus(`You stole the whole collection. Final score ${state.score}.`);
    } else {
      state.screen = 'levelclear';
      setStatus(`${state.level.name} cleared. Bonus ${state.lastBonus}. Score ${state.score}.`);
    }
  }

  function handlePlayingClick(click) {
    // Clicks inside the world throw a coin; clicks on the HUD do nothing.
    const wx = click.x;
    const wy = click.y - WORLD_OY;
    if (wy < 0 || wy > 720 || wx < 0 || wx > 1280) return;
    const landing = throwCoin(state.player, wx, wy);
    if (!landing) {
      setStatus('Out of coins.');
      return;
    }
    state.coins = state.player.coins;
    state.coinsOnGround.push({ x: landing.x, y: landing.y, born: state._time });
    sfx.coin();
    for (const guard of state.guards) {
      const d = Math.hypot(guard.x - landing.x, guard.y - landing.y);
      if (d < COIN_NOISE_RADIUS) sendGuardToNoise(guard, landing.x, landing.y);
    }
  }

  function handleMenuClick(click) {
    for (const b of state._buttons) {
      if (!b.rect) continue;
      const r = b.rect;
      if (click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h) {
        return b.label;
      }
    }
    return null;
  }

  function update(dt) {
    state._time = (state._time || 0) + dt;

    if (input.takeAction('mute')) {
      const m = toggleMute();
      setStatus(m ? 'Sound off.' : 'Sound on.');
    }

    if (state.screen === 'title') {
      if (input.takeAction('confirm')) {
        ensureAudio();
        state.score = 0;
        state.totalElapsed = 0;
        loadLevel(0);
        return;
      }
      for (const click of input.takeClicks()) {
        if (handleMenuClick(click)) {
          ensureAudio();
          state.score = 0;
          state.totalElapsed = 0;
          loadLevel(0);
          return;
        }
      }
      return;
    }

    if (state.screen === 'paused') {
      if (input.takeAction('pause') || input.takeAction('confirm')) {
        state.screen = 'playing';
        setStatus('Back to the heist.');
      }
      for (const click of input.takeClicks()) {
        if (handleMenuClick(click)) { state.screen = 'playing'; }
      }
      return;
    }

    if (state.screen === 'caught') {
      if (input.takeAction('restart') || input.takeAction('confirm')) loadLevel(state.levelIndex);
      for (const click of input.takeClicks()) {
        if (handleMenuClick(click)) loadLevel(state.levelIndex);
      }
      return;
    }

    if (state.screen === 'levelclear') {
      if (input.takeAction('confirm')) { loadLevel(state.levelIndex + 1); return; }
      for (const click of input.takeClicks()) {
        if (handleMenuClick(click)) { loadLevel(state.levelIndex + 1); return; }
      }
      return;
    }

    if (state.screen === 'win') {
      if (input.takeAction('restart') || input.takeAction('confirm')) restartAll();
      for (const click of input.takeClicks()) {
        if (handleMenuClick(click)) restartAll();
      }
      return;
    }

    // --- playing ---
    if (input.takeAction('pause')) {
      state.screen = 'paused';
      setStatus('Paused.');
      return;
    }
    if (input.takeAction('restart')) {
      loadLevel(state.levelIndex);
      return;
    }
    for (const click of input.takeClicks()) handlePlayingClick(click);

    state.elapsed += dt;
    const events = [];
    updatePlayer(state.tiles, state.player, input, dt, events);
    for (const e of events) {
      if (e.type === 'step') sfx.step();
    }

    // Running rings a noise circle; nearby patrolling guards come to look.
    state.noiseRadius = playerNoiseRadius(state.player);
    state._noiseCooldown -= dt;
    if (state.noiseRadius > 0 && state._noiseCooldown <= 0) {
      state._noiseCooldown = 1.2;
      for (const guard of state.guards) {
        if (guard.state !== 'patrol') continue;
        const d = Math.hypot(guard.x - state.player.x, guard.y - state.player.y);
        if (d < state.noiseRadius + 30) {
          sendGuardToNoise(guard, state.player.x, state.player.y);
        }
      }
    }

    let maxSuspicion = 0;
    for (const guard of state.guards) {
      updateGuard(state.tiles, guard, state.player, dt, events);
      maxSuspicion = Math.max(maxSuspicion, guard.suspicion);
      if (guard.state === 'chase') state.spottedThisLevel = true;
      if (guard.caughtPlayer) {
        state.screen = 'caught';
        sfx.caught();
        setStatus('Caught! Press R to try the level again.');
        state.maxSuspicion = 1;
        return;
      }
    }
    for (const e of events) {
      if (e.type === 'alert') sfx.alert();
    }
    state.maxSuspicion = maxSuspicion;

    // Pick up relics.
    for (const relic of state.relics) {
      if (relic.taken) continue;
      if (Math.hypot(relic.x - state.player.x, relic.y - state.player.y) < 28) {
        relic.taken = true;
        state.relicsTaken += 1;
        state.score += 250;
        sfx.pickup();
        setStatus(`Relic ${state.relicsTaken} of ${state.relicTotal}.`);
        if (state.relicsTaken === state.relicTotal) {
          state.unlocked = true;
          sfx.unlock();
          setStatus('Every relic taken. The green door is open — get out unseen.');
        }
      }
    }

    // Reach the unlocked exit.
    if (state.unlocked && state.exit) {
      if (Math.hypot(state.exit.x - state.player.x, state.exit.y - state.player.y) < 30) {
        levelClear();
      }
    }

    // A coin's ripple fades after a second.
    state.coinsOnGround = state.coinsOnGround.filter((c) => state._time - c.born < 1.2);
  }

  function draw(t) {
    drawGame(ctx, state, t);
  }

  // Load the first level's data so the title screen shows the gallery
  // behind its panel.
  loadLevel(0);
  state.screen = 'title';

  const game = {
    state,
    loadLevel,
    restartAll,
    update,
    draw,
    isMuted,
    formatTime,
  };
  return game;
}
