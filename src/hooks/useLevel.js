import { useRef, useCallback } from 'react'
import { TILE_SIZE, TILES, ENEMY_STATES } from '../constants.js'
import { generateLevel } from '../engine/levelGenerator.js'
import { createBoard, createRock, updateBoard, updateRock } from '../entities/Obstacle.js'
import { createEnemy, updateEnemy, hurtEnemy } from '../entities/Enemy.js'
import { aabbOverlap } from '../engine/physics.js'
import { getAttackHitbox } from '../entities/Player.js'

const ROCK_SPAWN_INTERVAL = 4.0  // seconds between rock spawns at each spawn point

export function useLevel(seed = 1, levelIndex = 0) {
  const levelRef = useRef(null)
  const boardsRef = useRef(null)
  const rocksRef = useRef([])
  const rockTimersRef = useRef(null)
  const enemiesRef = useRef([])
  const fishRef = useRef([])

  if (levelRef.current === null) {
    const level = generateLevel(seed, { cols: 120, rows: 15, levelIndex })
    levelRef.current = level

    // Build moving boards from descriptors
    boardsRef.current = level.movingBoards.map(createBoard)

    // Rock spawn timers — stagger each spawn point so they don't all drop at once
    rockTimersRef.current = level.rockSpawns.map((_, i) => i * (ROCK_SPAWN_INTERVAL / level.rockSpawns.length))

    // Enemies
    enemiesRef.current = level.enemySpawns.map((s) => createEnemy(s.x, s.y))

    // Fish collectibles
    fishRef.current = level.fishSpawns.map((s) => ({ ...s, collected: false }))
  }

  const { map, spawnX, spawnY, rockSpawns, goalCol } = levelRef.current
  const levelWidthPx = map[0].length * TILE_SIZE
  const levelHeightPx = map.length * TILE_SIZE
  const goalX = goalCol * TILE_SIZE

  /**
   * Advance all obstacles by dt seconds.
   * Returns { boards, rocks } for rendering.
   * Also returns `playerHit` = true if any active rock overlaps the player rect.
   */
  const updateObstacles = useCallback((player, dt) => {
    // Moving boards
    boardsRef.current = boardsRef.current.map((b) => updateBoard(b, dt))

    // Rock spawn timers
    rockTimersRef.current = rockTimersRef.current.map((t, i) => {
      if (t <= 0) {
        rocksRef.current = [
          ...rocksRef.current.filter((r) => r.active),
          createRock(rockSpawns[i].col, rockSpawns[i].row),
        ]
        return ROCK_SPAWN_INTERVAL
      }
      return t - dt
    })

    // Update active rocks
    rocksRef.current = rocksRef.current.map((r) =>
      updateRock(r, map, dt, levelHeightPx)
    )

    // Check player collision with rocks
    const playerHit = rocksRef.current.some(
      (r) => r.active && aabbOverlap(r, player)
    )

    // Update enemies and resolve combat
    const attackHitbox = getAttackHitbox(player)
    const killedEnemies = []  // array of {x, y} world-space centres
    enemiesRef.current = enemiesRef.current.map((enemy) => {
      if (enemy.state === ENEMY_STATES.DEAD) return enemy
      // DYING enemies just tick their timer — no patrol, no contact
      if (enemy.state === ENEMY_STATES.DYING) return updateEnemy(enemy, map, dt)
      const moved = updateEnemy(enemy, map, dt)
      if (attackHitbox && aabbOverlap(attackHitbox, moved)) {
        killedEnemies.push({ x: moved.x + moved.width / 2, y: moved.y + moved.height / 2 })
        return hurtEnemy(moved)
      }
      return moved
    })

    // Enemy body contact deals damage to player (PATROL only)
    const enemyPlayerHit = enemiesRef.current.some(
      (e) => e.state === ENEMY_STATES.PATROL && aabbOverlap(e, player)
    )

    // Fish collection — track positions for particles
    const collectedFish = []  // array of {x, y} world-space centres
    fishRef.current = fishRef.current.map((f) => {
      if (f.collected) return f
      if (aabbOverlap(f, player)) {
        collectedFish.push({ x: f.x + f.width / 2, y: f.y + f.height / 2 })
        return { ...f, collected: true }
      }
      return f
    })

    // Goal detection
    const goalReached = player.x + player.width >= goalX

    return {
      boards: boardsRef.current,
      rocks: rocksRef.current.filter((r) => r.active),
      enemies: enemiesRef.current,
      fish: fishRef.current,
      playerHit,
      enemyPlayerHit,
      killedEnemies,
      collectedFish,
      goalReached,
    }
  }, [map, rockSpawns, levelHeightPx, goalX])

  /**
   * Build an augmented tilemap that includes moving boards as solid PLATFORM tiles.
   * Called each frame before physics so the player can stand on boards.
   */
  const getTilemapWithBoards = useCallback(() => {
    const boards = boardsRef.current
    if (boards.length === 0) return map

    // Shallow-copy only the rows that boards touch
    const augmented = map.map((row) => row)
    for (const board of boards) {
      const row = Math.floor((board.y + board.height) / TILE_SIZE)
      if (row < 0 || row >= map.length) continue

      augmented[row] = augmented[row].slice()  // copy row before mutating
      const colStart = Math.max(0, Math.floor(board.x / TILE_SIZE))
      const colEnd = Math.min(map[0].length - 1, Math.floor((board.x + board.width - 1) / TILE_SIZE))
      for (let c = colStart; c <= colEnd; c++) {
        if (augmented[row][c] === TILES.EMPTY) augmented[row][c] = TILES.PLATFORM
      }
    }
    return augmented
  }, [map])

  return {
    tilemap: map,
    getTilemapWithBoards,
    updateObstacles,
    levelWidthPx,
    levelHeightPx,
    goalX,
    spawnX,
    spawnY,
  }
}
