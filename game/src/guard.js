// Guard: patrols waypoints, watches a vision cone, and reacts to what it
// sees and hears. States: patrol -> suspicious -> chase, or patrol ->
// investigate (a noise) -> patrol. Suspicion fills while the player is
// visible in the cone and drains while hidden; a full meter means chase.

import {
  TILE, GUARD_RANGE, GUARD_HALF_ANGLE, GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED, GUARD_INVESTIGATE_SPEED, SUSPICION_FILL,
  SUSPICION_DRAIN, SNEAK_VISIBILITY, CHASE_MEMORY,
} from './config.js';
import { moveCircle, hasLineOfSight, conePolygon } from './world.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createGuard(def) {
  const spawn = { x: def.spawn[0] * TILE + TILE / 2, y: def.spawn[1] * TILE + TILE / 2 };
  const patrol = def.patrol.map(([x, y]) => ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 }));
  return {
    x: spawn.x,
    y: spawn.y,
    angle: 0,
    patrol,
    waypoint: 1 % patrol.length,
    state: 'patrol', // patrol | suspicious | chase | investigate
    suspicion: 0,
    lastSeen: null,
    investigateTarget: null,
    lookTimer: 0,
    lostTimer: 0,
    caughtPlayer: false,
  };
}

// Can this guard see the player right now? Range, cone angle, line of
// sight, and a sneaking player counts as farther away.
export function canSeePlayer(tiles, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = GUARD_RANGE * (player.sneaking ? SNEAK_VISIBILITY : 1);
  if (dist > range) return false;
  if (dist > 26) {
    const toPlayer = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(toPlayer, guard.angle)) > GUARD_HALF_ANGLE) return false;
  }
  return hasLineOfSight(tiles, guard.x, guard.y, player.x, player.y);
}

function stepToward(tiles, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.angle = Math.atan2(dy, dx);
  moveCircle(tiles, guard, (dx / dist) * step, (dy / dist) * step, 13);
  return Math.hypot(tx - guard.x, ty - guard.y) < 4;
}

export function updateGuard(tiles, guard, player, dt, events) {
  const sees = canSeePlayer(tiles, guard, player);
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);

  if (sees) {
    guard.lastSeen = { x: player.x, y: player.y };
    guard.lostTimer = 0;
    // Closer prey is spotted faster; sneaking slows the fill.
    const closeness = 1 - (dist / (GUARD_RANGE * (player.sneaking ? SNEAK_VISIBILITY : 1))) * 0.6;
    guard.suspicion = Math.min(1, guard.suspicion + SUSPICION_FILL * closeness * dt);
    if (guard.suspicion >= 1 && guard.state !== 'chase') {
      guard.state = 'chase';
      events.push({ type: 'alert', x: guard.x, y: guard.y });
    } else if (guard.suspicion >= 0.35 && guard.state === 'patrol') {
      guard.state = 'suspicious';
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DRAIN * dt);
    if (guard.state === 'suspicious' && guard.suspicion < 0.15) guard.state = 'patrol';
  }

  if (guard.state === 'chase') {
    if (sees) {
      stepToward(tiles, guard, player.x, player.y, GUARD_CHASE_SPEED, dt);
    } else {
      guard.lostTimer += dt;
      if (guard.lastSeen) stepToward(tiles, guard, guard.lastSeen.x, guard.lastSeen.y, GUARD_CHASE_SPEED, dt);
      if (guard.lostTimer > CHASE_MEMORY) {
        guard.state = 'investigate';
        guard.investigateTarget = guard.lastSeen ? { ...guard.lastSeen } : { x: guard.x, y: guard.y };
        guard.lookTimer = 0;
      }
    }
    if (dist < 26) guard.caughtPlayer = true;
    return;
  }

  if (guard.state === 'investigate') {
    if (guard.investigateTarget) {
      const arrived = stepToward(tiles, guard, guard.investigateTarget.x, guard.investigateTarget.y, GUARD_INVESTIGATE_SPEED, dt);
      if (arrived) {
        // Look around for a moment, then give up and walk back to patrol.
        guard.lookTimer += dt;
        guard.angle += dt * 1.6;
        if (guard.lookTimer > 2.2) {
          guard.state = 'patrol';
          guard.investigateTarget = null;
          guard.suspicion = 0;
        }
      }
    }
    return;
  }

  if (guard.state === 'suspicious') {
    // Freeze and stare at where the player was glimpsed.
    if (guard.lastSeen) guard.angle = Math.atan2(guard.lastSeen.y - guard.y, guard.lastSeen.x - guard.x);
    return;
  }

  // Patrol: walk the loop, pausing briefly at each waypoint.
  const target = guard.patrol[guard.waypoint];
  const arrived = stepToward(tiles, guard, target.x, target.y, GUARD_PATROL_SPEED, dt);
  if (arrived) guard.waypoint = (guard.waypoint + 1) % guard.patrol.length;
}

export function sendGuardToNoise(guard, x, y) {
  if (guard.state === 'chase') return;
  guard.state = 'investigate';
  guard.investigateTarget = { x, y };
  guard.lookTimer = 0;
  if (guard.suspicion < 0.3) guard.suspicion = 0.3;
}

export function guardCone(tiles, guard) {
  return conePolygon(tiles, guard.x, guard.y, guard.angle, GUARD_HALF_ANGLE, GUARD_RANGE);
}
