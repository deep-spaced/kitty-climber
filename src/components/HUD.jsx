import { MAX_HEALTH } from '../constants.js'

const containerStyle = {
  position: 'absolute',
  top: 12,
  left: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'monospace',
}

const heartFilledStyle = {
  display: 'inline-block',
  width: 24,
  height: 24,
  marginRight: 4,
  fontSize: 20,
  lineHeight: '24px',
  color: '#e84393',
  userSelect: 'none',
}

const heartEmptyStyle = {
  ...heartFilledStyle,
  color: '#444',
}

const scoreStyle = {
  marginLeft: 8,
  fontSize: 14,
  color: 'rgba(255,255,255,0.75)',
  userSelect: 'none',
}

const fishDotStyle = {
  marginLeft: 10,
  fontSize: 14,
  color: '#f0a030',
  userSelect: 'none',
}

const fishCountStyle = {
  marginLeft: 3,
  fontSize: 14,
  color: '#f0a030',
  userSelect: 'none',
}

const levelStyle = {
  marginLeft: 14,
  fontSize: 12,
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: 1,
  userSelect: 'none',
}

export default function HUD({ health, score, fishCount, levelIndex }) {
  return (
    <div style={containerStyle}>
      {Array.from({ length: MAX_HEALTH }, (_, i) => {
        const filled = i < health
        return (
          <span key={i} style={filled ? heartFilledStyle : heartEmptyStyle}>
            {filled ? '♥' : '♡'}
          </span>
        )
      })}
      {score != null && <span style={scoreStyle}>{score}</span>}
      {fishCount != null && fishCount > 0 && (
        <>
          <span style={fishDotStyle}>◆</span>
          <span style={fishCountStyle}>{fishCount}</span>
        </>
      )}
      {levelIndex != null && <span style={levelStyle}>LVL {levelIndex + 1}</span>}
    </div>
  )
}
