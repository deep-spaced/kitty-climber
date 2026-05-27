import { useRef, useCallback } from 'react'
import { TILE_SIZE, TILES, ENEMY_STATES, CAGE_HEALTH, CAGE_FREED_DELAY, CAGE_HURT_DURATION } from '../constants.js'
import { generateLevel } from '../engine/levelGenerator.js'
import { createBoard, createRock, updateBoard, updateRock } from '../entities/Obstacle.js'
import { createEnemy, createBoss, updateEnemy, hurtEnemy } from '../entities/Enemy.js'
import { aabbOverlap } from '../engine/physics.js'
import { getAttackHitbox } from '../entities/Player.js'

const ROCK_SPAWN_INTERVAL = 4.0

export function useLevel(seed = 1, levelIndex = 0) {
  const levelRef      = useRef(null)
  const boardsRef     = useRef(null)
  const rocksRef      = useRef([])
  const rockTimersRef = useRef(null)
  const enemiesRef    = useRef([])
  const fishRef       = useRef([])
  const treatsRef     = useRef([])
  const cageRef       = useRef(null)

  if (levelRef.current === null) {
    const level = generateLevel(seed, { cols: 120, rows: 15, levelIndex })
    levelRef.current = level

    boardsRef.current = level.movingBoards.map(createBoard)
    rockTimersRef.current = level.rockSpawns.map((_, i) => i * (ROCK_SPAWN_INTERVAL / level.rockSpawns.length))

    // Regular enemies
    enemiesRef.current = level.enemySpawns.map((s) => createEnemy(s.x, s.y))

    // Boss (if the generator produced one)
    if (level.bossSpawn) {
      enemiesRef.current = [...enemiesRef.current, createBoss(level.bossSpawn.x, level.bossSpawn.y)]
    }

    fishRef.current   = level.fishSpawns.map((s) => ({ ...s, collected: false }))
    treatsRef.current = level.treatSpawns.map((s) => ({ ...s, collected: false }))

    cageRef.current = {
      ...level.cageSpawn,
      health: CAGE_HEALTH,
      freed: false,
      freedTimer: 0,
      hurtTimer: 0,
    }
  }

  const { map, spawnX, spawnY, rockSpawns, roughPatches } = levelRef.current
  const levelWidthPx  = map[0].length * TILE_SIZE
  const levelHeightPx = map.length * TILE_SIZE

  const updateObstacles = useCallback((player, dt) => {
    // Detect which board (if any) the player is standing on before boards move
    let boardUnderPlayer = null
    const playerFeetY = player.y + player.height
    for (const board of boardsRef.current) {
      if (
        Math.abs(playerFeetY - board.y) <= 2 &&
        player.x + player.width > board.x &&
        player.x < board.x + board.width
      ) {
        boardUnderPlayer = board
        break
      }
    }

    // Moving boards
    boardsRef.current = boardsRef.current.map((b) => updateBoard(b, dt))

    // Apply the updated board's dx to the player if they were riding it
    let platformDx = 0
    if (boardUnderPlayer !== null) {
      const updated = boardsRef.current.find((b) => b.centerX === boardUnderPlayer.centerX)
      if (updated) platformDx = updated.dx ?? 0
    }

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

    rocksRef.current = rocksRef.current.map((r) => updateRock(r, map, dt, levelHeightPx))

    const playerHit = rocksRef.current.some((r) => r.active && aabbOverlap(r, player))

    // Enemies + combat
    const attackHitbox = getAttackHitbox(player)
    const killedEnemies = []
    enemiesRef.current = enemiesRef.current.map((enemy) => {
      if (enemy.state === ENEMY_STATES.DEAD) return enemy
      if (enemy.state === ENEMY_STATES.DYING) return updateEnemy(enemy, map, dt)
      const moved = updateEnemy(enemy, map, dt)
      // Only damage if attack is active and enemy is not in invincibility window
      if (attackHitbox && moved.hurtTimer <= 0 && aabbOverlap(attackHitbox, moved)) {
        const hurt = hurtEnemy(moved)
        if (hurt.state === ENEMY_STATES.DYING) {
          killedEnemies.push({ x: moved.x + moved.width / 2, y: moved.y + moved.height / 2 })
        }
        return hurt
      }
      return moved
    })

    const enemyPlayerHit = enemiesRef.current.some(
      (e) => e.state === ENEMY_STATES.PATROL && aabbOverlap(e, player)
    )

    // Fish collection
    const collectedFish = []
    fishRef.current = fishRef.current.map((f) => {
      if (f.collected) return f
      if (aabbOverlap(f, player)) {
        collectedFish.push({ x: f.x + f.width / 2, y: f.y + f.height / 2 })
        return { ...f, collected: true }
      }
      return f
    })

    // Treat collection
    const collectedTreats = []
    treatsRef.current = treatsRef.current.map((t) => {
      if (t.collected) return t
      if (aabbOverlap(t, player)) {
        collectedTreats.push({ x: t.x + t.width / 2, y: t.y + t.height / 2 })
        return { ...t, collected: true }
      }
      return t
    })

    // Cage: attack interaction and freed timer
    let cage = cageRef.current
    let cageDamaged = false
    let cageFreed   = false

    cage = { ...cage, hurtTimer: Math.max(0, cage.hurtTimer - dt) }

    if (cage.freed) {
      cage = { ...cage, freedTimer: cage.freedTimer + dt }
      if (cage.freedTimer >= CAGE_FREED_DELAY) cageFreed = true
    } else if (attackHitbox && cage.hurtTimer <= 0 && aabbOverlap(attackHitbox, cage)) {
      const newHealth = cage.health - 1
      cage = {
        ...cage,
        health: Math.max(0, newHealth),
        hurtTimer: CAGE_HURT_DURATION,
        freed: newHealth <= 0,
      }
      cageDamaged = true
    }

    cageRef.current = cage

    return {
      boards: boardsRef.current,
      rocks:  rocksRef.current.filter((r) => r.active),
      enemies: enemiesRef.current,
      fish:   fishRef.current,
      treats: treatsRef.current,
      cage,
      playerHit,
      enemyPlayerHit,
      killedEnemies,
      collectedFish,
      collectedTreats,
      cageDamaged,
      cageFreed,
      platformDx,
    }
  }, [map, rockSpawns, levelHeightPx])

  const getTilemapWithBoards = useCallback(() => {
    const boards = boardsRef.current
    if (boards.length === 0) return map

    const augmented = map.map((row) => row)
    for (const board of boards) {
      const row = Math.floor((board.y + board.height) / TILE_SIZE)
      if (row < 0 || row >= map.length) continue
      augmented[row] = augmented[row].slice()
      const colStart = Math.max(0, Math.floor(board.x / TILE_SIZE))
      const colEnd   = Math.min(map[0].length - 1, Math.floor((board.x + board.width - 1) / TILE_SIZE))
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
    spawnX,
    spawnY,
    roughPatches,
  }
}
