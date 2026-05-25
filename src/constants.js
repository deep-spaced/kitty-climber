export const TILE_SIZE = 32

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 480

export const GRAVITY = 1800         // px per second squared
export const MAX_FALL_SPEED = 900   // px per second
export const JUMP_FORCE = -600      // px per second (negative = up)
export const MOVE_SPEED = 220       // px per second
export const PLAYER_WIDTH = 28
export const PLAYER_HEIGHT = 40
export const CROUCH_HEIGHT = 24

export const KEYS = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  JUMP: 'x',
  SCRATCH: 'c',
  BITE: 'z',
  CROUCH: 'v',
  MAP: 'm',
}

export const PLAYER_STATES = {
  IDLE: 'idle',
  RUN: 'run',
  JUMP: 'jump',
  FALL: 'fall',
  CROUCH: 'crouch',
  ATTACK_SCRATCH: 'attack_scratch',
  ATTACK_BITE: 'attack_bite',
  HURT: 'hurt',
}

export const TILES = {
  EMPTY: 0,
  WALL: 1,
  FLOOR: 2,
  CEILING: 3,
  PLATFORM: 4,
}

export const MAX_HEALTH = 4
export const ATTACK_DURATION = 0.25  // seconds
export const HURT_DURATION = 0.5     // seconds
export const ATTACK_RANGE = 40       // px

export const ENEMY_SPEED = 70        // px per second
export const ENEMY_WIDTH = 26
export const ENEMY_HEIGHT = 32
export const ENEMY_STATES = {
  PATROL: 'patrol',
  DEAD: 'dead',
}
export const SCORE_PER_KILL = 10
