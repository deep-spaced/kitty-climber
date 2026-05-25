import { describe, it, expect } from 'vitest'
import {
  createParticle,
  emitHit, emitDeath, emitCollect, emitLand,
  updateParticles,
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
})
