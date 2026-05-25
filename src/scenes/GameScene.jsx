import { useRef, useState, useCallback, useEffect } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, SCORE_PER_KILL } from '../constants.js'
import { useInput } from '../hooks/useInput.js'
import { useGameLoop } from '../hooks/useGameLoop.js'
import { useLevel } from '../hooks/useLevel.js'
import { createPlayer, updatePlayer, hurtPlayer } from '../entities/Player.js'
import { renderFrame, computeCameraX } from '../engine/renderer.js'
import HUD from '../components/HUD.jsx'

const overlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.65)',
  color: '#fff',
  fontSize: 32,
  fontFamily: 'monospace',
  letterSpacing: 2,
  cursor: 'pointer',
}

const subTextStyle = {
  fontSize: 14,
  marginTop: 12,
  opacity: 0.7,
  letterSpacing: 1,
}

const controlsHintStyle = {
  position: 'absolute',
  bottom: 8,
  right: 8,
  color: 'rgba(255,255,255,0.4)',
  fontSize: 11,
  fontFamily: 'monospace',
}

export default function GameScene({ seed = 1, levelIndex = 0, onLevelClear, onGameOver }) {
  const getInput = useInput()
  const { getTilemapWithBoards, tilemap, updateObstacles, levelWidthPx, spawnX, spawnY, goalX } = useLevel(seed, levelIndex)

  const canvasRef = useRef(null)
  const playerRef = useRef(createPlayer(spawnX, spawnY))
  const cameraXRef = useRef(0)
  const obstaclesRef = useRef({ boards: [], rocks: [], enemies: [] })

  const [health, setHealth] = useState(playerRef.current.health)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [levelClear, setLevelClear] = useState(false)

  // Advance to next level after brief delay when level is cleared
  useEffect(() => {
    if (!levelClear || !onLevelClear) return
    const t = setTimeout(() => onLevelClear(score), 1800)
    return () => clearTimeout(t)
  }, [levelClear, onLevelClear, score])

  const update = useCallback((dt) => {
    if (gameOver || levelClear) return

    const input = getInput()

    const liveMap = getTilemapWithBoards()
    playerRef.current = updatePlayer(playerRef.current, input, liveMap, dt)

    const { boards, rocks, enemies, playerHit, enemyPlayerHit, killedEnemies, goalReached } =
      updateObstacles(playerRef.current, dt)
    obstaclesRef.current = { boards, rocks, enemies }

    if (killedEnemies > 0) {
      setScore((prev) => prev + killedEnemies * SCORE_PER_KILL)
    }

    if (playerHit || enemyPlayerHit) {
      playerRef.current = hurtPlayer(playerRef.current)
      setHealth(playerRef.current.health)
      if (playerRef.current.health <= 0) setGameOver(true)
    }

    if (goalReached) {
      setLevelClear(true)
    }

    cameraXRef.current = computeCameraX(playerRef.current.x, levelWidthPx, CANVAS_WIDTH)

    setHealth((prev) => {
      const next = playerRef.current.health
      return prev !== next ? next : prev
    })
  }, [gameOver, levelClear, getInput, getTilemapWithBoards, updateObstacles, levelWidthPx])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    renderFrame(ctx, {
      tilemap,
      player: playerRef.current,
      boards: obstaclesRef.current.boards,
      rocks: obstaclesRef.current.rocks,
      enemies: obstaclesRef.current.enemies,
      goalX,
      cameraX: cameraXRef.current,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
    })
  }, [tilemap, goalX])

  useGameLoop({ update, render })

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
      <HUD health={health} score={score} />
      <div style={controlsHintStyle}>
        ←→ move · x jump · c scratch · z bite · v crouch
      </div>
      {levelClear && (
        <div style={overlayStyle}>
          LEVEL CLEAR!
          <div style={subTextStyle}>score: {score}</div>
        </div>
      )}
      {gameOver && !levelClear && (
        <div style={overlayStyle} onClick={onGameOver}>
          GAME OVER
          <div style={subTextStyle}>click to restart</div>
        </div>
      )}
    </div>
  )
}
