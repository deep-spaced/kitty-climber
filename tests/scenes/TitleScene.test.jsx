import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TitleScene from '../../src/scenes/TitleScene.jsx'

afterEach(() => vi.restoreAllMocks())

describe('TitleScene', () => {
  it('renders the game title', () => {
    render(<TitleScene onStart={() => {}} />)
    expect(screen.getByText('KITTY CLIMBER')).toBeTruthy()
  })

  it('renders the subtitle', () => {
    render(<TitleScene onStart={() => {}} />)
    expect(screen.getByText('CAVE ADVENTURE')).toBeTruthy()
  })

  it('renders PRESS ANY KEY prompt', () => {
    render(<TitleScene onStart={() => {}} />)
    expect(screen.getByText('PRESS ANY KEY')).toBeTruthy()
  })

  it('calls onStart when a regular key is pressed', () => {
    const onStart = vi.fn()
    render(<TitleScene onStart={onStart} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onStart when ArrowRight is pressed', () => {
    const onStart = vi.fn()
    render(<TitleScene onStart={onStart} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('does not call onStart for Shift key', () => {
    const onStart = vi.fn()
    render(<TitleScene onStart={onStart} />)
    fireEvent.keyDown(window, { key: 'Shift' })
    expect(onStart).not.toHaveBeenCalled()
  })

  it('does not call onStart for Control key', () => {
    const onStart = vi.fn()
    render(<TitleScene onStart={onStart} />)
    fireEvent.keyDown(window, { key: 'Control' })
    expect(onStart).not.toHaveBeenCalled()
  })

  it('calls onStart when the container is clicked', () => {
    const onStart = vi.fn()
    const { container } = render(<TitleScene onStart={onStart} />)
    fireEvent.click(container.firstChild)
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('shows high score when it is greater than 0', () => {
    render(<TitleScene onStart={() => {}} highScore={1500} />)
    expect(screen.getByText('BEST: 1500')).toBeTruthy()
  })

  it('does not show high score when it is 0', () => {
    render(<TitleScene onStart={() => {}} highScore={0} />)
    expect(screen.queryByText(/BEST:/)).toBeNull()
  })

  it('removes the keyboard listener when unmounted', () => {
    const onStart = vi.fn()
    const { unmount } = render(<TitleScene onStart={onStart} />)
    unmount()
    fireEvent.keyDown(window, { key: 'x' })
    expect(onStart).not.toHaveBeenCalled()
  })
})
