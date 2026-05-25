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
  PAUSE: 'Escape',
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
  DYING: 'dying',
  DEAD: 'dead',
}
export const ENEMY_DYING_DURATION = 0.3   // seconds
export const ENEMY_HURT_DURATION = 0.4   // invincibility after a hit
export const SCORE_PER_KILL = 10

export const BOSS_ENEMY_WIDTH = 40
export const BOSS_ENEMY_HEIGHT = 50
export const BOSS_ENEMY_HEALTH = 4

export const CAGE_WIDTH = 48
export const CAGE_HEIGHT = 52
export const CAGE_HEALTH = 3
export const CAGE_FREED_DELAY = 0.5   // seconds of open-cage animation before level clear
export const CAGE_HURT_DURATION = 0.25  // immunity window per hit

export const FISH_WIDTH = 16
export const FISH_HEIGHT = 12
export const FISH_SCORE = 5

export const TREAT_WIDTH = 12
export const TREAT_HEIGHT = 12

export const LEVEL_COUNT = 5  // levels before end screen
