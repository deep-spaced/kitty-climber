import { describe, it, expect } from 'vitest'
import { getTile, stepPhysics, aabbOverlap } from '../../src/engine/physics.js'
import { TILES, TILE_SIZE } from '../../src/constants.js'

// 5-row × 10-col map: ceiling on row 0, floor on row 4, empty in between
function makeMap() {
  const rows = 5
  const cols = 10
  const map = Array.from({ length: rows }, () => Array(cols).fill(TILES.EMPTY))
  for (let c = 0; c < cols; c++) {
    map[0][c] = TILES.CEILING
    map[rows - 1][c] = TILES.FLOOR
  }
  return map
}

const ENTITY_W = 28
const ENTITY_H = 40
const DT = 1 / 60

describe('getTile', () => {
  it('returns WALL for out-of-bounds rows', () => {
    const map = makeMap()
    expect(getTile(map, 0, -1)).toBe(TILES.WALL)
    expect(getTile(map, 0, 999)).toBe(TILES.WALL)
  })

  it('returns WALL for out-of-bounds cols', () => {
    const map = makeMap()
    expect(getTile(map, -1, TILE_SIZE)).toBe(TILES.WALL)
    expect(getTile(map, 999, TILE_SIZE)).toBe(TILES.WALL)
  })

  it('returns correct tile for valid coords', () => {
    const map = makeMap()
    expect(getTile(map, TILE_SIZE, 0)).toBe(TILES.CEILING)
    expect(getTile(map, TILE_SIZE, (map.length - 1) * TILE_SIZE)).toBe(TILES.FLOOR)
    expect(getTile(map, TILE_SIZE, TILE_SIZE)).toBe(TILES.EMPTY)
  })
})

describe('stepPhysics — vertical', () => {
  it('entity falls and lands on floor', () => {
    const map = makeMap()
    const floorY = (map.length - 1) * TILE_SIZE  // row 4 = y 128

    // Place entity well above the floor
    let entity = { x: TILE_SIZE, y: TILE_SIZE * 2, vx: 0, vy: 0, width: ENTITY_W, height: ENTITY_H }

    // Simulate up to 2 seconds
    for (let i = 0; i < 120; i++) {
      entity = { ...entity, ...stepPhysics(entity, map, DT) }
      if (entity.onGround) break
    }

    expect(entity.onGround).toBe(true)
    expect(entity.y + ENTITY_H).toBeCloseTo(floorY, 0)
    expect(entity.vy).toBe(0)
  })

  it('entity moving up is stopped by ceiling', () => {
    const map = makeMap()
    let entity = { x: TILE_SIZE, y: TILE_SIZE * 2, vx: 0, vy: -900, width: ENTITY_W, height: ENTITY_H }

    for (let i = 0; i < 60; i++) {
      entity = { ...entity, ...stepPhysics(entity, map, DT) }
      if (entity.vy >= 0) break
    }

    // After hitting ceiling, vy should have been zeroed and y pushed below ceiling row
    expect(entity.y).toBeGreaterThanOrEqual(TILE_SIZE)
  })
})

describe('stepPhysics — horizontal', () => {
  it('entity moving right is stopped by wall tile', () => {
    const map = makeMap()
    // Add a wall in col 5
    for (let r = 0; r < map.length; r++) map[r][5] = TILES.WALL

    const wallX = 5 * TILE_SIZE
    let entity = { x: TILE_SIZE * 3, y: TILE_SIZE * 2, vx: 300, vy: 0, width: ENTITY_W, height: ENTITY_H }

    for (let i = 0; i < 120; i++) {
      entity = { ...entity, ...stepPhysics(entity, map, DT) }
      if (entity.vx === 0) break
    }

    expect(entity.vx).toBe(0)
    expect(entity.x + ENTITY_W).toBeLessThanOrEqual(wallX + 1)
  })
})

describe('aabbOverlap', () => {
  it('detects overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 40, height: 40 }
    const b = { x: 20, y: 20, width: 40, height: 40 }
    expect(aabbOverlap(a, b)).toBe(true)
  })

  it('returns false for non-overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 40, height: 40 }
    const b = { x: 50, y: 0, width: 40, height: 40 }
    expect(aabbOverlap(a, b)).toBe(false)
  })

  it('returns false for boxes that touch but do not overlap', () => {
    const a = { x: 0, y: 0, width: 40, height: 40 }
    const b = { x: 40, y: 0, width: 40, height: 40 }
    expect(aabbOverlap(a, b)).toBe(false)
  })
})
