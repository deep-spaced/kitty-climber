import { describe, it, expect, vi } from 'vitest'
import {
  createParticle,
  emitHit, emitDeath, emitCollect, emitLand, emitHeal,
  updateParticles, drawParticles,
} from '../../src/engine/particles.js'

const DT = 1 / 60

describe('createParticle', () => {
  it('stores all supplied fields', () => {
    const p = createParticle(10, 20, 50, -30, '#ff0000', 0.5)
    expect(p.x).toBe(10)
    expect(p.y).toBe(20)
    expect(p.vx).toBe(50)
    expect(p.vy).toBe(-30)
    expect(p.color).toBe('#ff0000')
    expect(p.life).toBe(0.5)
    expect(p.maxLife).toBe(0.5)
  })
})

describe('updateParticles', () => {
  it('advances position by velocity × dt', () => {
    const p = createParticle(0, 0, 60, 0, '#fff', 1)
    const [next] = updateParticles([p], DT)
    expect(next.x).toBeCloseTo(60 * DT, 4)
  })

  it('applies downward gravity each tick', () => {
    const p = createParticle(0, 0, 0, 0, '#fff', 1)
    const [next] = updateParticles([p], DT)
    expect(next.vy).toBeGreaterThan(0)
  })

  it('decrements life by dt', () => {
    const p = createParticle(0, 0, 0, 0, '#fff', 1)
    const [next] = updateParticles([p], DT)
    expect(next.life).toBeCloseTo(1 - DT, 4)
  })

  it('filters out expired particles', () => {
    const alive = createParticle(0, 0, 0, 0, '#fff', 0.5)
    const dead  = createParticle(0, 0, 0, 0, '#fff', 0.001)
    const result = updateParticles([alive, dead], DT)
    expect(result).toHaveLength(1)
    expect(result[0].maxLife).toBe(0.5)
  })

  it('handles an empty array', () => {
    expect(updateParticles([], DT)).toEqual([])
  })
})

describe('emitters — return correct shapes', () => {
  it('emitHit returns 8 particles', () => {
    const ps = emitHit(100, 100)
    expect(ps).toHaveLength(8)
    ps.forEach((p) => {
      expect(p.life).toBeGreaterThan(0)
      expect(p.maxLife).toBeGreaterThan(0)
      expect(typeof p.color).toBe('string')
    })
  })

  it('emitDeath returns 10 particles', () => {
    expect(emitDeath(0, 0)).toHaveLength(10)
  })

  it('emitCollect returns 6 particles', () => {
    expect(emitCollect(0, 0)).toHaveLength(6)
  })

  it('emitLand returns 4 particles', () => {
    expect(emitLand(0, 0)).toHaveLength(4)
  })

  it('emitters spread particles around the origin', () => {
    const ps = emitHit(200, 150)
    const hasRight = ps.some((p) => p.vx > 0)
    const hasLeft  = ps.some((p) => p.vx < 0)
    expect(hasRight).toBe(true)
    expect(hasLeft).toBe(true)
  })

  it('emitLand particles travel mostly sideways (not straight down)', () => {
    const ps = emitLand(0, 0)
    ps.forEach((p) => expect(Math.abs(p.vx)).toBeGreaterThan(0))
  })

  it('emitHeal returns 8 particles', () => {
    const ps = emitHeal(100, 100)
    expect(ps).toHaveLength(8)
    ps.forEach((p) => {
      expect(p.life).toBeGreaterThan(0)
      expect(typeof p.color).toBe('string')
    })
  })

  it('emitHeal particles travel mostly upward', () => {
    const ps = emitHeal(0, 0)
    const upward = ps.filter((p) => p.vy < 0)
    expect(upward.length).toBeGreaterThan(0)
  })
})

describe('drawParticles', () => {
  it('draws each active particle', () => {
    const ctx = {
      fillRect: vi.fn(),
      fillStyle: '',
      globalAlpha: 1,
    }
    const particles = [
      createParticle(100, 200, 0, 0, '#ff4422', 0.2),
      createParticle(150, 250, 0, 0, '#44ff44', 0.1),
    ]
    drawParticles(ctx, particles, 0)
    expect(ctx.fillRect).toHaveBeenCalledTimes(2)
    expect(ctx.globalAlpha).toBe(1)  // reset after draw
  })

  it('scales alpha by remaining life ratio', () => {
    const alphas = []
    const ctx = {
      fillRect: vi.fn(),
      fillStyle: '',
      get globalAlpha() { return this._alpha },
      set globalAlpha(v) { this._alpha = v; alphas.push(v) },
      _alpha: 1,
    }
    const p = createParticle(0, 0, 0, 0, '#fff', 0.5)
    const half = { ...p, life: 0.25 }  // half of maxLife
    drawParticles(ctx, [half], 0)
    // alpha should have been set to ~0.5 during draw
    expect(alphas.some((a) => a < 1 && a > 0)).toBe(true)
  })

  it('handles empty particle array', () => {
    const ctx = { fillRect: vi.fn(), fillStyle: '', globalAlpha: 1 }
    expect(() => drawParticles(ctx, [], 0)).not.toThrow()
  })

  it('applies cameraX offset', () => {
    const calls = []
    const ctx = {
      fillRect: (...args) => calls.push(args),
      fillStyle: '',
      globalAlpha: 1,
    }
    const p = createParticle(200, 100, 0, 0, '#fff', 0.5)
    drawParticles(ctx, [p], 100)
    // x should be shifted left by cameraX=100
    expect(calls[0][0]).toBeLessThan(200)
  })
})
