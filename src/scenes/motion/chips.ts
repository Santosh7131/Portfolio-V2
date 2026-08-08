export type ChipSpec = {
  word: string
  /** Home position, % of stage width/height (chip is center-anchored). */
  x: number
  y: number
  /** Resting rotation, degrees — the composed "hand-placed" look. */
  rot: number
}

/**
 * The home composition: two gently staggered rows in the lower-right field
 * (the header owns the upper left). Authored, not random — the resting state
 * must read as design.
 */
export const CHIPS: ChipSpec[] = [
  { word: 'TYPE', x: 30, y: 46, rot: -2.5 },
  { word: 'MOTION', x: 46, y: 44, rot: 1.5 },
  { word: 'COLOR', x: 62, y: 47, rot: -1 },
  { word: 'SPACE', x: 78, y: 44, rot: 2.5 },
  { word: 'SYSTEMS', x: 23, y: 66, rot: 1 },
  { word: 'DETAIL', x: 41, y: 68, rot: -2 },
  { word: 'RHYTHM', x: 58, y: 66, rot: 2 },
  { word: 'CONTRAST', x: 76, y: 68, rot: -1.5 },
]

/** Every feel constant in one tunable block. Units noted per field. */
export const PHYSICS = {
  /** exponential friction per second — higher stops sooner */
  friction: 1.8,
  /** fraction of velocity kept after a wall hit */
  wallDamping: 0.45,
  /** deg of tilt per px/s of horizontal velocity */
  spinFactor: 0.02,
  /** tilt clamp while airborne, deg */
  maxSpin: 14,
  /** below this speed (px/s) a flight ends and the chip settles */
  restSpeed: 40,
  /** hard cap on throw speed, px/s */
  maxSpeed: 3600,
  /** rotation spring — slightly underdamped so settling overshoots a touch */
  rotStiffness: 120,
  rotDamping: 11,
  /** idle time before chips tidy themselves home, ms */
  idleReturnMs: 4000,
  returnDuration: 1.4,
  returnStagger: 0.05,
} as const
