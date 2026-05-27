import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import MapView from '../../src/scenes/MapView.jsx'

const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  closePath: vi.fn(),
  fillText: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  shadowBlur: 0,
  shadowColor: '',
  globalAlpha: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  setLineDash: vi.fn(),
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx)
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('MapView', () => {
  it('renders a canvas element', () => {
    const { container } = render(<MapView levelsCleared={0} onEnter={() => {}} />)
    expect(container.querySelector('canvas')).toBeTruthy()
  })

  it('canvas has the expected dimensions', () => {
    const { container } = render(<MapView levelsCleared={0} onEnter={() => {}} />)
    const canvas = container.querySelector('canvas')
    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(480)
  })

  it('calls onEnter when Enter key is pressed', () => {
    const onEnter = vi.fn()
    render(<MapView levelsCleared={0} onEnter={onEnter} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onEnter).toHaveBeenCalledOnce()
  })

  it('calls onEnter when Space key is pressed', () => {
    const onEnter = vi.fn()
    render(<MapView levelsCleared={0} onEnter={onEnter} />)
    fireEvent.keyDown(window, { key: ' ' })
    expect(onEnter).toHaveBeenCalledOnce()
  })

  it('removes keyboard listener on unmount', () => {
    const onEnter = vi.fn()
    const { unmount } = render(<MapView levelsCleared={0} onEnter={onEnter} />)
    unmount()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onEnter).not.toHaveBeenCalled()
  })

  it('draws to the canvas on mount', () => {
    render(<MapView levelsCleared={1} onEnter={() => {}} />)
    expect(mockCtx.fillRect).toHaveBeenCalled()
  })
})
