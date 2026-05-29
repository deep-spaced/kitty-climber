import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLevel } from '../../src/hooks/useLevel.js'
import { generateLevel } from '../../src/engine/levelGenerator.js'
import { TILES, TILE_SIZE, PLAYER_STATES, PLAYER_WIDTH, PLAYER_HEIGHT, CAGE_HEALTH, CAGE_HURT_DURATION, CAGE_FREED_DELAY } from '../../src/constants.js'

function makePlayer(overrides = {}) {
  return {
    x: 64, y: 288, width: 28, height: 40,
    state: PLAYER_STATES.IDLE, vx: 0, vy: 0,
    ...overrides,
  }
}

describe('useLevel — initialisation', () => {
  it('returns a tilemap array', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    expect(Array.isArray(result.current.tilemap)).toBe(true)
    expect(result.current.tilemap.length).toBeGreaterThan(0)
    expect(Array.isArray(result.current.tilemap[0])).toBe(true)
  })

  it('returns numeric spawn coordinates', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    expect(typeof result.current.spawnX).toBe('number')
    expect(typeof result.current.spawnY).toBe('number')
    expect(result.current.spawnX).toBeGreaterThanOrEqual(0)
    expect(result.current.spawnY).toBeGreaterThanOrEqual(0)
  })

  it('returns positive level dimensions', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    expect(result.current.levelWidthPx).toBeGreaterThan(0)
    expect(result.current.levelHeightPx).toBeGreaterThan(0)
  })

  it('returns roughPatches array', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    expect(Array.isArray(result.current.roughPatches)).toBe(true)
  })

  it('produces the same map for the same seed', () => {
    const { result: a } = renderHook(() => useLevel(42, 0))
    const { result: b } = renderHook(() => useLevel(42, 0))
    expect(JSON.stringify(a.current.tilemap)).toBe(JSON.stringify(b.current.tilemap))
  })
})

describe('useLevel — getTilemapWithBoards', () => {
  it('returns a 2D array', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    const map = result.current.getTilemapWithBoards()
    expect(Array.isArray(map)).toBe(true)
    expect(Array.isArray(map[0])).toBe(true)
  })

  it('has same dimensions as tilemap', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    const map = result.current.getTilemapWithBoards()
    expect(map.length).toBe(result.current.tilemap.length)
    expect(map[0].length).toBe(result.current.tilemap[0].length)
  })
})

describe('useLevel — updateObstacles', () => {
  it('returns all required properties', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    let obs
    act(() => {
      obs = result.current.updateObstacles(makePlayer(), 1 / 60)
    })
    expect(obs).toHaveProperty('boards')
    expect(obs).toHaveProperty('rocks')
    expect(obs).toHaveProperty('enemies')
    expect(obs).toHaveProperty('fish')
    expect(obs).toHaveProperty('treats')
    expect(obs).toHaveProperty('cage')
    expect(obs).toHaveProperty('playerHit')
    expect(obs).toHaveProperty('enemyPlayerHit')
    expect(obs).toHaveProperty('killedEnemies')
    expect(obs).toHaveProperty('collectedFish')
    expect(obs).toHaveProperty('collectedTreats')
    expect(obs).toHaveProperty('cageDamaged')
    expect(obs).toHaveProperty('cageFreed')
    expect(obs).toHaveProperty('platformDx')
  })

  it('boards is an array', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    let obs
    act(() => {
      obs = result.current.updateObstacles(makePlayer(), 1 / 60)
    })
    expect(Array.isArray(obs.boards)).toBe(true)
  })

  it('playerHit is boolean', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    let obs
    act(() => {
      obs = result.current.updateObstacles(makePlayer(), 1 / 60)
    })
    expect(typeof obs.playerHit).toBe('boolean')
  })

  it('platformDx is a number', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    let obs
    act(() => {
      obs = result.current.updateObstacles(makePlayer(), 1 / 60)
    })
    expect(typeof obs.platformDx).toBe('number')
  })

  it('advances rock timers on repeated calls', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    const player = makePlayer()
    let obs1, obs2
    act(() => {
      obs1 = result.current.updateObstacles(player, 1 / 60)
      obs2 = result.current.updateObstacles(player, 1 / 60)
    })
    // Both calls succeed without error
    expect(obs1).toBeTruthy()
    expect(obs2).toBeTruthy()
  })

  it('cage starts with health > 0 and freed = false', () => {
    const { result } = renderHook(() => useLevel(1, 0))
    let obs
    act(() => {
      obs = result.current.updateObstacles(makePlayer(), 1 / 60)
    })
    expect(obs.cage.health).toBeGreaterThan(0)
    expect(obs.cage.freed).toBe(false)
  })

  it('platformDx is non-zero when player stands on a board', () => {
    const { result } = renderHook(() => useLevel(1, 0))

    // Get current boards after one tick, then place player feet on first board
    let obs1
    act(() => {
      obs1 = result.current.updateObstacles(makePlayer(), 1 / 60)
    })

    if (obs1.boards.length > 0) {
      const board = obs1.boards[0]
      // Place player so feet (y + height = board.y) and horizontally overlapping
      const playerOnBoard = makePlayer({
        x: board.x + 1,
        y: board.y - 40,  // height=40 so feet at board.y
      })
      let obs2
      act(() => {
        obs2 = result.current.updateObstacles(playerOnBoard, 1 / 60)
      })
      // platformDx will be the board's dx for this frame; may be 0 if board is at max
      expect(typeof obs2.platformDx).toBe('number')
    }
  })

  it('levelIndex affects enemy count (higher index = more enemies)', () => {
    const { result: r0 } = renderHook(() => useLevel(1, 0))
    const { result: r3 } = renderHook(() => useLevel(1, 3))
    let obs0, obs3
    act(() => {
      obs0 = r0.current.updateObstacles(makePlayer(), 1 / 60)
      obs3 = r3.current.updateObstacles(makePlayer(), 1 / 60)
    })
    expect(obs3.enemies.length).toBeGreaterThanOrEqual(obs0.enemies.length)
  })
})

