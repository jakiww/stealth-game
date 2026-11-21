// Screenshot presets: frozen mid-game states the maker renders for
// screenshots/. Each one drives the same state machine the player uses —
// a level loaded, then the player, guards and relics placed — so the shot
// is a real render of the game's own code, not a mockup.
//   ?shot=cover  — level 1, Wren sneaking behind a crate as a cone sweeps past
//   ?shot=sneak  — level 2, a guard half-suspicious, Wren frozen mid-room
//   ?shot=alert  — level 3, a chase: red cone, Wren running for the door
//   ?shot=exit   — level 2 cleared: the clean-getaway panel with the bonus

import { TILE } from './config.js';

function at(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function takeRelics(game, count) {
  const s = game.state;
  for (let i = 0; i < count && i < s.relics.length; i++) {
    s.relics[i].taken = true;
  }
  s.relicsTaken = Math.min(count, s.relics.length);
  s.score = s.relicsTaken * 250;
  if (s.relicsTaken === s.relicTotal) {
    s.unlocked = true;
  }
}

export function applyShot(game, name) {
  const s = game.state;
  if (name === 'cover') {
    game.loadLevel(0);
    takeRelics(game, 1);
    const p = at(8, 6);
    s.player.x = p.x; s.player.y = p.y;
    s.player.sneaking = true;
    s.player.facing = Math.PI;
    const g = s.guards[0];
    const gp = at(14, 6);
    g.x = gp.x; g.y = gp.y;
    g.angle = Math.PI; // looking left, toward Wren's crate
    g.state = 'suspicious';
    g.suspicion = 0.45;
    g.lastSeen = { x: p.x, y: p.y };
    s.screen = 'playing';
  } else if (name === 'sneak') {
    game.loadLevel(1);
    takeRelics(game, 2);
    const p = at(16, 8);
    s.player.x = p.x; s.player.y = p.y;
    s.player.sneaking = true;
    s.player.facing = Math.PI / 2;
    const g = s.guards[0];
    const gp = at(12, 7);
    g.x = gp.x; g.y = gp.y;
    g.angle = 0; // looking right, straight at Wren
    g.state = 'suspicious';
    g.suspicion = 0.62;
    g.lastSeen = { x: p.x, y: p.y };
    s.screen = 'playing';
  } else if (name === 'alert') {
    game.loadLevel(2);
    takeRelics(game, 4);
    s.coins = 1;
    s.player.coins = 1;
    const p = at(24, 11);
    s.player.x = p.x; s.player.y = p.y;
    s.player.facing = 0;
    s.player.moving = true;
    const g = s.guards[1];
    const gp = at(20, 11);
    g.x = gp.x; g.y = gp.y;
    g.angle = 0; // chasing Wren down the hall
    g.state = 'chase';
    g.suspicion = 1;
    g.lastSeen = { x: p.x, y: p.y };
    s.maxSuspicion = 1;
    s.screen = 'playing';
  } else if (name === 'exit') {
    game.loadLevel(1);
    takeRelics(game, s.relicTotal);
    s.score = 1000;
    s.lastBonus = 740;
    s.score += s.lastBonus;
    s.elapsed = 96;
    s.screen = 'levelclear';
  } else {
    game.loadLevel(0);
    s.screen = 'title';
  }
}

export const SHOT_NAMES = ['cover', 'sneak', 'alert', 'exit'];
