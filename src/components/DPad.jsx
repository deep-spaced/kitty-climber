const dpadStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 80,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
  userSelect: 'none',
}

const groupStyle = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
}

const btnBase = {
  width: 44,
  height: 44,
  background: 'rgba(255,255,255,0.13)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: 14,
  fontFamily: 'monospace',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'none',
}

const actionBtnBase = {
  ...btnBase,
  width: 36,
  height: 36,
  fontSize: 11,
  color: '#e8a87c',
}

function pressKey(key) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}
function releaseKey(key) {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
}

function DButton({ label, keyName, style }) {
  return (
    <div
      style={style}
      onPointerDown={(e) => { e.preventDefault(); pressKey(keyName) }}
      onPointerUp={() => releaseKey(keyName)}
      onPointerLeave={() => releaseKey(keyName)}
    >
      {label}
    </div>
  )
}

export default function DPad() {
  return (
    <div style={dpadStyle}>
      <div style={groupStyle}>
        <DButton label="←" keyName="ArrowLeft"  style={btnBase} />
        <DButton label="→" keyName="ArrowRight" style={btnBase} />
      </div>
      <div style={groupStyle}>
        <DButton label="X"   keyName="x" style={actionBtnBase} />
        <DButton label="C"   keyName="c" style={actionBtnBase} />
        <DButton label="Z"   keyName="z" style={actionBtnBase} />
        <DButton label="V"   keyName="v" style={actionBtnBase} />
      </div>
    </div>
  )
}
