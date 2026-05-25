import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HUD from '../../src/components/HUD.jsx'
import { MAX_HEALTH } from '../../src/constants.js'

describe('HUD — hearts', () => {
  it('renders MAX_HEALTH slots when at full health', () => {
    render(<HUD health={MAX_HEALTH} />)
    const filled = screen.getAllByText('♥')
    const empty = screen.queryAllByText('♡')
    expect(filled).toHaveLength(MAX_HEALTH)
    expect(empty).toHaveLength(0)
  })

  it('renders all empty hearts at zero health', () => {
    render(<HUD health={0} />)
    const filled = screen.queryAllByText('♥')
    const empty = screen.getAllByText('♡')
    expect(filled).toHaveLength(0)
    expect(empty).toHaveLength(MAX_HEALTH)
  })

  it('renders partial health correctly (filled first, then empty)', () => {
    render(<HUD health={2} />)
    const filled = screen.getAllByText('♥')
    const empty = screen.getAllByText('♡')
    expect(filled).toHaveLength(2)
    expect(empty).toHaveLength(MAX_HEALTH - 2)
  })

  it('caps filled hearts at MAX_HEALTH when health overflows', () => {
    render(<HUD health={MAX_HEALTH + 5} />)
    const all = screen.queryAllByText('♡')
    expect(all).toHaveLength(0)
    expect(screen.getAllByText('♥')).toHaveLength(MAX_HEALTH)
  })

  it('does not crash and shows all empty for negative health', () => {
    render(<HUD health={-1} />)
    expect(screen.getAllByText('♡')).toHaveLength(MAX_HEALTH)
    expect(screen.queryAllByText('♥')).toHaveLength(0)
  })
})

describe('HUD — score', () => {
  it('displays the score when provided', () => {
    render(<HUD health={4} score={50} />)
    expect(screen.getByText('50')).toBeTruthy()
  })

  it('does not render a score element when score is undefined', () => {
    render(<HUD health={4} />)
    expect(screen.queryByText('0')).toBeNull()
  })

  it('displays zero score', () => {
    render(<HUD health={4} score={0} />)
    // score=0 is falsy but we pass null check via != null
    expect(screen.getByText('0')).toBeTruthy()
  })
})

describe('HUD — layout', () => {
  it('container is absolutely positioned at top-left', () => {
    const { container } = render(<HUD health={2} score={10} />)
    const div = container.firstChild
    expect(div.style.position).toBe('absolute')
    expect(div.style.top).toBe('12px')
    expect(div.style.left).toBe('12px')
  })
})
