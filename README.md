# The Quiet Gallery

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/jakiww/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/jakiww/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A complete top-down stealth game that plays offline in a desktop browser.
You are Wren, a relic retriever in a moonlit museum. Sneak past patrolling
guards, take every relic, and reach the green exit door unseen — across
three floors: the Moonlit Gallery, the Old Library, and the Vault Below.

## Play

- **Move:** WASD or arrow keys.
- **Sneak:** hold Shift — slower, silent, and harder for guards to spot.
- **Distract:** click anywhere to throw a coin (3 per level). Guards in
  earshot leave their patrol to investigate the clink.
- **Vision cones:** a guard's lit cone is exactly what it can see — walls,
  crates, shelves, statues and display cases all block its sight. Its
  suspicion meter fills while you are visible; full means it chases you.
  Break line of sight and it searches your last seen spot, then gives up.
- **Noise:** running rings a circle guards can hear. Sneaking is silent.
- **Goal:** collect every relic to unlock the exit, then slip out. Getting
  caught restarts the level. A clean floor (never chased) pays a +500
  ghost bonus; leftover coins and fast clears pay too.
- **Keys:** M mutes, P or Esc pauses, R restarts the level, Enter confirms.

## Run it

Serve `game/` with any static server and open `game/index.html`. No build
step, no network: every script, style and sound is a file under `game/`
(sounds are synthesized with WebAudio). All art is drawn with Canvas 2D.

Screenshot presets (frozen mid-game states, used for `screenshots/`):

- `?shot=cover` — level 1, Wren sneaking behind a crate as a cone sweeps past
- `?shot=sneak` — level 2, a guard half-suspicious, Wren frozen mid-room
- `?shot=alert` — level 3, a chase: red cone, Wren running for the door
- `?shot=exit` — level 2 cleared: the clean-getaway panel with the bonus

## Layout

- `main.ts` — entry program: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json` with the vendored make.fun library.
- `game/index.html` — page shell and canvas.
- `game/style.css` — the one dark museum style for the whole game.
- `game/src/config.js` — tuning constants and the three level maps.
- `game/src/world.js` — tiles, collision, line of sight, cone raycasts.
- `game/src/guard.js` — guard AI: patrol, suspicion, chase, investigate.
- `game/src/player.js` — Wren: movement, sneaking, noise, coin throws.
- `game/src/audio.js` — WebAudio sounds, synthesized, no audio files.
- `game/src/input.js` — keyboard and mouse, translated into intents.
- `game/src/render.js` — every pixel: floor, cover, cones, HUD, panels.
- `game/src/game.js` — the state machine: levels, score, screens.
- `game/src/shots.js` — the four frozen screenshot presets.
- `game/src/main.js` — bootstrap and the animation loop.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

Built for the [make.fun](https://make.fun/bounty/best-stealth-game-20261121-1759)
"Make the best stealth game" bounty. MIT licensed.
