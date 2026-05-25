import { describe, it, expect } from 'vitest'
import { generateLevel } from '../../src/engine/levelGenerator.js'
import { TILES, TILE_SIZE } from '../../src/constants.js'

describe('generateLevel', () => {
  it('produces a map with the requested dimensions', () => {
    const { map } = generateLevel(42, { cols: 80, rows: 15 })
    expect(map.length).toBe(15)
    expect(map[0].length).toBe(80)
  })

  it('is deterministic for the same seed', () => {
    const a = generateLevel(99, { cols: 80, rows: 15 })
    const b = generateLevel(99, { cols: 80, rows: 15 })
    expect(JSON.stringify(a.map)).toBe(JSON.stringify(b.map))
  })

  it('produces different maps for different seeds', () => {
    const a = generateLevel(1, { cols: 80, rows: 15 })
    const b = generateLevel(2, { cols: 80, rows: 15 })
    expect(JSON.stringify(a.map)).not.toBe(JSON.stringify(b.map))
  })

  it('every column has at least one EMPTY tile (walkable tunnel)', () => {
    const { map } = generateLevel(7, { cols: 80, rows: 15 })
    for (let c = 1; c < map[0].length - 1; c++) {
      const hasEmpty = map.some((row) => row[c] === TILES.EMPTY)
      expect(hasEmpty, `col ${c} has no EMPTY tile`).toBe(true)
    }
  })

  it('has solid walls on the left and right boundary columns', () => {
    const { map } = generateLevel(5, { cols: 80, rows: 15 })
    for (let r = 0; r < map.length; r++) {
      expect(map[r][0]).toBe(TILES.WALL)
      expect(map[r][map[0].length - 1]).toBe(TILES.WALL)
    }
  })

  it('provides spawn coordinates inside the map bounds', () => {
    const cols = 80
    const rows = 15
    const { spawnX, spawnY } = generateLevel(3, { cols, rows })
    expect(spawnX).toBeGreaterThanOrEqual(0)
    expect(spawnX).toBeLessThan(cols * TILE_SIZE)
    expect(spawnY).toBeGreaterThanOrEqual(0)
    expect(spawnY).toBeLessThan(rows * TILE_SIZE)
  })

  it('produces moving board descriptors', () => {
    const { movingBoards } = generateLevel(10, { cols: 120, rows: 15 })
    expect(Array.isArray(movingBoards)).toBe(true)
    for (const b of movingBoards) {
      expect(b).toHaveProperty('col')
      expect(b).toHaveProperty('row')
      expect(b).toHaveProperty('amplitude')
      expect(b).toHaveProperty('speed')
      expect(b.amplitude).toBeGreaterThan(0)
      expect(b.speed).toBeGreaterThan(0)
    }
  })

  it('produces rock spawn descriptors', () => {
    const { rockSpawns } = generateLevel(10, { cols: 120, rows: 15 })
    expect(Array.isArray(rockSpawns)).toBe(true)
    expect(rockSpawns.length).toBeGreaterThan(0)
    for (const s of rockSpawns) {
      expect(s).toHaveProperty('col')
      expect(s).toHaveProperty('row')
      expect(s.col).toBeGreaterThanOrEqual(0)
      expect(s.col).toBeLessThan(120)
    }
  })

  it('platform tiles appear only inside the tunnel (between ceiling and floor rows)', () => {
    const { map } = generateLevel(20, { cols: 80, rows: 15 })
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[0].length; c++) {
        if (map[r][c] === TILES.PLATFORM) {
          // There must be an EMPTY tile somewhere above this in the same col
          const hasEmptyAbove = map.slice(0, r).some((row) => row[c] === TILES.EMPTY)
          expect(hasEmptyAbove, `platform at [${r}][${c}] has no empty above`).toBe(true)
        }
      }
    }
  })
})
