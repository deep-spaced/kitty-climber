import { useEffect, useState } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js'

const containerStyle = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  background: 'linear-gradient(to bottom, #0d0820, #1a1008)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'monospace',
  color: '#fff',
  userSelect: 'none',
  position: 'relative',
}

const titleStyle = {
  fontSize: 48,
  letterSpacing: 6,
  color: '#e8a87c',
  marginBottom: 8,
  textShadow: '0 0 20px rgba(232,168,124,0.6)',
}

const subtitleStyle = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: 3,
  marginBottom: 48,
}

const controlsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto auto',
  gap: '6px 24px',
  fontSize: 13,
  color: 'rgba(255,255,255,0.65)',
  marginBottom: 52,
}

const keyStyle = {
  color: '#e8a87c',
  textAlign: 'right',
}

const CONTROLS = [
  ['← →',      'move'],
  ['X',         'jump'],
  ['C',         'scratch'],
  ['Z',         'bite'],
  ['V',         'crouch'],
  ['reach ◆◆', 'collect fish'],
  ['reach ▶▶', 'exit level'],
]

export default function TitleScene({ onStart }) {
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 550)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      // Ignore pure modifier keys and browser shortcuts
      if (['Shift', 'Control', 'Alt', 'Meta', 'F5', 'F11', 'F12'].includes(e.key)) return
      onStart()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onStart])

  return (
    <div style={containerStyle} onClick={onStart}>
      <div style={titleStyle}>KITTY CLIMBER</div>
      <div style={subtitleStyle}>CAVE ADVENTURE</div>
      <div style={controlsGridStyle}>
        {CONTROLS.map(([key, action]) => (
          <>
            <span key={key + '-k'} style={keyStyle}>{key}</span>
            <span key={key + '-a'}>{action}</span>
          </>
        ))}
      </div>
      <div style={{ fontSize: 14, letterSpacing: 3, opacity: blink ? 0.9 : 0.2 }}>
        PRESS ANY KEY
      </div>
    </div>
  )
}
