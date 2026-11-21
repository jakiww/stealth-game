// Player: Wren, the relic retriever. Walks with WASD or arrows, sneaks
// with Shift (slower, quieter, harder to spot), and throws coins with a
// mouse click to lure guards away. Running makes noise guards can hear.

import { TILE, PLAYER_SPEED, SNEAK_SPEED, NOISE_RADIUS, SNEAK_NOISE_RADIUS, COIN_RANGE, COIN_START } from './config.js';
import { moveCircle } from './world.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: 0,
    sneaking: false,
    moving: false,
    coins: COIN_START,
    stepTimer: 0,
  };
}

export function updatePlayer(tiles, player, input, dt, events) {
  const vec = input.moveVector();
  player.sneaking = input.sneaking();
  player.moving = vec !== null;
  if (vec) {
    const speed = player.sneaking ? SNEAK_SPEED : PLAYER_SPEED;
    player.facing = Math.atan2(vec.y, vec.x);
    moveCircle(tiles, player, vec.x * speed * dt, vec.y * speed * dt, 13);
    // Footsteps: a soft tick every stride, only while walking (never while sneaking).
    player.stepTimer -= dt;
    if (!player.sneaking && player.stepTimer <= 0) {
      player.stepTimer = 0.34;
      events.push({ type: 'step' });
    }
  }
  return player;
}

// A running player rings a noise circle guards can hear; sneaking is silent.
export function playerNoiseRadius(player) {
  if (!player.moving || player.sneaking) return SNEAK_NOISE_RADIUS;
  return NOISE_RADIUS;
}

// Throw a coin toward a clicked point: it lands at most COIN_RANGE away,
// clinks, and every guard in earshot comes to look. Returns the landing
// spot, or null when the player is out of coins.
export function throwCoin(player, clickX, clickY) {
  if (player.coins <= 0) return null;
  const dx = clickX - player.x;
  const dy = clickY - player.y;
  const dist = Math.hypot(dx, dy);
  const range = Math.min(dist, COIN_RANGE);
  const landing = dist < 1
    ? { x: player.x + 40, y: player.y }
    : { x: player.x + (dx / dist) * range, y: player.y + (dy / dist) * range };
  player.coins -= 1;
  return landing;
}

export function tileOf(player) {
  return { x: Math.floor(player.x / TILE), y: Math.floor(player.y / TILE) };
}
