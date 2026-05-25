import {
  ENEMY_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT,
  ENEMY_STATES, ENEMY_DYING_DURATION, ENEMY_HURT_DURATION,
  BOSS_ENEMY_WIDTH, BOSS_ENEMY_HEIGHT, BOSS_ENEMY_HEALTH,
  TILE_SIZE, TILES, GRAVITY, MAX_FALL_SPEED,
} from '../constants.js'

function isSolid(tile) {
  return tile != null && tile !== TILES.EMPTY
}

export function createEnemy(x, y) {
  return {
    x, y,
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
    vx: ENEMY_SPEED,
    vy: 0,
    facing: 1,
    state: ENEMY_STATES.PATROL,
    health: 1,
    isBoss: false,
    hurtTimer: 0,
    dyingTimer: 0,
  }
}

export function createBoss(x, y) {
  return {
    x, y,
    width: BOSS_ENEMY_WIDTH,
    height: BOSS_ENEMY_HEIGHT,
    vx: Math.round(ENEMY_SPEED * 0.65),
    vy: 0,
    facing: 1,
    state: ENEMY_STATES.PATROL,
    health: BOSS_ENEMY_HEALTH,
    isBoss: true,
    hurtTimer: 0,
    dyingTimer: 0,
  }
}

export function updateEnemy(enemy, tilemap, dt) {
  if (enemy.state === ENEMY_STATES.DEAD) return enemy

  const hurtTimer = Math.max(0, enemy.hurtTimer - dt)

  if (enemy.state === ENEMY_STATES.DYING) {
    const dyingTimer = Math.max(0, enemy.dyingTimer - dt)
    return {
      ...enemy,
      dyingTimer,
      hurtTimer,
      state: dyingTimer === 0 ? ENEMY_STATES.DEAD : ENEMY_STATES.DYING,
    }
  }

  const rows = tilemap.length
  const cols = tilemap[0].length
  let { x, y, vx, vy, facing } = enemy

  // Gravity
  vy = Math.min(vy + GRAVITY * dt, MAX_FALL_SPEED)
  y += vy * dt

  // Vertical: snap to floor when feet hit solid tile
  const feetY = y + enemy.height
  const leftCol  = Math.floor(x / TILE_SIZE)
  const rightCol = Math.floor((x + enemy.width - 1) / TILE_SIZE)
  const feetRow  = Math.floor(feetY / TILE_SIZE)

  if (feetRow >= 0 && feetRow < rows) {
    const leftSolid  = isSolid(tilemap[feetRow]?.[leftCol])
    const rightSolid = isSolid(tilemap[feetRow]?.[rightCol])
    if (leftSolid || rightSolid) {
      y = feetRow * TILE_SIZE - enemy.height
      vy = 0
    }
  }

  // Horizontal: check wall ahead or floor edge (avoid pits)
  const nextX  = x + vx * dt
  const midRow = Math.floor((y + enemy.height / 2) / TILE_SIZE)
  const leadCol = vx > 0
    ? Math.min(cols - 1, Math.floor((nextX + enemy.width) / TILE_SIZE))
    : Math.max(0, Math.floor(nextX / TILE_SIZE))

  const wallAhead = midRow >= 0 && midRow < rows
    ? isSolid(tilemap[midRow]?.[leadCol])
    : true

  const groundRow  = Math.floor((y + enemy.height) / TILE_SIZE)
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

  return { ...enemy, x, y, vx, vy, facing, hurtTimer }
}

export function hurtEnemy(enemy) {
  const health = enemy.health - 1
  if (health <= 0) {
    return {
      ...enemy,
      health: 0,
      state: ENEMY_STATES.DYING,
      dyingTimer: ENEMY_DYING_DURATION,
      hurtTimer: 0,
    }
  }
  return { ...enemy, health, hurtTimer: ENEMY_HURT_DURATION }
}
