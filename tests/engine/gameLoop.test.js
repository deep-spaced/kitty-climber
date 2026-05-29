import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createGameLoop } from '../../src/engine/gameLoop.js'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createGameLoop', () => {
  it('returns start and stop functions', () => {
    const loop = createGameLoop({ update: vi.fn(), render: vi.fn() })
    expect(typeof loop.start).toBe('function')
    expect(typeof loop.stop).toBe('function')
  })

  it('calls requestAnimationFrame when started', () => {
    const loop = createGameLoop({ update: vi.fn(), render: vi.fn() })
    loop.start()
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('does not call rAF again if already running', () => {
    const loop = createGameLoop({ update: vi.fn(), render: vi.fn() })
    loop.start()
    const count = vi.mocked(requestAnimationFrame).mock.calls.length
    loop.start()
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBe(count)
  })

  it('calls cancelAnimationFrame when stopped', () => {
    const loop = createGameLoop({ update: vi.fn(), render: vi.fn() })
    loop.start()
    loop.stop()
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
  })

  it('stop is a no-op when loop is not running', () => {
    const loop = createGameLoop({ update: vi.fn(), render: vi.fn() })
    expect(() => loop.stop()).not.toThrow()
    expect(cancelAnimationFrame).not.toHaveBeenCalled()
  })

  it('calls update and render when tick fires', () => {
    const update = vi.fn()
    const render = vi.fn()
    let tickFn = null
    vi.mocked(requestAnimationFrame).mockImplementation((fn) => { tickFn = fn; return 2 })

    const loop = createGameLoop({ update, render })
    loop.start()

    // First tick initialises lastTime
    tickFn(0)
    // Second tick at +100ms — should fire update at least once and render
    tickFn(100)

    expect(update).toHaveBeenCalled()
    expect(render).toHaveBeenCalled()
  })

  it('clamps large elapsed time to 100ms', () => {
    const update = vi.fn()
    const render = vi.fn()
    let tickFn = null
    vi.mocked(requestAnimationFrame).mockImplementation((fn) => { tickFn = fn; return 3 })

    const loop = createGameLoop({ update, render })
    loop.start()
    tickFn(0)
    tickFn(10000) // 10 seconds — should be capped to 100ms worth of updates

    // update should be called at most ceil(0.1 / (1/60)) = 6 times, not 600
    expect(update.mock.calls.length).toBeLessThanOrEqual(7)
    expect(render).toHaveBeenCalled()
  })

  it('can be restarted after stop', () => {
    const loop = createGameLoop({ update: vi.fn(), render: vi.fn() })
    loop.start()
    loop.stop()
    loop.start()
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
