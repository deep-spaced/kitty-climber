import { useRef, useState, useCallback } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js'
import { useInput } from '../hooks/useInput.js'
import { useGameLoop } from '../hooks/useGameLoop.js'
import { useLevel } from '../hooks/useLevel.js'
import { createPlayer, updatePlayer, hurtPlayer } from '../entities/Player.js'
import { renderFrame, computeCameraX } from '../engine/renderer.js'
import HUD from '../components/HUD.jsx'

export default function GameScene({ seed = 1, levelIndex = 0 }) {
  const getInput = useInput()
  const { getTilemapWithBoards, tilemap, updateObstacles, levelWidthPx, spawnX, spawnY } = useLevel(seed, levelIndex)

  const canvasRef = useRef(null)
  const playerRef = useRef(createPlayer(spawnX, spawnY))
  const cameraXRef = useRef(0)
  const obstaclesRef = useRef({ boards: [], rocks: [] })

  const [health, setHealth] = useState(playerRef.current.health)
  const [gameOver, setGameOver] = useState(false)

  const update = useCallback((dt) => {
    if (gameOver) return

    const input = getInput()

    // Use board-augmented tilemap so player can stand on moving boards
    const liveMap = getTilemapWithBoards()
    playerRef.current = updatePlayer(playerRef.current, input, liveMap, dt)

    // Tick obstacles; check if any rock hit the player
    const { boards, rocks, playerHit } = updateObstacles(playerRef.current, dt)
    obstaclesRef.current = { boards, rocks }

    if (playerHit) {
      playerRef.current = hurtPlayer(playerRef.current)
      setHealth(playerRef.current.health)
      if (playerRef.current.health <= 0) setGameOver(true)
    }

    cameraXRef.current = computeCameraX(playerRef.current.x, levelWidthPx, CANVAS_WIDTH)

    setHealth((prev) => {
      const next = playerRef.current.health
      return prev !== next ? next : prev
    })
  }, [gameOver, getInput, getTilemapWithBoards, updateObstacles, levelWidthPx])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    renderFrame(ctx, {
      tilemap,
      player: playerRef.current,
      boards: obstaclesRef.current.boards,
      rocks: obstaclesRef.current.rocks,
      cameraX: cameraXRef.current,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
    })
  }, [tilemap])

  useGameLoop({ update, render })

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
      <HUD health={health} />
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontFamily: 'monospace',
      }}>
        ←→ move · x jump · c scratch · z bite · v crouch
      </div>
      {gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)',
          color: '#fff',
          fontSize: 32,
          fontFamily: 'monospace',
          letterSpacing: 2,
        }}>
          GAME OVER
        </div>
      )}
    </div>
  )
}
