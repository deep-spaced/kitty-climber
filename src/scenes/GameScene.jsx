import { useRef, useState, useCallback } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from '../constants.js'
import { useInput } from '../hooks/useInput.js'
import { useGameLoop } from '../hooks/useGameLoop.js'
import { useLevel } from '../hooks/useLevel.js'
import { createPlayer, updatePlayer } from '../entities/Player.js'
import { renderFrame, computeCameraX } from '../engine/renderer.js'
import HUD from '../components/HUD.jsx'

const SPAWN_X = TILE_SIZE * 2
const SPAWN_Y = TILE_SIZE * 10

export default function GameScene() {
  const canvasRef = useRef(null)
  const getInput = useInput()
  const { tilemap, levelWidthPx } = useLevel()

  const playerRef = useRef(createPlayer(SPAWN_X, SPAWN_Y))
  const cameraXRef = useRef(0)

  const [health, setHealth] = useState(playerRef.current.health)

  const update = useCallback((dt) => {
    const input = getInput()
    playerRef.current = updatePlayer(playerRef.current, input, tilemap, dt)
    cameraXRef.current = computeCameraX(playerRef.current.x, levelWidthPx, CANVAS_WIDTH)

    // Sync health to React state (only re-renders when it changes)
    setHealth((prev) => {
      const next = playerRef.current.health
      return prev !== next ? next : prev
    })
  }, [getInput, tilemap, levelWidthPx])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    renderFrame(ctx, {
      tilemap,
      player: playerRef.current,
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
    </div>
  )
}
