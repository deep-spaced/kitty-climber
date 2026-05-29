import { describe, it, expect, vi } from 'vitest'
import { createAudioEngine } from '../../src/audio/AudioEngine.js'

// Minimal Web Audio API mock — jsdom does not implement it
function makeNode() {
  return {
    type: '',
    frequency: { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    Q: { value: 1 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
  }
}

function makeMockCtx(state = 'running') {
  return {
    state,
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

const SOUNDS = ['jump', 'land', 'hurt', 'attack', 'kill', 'collect', 'levelClear', 'gameOver', 'heal', 'cage']

describe('AudioEngine — all sounds play without throwing', () => {
  SOUNDS.forEach((name) => {
    it(name, () => {
      const ctx = makeMockCtx()
      const engine = createAudioEngine(ctx)
      expect(() => engine[name]()).not.toThrow()
    })
  })
})

describe('AudioEngine — AudioContext lifecycle', () => {
  it('resumes a suspended context before playing', () => {
    const ctx = makeMockCtx('suspended')
    const engine = createAudioEngine(ctx)
    engine.jump()
    expect(ctx.resume).toHaveBeenCalled()
  })

  it('does not call resume when context is already running', () => {
    const ctx = makeMockCtx('running')
    const engine = createAudioEngine(ctx)
    engine.jump()
    expect(ctx.resume).not.toHaveBeenCalled()
  })
})

describe('AudioEngine — node creation', () => {
  it('jump creates an oscillator and gain node', () => {
    const ctx = makeMockCtx()
    const engine = createAudioEngine(ctx)
    engine.jump()
    expect(ctx.createOscillator).toHaveBeenCalled()
    expect(ctx.createGain).toHaveBeenCalled()
  })

  it('attack creates a biquad filter', () => {
    const ctx = makeMockCtx()
    const engine = createAudioEngine(ctx)
    engine.attack()
    expect(ctx.createBiquadFilter).toHaveBeenCalled()
  })

  it('collect creates three oscillators (one per note)', () => {
    const ctx = makeMockCtx()
    const engine = createAudioEngine(ctx)
    engine.collect()
    expect(ctx.createOscillator).toHaveBeenCalledTimes(3)
  })

  it('levelClear creates four oscillators', () => {
    const ctx = makeMockCtx()
    const engine = createAudioEngine(ctx)
    engine.levelClear()
    expect(ctx.createOscillator).toHaveBeenCalledTimes(4)
  })

  it('gameOver creates three oscillators', () => {
    const ctx = makeMockCtx()
    const engine = createAudioEngine(ctx)
    engine.gameOver()
    expect(ctx.createOscillator).toHaveBeenCalledTimes(3)
  })
})
