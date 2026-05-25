import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EndScreen from '../../src/scenes/EndScreen.jsx'

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
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn())
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('EndScreen', () => {
  it('shows "ALL LEVELS CLEAR!" heading', () => {
    render(<EndScreen score={500} highScore={500} isNewRecord={false} onReplay={() => {}} />)
    expect(screen.getByText('ALL LEVELS CLEAR!')).toBeTruthy()
  })

  it('displays the final score', () => {
    render(<EndScreen score={750} highScore={750} isNewRecord={false} onReplay={() => {}} />)
    expect(screen.getByText('SCORE: 750')).toBeTruthy()
  })

  it('displays the high score', () => {
    render(<EndScreen score={300} highScore={1000} isNewRecord={false} onReplay={() => {}} />)
    expect(screen.getByText('BEST: 1000')).toBeTruthy()
  })

  it('shows "NEW RECORD!" when isNewRecord is true', () => {
    render(<EndScreen score={900} highScore={900} isNewRecord={true} onReplay={() => {}} />)
    expect(screen.getByText('NEW RECORD!')).toBeTruthy()
  })

  it('does not show "NEW RECORD!" when isNewRecord is false', () => {
    render(<EndScreen score={100} highScore={500} isNewRecord={false} onReplay={() => {}} />)
    expect(screen.queryByText('NEW RECORD!')).toBeNull()
  })

  it('calls onReplay when play again is clicked', () => {
    const onReplay = vi.fn()
    render(<EndScreen score={200} highScore={200} isNewRecord={false} onReplay={onReplay} />)
    fireEvent.click(screen.getByText('PLAY AGAIN'))
    expect(onReplay).toHaveBeenCalledOnce()
  })
})