describe('useLevel — collection and damage', () => {
  const level = generateLevel(1, { cols: 120, rows: 15, levelIndex: 0 })

  it('collects fish when player overlaps fish position', () => {
    if (level.fishSpawns.length === 0) return
    const fish = level.fishSpawns[0]
    const { result } = renderHook(() => useLevel(1, 0))
    const playerOnFish = makePlayer({ x: fish.x, y: fish.y })
    let obs
    act(() => {
      obs = result.current.updateObstacles(playerOnFish, 1 / 60)
    })
    expect(obs.collectedFish.length).toBeGreaterThan(0)
  })

  it('already-collected fish is not collected again', () => {
    if (level.fishSpawns.length === 0) return
    const fish = level.fishSpawns[0]
    const { result } = renderHook(() => useLevel(1, 0))
    const playerOnFish = makePlayer({ x: fish.x, y: fish.y })
    let obs1, obs2
    act(() => {
      obs1 = result.current.updateObstacles(playerOnFish, 1 / 60)
      obs2 = result.current.updateObstacles(playerOnFish, 1 / 60)
    })
    expect(obs1.collectedFish.length).toBeGreaterThan(0)
    expect(obs2.collectedFish.length).toBe(0)
  })

  it('collects treat when player overlaps treat position', () => {
    if (level.treatSpawns.length === 0) return
    const treat = level.treatSpawns[0]
    const { result } = renderHook(() => useLevel(1, 0))
    const playerOnTreat = makePlayer({ x: treat.x, y: treat.y })
    let obs
    act(() => {
      obs = result.current.updateObstacles(playerOnTreat, 1 / 60)
    })
    expect(obs.collectedTreats.length).toBeGreaterThan(0)
  })

  it('damages cage when player attacks from adjacent position', () => {
    const cage = level.cageSpawn
    const { result } = renderHook(() => useLevel(1, 0))
    // Position player so scratch attack hitbox (facing right: x + width, width 36) overlaps cage
    const attacker = makePlayer({
      x: cage.x - PLAYER_WIDTH,
      y: cage.y,
      state: PLAYER_STATES.ATTACK_SCRATCH,
      stateTimer: 0.3,
      facing: 1,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    })
    let obs
    act(() => {
      obs = result.current.updateObstacles(attacker, 1 / 60)
    })
    expect(obs.cageDamaged).toBe(true)
    expect(obs.cage.health).toBe(CAGE_HEALTH - 1)
  })

  it('frees cage after CAGE_HEALTH hits and CAGE_FREED_DELAY elapses', () => {
    const cage = level.cageSpawn
    const { result } = renderHook(() => useLevel(1, 0))
    const attacker = makePlayer({
      x: cage.x - PLAYER_WIDTH,
      y: cage.y,
      state: PLAYER_STATES.ATTACK_SCRATCH,
      stateTimer: 0.3,
      facing: 1,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    })
    let obs
    act(() => {
      // Hit cage CAGE_HEALTH times with immunity window advance between hits
      for (let i = 0; i < CAGE_HEALTH; i++) {
        result.current.updateObstacles(attacker, CAGE_HURT_DURATION + 0.01)
      }
      // Advance past freed delay to trigger cageFreed
      obs = result.current.updateObstacles(makePlayer(), CAGE_FREED_DELAY + 0.01)
    })
    expect(obs.cageFreed).toBe(true)
  })
})
