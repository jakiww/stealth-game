// World: tile lookup, movement collision, line of sight and the vision-cone
// raycast. Walls and cover block both feet and eyes; rugs and floor do not.

import { TILE, COLS, ROWS } from './config.js';

export const BLOCK_MOVE = new Set(['#', 'C', 'S', 'T', 'D']);
export const BLOCK_SIGHT = new Set(['#', 'C', 'S', 'T', 'D']);

export function parseLevel(def) {
  const tiles = def.map.map((row) => row.split(''));
  let playerStart = null;
  let exit = null;
  const relics = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = tiles[y][x];
      if (ch === 'P') { playerStart = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 }; tiles[y][x] = '.'; }
      if (ch === 'E') { exit = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 }; tiles[y][x] = '.'; }
      if (ch === 'R') { relics.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, taken: false }); tiles[y][x] = '.'; }
    }
  }
  return { tiles, playerStart, exit, relics };
}

export function tileAt(tiles, px, py) {
  const x = Math.floor(px / TILE);
  const y = Math.floor(py / TILE);
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return '#';
  return tiles[y][x];
}

export function blocksMove(tiles, px, py) {
  return BLOCK_MOVE.has(tileAt(tiles, px, py));
}

export function blocksSight(tiles, px, py) {
  return BLOCK_SIGHT.has(tileAt(tiles, px, py));
}

// Slide a circle of radius r through the world: try the full step, then
// each axis alone, so the player slides along walls instead of sticking.
export function moveCircle(tiles, pos, dx, dy, r) {
  const tryAt = (x, y) => {
    const corners = [
      [x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r],
      [x, y - r], [x, y + r], [x - r, y], [x + r, y],
    ];
    return corners.every(([cx, cy]) => !blocksMove(tiles, cx, cy));
  };
  if (tryAt(pos.x + dx, pos.y + dy)) { pos.x += dx; pos.y += dy; return; }
  if (tryAt(pos.x + dx, pos.y)) { pos.x += dx; return; }
  if (tryAt(pos.x, pos.y + dy)) { pos.y += dy; }
}

// True when nothing blocks the straight segment from (x1, y1) to (x2, y2).
export function hasLineOfSight(tiles, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(tiles, x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

// Cast one ray from (x, y) along angle until it hits a sight blocker or
// reaches maxDist. Returns the hit point.
export function castRay(tiles, x, y, angle, maxDist) {
  const step = 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    const px = x + cos * d;
    const py = y + sin * d;
    if (blocksSight(tiles, px, py)) return { x: px, y: py };
  }
  return { x: x + cos * maxDist, y: y + sin * maxDist };
}

// The polygon of a vision cone: the guard's eye plus one raycast point per
// slice across the field of view, so walls and cover cut the cone short.
export function conePolygon(tiles, x, y, angle, halfAngle, range) {
  const points = [{ x, y }];
  const slices = 26;
  for (let i = 0; i <= slices; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / slices;
    points.push(castRay(tiles, x, y, a, range));
  }
  return points;
}
