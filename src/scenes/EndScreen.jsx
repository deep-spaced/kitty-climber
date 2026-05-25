import { useEffect, useRef } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js'

const containerStyle = {
  position: 'relative',
  display: 'inline-block',
}

const canvasStyle = {
  display: 'block',
  imageRendering: 'pixelated',
}

const overlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'monospace',
  color: '#fff',
  pointerEvents: 'none',
}

const titleStyle = {
  fontSize: 36,
  letterSpacing: 4,
  color: '#e8a87c',
  textShadow: '0 0 24px rgba(232,168,124,0.9)',
  marginBottom: 8,
  marginTop: 120,
}

const newRecordStyle = {
  fontSize: 16,
  letterSpacing: 3,
  color: '#ffe060',
  textShadow: '0 0 12px rgba(255,224,96,0.8)',
  marginBottom: 6,
}

const scoreStyle = {
  fontSize: 22,
  letterSpacing: 3,
  color: '#fff',
  marginBottom: 4,
}

const highScoreStyle = {
  fontSize: 14,
  letterSpacing: 2,
  color: 'rgba(255,255,255,0.5)',
  marginBottom: 32,
}

const replayStyle = {
  fontSize: 16,
  letterSpacing: 3,
  color: '#fff',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.3)',
  padding: '10px 28px',
  cursor: 'pointer',
  pointerEvents: 'auto',
}

function drawEndFrame(ctx, t, w, h) {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#0d0820')
  grad.addColorStop(1, '#1a1008')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Light beams from disco ball position
  const bx = w / 2, by = 72, br = 38
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + t * 0.5
    const hue = Math.round((i / 7 * 360 + t * 60) % 360)
    ctx.save()
    ctx.globalAlpha = 0.06 + Math.sin(t * 2 + i) * 0.03
    ctx.fillStyle = `hsl(${hue},100%,70%)`
    ctx.beginPath()
    ctx.moveTo(bx, by)
    const spread = 0.14
    ctx.lineTo(bx + Math.cos(angle - spread) * w * 1.2, by + Math.sin(angle - spread) * h * 1.2)
    ctx.lineTo(bx + Math.cos(angle + spread) * w * 1.2, by + Math.sin(angle + spread) * h * 1.2)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Hanging string
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(bx, 0)
  ctx.lineTo(bx, by - br)
  ctx.stroke()

  // Disco ball body
  ctx.fillStyle = '#aaa'
  ctx.beginPath()
  ctx.arc(bx, by, br, 0, Math.PI * 2)
  ctx.fill()

  // Grid lines on ball
  ctx.save()
  ctx.beginPath()
  ctx.arc(bx, by, br, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = '#777'
  ctx.lineWidth = 0.8
  for (let i = -br; i <= br; i += 9) {
    const hw = Math.sqrt(Math.max(0, br * br - i * i))
    ctx.beginPath(); ctx.moveTo(bx - hw, by + i); ctx.lineTo(bx + hw, by + i); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx + i, by - hw); ctx.lineTo(bx + i, by + hw); ctx.stroke()
  }
  ctx.restore()

  // Rotating color mirror-spots
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + t * 1.8
    const dist = br * 0.62
    const sx = bx + Math.cos(angle) * dist
    const sy = by + Math.sin(angle) * dist * 0.42
    const hue = Math.round((i * 36 + t * 80) % 360)
    ctx.fillStyle = `hsla(${hue},100%,75%,0.85)`
    ctx.fillRect(Math.round(sx) - 3, Math.round(sy) - 3, 6, 6)
  }

  // Falling confetti/sparkles
  for (let i = 0; i < 28; i++) {
    const phase = i / 28
    const x = Math.round((phase * w * 1.3 + t * (22 + i * 9)) % w)
    const y = Math.round(((t * (50 + i * 4) + phase * h) % h))
    const hue = Math.round((i * 13 + t * 45) % 360)
    ctx.globalAlpha = 0.5 + Math.sin(t * 4 + i) * 0.3
    ctx.fillStyle = `hsl(${hue},100%,70%)`
    ctx.fillRect(x, y, 2, 2)
  }
  ctx.globalAlpha = 1

  // Floor sparkle reflection
  for (let i = 0; i < 5; i++) {
    const rx = bx + Math.cos((i / 5) * Math.PI * 2 + t * 1.2) * 60
    const ry = h - 20
    const hue = Math.round((i * 72 + t * 100) % 360)
    ctx.globalAlpha = 0.25 + Math.sin(t * 3 + i * 1.3) * 0.15
    ctx.fillStyle = `hsl(${hue},100%,70%)`
    ctx.fillRect(Math.round(rx), ry, 3, 3)
  }
  ctx.globalAlpha = 1
}

export default function EndScreen({ score, highScore, isNewRecord, onReplay }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let last = null
    function tick(now) {
      const dt = last !== null ? (now - last) / 1000 : 0
      last = now
      timeRef.current += dt
      drawEndFrame(ctx, timeRef.current, CANVAS_WIDTH, CANVAS_HEIGHT)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={canvasStyle} />
      <div style={overlayStyle}>
        <div style={titleStyle}>ALL LEVELS CLEAR!</div>
        {isNewRecord && <div style={newRecordStyle}>NEW RECORD!</div>}
        <div style={scoreStyle}>SCORE: {score}</div>
        <div style={highScoreStyle}>BEST: {highScore}</div>
        <div style={replayStyle} onClick={onReplay}>PLAY AGAIN</div>
      </div>
    </div>
  )
}
