// Level definitions and tuning constants for The Quiet Gallery.
//
// A level is an ASCII map, 32 columns by 18 rows, one tile = 40 px:
//   #  wall          C  crate (cover)      S  shelf (cover)
//   T  statue (cover) D display case (cover)  .  floor
//   ,  rug (floor)   R  relic          P  player start
//   E  exit door     G  guard spawn (patrol waypoints live beside the map)
//
// Walls and cover block movement and block a guard's line of sight.
// A guard's patrol is a loop of tile coordinates; it walks them in order.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const HUD_HEIGHT = 56;

// Player tuning: walk speed, sneak speed, noise radius while running.
export const PLAYER_SPEED = 150;
export const SNEAK_SPEED = 78;
export const NOISE_RADIUS = 95;
export const SNEAK_NOISE_RADIUS = 0;

// Guard tuning: vision range and half-angle, patrol and chase speeds,
// suspicion fill per second at point blank, and how fast suspicion drains.
export const GUARD_RANGE = 190;
export const GUARD_HALF_ANGLE = 0.66; // ~38 degrees each side
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 132;
export const GUARD_INVESTIGATE_SPEED = 88;
export const SUSPICION_FILL = 1.6;
export const SUSPICION_DRAIN = 0.45;
export const SNEAK_VISIBILITY = 0.55; // sneaking shrinks the seen range
export const CHASE_MEMORY = 3.0; // seconds a guard keeps chasing unseen prey
export const COIN_RANGE = 300;
export const COIN_NOISE_RADIUS = 150;
export const COIN_START = 3;

export const LEVELS = [
  {
    name: 'The Moonlit Gallery',
    intro: 'Four relics glow in the dark. Take them all, then slip out the green door.',
    map: [
      '################################',
      '#......#..........#............#',
      '#..R...#....C......#....R......#',
      '#......#..........#............#',
      '#..C...####..######....####....#',
      '#..............................#',
      '#..S......C..........T....C....#',
      '#..S...........................#',
      '####..#######.....######..######',
      '#..............................#',
      '#....T.......C........C....R...#',
      '#..............................#',
      '#..C......######..#####....C...#',
      '#..............................#',
      '#......C..........#...........E#',
      '#..P...#....R.....#............#',
      '#......#..........#............#',
      '################################',
    ],
    guards: [
      { spawn: [9, 6], patrol: [[9, 6], [20, 6], [20, 9], [9, 9]] },
      { spawn: [22, 11], patrol: [[22, 11], [22, 14], [12, 14], [12, 11]] },
    ],
  },
  {
    name: 'The Old Library',
    intro: 'Shelves make long shadows. The guards here walk slower, but there are three of them.',
    map: [
      '################################',
      '#..R.......#......#.......R....#',
      '#..........#......#............#',
      '#..S...S...#..C...#...S...S....#',
      '#..S...S...#......#...S...S....#',
      '#..............................#',
      '####....#####......#####....####',
      '#......C................C......#',
      '#..T...........R............T..#',
      '#..............................#',
      '#..S...S....C......C....S...S..#',
      '#..S...S................S...S..#',
      '#..............................#',
      '#####....######....######....###',
      '#......C..........#........E...#',
      '#..P....#....R....#............#',
      '#.......#.........#............#',
      '################################',
    ],
    guards: [
      { spawn: [6, 7], patrol: [[6, 7], [25, 7], [25, 9], [6, 9]] },
      { spawn: [16, 5], patrol: [[16, 5], [16, 2], [24, 2], [24, 5]] },
      { spawn: [16, 14], patrol: [[16, 14], [10, 14], [10, 11], [20, 11], [20, 14]] },
    ],
  },
  {
    name: 'The Vault Below',
    intro: 'Four guards, six relics, tight corridors. Patience wins this floor.',
    map: [
      '################################',
      '#..R....#.....#......#.....R...#',
      '#.......#.....#......#.........#',
      '#..C....#..T..#..C...#..T......#',
      '#.......#.....#......#.........#',
      '###..####..####..#####..####..##',
      '#..............................#',
      '#..S.......C....R.....C......T.#',
      '#..S...........................#',
      '####...#######....#######...####',
      '#..............................#',
      '#.T......C.....R......C......S.#',
      '#..............................#',
      '###...####....####....####...###',
      '#......C......#.......C.......E#',
      '#..P...#..R...#...R...#........#',
      '#......#......#.......#........#',
      '################################',
    ],
    guards: [
      { spawn: [8, 6], patrol: [[8, 6], [23, 6], [23, 8], [8, 8]] },
      { spawn: [16, 10], patrol: [[16, 10], [16, 12], [24, 12], [24, 10]] },
      { spawn: [5, 12], patrol: [[5, 12], [5, 15], [12, 15], [12, 12]] },
      { spawn: [26, 2], patrol: [[26, 2], [26, 4], [19, 4], [19, 2]] },
    ],
  },
];
