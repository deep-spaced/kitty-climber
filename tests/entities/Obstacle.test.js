import { describe, it, expect } from 'vitest'
import { createRock, updateRock, createBoard, updateBoard } from '../../src/entities/Obstacle.js'
import { TILES, TILE_SIZE } from '../../src/constants.js'

// Simple flat map: 10 rows × 20 cols, solid floor on row 9
function makeMap(rows = 10, cols = 20) {
  const map = Array.from({ length: rows }, () => Array(cols).fill(TILES.EMPTY))
  for (let c = 0; c < cols; c++) map[rows - 1][c] = TILES.FLOOR
  return map
}

const DT = 1 / 60

describe('createRock', () => {
  it('spawns at the correct world position', () => {
    const rock = createRock(5, 2)
    expect(rock.x).toBeCloseTo(5 * TILE_SIZE + (TILE_SIZE - rock.width) / 2, 0)
    expect(rock.y).toBeCloseTo(3 * TILE_SIZE, 0)
    expect(rock.active).toBe(true)
    expect(rock.vy).toBe(0)
  })
})

describe('updateRock', () => {
  it('accelerates downward due to gravity', () => {
    const map = makeMap()
    let rock = createRock(5, 0)
    const vy0 = rock.vy
    rock = updateRock(rock, map, DT, map.length * TILE_SIZE)
    expect(rock.vy).toBeGreaterThan(vy0)
    expect(rock.y).toBeGreaterThan(TILE_SIZE)
  })

  it('deactivates when it hits the floor', () => {
    const map = makeMap()
    let rock = createRock(5, 0)
    // Simulate until it hits the floor or deactivates
    for (let i = 0; i < 300; i++) {
      rock = updateRock(rock, map, DT, map.length * TILE_SIZE)
      if (!rock.active) break
    }
    expect(rock.active).toBe(false)
  })

  it('deactivates when it falls below the level', () => {
    // Map with no floor so it falls through
    const map = Array.from({ length: 5 }, () => Array(10).fill(TILES.EMPTY))
    let rock = createRock(3, 0)
    const levelH = map.length * TILE_SIZE
    for (let i = 0; i < 500; i++) {
      rock = updateRock(rock, map, DT, levelH)
      if (!rock.active) break
    }
    expect(rock.active).toBe(false)
  })

  it('does not move when already inactive', () => {
    const map = makeMap()
    let rock = { ...createRock(5, 0), active: false, y: 100 }
    const snapshot = { ...rock }
    rock = updateRock(rock, map, DT, map.length * TILE_SIZE)
    expect(rock.y).toBe(snapshot.y)
    expect(rock.vy).toBe(snapshot.vy)
  })
})

describe('createBoard', () => {
  it('places board at correct position', () => {
    const desc = { col: 10, row: 7, width: 4, amplitude: 64, speed: 1.5, phase: 0 }
    const board = createBoard(desc)
    expect(board.type).toBe('board')
    expect(board.width).toBe(4 * TILE_SIZE)
    expect(board.amplitude).toBe(64)
    expect(board.speed).toBe(1.5)
  })
})

describe('updateBoard', () => {
  it('advances the phase each tick', () => {
    const desc = { col: 5, row: 6, width: 3, amplitude: 48, speed: 2, phase: 0 }
    const board = createBoard(desc)
    const updated = updateBoard(board, DT)
    expect(updated.phase).toBeCloseTo(2 * DT, 5)
  })

  it('oscillates x position (not static)', () => {
    const desc = { col: 5, row: 6, width: 3, amplitude: 48, speed: 2, phase: 0 }
    let board = createBoard(desc)
    const x0 = board.x
    // Advance one full cycle worth of frames
    for (let i = 0; i < 60; i++) board = updateBoard(board, DT)
    // After some motion the x should have moved
    const xs = []
    for (let i = 0; i < 120; i++) {
      board = updateBoard(board, DT)
      xs.push(board.x)
    }
    const min = Math.min(...xs)
    const max = Math.max(...xs)
    expect(max - min).toBeGreaterThan(4)  // board actually oscillates
  })

  it('x stays within amplitude range of center', () => {
    const desc = { col: 5, row: 6, width: 3, amplitude: 48, speed: 3, phase: 0 }
    let board = createBoard(desc)
    const halfW = board.width / 2
    for (let i = 0; i < 300; i++) {
      board = updateBoard(board, DT)
      const center = board.x + halfW
      expect(Math.abs(center - board.centerX)).toBeLessThanOrEqual(board.amplitude + 1)
    }
  })
})
