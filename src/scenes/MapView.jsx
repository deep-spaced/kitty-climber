import { useRef, useEffect, useCallback, useState } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js'

const NODE_R = 20

const LEVEL_NODES = [
  { name: 'Base',         sub: 'Base of the mountain', x: 110, y: 280 },
  { name: 'First Peak',   sub: 'The first summit',     x: 258, y: 164 },
  { name: 'Tallest Peak', sub: 'The highest point',    x: 452, y: 80  },
  { name: 'Far Side',     sub: 'The far side',         x: 686, y: 248 },
]

const MOUNTAIN_PTS = [
  [0, 480], [0, 378], [50, 330], [100, 282], [150, 238],
  [200, 202], [258, 162], [296, 178], [346, 164], [392, 134],
  [452, 78],  [506, 112], [560, 152], [618, 192], [678, 236],
  [738, 270], [800, 304], [800, 480],
]

const SNOW_LEFT = [
  [222, 194], [242, 174], [258, 162], [278, 170], [296, 178],
  [272, 192], [244, 198],
]

const SNOW_RIGHT = [
  [384, 142], [410, 118], [434, 96], [452, 78], [472, 90],
  [506, 112], [490, 132], [462, 118], [432, 128],
]

// Quadratic bezier control points for path segments
const PATH_SEGS = [
  { from: 0, to: 1, cx: 180, cy: 218 },
  { from: 1, to: 2, cx: 356, cy: 120 },
  { from: 2, to: 3, cx: 574, cy: 148 },
]

function drawPoly(ctx, pts) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.fill()
}

function drawTinyKitten(ctx, cx, cy) {
  ctx.fillStyle = '#f5c040'
  ctx.fillRect(cx - 5, cy + 1, 10, 6)
  ctx.fillRect(cx - 4, cy - 5, 8, 6)
  ctx.fillRect(cx - 4, cy - 9, 3, 4)
  ctx.fillRect(cx + 1, cy - 9, 3, 4)
}

