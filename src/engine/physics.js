import { TILE_SIZE, TILES, GRAVITY, MAX_FALL_SPEED } from '../constants.js'

/**
 * Returns the tile value at world-space (x, y), or WALL if out of bounds.
 */
export function getTile(tilemap, x, y) {
  const col = Math.floor(x / TILE_SIZE)
  const row = Math.floor(y / TILE_SIZE)
  if (row < 0 || row >= tilemap.length) return TILES.WALL
  if (col < 0 || col >= tilemap[0].length) return TILES.WALL
  return tilemap[row][col]
}

function isSolid(tile) {
  return tile === TILES.WALL || tile === TILES.FLOOR || tile === TILES.CEILING || tile === TILES.PLATFORM
}

/**
 * Apply gravity and integrate velocity into position, then resolve AABB
 * collisions against the tilemap.
 *
 * Returns updated { x, y, vx, vy, onGround }.
 */
export function stepPhysics(entity, tilemap, dt) {
  let { x, y, vx, vy, width, height } = entity

  // Gravity
  vy = Math.min(vy + GRAVITY * dt, MAX_FALL_SPEED)

  // Integrate
  x += vx * dt
  y += vy * dt

  let onGround = false

  // --- Vertical collision ---
  if (vy >= 0) {
    // Falling — check feet
    const feetY = y + height
    const leftCol = Math.floor(x / TILE_SIZE)
    const rightCol = Math.floor((x + width - 1) / TILE_SIZE)
    const row = Math.floor(feetY / TILE_SIZE)

    if (
      isSolid(getTile(tilemap, leftCol * TILE_SIZE, row * TILE_SIZE)) ||
      isSolid(getTile(tilemap, rightCol * TILE_SIZE, row * TILE_SIZE))
    ) {
      y = row * TILE_SIZE - height
      vy = 0
      onGround = true
    }
  } else {
    // Rising — check head
    const headY = y
    const leftCol = Math.floor(x / TILE_SIZE)
    const rightCol = Math.floor((x + width - 1) / TILE_SIZE)
    const row = Math.floor(headY / TILE_SIZE)

    if (
      isSolid(getTile(tilemap, leftCol * TILE_SIZE, row * TILE_SIZE)) ||
      isSolid(getTile(tilemap, rightCol * TILE_SIZE, row * TILE_SIZE))
    ) {
      y = (row + 1) * TILE_SIZE
      vy = 0
    }
  }

  // --- Horizontal collision ---
  if (vx > 0) {
    const rightX = x + width
    const topRow = Math.floor(y / TILE_SIZE)
    const botRow = Math.floor((y + height - 1) / TILE_SIZE)
    const col = Math.floor(rightX / TILE_SIZE)

    if (
      isSolid(getTile(tilemap, col * TILE_SIZE, topRow * TILE_SIZE)) ||
      isSolid(getTile(tilemap, col * TILE_SIZE, botRow * TILE_SIZE))
    ) {
      x = col * TILE_SIZE - width
      vx = 0
    }
  } else if (vx < 0) {
    const leftX = x
    const topRow = Math.floor(y / TILE_SIZE)
    const botRow = Math.floor((y + height - 1) / TILE_SIZE)
    const col = Math.floor(leftX / TILE_SIZE)

    if (
      isSolid(getTile(tilemap, col * TILE_SIZE, topRow * TILE_SIZE)) ||
      isSolid(getTile(tilemap, col * TILE_SIZE, botRow * TILE_SIZE))
    ) {
      x = (col + 1) * TILE_SIZE
      vx = 0
    }
  }

  return { x, y, vx, vy, onGround }
}

/** Simple AABB overlap test. */
export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}
