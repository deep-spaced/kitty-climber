import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DPad from '../../src/components/DPad.jsx'

describe('DPad', () => {
  it('renders movement buttons', () => {
    render(<DPad />)
    expect(screen.getByText('←')).toBeTruthy()
    expect(screen.getByText('→')).toBeTruthy()
  })

  it('renders action buttons', () => {
    render(<DPad />)
    expect(screen.getByText('X')).toBeTruthy()
    expect(screen.getByText('C')).toBeTruthy()
    expect(screen.getByText('Z')).toBeTruthy()
    expect(screen.getByText('V')).toBeTruthy()
  })

  it('dispatches keydown on pointer down', () => {
    const events = []
    window.addEventListener('keydown', (e) => events.push(e.key))
    render(<DPad />)
    fireEvent.pointerDown(screen.getByText('←'))
    expect(events).toContain('ArrowLeft')
    window.removeEventListener('keydown', events)
  })

  it('dispatches keyup on pointer up', () => {
    const events = []
    window.addEventListener('keyup', (e) => events.push(e.key))
    render(<DPad />)
    fireEvent.pointerUp(screen.getByText('→'))
    expect(events).toContain('ArrowRight')
    window.removeEventListener('keyup', events)
  })

  it('dispatches keyup on pointer leave', () => {
    const events = []
    window.addEventListener('keyup', (e) => events.push(e.key))
    render(<DPad />)
    fireEvent.pointerLeave(screen.getByText('X'))
    expect(events).toContain('x')
    window.removeEventListener('keyup', events)
  })
})
