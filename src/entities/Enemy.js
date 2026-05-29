import {
  ENEMY_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT,
  ENEMY_STATES, ENEMY_DYING_DURATION, ENEMY_HURT_DURATION,
  ENEMY_ATTACK_RANGE, ENEMY_ATTACK_DURATION, ENEMY_LUNGE_SPEED, ENEMY_ATTACK_COOLDOWN,
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
    attackTimer: 0,
    attackCooldown: 0,
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
    attackTimer: 0,
    attackCooldown: 0,
  }
}

export function updateEnemy(enemy, tilemap, dt, playerX, playerY) {
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
  let { x, y, vx, vy, facing, state, attackTimer, attackCooldown } = enemy

  attackTimer = Math.max(0, attackTimer - dt)
  attackCooldown = Math.max(0, attackCooldown - dt)

  // --- Attack state: lunge toward player until timer expires ---
  if (state === ENEMY_STATES.ATTACK) {
    if (attackTimer === 0) {
      // Lunge finished — resume patrol at normal speed toward same direction
      state = ENEMY_STATES.PATROL
      attackCooldown = ENEMY_ATTACK_COOLDOWN
      vx = facing * ENEMY_SPEED
    } else {
      // Surge forward at lunge speed
      vx = facing * ENEMY_LUNGE_SPEED
    }
  }

  // --- Gravity ---
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
    // Cancel a lunge if it runs into a wall
    if (state === ENEMY_STATES.ATTACK) {
      state = ENEMY_STATES.PATROL
      attackTimer = 0
      attackCooldown = ENEMY_ATTACK_COOLDOWN
    }
    vx = -vx
    facing = -facing
  } else {
    x = nextX
  }

  // --- Transition to attack when player is close and cooldown has elapsed ---
  if (
    state === ENEMY_STATES.PATROL &&
    hurtTimer === 0 &&
    attackCooldown === 0 &&
    playerX !== undefined &&
    playerY !== undefined
  ) {
    const dx = playerX - x
    const dy = Math.abs(playerY - y)
    const sameLane = dy < enemy.height * 1.5
    const inRange = Math.abs(dx) < ENEMY_ATTACK_RANGE
    const playerAhead = (facing === 1 && dx > 0) || (facing === -1 && dx < 0)
    if (sameLane && inRange && playerAhead) {
      state = ENEMY_STATES.ATTACK
      attackTimer = ENEMY_ATTACK_DURATION
      vx = facing * ENEMY_LUNGE_SPEED
    }
  }

  return { ...enemy, x, y, vx, vy, facing, hurtTimer, state, attackTimer, attackCooldown }
}

export function resetEnemyAttack(enemy) {
  return {
    ...enemy,
    state: ENEMY_STATES.PATROL,
    attackTimer: 0,
    attackCooldown: ENEMY_ATTACK_COOLDOWN,
    vx: enemy.facing * ENEMY_SPEED,
  }
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
