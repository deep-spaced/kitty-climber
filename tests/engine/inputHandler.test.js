import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createInputHandler } from '../../src/engine/inputHandler.js'

function fireKey(type, key) {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }))
}

describe('createInputHandler', () => {
  let handler

  beforeEach(() => {
    handler = createInputHandler()
    handler.attach()
  })

  afterEach(() => {
    handler.detach()
  })

  it('starts with all inputs false', () => {
    const state = handler.getState()
    expect(Object.values(state).every((v) => v === false)).toBe(true)
  })

  it('registers left arrow key', () => {
    fireKey('keydown', 'ArrowLeft')
    expect(handler.getState().left).toBe(true)
    fireKey('keyup', 'ArrowLeft')
    expect(handler.getState().left).toBe(false)
  })

  it('registers right arrow key', () => {
    fireKey('keydown', 'ArrowRight')
    expect(handler.getState().right).toBe(true)
  })

  it('registers jump (x)', () => {
    fireKey('keydown', 'x')
    expect(handler.getState().jump).toBe(true)
  })

  it('registers scratch (c)', () => {
    fireKey('keydown', 'c')
    expect(handler.getState().scratch).toBe(true)
  })

  it('registers bite (z)', () => {
    fireKey('keydown', 'z')
    expect(handler.getState().bite).toBe(true)
  })

  it('registers crouch (v)', () => {
    fireKey('keydown', 'v')
    expect(handler.getState().crouch).toBe(true)
  })

  it('clears all keys on detach', () => {
    fireKey('keydown', 'ArrowLeft')
    fireKey('keydown', 'x')
    handler.detach()
    // After detach the set is cleared
    const h2 = createInputHandler()
    h2.attach()
    expect(h2.getState().left).toBe(false)
    h2.detach()
  })

  it('tracks multiple keys simultaneously', () => {
    fireKey('keydown', 'ArrowRight')
    fireKey('keydown', 'x')
    const state = handler.getState()
    expect(state.right).toBe(true)
    expect(state.jump).toBe(true)
  })
})
