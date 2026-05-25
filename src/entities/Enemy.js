import { ENEMY_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT, ENEMY_STATES, TILE_SIZE, TILES, GRAVITY, MAX_FALL_SPEED } from '../constants.js'

function isSolid(tile) {
  return tile != null && tile !== TILES.EMPTY
}

export function createEnemy(x, y) {
  return {
    x,
    y,
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
    vx: ENEMY_SPEED,
    vy: 0,
    facing: 1,
    state: ENEMY_STATES.PATROL,
  }
}

export function updateEnemy(enemy, tilemap, dt) {
  if (enemy.state === ENEMY_STATES.DEAD) return enemy

  const rows = tilemap.length
  const cols = tilemap[0].length
  let { x, y, vx, vy, facing } = enemy

  // Gravity
  vy = Math.min(vy + GRAVITY * dt, MAX_FALL_SPEED)
  y += vy * dt

  // Vertical: snap to floor when feet hit solid tile
  const feetY = y + enemy.height
  const leftCol = Math.floor(x / TILE_SIZE)
  const rightCol = Math.floor((x + enemy.width - 1) / TILE_SIZE)
  const feetRow = Math.floor(feetY / TILE_SIZE)

  if (feetRow >= 0 && feetRow < rows) {
    const leftSolid = isSolid(tilemap[feetRow]?.[leftCol])
    const rightSolid = isSolid(tilemap[feetRow]?.[rightCol])
    if (leftSolid || rightSolid) {
      y = feetRow * TILE_SIZE - enemy.height
      vy = 0
    }
  }

  // Horizontal: check for wall ahead or floor edge (avoid pits)
  const nextX = x + vx * dt
  const midRow = Math.floor((y + enemy.height / 2) / TILE_SIZE)
  const leadCol = vx > 0
    ? Math.min(cols - 1, Math.floor((nextX + enemy.width) / TILE_SIZE))
    : Math.max(0, Math.floor(nextX / TILE_SIZE))

  const wallAhead = midRow >= 0 && midRow < rows
    ? isSolid(tilemap[midRow]?.[leadCol])
    : true

  // Floor check: FLOOR or PLATFORM tile = solid ground; WALL (pit bottom) or EMPTY = no ground
  const groundRow = Math.floor((y + enemy.height) / TILE_SIZE)
  const floorAhead = groundRow >= 0 && groundRow < rows && leadCol >= 0 && leadCol < cols
    ? tilemap[groundRow][leadCol]
    : null
  const hasFloor = floorAhead === TILES.FLOOR || floorAhead === TILES.PLATFORM

  if (wallAhead || !hasFloor) {
    vx = -vx
    facing = -facing
  } else {
    x = nextX
  }

  return { ...enemy, x, y, vx, vy, facing }
}

export function hurtEnemy(enemy) {
  return { ...enemy, state: ENEMY_STATES.DEAD }
}
