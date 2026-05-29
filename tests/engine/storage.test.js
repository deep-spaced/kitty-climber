import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getHighScore, saveHighScore } from '../../src/engine/storage.js'

// Stub localStorage with a plain in-memory implementation
let store = {}
const mockStorage = {
  getItem:    (k) => (k in store ? store[k] : null),
  setItem:    (k, v) => { store[k] = String(v) },
  removeItem: (k) => { delete store[k] },
  clear:      () => { store = {} },
}

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', mockStorage)
})
afterEach(() => vi.unstubAllGlobals())

describe('getHighScore', () => {
  it('returns 0 when nothing stored', () => {
    expect(getHighScore()).toBe(0)
  })

  it('returns the stored value', () => {
    mockStorage.setItem('kittyClimber_highScore', '350')
    expect(getHighScore()).toBe(350)
  })
})

describe('saveHighScore', () => {
  it('stores the score when none exists', () => {
    saveHighScore(500)
    expect(getHighScore()).toBe(500)
  })

  it('overwrites when new score is higher', () => {
    saveHighScore(200)
    saveHighScore(800)
    expect(getHighScore()).toBe(800)
  })

  it('does not overwrite a higher existing score', () => {
    saveHighScore(1000)
    saveHighScore(400)
    expect(getHighScore()).toBe(1000)
  })

  it('does not change score when equal', () => {
    saveHighScore(300)
    saveHighScore(300)
    expect(getHighScore()).toBe(300)
  })
})

describe('error resilience', () => {
  it('getHighScore returns 0 when localStorage.getItem throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('storage blocked') },
      setItem: vi.fn(),
    })
    expect(getHighScore()).toBe(0)
  })

  it('saveHighScore does not throw when localStorage.setItem throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('storage blocked') },
    })
    expect(() => saveHighScore(100)).not.toThrow()
  })
})
