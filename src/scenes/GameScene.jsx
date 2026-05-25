import { useRef, useState, useCallback, useEffect } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, SCORE_PER_KILL, FISH_SCORE, PLAYER_STATES } from '../constants.js'
import { useInput } from '../hooks/useInput.js'
import { useGameLoop } from '../hooks/useGameLoop.js'
import { useLevel } from '../hooks/useLevel.js'
import { useAudio } from '../hooks/useAudio.js'
import { createPlayer, updatePlayer, hurtPlayer } from '../entities/Player.js'
import { renderFrame, computeCameraX } from '../engine/renderer.js'
import { emitHit, emitDeath, emitCollect, emitLand, updateParticles } from '../engine/particles.js'
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

const ATTACK_STATES = new Set([PLAYER_STATES.ATTACK_SCRATCH, PLAYER_STATES.ATTACK_BITE])

export default function GameScene({ seed = 1, levelIndex = 0, onLevelClear, onGameOver }) {
  const getInput = useInput()
  const { getTilemapWithBoards, tilemap, updateObstacles, levelWidthPx, spawnX, spawnY, goalX } = useLevel(seed, levelIndex)
  const play = useAudio()

  const canvasRef = useRef(null)
  const playerRef = useRef(createPlayer(spawnX, spawnY))
  const cameraXRef = useRef(0)
  const obstaclesRef = useRef({ boards: [], rocks: [], enemies: [], fish: [] })
  const particlesRef = useRef([])

  const prevStateRef = useRef(playerRef.current.state)
  const prevOnGroundRef = useRef(playerRef.current.onGround)

  const [health, setHealth] = useState(playerRef.current.health)
  const [score, setScore] = useState(0)
  const [fishCount, setFishCount] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [levelClear, setLevelClear] = useState(false)

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

    const p = playerRef.current
    const prevState = prevStateRef.current
    const prevOnGround = prevOnGroundRef.current

    // Edge-triggered audio + land particles
    if (p.state === PLAYER_STATES.JUMP && prevState !== PLAYER_STATES.JUMP) play('jump')
    if (p.onGround && !prevOnGround) {
      play('land')
      particlesRef.current = [...particlesRef.current, ...emitLand(p.x + p.width / 2, p.y + p.height)]
    }
    if (ATTACK_STATES.has(p.state) && !ATTACK_STATES.has(prevState)) play('attack')

    prevStateRef.current = p.state
    prevOnGroundRef.current = p.onGround

    const { boards, rocks, enemies, fish, playerHit, enemyPlayerHit, killedEnemies, collectedFish, goalReached } =
      updateObstacles(p, dt)
    obstaclesRef.current = { boards, rocks, enemies, fish }

    if (killedEnemies.length > 0) {
      play('kill')
      setScore((prev) => prev + killedEnemies.length * SCORE_PER_KILL)
      for (const pos of killedEnemies) {
        particlesRef.current = [...particlesRef.current, ...emitDeath(pos.x, pos.y)]
      }
    }

    if (collectedFish.length > 0) {
      play('collect')
      setFishCount((prev) => prev + collectedFish.length)
      setScore((prev) => prev + collectedFish.length * FISH_SCORE)
      for (const pos of collectedFish) {
        particlesRef.current = [...particlesRef.current, ...emitCollect(pos.x, pos.y)]
      }
    }

    if (playerHit || enemyPlayerHit) {
      particlesRef.current = [...particlesRef.current, ...emitHit(p.x + p.width / 2, p.y + p.height / 2)]
      playerRef.current = hurtPlayer(p)
      setHealth(playerRef.current.health)
      if (playerRef.current.health <= 0) {
        play('gameOver')
        setGameOver(true)
      } else {
        play('hurt')
      }
    }

    if (goalReached && !levelClear) {
      play('levelClear')
      setLevelClear(true)
    }

    particlesRef.current = updateParticles(particlesRef.current, dt)

    cameraXRef.current = computeCameraX(playerRef.current.x, levelWidthPx, CANVAS_WIDTH)

    setHealth((prev) => {
      const next = playerRef.current.health
      return prev !== next ? next : prev
    })
  }, [gameOver, levelClear, getInput, getTilemapWithBoards, updateObstacles, levelWidthPx, play])

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
      fish: obstaclesRef.current.fish,
      particles: particlesRef.current,
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
      <HUD health={health} score={score} fishCount={fishCount} />
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
