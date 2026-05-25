import { MAX_HEALTH } from '../constants.js'

const heartStyle = (filled) => ({
  display: 'inline-block',
  width: 24,
  height: 24,
  marginRight: 4,
  fontSize: 20,
  lineHeight: '24px',
  color: filled ? '#e84393' : '#444',
  userSelect: 'none',
})

export default function HUD({ health }) {
  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      {Array.from({ length: MAX_HEALTH }, (_, i) => (
        <span key={i} style={heartStyle(i < health)}>
          {i < health ? '♥' : '♡'}
        </span>
      ))}
    </div>
  )
}
