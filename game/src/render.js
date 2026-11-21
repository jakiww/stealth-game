// Render: every pixel of The Quiet Gallery, drawn with Canvas 2D.
// The world is 32 x 18 tiles of 40 px under a 56 px HUD bar; the canvas
// itself is 1280 x 800. Vision cones are raycast polygons clipped by
// walls and cover, so what a guard can see is exactly what you see lit.

import { TILE, COLS, ROWS, HUD_HEIGHT } from './config.js';
import { guardCone } from './guard.js';

export const WORLD_OX = 0;
export const WORLD_OY = 68;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

const FLOOR_A = '#2a2118';
const FLOOR_B = '#241c14';
const RUG = '#4a1f24';
const RUG_EDGE = '#6e2a30';
const WALL = '#3a3f4a';
const WALL_TOP = '#565d6d';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, tiles) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * TILE;
      const py = y * TILE;
      const ch = tiles[y][x];
      if (ch === '#') continue;
      ctx.fillStyle = (x + y) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(px, py, TILE, TILE);
      if (ch === ',') {
        ctx.fillStyle = RUG;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = RUG_EDGE;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10);
      }
      // faint plank lines on the wooden floor
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py + TILE / 2);
      ctx.lineTo(px + TILE, py + TILE / 2);
      ctx.stroke();
    }
  }
}

function drawWalls(ctx, tiles) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (tiles[y][x] !== '#') continue;
      const px = x * TILE;
      const py = y * TILE;
      ctx.fillStyle = WALL;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = WALL_TOP;
      ctx.fillRect(px, py, TILE, 5);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawCover(ctx, tiles, t) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = tiles[y][x];
      if (ch !== 'C' && ch !== 'S' && ch !== 'T' && ch !== 'D') continue;
      const px = x * TILE;
      const py = y * TILE;
      if (ch === 'C') {
        // wooden crate
        ctx.fillStyle = '#7a5a33';
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = '#54391d';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 3); ctx.lineTo(px + TILE - 3, py + TILE - 3);
        ctx.moveTo(px + TILE - 3, py + 3); ctx.lineTo(px + 3, py + TILE - 3);
        ctx.stroke();
      } else if (ch === 'S') {
        // bookshelf, spines facing the room
        ctx.fillStyle = '#4d3319';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        const colors = ['#a33', '#3a6', '#36c', '#c93', '#96c'];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = colors[(x * 3 + y * 2 + i) % colors.length];
          ctx.fillRect(px + 5 + i * 6, py + 6, 5, TILE - 12);
        }
        ctx.strokeStyle = '#2c1c0d';
        ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
      } else if (ch === 'T') {
        // marble statue on a pedestal
        ctx.fillStyle = '#5c5f66';
        ctx.fillRect(px + 8, py + 22, TILE - 16, TILE - 24);
        ctx.fillStyle = '#c8ccd4';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + 14, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(px + TILE / 2 - 5, py + 19, 10, 8);
      } else {
        // glass display case with a gold frame
        ctx.fillStyle = '#8a6d2f';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = 'rgba(180,220,255,0.35)';
        ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + TILE - 6); ctx.lineTo(px + TILE - 6, py + 6);
        ctx.stroke();
      }
    }
  }
  void t;
}

