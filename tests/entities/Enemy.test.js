import { describe, it, expect } from 'vitest'
import { createEnemy, createBoss, updateEnemy, hurtEnemy } from '../../src/entities/Enemy.js'
import {
  TILES, TILE_SIZE,
  ENEMY_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT,
  ENEMY_STATES, ENEMY_DYING_DURATION, ENEMY_HURT_DURATION,
  BOSS_ENEMY_WIDTH, BOSS_ENEMY_HEIGHT, BOSS_ENEMY_HEALTH,
} from '../../src/constants.js'

// 10×20 map: ceiling row 0, floor row 9, empty in between
function makeMap(rows = 10, cols = 20) {
  const map = Array.from({ length: rows }, () => Array(cols).fill(TILES.EMPTY))
  for (let c = 0; c < cols; c++) {
    map[0][c] = TILES.CEILING
    map[rows - 1][c] = TILES.FLOOR
  }
  return map
}

function onFloor(map, col = 5) {
  const floorRow = map.length - 1
  return createEnemy(
    col * TILE_SIZE + Math.floor((TILE_SIZE - ENEMY_WIDTH) / 2),
    floorRow * TILE_SIZE - ENEMY_HEIGHT,
  )
}

const DT = 1 / 60

describe('createEnemy', () => {
  it('starts in PATROL state facing right', () => {
    const e = createEnemy(100, 200)
    expect(e.state).toBe(ENEMY_STATES.PATROL)
    expect(e.facing).toBe(1)
    expect(e.vx).toBe(ENEMY_SPEED)
  })

  it('has correct dimensions', () => {
    const e = createEnemy(0, 0)
    expect(e.width).toBe(ENEMY_WIDTH)
    expect(e.height).toBe(ENEMY_HEIGHT)
  })

  it('starts with health 1 and isBoss false', () => {
    const e = createEnemy(0, 0)
    expect(e.health).toBe(1)
    expect(e.isBoss).toBe(false)
    expect(e.hurtTimer).toBe(0)
  })
})

describe('createBoss', () => {
  it('has boss dimensions and BOSS_ENEMY_HEALTH', () => {
    const b = createBoss(100, 200)
    expect(b.width).toBe(BOSS_ENEMY_WIDTH)
    expect(b.height).toBe(BOSS_ENEMY_HEIGHT)
    expect(b.health).toBe(BOSS_ENEMY_HEALTH)
    expect(b.isBoss).toBe(true)
  })

  it('starts in PATROL state', () => {
    expect(createBoss(0, 0).state).toBe(ENEMY_STATES.PATROL)
  })
})

describe('updateEnemy — patrol movement', () => {
  it('advances position in the facing direction', () => {
    const map = makeMap()
    const e = onFloor(map)
    const x0 = e.x
    const moved = updateEnemy(e, map, DT)
    expect(moved.x).toBeGreaterThan(x0)
  })

  it('does not move horizontally when dying or dead', () => {
    const map = makeMap()
    let e = onFloor(map)
    e = hurtEnemy(e)               // health=1 → DYING immediately
    const x0 = e.x
    const result = updateEnemy(e, map, DT)
    expect(result.x).toBe(x0)
  })

  it('turns around when it hits a right wall', () => {
    const map = makeMap(10, 10)
    const floorRow = map.length - 1
    let e = createEnemy(
      (map[0].length - 3) * TILE_SIZE,
      floorRow * TILE_SIZE - ENEMY_HEIGHT,
    )
    let turned = false
    for (let i = 0; i < 120; i++) {
      const prev = e.vx
      e = updateEnemy(e, map, DT)
      if (e.vx < 0 && prev > 0) { turned = true; break }
    }
    expect(turned).toBe(true)
  })

  it('turns around when it hits a left wall', () => {
    const map = makeMap(10, 10)
    const floorRow = map.length - 1
    let e = createEnemy(2 * TILE_SIZE, floorRow * TILE_SIZE - ENEMY_HEIGHT)
    e = { ...e, vx: -ENEMY_SPEED, facing: -1 }
    let turned = false
    for (let i = 0; i < 120; i++) {
      const prev = e.vx
      e = updateEnemy(e, map, DT)
      if (e.vx > 0 && prev < 0) { turned = true; break }
    }
    expect(turned).toBe(true)
  })

  it('turns at a floor edge (pit)', () => {
    const map = makeMap(10, 15)
    const floorRow = map.length - 1
    map[floorRow][8] = TILES.WALL

    let e = createEnemy(6 * TILE_SIZE, floorRow * TILE_SIZE - ENEMY_HEIGHT)
    let turned = false
    for (let i = 0; i < 120; i++) {
      const prev = e.vx
      e = updateEnemy(e, map, DT)
      if (e.vx < 0 && prev > 0) { turned = true; break }
    }
    expect(turned).toBe(true)
  })

  it('ticks hurtTimer down each frame', () => {
    const map = makeMap()
    let e = onFloor(map)
    // Give the boss 4 health so hurtEnemy leaves it alive
    e = createBoss(e.x, e.y)
    e = hurtEnemy(e)
    expect(e.hurtTimer).toBeCloseTo(ENEMY_HURT_DURATION)
    e = updateEnemy(e, map, DT)
    expect(e.hurtTimer).toBeLessThan(ENEMY_HURT_DURATION)
  })
})

describe('hurtEnemy', () => {
  it('single-health enemy goes DYING immediately', () => {
    const e = createEnemy(100, 200)
    const dying = hurtEnemy(e)
    expect(dying.state).toBe(ENEMY_STATES.DYING)
    expect(dying.dyingTimer).toBeCloseTo(ENEMY_DYING_DURATION)
  })

  it('multi-health enemy stays PATROL, loses 1 health, gains hurtTimer', () => {
    const b = createBoss(100, 200)
    const hurt = hurtEnemy(b)
    expect(hurt.state).toBe(ENEMY_STATES.PATROL)
    expect(hurt.health).toBe(BOSS_ENEMY_HEALTH - 1)
    expect(hurt.hurtTimer).toBeCloseTo(ENEMY_HURT_DURATION)
  })

  it('boss goes DYING when last HP removed', () => {
    let b = createBoss(100, 200)
    for (let i = 0; i < BOSS_ENEMY_HEALTH; i++) b = hurtEnemy(b)
    expect(b.state).toBe(ENEMY_STATES.DYING)
  })

  it('preserves position when hurt', () => {
    const e = createEnemy(150, 300)
    const dying = hurtEnemy(e)
    expect(dying.x).toBe(e.x)
    expect(dying.y).toBe(e.y)
  })

  it('transitions from DYING to DEAD after timer expires', () => {
    const map = makeMap()
    let e = onFloor(map)
    e = hurtEnemy(e)
    expect(e.state).toBe(ENEMY_STATES.DYING)
    const steps = Math.ceil(ENEMY_DYING_DURATION / DT) + 5
    for (let i = 0; i < steps; i++) e = updateEnemy(e, map, DT)
    expect(e.state).toBe(ENEMY_STATES.DEAD)
  })
})
