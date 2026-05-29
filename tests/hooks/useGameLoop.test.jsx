import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGameLoop } from '../../src/hooks/useGameLoop.js'

let tickFn = null

beforeEach(() => {
  tickFn = null
  vi.stubGlobal('requestAnimationFrame', vi.fn((fn) => { tickFn = fn; return 1 }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useGameLoop', () => {
  it('calls requestAnimationFrame on mount', () => {
    renderHook(() => useGameLoop({ update: vi.fn(), render: vi.fn() }))
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('calls cancelAnimationFrame on unmount', () => {
    const { unmount } = renderHook(() => useGameLoop({ update: vi.fn(), render: vi.fn() }))
    unmount()
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })

  it('does not throw when update and render are provided', () => {
    expect(() => renderHook(() => useGameLoop({ update: vi.fn(), render: vi.fn() }))).not.toThrow()
  })

  it('calls rAF only once on initial mount', () => {
    renderHook(() => useGameLoop({ update: vi.fn(), render: vi.fn() }))
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBe(1)
  })

  it('invokes update and render callbacks when tick fires', () => {
    const update = vi.fn()
    const render = vi.fn()
    renderHook(() => useGameLoop({ update, render }))
    if (tickFn) {
      tickFn(0)
      tickFn(100)  // 100ms → multiple fixed-dt steps
    }
    expect(update).toHaveBeenCalled()
    expect(render).toHaveBeenCalled()
  })
})