function drawScene(ctx, levelsCleared, hoveredIdx) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  sky.addColorStop(0, '#060318')
  sky.addColorStop(0.65, '#0d0820')
  sky.addColorStop(1, '#1a1008')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  const STARS = [
    [42,18],[189,45],[312,12],[520,38],[688,22],[95,72],[440,55],
    [580,15],[730,50],[155,30],[370,68],[620,42],[250,8],[480,60],
    [660,72],[340,30],[540,82],[710,36],[88,52],[420,22],
  ]
  for (const [sx, sy] of STARS) ctx.fillRect(sx, sy, 1.5, 1.5)

  // Crescent moon
  ctx.fillStyle = 'rgba(255,248,200,0.88)'
  ctx.beginPath()
  ctx.arc(740, 52, 18, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#060318'
  ctx.beginPath()
  ctx.arc(750, 46, 15, 0, Math.PI * 2)
  ctx.fill()

  // Mountain body
  const mtnGrad = ctx.createLinearGradient(0, 60, 0, CANVAS_HEIGHT)
  mtnGrad.addColorStop(0, '#4a4460')
  mtnGrad.addColorStop(0.45, '#3a3450')
  mtnGrad.addColorStop(1, '#26243a')
  ctx.fillStyle = mtnGrad
  drawPoly(ctx, MOUNTAIN_PTS)

  // Mountain ridge highlight
  ctx.strokeStyle = 'rgba(160,150,190,0.28)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(MOUNTAIN_PTS[1][0], MOUNTAIN_PTS[1][1])
  for (let i = 2; i < MOUNTAIN_PTS.length - 2; i++) {
    ctx.lineTo(MOUNTAIN_PTS[i][0], MOUNTAIN_PTS[i][1])
  }
  ctx.stroke()

  // Snow caps
  ctx.fillStyle = '#e8edf6'
  drawPoly(ctx, SNOW_LEFT)
  drawPoly(ctx, SNOW_RIGHT)

  // Snow highlight (sun-lit side)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  drawPoly(ctx, SNOW_RIGHT.slice(0, 5))

  // Connecting path between nodes
  for (const seg of PATH_SEGS) {
    const from    = LEVEL_NODES[seg.from]
    const to      = LEVEL_NODES[seg.to]
    const cleared = seg.to <= levelsCleared
    const visible = seg.from < levelsCleared || seg.from === 0

    ctx.save()
    if (cleared) {
      ctx.strokeStyle = '#c8a840'
      ctx.lineWidth = 3
      ctx.setLineDash([8, 5])
    } else if (visible) {
      ctx.strokeStyle = 'rgba(200,168,64,0.38)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 8])
    } else {
      ctx.strokeStyle = 'rgba(120,110,150,0.25)'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 10])
    }
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(seg.cx, seg.cy, to.x, to.y)
    ctx.stroke()
    ctx.restore()
  }

  // Level nodes
  for (let i = 0; i < LEVEL_NODES.length; i++) {
    const node    = LEVEL_NODES[i]
    const cleared = i < levelsCleared
    const current = i === levelsCleared
    const locked  = i > levelsCleared
    const hovered = i === hoveredIdx

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.arc(node.x + 2, node.y + 3, NODE_R, 0, Math.PI * 2)
    ctx.fill()

    // Circle fill
    const r = hovered ? NODE_R + 3 : NODE_R
    if (cleared) {
      ctx.fillStyle = '#22884a'
    } else if (current) {
      ctx.fillStyle = hovered ? '#ffcc22' : '#e09020'
    } else {
      ctx.fillStyle = '#32304a'
    }
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
    ctx.fill()

    // Outer glow ring for current level
    if (current) {
      ctx.strokeStyle = hovered ? 'rgba(255,230,80,0.85)' : 'rgba(240,170,30,0.55)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Inner decorative ring
    ctx.strokeStyle = cleared ? '#44cc6a' : (current ? '#ffd060' : '#4a4868')
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(node.x, node.y, r - 5, 0, Math.PI * 2)
    ctx.stroke()

    // Icon
    if (cleared) {
      drawTinyKitten(ctx, node.x, node.y)
    } else if (current) {
      ctx.fillStyle = '#fff8e0'
      ctx.font = 'bold 15px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('▶', node.x + 1, node.y + 1)
    } else {
      ctx.fillStyle = '#5a5878'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', node.x, node.y + 1)
    }

    // Level number badge (top-left of circle)
    ctx.fillStyle = cleared ? '#166630' : (current ? '#7a4a00' : '#1e1c2e')
    ctx.beginPath()
    ctx.arc(node.x - r + 5, node.y - r + 5, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = cleared ? '#88ffaa' : (current ? '#ffd060' : '#6a688a')
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(i + 1, node.x - r + 5, node.y - r + 6)

    // Name label below node
    ctx.fillStyle = locked ? 'rgba(170,160,200,0.45)' : '#f0eeff'
    ctx.font = `bold 12px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(node.name, node.x, node.y + r + 6)

    if (!locked) {
      ctx.fillStyle = cleared ? 'rgba(100,220,130,0.72)' : 'rgba(255,210,60,0.85)'
      ctx.font = `10px monospace`
      ctx.fillText(node.sub, node.x, node.y + r + 21)
    }
  }

  // Title
  ctx.textAlign = 'center'
  ctx.fillStyle = '#e8a87c'
  ctx.font = 'bold 28px monospace'
  ctx.shadowColor = 'rgba(232,168,124,0.55)'
  ctx.shadowBlur = 14
  ctx.textBaseline = 'top'
  ctx.fillText('MOUNT TWITCHY', CANVAS_WIDTH / 2, 14)
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255,255,255,0.32)'
  ctx.font = '11px monospace'
  ctx.fillText('find the missing kittens', CANVAS_WIDTH / 2, 46)

  // Bottom hint
  ctx.textBaseline = 'bottom'
  if (levelsCleared < LEVEL_NODES.length) {
    ctx.fillStyle = 'rgba(255,215,70,0.82)'
    ctx.font = '12px monospace'
    ctx.fillText(
      `click LEVEL ${levelsCleared + 1} · ${LEVEL_NODES[levelsCleared].name} · to begin`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - 10,
    )
  } else {
    ctx.fillStyle = 'rgba(100,220,130,0.82)'
    ctx.font = '12px monospace'
    ctx.fillText('all kittens found!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10)
  }
}

export default function MapView({ levelsCleared, onEnter }) {
  const canvasRef    = useRef(null)
  const [hoveredIdx, setHoveredIdx] = useState(-1)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawScene(ctx, levelsCleared, hoveredIdx)
  }, [levelsCleared, hoveredIdx])

  useEffect(() => { draw() }, [draw])

  // Keyboard: Enter or Space starts the current level
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') onEnter()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEnter])

  const getHitNode = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return -1
    const rect   = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH  / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    const mx = (clientX - rect.left) * scaleX
    const my = (clientY - rect.top)  * scaleY
    for (let i = 0; i < LEVEL_NODES.length; i++) {
      const n = LEVEL_NODES[i]
      if (Math.hypot(mx - n.x, my - n.y) <= NODE_R + 8) return i
    }
    return -1
  }, [])

  const handleMouseMove = useCallback((e) => {
    const idx = getHitNode(e.clientX, e.clientY)
    // Only highlight the currently-available node
    setHoveredIdx(idx === levelsCleared ? idx : -1)
  }, [getHitNode, levelsCleared])

  const handleClick = useCallback((e) => {
    const idx = getHitNode(e.clientX, e.clientY)
    if (idx === levelsCleared) onEnter()
  }, [getHitNode, levelsCleared, onEnter])

  const handleMouseLeave = useCallback(() => setHoveredIdx(-1), [])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        imageRendering: 'pixelated',
        cursor: hoveredIdx >= 0 ? 'pointer' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    />
  )
}
