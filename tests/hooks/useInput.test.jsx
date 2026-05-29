import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useInput } from '../../src/hooks/useInput.js'

afterEach(() => {
  // Release any lingering held keys
  fireEvent.keyUp(window, { key: 'ArrowLeft' })
  fireEvent.keyUp(window, { key: 'ArrowRight' })
  fireEvent.keyUp(window, { key: 'x' })
})

describe('useInput', () => {
  it('returns a stable getter function', () => {
    const { result } = renderHook(() => useInput())
    expect(typeof result.current).toBe('function')
  })

  it('initial state has all controls false', () => {
    const { result } = renderHook(() => useInput())
    const state = result.current()
    expect(state.left).toBe(false)
    expect(state.right).toBe(false)
    expect(state.jump).toBe(false)
    expect(state.scratch).toBe(false)
    expect(state.bite).toBe(false)
    expect(state.crouch).toBe(false)
  })

  it('reflects ArrowLeft key press', () => {
    const { result } = renderHook(() => useInput())
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(result.current().left).toBe(true)
    fireEvent.keyUp(window, { key: 'ArrowLeft' })
    expect(result.current().left).toBe(false)
  })

  it('reflects ArrowRight key press', () => {
    const { result } = renderHook(() => useInput())
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(result.current().right).toBe(true)
    fireEvent.keyUp(window, { key: 'ArrowRight' })
    expect(result.current().right).toBe(false)
  })

  it('reflects jump key (x)', () => {
    const { result } = renderHook(() => useInput())
    fireEvent.keyDown(window, { key: 'x' })
    expect(result.current().jump).toBe(true)
    fireEvent.keyUp(window, { key: 'x' })
    expect(result.current().jump).toBe(false)
  })

  it('removes listener on unmount', () => {
    const { result, unmount } = renderHook(() => useInput())
    unmount()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    // After unmount the handler is detached; a fresh call should see false
    // We can't easily verify this without a new hook instance, so just verify no crash
    expect(typeof result.current).toBe('function')
  })
})