function drawRelics(ctx, relics, t) {
  for (const relic of relics) {
    if (relic.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(t * 3 + relic.x);
    const glow = ctx.createRadialGradient(relic.x, relic.y, 2, relic.x, relic.y, 30);
    glow.addColorStop(0, `rgba(255,215,90,${0.5 * pulse})`);
    glow.addColorStop(1, 'rgba(255,215,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y, 30, 0, Math.PI * 2);
    ctx.fill();
    // a little golden idol
    ctx.save();
    ctx.translate(relic.x, relic.y);
    ctx.rotate(Math.sin(t * 1.5 + relic.y) * 0.25);
    ctx.fillStyle = '#ffd75a';
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawExit(ctx, exit, unlocked, t) {
  const pulse = unlocked ? 0.6 + 0.4 * Math.sin(t * 4) : 0.25;
  const glow = ctx.createRadialGradient(exit.x, exit.y, 4, exit.x, exit.y, 46);
  glow.addColorStop(0, unlocked ? `rgba(80,255,140,${0.55 * pulse + 0.2})` : 'rgba(255,80,80,0.25)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(exit.x, exit.y, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = unlocked ? '#2f9e5f' : '#5a2a2a';
  roundRect(ctx, exit.x - 14, exit.y - 18, 28, 36, 4);
  ctx.fill();
  ctx.strokeStyle = unlocked ? '#7dffb0' : '#c05a5a';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!unlocked) {
    // chains across a locked door
    ctx.strokeStyle = '#d8b25a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(exit.x - 13, exit.y - 8); ctx.lineTo(exit.x + 13, exit.y + 8);
    ctx.moveTo(exit.x + 13, exit.y - 8); ctx.lineTo(exit.x - 13, exit.y + 8);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#eafff0';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x, exit.y + 30);
  }
}

function drawCoinMark(ctx, coin, t) {
  const age = t - coin.born;
  const r = 8 + age * 26;
  ctx.strokeStyle = `rgba(255,215,90,${Math.max(0, 0.8 - age * 0.9)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd75a';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, player, t) {
  const bob = player.moving ? Math.sin(t * 10) * 1.5 : 0;
  const r = player.sneaking ? 11 : 13;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  // soft shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // hooded cloak
  ctx.fillStyle = '#2e6f6a';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d4a46';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.7, r * 0.8);
  ctx.lineTo(-r * 0.7, r * 0.8);
  ctx.closePath();
  ctx.fill();
  // face in shadow, looking where the player faces
  ctx.fillStyle = '#0e1a18';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing) * 4, Math.sin(player.facing) * 4 - 1, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing) * 6, Math.sin(player.facing) * 6 - 2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(120,220,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGuard(ctx, tiles, guard, t) {
  const cone = guardCone(tiles, guard);
  const color = guard.state === 'chase'
    ? '255,60,60'
    : guard.state === 'investigate'
      ? '255,160,60'
      : guard.state === 'suspicious'
        ? '255,220,80'
        : '255,235,150';
  const alpha = guard.state === 'chase' ? 0.34 : guard.state === 'patrol' ? 0.16 : 0.26;
  ctx.fillStyle = `rgba(${color},${alpha})`;
  ctx.beginPath();
  ctx.moveTo(cone[0].x, cone[0].y);
  for (let i = 1; i < cone.length; i++) ctx.lineTo(cone[i].x, cone[i].y);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 13, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // navy uniform and cap
  ctx.fillStyle = '#2b3a67';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c2745';
  ctx.beginPath();
  ctx.arc(0, -3, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8b25a';
  ctx.fillRect(-9, -7, 18, 3);
  // facing tick
  ctx.strokeStyle = '#e8ecf5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.cos(guard.angle) * 8, Math.sin(guard.angle) * 8);
  ctx.lineTo(Math.cos(guard.angle) * 16, Math.sin(guard.angle) * 16);
  ctx.stroke();
  ctx.restore();

  // suspicion: a "?" while curious, a "!" while chasing, and a filling arc
  if (guard.state === 'suspicious' || guard.state === 'investigate') {
    ctx.fillStyle = '#ffd75a';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 24 + Math.sin(t * 4) * 2);
  }
  if (guard.state === 'chase') {
    ctx.fillStyle = '#ff5050';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 24);
  }
  if (guard.suspicion > 0.05 && guard.state !== 'chase') {
    ctx.strokeStyle = 'rgba(255,215,90,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 19, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, s) {
  ctx.fillStyle = '#10131c';
  ctx.fillRect(0, 0, 1280, HUD_HEIGHT);
  ctx.strokeStyle = '#2c3345';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT + 0.5);
  ctx.lineTo(1280, HUD_HEIGHT + 0.5);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText(s.level.name, 18, HUD_HEIGHT / 2 - 9);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#9aa3b5';
  ctx.fillText(`Level ${s.levelIndex + 1} of ${s.levelCount}`, 18, HUD_HEIGHT / 2 + 12);

  // relics collected
  let rx = 330;
  ctx.fillStyle = '#ffd75a';
  ctx.font = '15px sans-serif';
  ctx.fillText('Relics', rx, HUD_HEIGHT / 2);
  rx += 52;
  for (let i = 0; i < s.relicTotal; i++) {
    ctx.save();
    ctx.translate(rx + i * 24, HUD_HEIGHT / 2);
    ctx.fillStyle = i < s.relicsTaken ? '#ffd75a' : '#3a3f4a';
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // coins
  const cx = 560;
  ctx.fillStyle = '#ffd75a';
  ctx.beginPath();
  ctx.arc(cx, HUD_HEIGHT / 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '15px sans-serif';
  ctx.fillText(`× ${s.coins}`, cx + 12, HUD_HEIGHT / 2);

  // the watching eye: how close any guard is to spotting you
  const ex = 680;
  const danger = s.maxSuspicion;
  ctx.font = '15px sans-serif';
  ctx.fillStyle = danger > 0.7 ? '#ff7070' : '#e8ecf5';
  ctx.fillText('Seen', ex, HUD_HEIGHT / 2);
  ctx.fillStyle = '#232838';
  roundRect(ctx, ex + 48, HUD_HEIGHT / 2 - 7, 130, 14, 7);
  ctx.fill();
  ctx.fillStyle = danger > 0.7 ? '#ff5050' : danger > 0.3 ? '#ffb84d' : '#ffd75a';
  if (danger > 0.01) {
    roundRect(ctx, ex + 48, HUD_HEIGHT / 2 - 7, 130 * danger, 14, 7);
    ctx.fill();
  }

  // timer and score, right aligned
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 16px sans-serif';
  const mm = String(Math.floor(s.elapsed / 60)).padStart(2, '0');
  const ss = String(Math.floor(s.elapsed % 60)).padStart(2, '0');
  ctx.fillText(`${mm}:${ss}`, 1150, HUD_HEIGHT / 2 - 9);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#9aa3b5';
  ctx.fillText(`Score ${s.score}`, 1150, HUD_HEIGHT / 2 + 12);
  ctx.textAlign = 'left';
}

function drawPanel(ctx, title, lines, buttons) {
  ctx.fillStyle = 'rgba(5,7,12,0.72)';
  ctx.fillRect(0, 0, 1280, 800);
  const w = 620;
  const h = 130 + lines.length * 30 + (buttons ? 64 : 0);
  const x = (1280 - w) / 2;
  const y = (800 - h) / 2;
  ctx.fillStyle = '#141824';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = '#d8b25a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd75a';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(title, 640, y + 58);
  ctx.fillStyle = '#dfe4ee';
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, 640, y + 104 + i * 30));
  if (buttons) {
    buttons.forEach((b, i) => {
      const bw = 220;
      const bx = 640 - ((buttons.length * (bw + 16) - 16) / 2) + i * (bw + 16);
      const by = y + h - 52;
      ctx.fillStyle = '#2e6f6a';
      roundRect(ctx, bx, by, bw, 38, 8);
      ctx.fill();
      ctx.strokeStyle = '#7dd8c8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#eafff8';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(b.label, bx + bw / 2, by + 20);
      b.rect = { x: bx, y: by, w: bw, h: 38 };
    });
  }
  ctx.textAlign = 'left';
}

export function drawGame(ctx, s, t) {
  ctx.clearRect(0, 0, 1280, 800);
  ctx.fillStyle = '#0a0c12';
  ctx.fillRect(0, 0, 1280, 800);

  ctx.save();
  ctx.translate(WORLD_OX, WORLD_OY);
  drawFloor(ctx, s.tiles);
  drawRelics(ctx, s.relics, t);
  drawExit(ctx, s.exit, s.unlocked, t);
  for (const coin of s.coinsOnGround) drawCoinMark(ctx, coin, t);
  // the player's own noise ring while running
  if (s.noiseRadius > 0) {
    ctx.strokeStyle = 'rgba(160,200,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.player.x, s.player.y, s.noiseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawCover(ctx, s.tiles, t);
  drawWalls(ctx, s.tiles);
  for (const guard of s.guards) drawGuard(ctx, s.tiles, guard, t);
  drawPlayer(ctx, s.player, t);
  ctx.restore();

  // moonlight vignette over the playfield
  const vg = ctx.createRadialGradient(640, 430, 260, 640, 430, 760);
  vg.addColorStop(0, 'rgba(120,150,255,0)');
  vg.addColorStop(1, 'rgba(4,6,14,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, HUD_HEIGHT, 1280, 800 - HUD_HEIGHT);

  drawHud(ctx, s);

  s._buttons = [];
  if (s.screen === 'title') {
    const buttons = [{ label: 'Begin the heist  (Enter)' }];
    s._buttons = buttons;
    drawPanel(ctx, 'THE QUIET GALLERY', [
      'You are Wren, a relic retriever. The museum sleeps — almost.',
      'Sneak past the guards, take every relic, reach the green door unseen.',
      'WASD / arrows to move · Shift to sneak · Click to throw a coin and lure a guard',
      'A guard\'s cone is what it can see. Fill its suspicion meter and it will chase you.',
    ], buttons);
  } else if (s.screen === 'paused') {
    const buttons = [{ label: 'Resume  (P)' }];
    s._buttons = buttons;
    drawPanel(ctx, 'PAUSED', ['The gallery waits. The guards do not sleep.'], buttons);
  } else if (s.screen === 'caught') {
    const buttons = [{ label: 'Try again  (R)' }];
    s._buttons = buttons;
    drawPanel(ctx, 'CAUGHT!', [
      'A guard laid hands on Wren. The relics stay where they are.',
      `Level ${s.levelIndex + 1} restarts — the guards forget nothing, but neither do you.`,
    ], buttons);
  } else if (s.screen === 'levelclear') {
    const buttons = [{ label: 'Next level  (Enter)' }];
    s._buttons = buttons;
    drawPanel(ctx, 'CLEAN GETAWAY', [
      `${s.level.name} — every relic taken, no alarm that mattered.`,
      `Level bonus +${s.lastBonus}  ·  Score ${s.score}`,
    ], buttons);
  } else if (s.screen === 'win') {
    const buttons = [{ label: 'Play again  (R)' }];
    s._buttons = buttons;
    drawPanel(ctx, 'THE WHOLE COLLECTION', [
      'Every relic, every floor, never once dragged out by the guards.',
      `Final score ${s.score}  ·  Time ${s.totalTime}  ·  Coins left ${s.coins}`,
    ], buttons);
  }
}
