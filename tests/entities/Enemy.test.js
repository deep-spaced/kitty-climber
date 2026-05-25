import { describe, it, expect } from 'vitest'
import { createEnemy, updateEnemy, hurtEnemy } from '../../src/entities/Enemy.js'
import { TILES, TILE_SIZE, ENEMY_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT, ENEMY_STATES, ENEMY_DYING_DURATION } from '../../src/constants.js'

// 10×20 map: ceiling row 0, floor row 9, empty in between
function makeMap(rows = 10, cols = 20) {
  const map = Array.from({ length: rows }, () => Array(cols).fill(TILES.EMPTY))
  for (let c = 0; c < cols; c++) {
    map[0][c] = TILES.CEILING
    map[rows - 1][c] = TILES.FLOOR
  }
  return map
}

// Enemy placed on the floor of the map
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
    e = hurtEnemy(e)                    // now DYING
    const x0 = e.x
    const result = updateEnemy(e, map, DT)
    expect(result.x).toBe(x0)
  })

  it('turns around when it hits a right wall', () => {
    const map = makeMap(10, 10)
    // Place enemy near the right wall
    const floorRow = map.length - 1
    let e = createEnemy(
      (map[0].length - 3) * TILE_SIZE,
      floorRow * TILE_SIZE - ENEMY_HEIGHT,
    )
    // Simulate until direction flips
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
    // Start facing left, near the left edge
    let e = createEnemy(
      2 * TILE_SIZE,
      floorRow * TILE_SIZE - ENEMY_HEIGHT,
    )
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
    // Map with a pit at col 8 (floor tile replaced by WALL as the generator does)
    const map = makeMap(10, 15)
    const floorRow = map.length - 1
    map[floorRow][8] = TILES.WALL  // simulate pit: FLOOR → WALL

    let e = createEnemy(
      6 * TILE_SIZE,
      floorRow * TILE_SIZE - ENEMY_HEIGHT,
    )
    // Enemy walks right; should turn before falling in
    let turned = false
    for (let i = 0; i < 120; i++) {
      const prev = e.vx
      e = updateEnemy(e, map, DT)
      if (e.vx < 0 && prev > 0) { turned = true; break }
    }
    expect(turned).toBe(true)
  })
})

describe('hurtEnemy', () => {
  it('sets state to DYING (not immediately DEAD)', () => {
    const e = createEnemy(100, 200)
    const dying = hurtEnemy(e)
    expect(dying.state).toBe(ENEMY_STATES.DYING)
    expect(dying.dyingTimer).toBeCloseTo(ENEMY_DYING_DURATION)
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
    // Simulate past the dying duration
    const steps = Math.ceil(ENEMY_DYING_DURATION / DT) + 5
    for (let i = 0; i < steps; i++) {
      e = updateEnemy(e, map, DT)
    }
    expect(e.state).toBe(ENEMY_STATES.DEAD)
  })
})
