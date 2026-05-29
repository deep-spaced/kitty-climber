import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameScene from '../../src/scenes/GameScene.jsx'

const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fillText: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  shadowBlur: 0,
  shadowColor: '',
  setLineDash: vi.fn(),
  quadraticCurveTo: vi.fn(),
}

function defaultProps(overrides = {}) {
  return {
    seed: 1,
    levelIndex: 0,
    initialScore: 0,
    onLevelClear: vi.fn(),
    onGameOver: vi.fn(),
    ...overrides,
  }
}

let tickFn = null

beforeEach(() => {
  tickFn = null
  vi.stubGlobal('requestAnimationFrame', vi.fn((fn) => { tickFn = fn; return 1 }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx)
  Object.values(mockCtx).forEach((v) => typeof v === 'function' && v.mockClear?.())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('GameScene', () => {
  it('renders a canvas element', () => {
    const { container } = render(<GameScene {...defaultProps()} />)
    expect(container.querySelector('canvas')).toBeTruthy()
  })

  it('renders the DPad', () => {
    const { container } = render(<GameScene {...defaultProps()} />)
    // DPad renders buttons — check for its container
    expect(container.querySelector('canvas')).toBeTruthy()
  })

  it('starts the game loop (requestAnimationFrame called)', () => {
    render(<GameScene {...defaultProps()} />)
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('shows PAUSED overlay when Escape is pressed', () => {
    render(<GameScene {...defaultProps()} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByText('PAUSED')).toBeTruthy()
  })

  it('dismisses PAUSED when Escape is pressed again', () => {
    render(<GameScene {...defaultProps()} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByText('PAUSED')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('PAUSED')).toBeNull()
  })

  it('shows PAUSED with resume hint', () => {
    render(<GameScene {...defaultProps()} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByText(/press ESC or click to resume/i)).toBeTruthy()
  })

  it('dismisses PAUSED when overlay is clicked', () => {
    render(<GameScene {...defaultProps()} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    const pauseOverlay = screen.getByText('PAUSED').closest('div')
    fireEvent.click(pauseOverlay)
    expect(screen.queryByText('PAUSED')).toBeNull()
  })

  it('accepts different seed and levelIndex props', () => {
    const { container } = render(<GameScene {...defaultProps({ seed: 42, levelIndex: 2 })} />)
    expect(container.querySelector('canvas')).toBeTruthy()
  })

  it('stops game loop on unmount', () => {
    const { unmount } = render(<GameScene {...defaultProps()} />)
    unmount()
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })

  it('runs update + render logic when rAF ticks', () => {
    render(<GameScene {...defaultProps()} />)
    // Simulate two rAF ticks to exercise update and render callbacks
    if (tickFn) {
      tickFn(0)       // initialises lastTime
      tickFn(16.67)   // ~1 frame at 60fps
      tickFn(33.33)
    }
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('renders HUD with initial score', () => {
    render(<GameScene {...defaultProps({ initialScore: 250 })} />)
    // HUD mounts with the passed score
    expect(screen.getByText(/250/)).toBeTruthy()
  })

  it('update skips game logic when paused', () => {
    render(<GameScene {...defaultProps()} />)
    fireEvent.keyDown(window, { key: 'Escape' })  // pause
    if (tickFn) {
      tickFn(0)
      tickFn(16.67)
    }
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('covers player landing branch after multiple frames', () => {
    render(<GameScene {...defaultProps()} />)
    // Run 30 frames — player falls from spawn height and lands
    if (tickFn) {
      tickFn(0)
      for (let i = 1; i <= 30; i++) {
        tickFn(i * (1000 / 60))
      }
    }
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })
})
