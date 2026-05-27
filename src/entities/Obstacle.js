import { TILE_SIZE, GRAVITY, MAX_FALL_SPEED } from '../constants.js'

const ROCK_SIZE = Math.round(TILE_SIZE * 0.75)
const BOARD_HEIGHT = Math.round(TILE_SIZE * 0.4)

// ----- Falling Rocks -----

export function createRock(col, ceilRow) {
  return {
    type: 'rock',
    x: col * TILE_SIZE + (TILE_SIZE - ROCK_SIZE) / 2,
    y: (ceilRow + 1) * TILE_SIZE,
    vx: 0,
    vy: 0,
    width: ROCK_SIZE,
    height: ROCK_SIZE,
    active: true,
  }
}

export function updateRock(rock, tilemap, dt, levelHeightPx) {
  if (!rock.active) return rock

  const vy = Math.min(rock.vy + GRAVITY * dt, MAX_FALL_SPEED)
  const y = rock.y + vy * dt

  // Deactivate when it falls below the level
  if (y > levelHeightPx) {
    return { ...rock, active: false }
  }

  // Simple floor collision: check row beneath
  const rows = tilemap.length
  const cols = tilemap[0].length
  const feetRow = Math.floor((y + ROCK_SIZE) / TILE_SIZE)
  const leftCol = Math.max(0, Math.floor(rock.x / TILE_SIZE))
  const rightCol = Math.min(cols - 1, Math.floor((rock.x + ROCK_SIZE - 1) / TILE_SIZE))

  if (feetRow < rows) {
    const hitFloor =
      tilemap[feetRow]?.[leftCol] > 0 ||
      tilemap[feetRow]?.[rightCol] > 0

    if (hitFloor) {
      return { ...rock, active: false }
    }
  }

  return { ...rock, y, vy }
}

// ----- Moving Boards -----

/**
 * descriptor: { col, row, width, amplitude, speed, phase }
 * amplitude — max displacement in px from center
 * speed     — oscillation in radians/sec
 * phase     — initial phase offset (radians)
 */
export function createBoard(descriptor) {
  const { col, row, width, amplitude, speed, phase } = descriptor
  const centerX = col * TILE_SIZE + (TILE_SIZE / 2)
  return {
    type: 'board',
    centerX,
    y: (row - 1) * TILE_SIZE,      // board sits just above the floor row
    width: width * TILE_SIZE,
    height: BOARD_HEIGHT,
    amplitude,
    speed,
    phase,
    // derived each frame:
    x: centerX - (width * TILE_SIZE) / 2,
  }
}

export function updateBoard(board, dt) {
  const phase = board.phase + board.speed * dt
  const x = board.centerX + Math.sin(phase) * board.amplitude - board.width / 2
  const dx = x - board.x  // horizontal displacement this frame
  return { ...board, phase, x, dx }
}
