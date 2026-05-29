import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAudio } from '../../src/hooks/useAudio.js'

function makeNode() {
  return {
    type: '',
    frequency: { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    Q: { value: 1 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
}

function makeMockAudioCtx() {
  return {
    state: 'running',
    currentTime: 0,
    destination: {},
    resume: vi.fn(),
    createOscillator: vi.fn(() => makeNode()),
    createGain: vi.fn(() => makeNode()),
    createBiquadFilter: vi.fn(() => makeNode()),
    createBufferSource: vi.fn(() => makeNode()),
    createBuffer: vi.fn(() => ({})),
  }
}

afterEach(() => vi.restoreAllMocks())

describe('useAudio', () => {
  it('returns an object with play and music', () => {
    const { result } = renderHook(() => useAudio())
    expect(typeof result.current.play).toBe('function')
    expect(typeof result.current.music).toBe('object')
  })

  it('returns the same play reference on re-render', () => {
    const { result, rerender } = renderHook(() => useAudio())
    const first = result.current.play
    rerender()
    expect(result.current.play).toBe(first)
  })

  it('calling play with a valid name does not throw', () => {
    const { result } = renderHook(() => useAudio())
    expect(() => result.current.play('jump')).not.toThrow()
  })

  it('calling play with an unknown name does not throw', () => {
    const { result } = renderHook(() => useAudio())
    expect(() => result.current.play('nonexistent')).not.toThrow()
  })

  it('calling play with no argument does not throw', () => {
    const { result } = renderHook(() => useAudio())
    expect(() => result.current.play()).not.toThrow()
  })

  it('calls engine method when AudioContext is available', () => {
    vi.stubGlobal('AudioContext', vi.fn(() => makeMockAudioCtx()))
    const { result } = renderHook(() => useAudio())
    expect(() => result.current.play('jump')).not.toThrow()
    vi.unstubAllGlobals()
  })

  it('handles missing sound name gracefully when AudioContext is available', () => {
    vi.stubGlobal('AudioContext', vi.fn(() => makeMockAudioCtx()))
    const { result } = renderHook(() => useAudio())
    expect(() => result.current.play('nonexistent')).not.toThrow()
    vi.unstubAllGlobals()
  })
})
