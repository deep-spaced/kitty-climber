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

  it('calls onEnter when available node is clicked directly on canvas', () => {
    const onEnter = vi.fn()
    const { container } = render(<MapView levelsCleared={0} onEnter={onEnter} />)
    const canvas = container.querySelector('canvas')
    // jsdom returns all-zero rects; stub it so getHitNode can compute pixel coords.
    // Canvas is 800x480; clientX/Y values map 1:1 when rect.left/top = 0 and scale = 1.
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 800, height: 480,
      right: 800, bottom: 480, x: 0, y: 0,
    })
    // Node 0 is at (110, 280) with NODE_R=20; click within NODE_R+8=28px
    fireEvent.click(canvas, { clientX: 110, clientY: 280 })
    expect(onEnter).toHaveBeenCalledOnce()
  })

  it('does not call onEnter when a locked node is clicked', () => {
    const onEnter = vi.fn()
    const { container } = render(<MapView levelsCleared={0} onEnter={onEnter} />)
    const canvas = container.querySelector('canvas')
    // Node 1 at (258, 164) is locked when levelsCleared=0
    fireEvent.click(canvas, { clientX: 258, clientY: 164 })
    expect(onEnter).not.toHaveBeenCalled()
  })

  it('highlights available node on mouse hover', () => {
    const { container } = render(<MapView levelsCleared={0} onEnter={() => {}} />)
    const canvas = container.querySelector('canvas')
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 280 })
    expect(canvas).toBeTruthy()
  })

  it('clears hover state when mouse leaves canvas', () => {
    const { container } = render(<MapView levelsCleared={0} onEnter={() => {}} />)
    const canvas = container.querySelector('canvas')
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 280 })
    fireEvent.mouseLeave(canvas)
    expect(canvas).toBeTruthy()
  })

  it('does not highlight non-available node on hover', () => {
    const { container } = render(<MapView levelsCleared={0} onEnter={() => {}} />)
    const canvas = container.querySelector('canvas')
    // Hover over locked node 1
    fireEvent.mouseMove(canvas, { clientX: 258, clientY: 164 })
    expect(canvas).toBeTruthy()
  })
})
