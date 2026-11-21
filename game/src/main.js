// Bootstrap: wire the canvas, input and game together and run the loop.
// With ?shot=<name> the page renders one frozen frame of that preset for
// screenshots/ and exposes it for inspection instead of starting the loop.

import { createInput } from './input.js';
import { createGame } from './game.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const input = createInput(canvas);
const game = createGame(canvas, input);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

// A handle for play-testing and screenshots: the live state, the screen,
// and a one-line summary of what is happening right now.
window.__stealth = {
  game,
  state: game.state,
  ready: false,
  summary() {
    const s = game.state;
    return {
      screen: s.screen,
      level: s.levelIndex + 1,
      player: { x: Math.round(s.player.x), y: Math.round(s.player.y) },
      relics: `${s.relicsTaken}/${s.relicTotal}`,
      coins: s.coins,
      maxSuspicion: Number(s.maxSuspicion.toFixed(2)),
      guardStates: s.guards.map((g) => g.state),
      score: s.score,
      elapsed: Number(s.elapsed.toFixed(1)),
    };
  },
};

if (shot) {
  applyShot(game, shot);
  // One frozen frame at a fixed time, so the same shot always looks the same.
  game.draw(1.23);
  window.__stealth.ready = true;
} else {
  let last = performance.now();
  let t = 0;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    t += dt;
    game.update(dt);
    game.draw(t);
    window.__stealth.ready = true;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
