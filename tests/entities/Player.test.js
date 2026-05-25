import { describe, it, expect } from 'vitest'
import { createPlayer, updatePlayer, hurtPlayer, getAttackHitbox } from '../../src/entities/Player.js'
import { PLAYER_STATES, TILES, TILE_SIZE, MAX_HEALTH } from '../../src/constants.js'

// Flat ground map: 1 row ceiling + 8 rows empty + 1 row floor, 20 cols wide
function makeMap() {
  const rows = 10
  const cols = 20
  const map = Array.from({ length: rows }, () => Array(cols).fill(TILES.EMPTY))
  for (let c = 0; c < cols; c++) {
    map[0][c] = TILES.CEILING
    map[rows - 1][c] = TILES.FLOOR
  }
  return map
}

const NO_INPUT = { left: false, right: false, jump: false, scratch: false, bite: false, crouch: false, map: false }
const DT = 1 / 60

function settled(map) {
  // Returns a player that has fallen to the ground
  let p = createPlayer(TILE_SIZE * 2, TILE_SIZE * 2)
  for (let i = 0; i < 120; i++) {
    p = updatePlayer(p, NO_INPUT, map, DT)
    if (p.onGround) break
  }
  return p
}

describe('createPlayer', () => {
  it('spawns with full health and idle state', () => {
    const p = createPlayer(100, 100)
    expect(p.health).toBe(MAX_HEALTH)
    expect(p.state).toBe(PLAYER_STATES.IDLE)
  })
})

describe('updatePlayer — movement', () => {
  it('moves right when right key held', () => {
    const map = makeMap()
    let p = settled(map)
    const startX = p.x
    p = updatePlayer(p, { ...NO_INPUT, right: true }, map, DT)
    expect(p.x).toBeGreaterThan(startX)
    expect(p.state).toBe(PLAYER_STATES.RUN)
    expect(p.facing).toBe(1)
  })

  it('moves left when left key held', () => {
    const map = makeMap()
    let p = settled(map)
    // Move away from left wall first
    for (let i = 0; i < 30; i++) p = updatePlayer(p, { ...NO_INPUT, right: true }, map, DT)
    const startX = p.x
    p = updatePlayer(p, { ...NO_INPUT, left: true }, map, DT)
    expect(p.x).toBeLessThan(startX)
    expect(p.facing).toBe(-1)
  })

  it('transitions to IDLE when no keys held on ground', () => {
    const map = makeMap()
    let p = settled(map)
    p = updatePlayer(p, NO_INPUT, map, DT)
    expect(p.state).toBe(PLAYER_STATES.IDLE)
  })

  it('transitions to JUMP state when jump pressed on ground', () => {
    const map = makeMap()
    let p = settled(map)
    p = updatePlayer(p, { ...NO_INPUT, jump: true }, map, DT)
    expect(p.state).toBe(PLAYER_STATES.JUMP)
    expect(p.vy).toBeLessThan(0)
  })

  it('cannot double-jump', () => {
    const map = makeMap()
    let p = settled(map)
    // First jump
    p = updatePlayer(p, { ...NO_INPUT, jump: true }, map, DT)
    const vyAfterFirstJump = p.vy
    // Second frame — still holding jump key, already in air
    p = updatePlayer(p, { ...NO_INPUT, jump: true }, map, DT)
    // vy should only increase from gravity, not get another jump boost
    expect(p.vy).toBeGreaterThan(vyAfterFirstJump)
  })

  it('enters CROUCH state when crouch key held on ground', () => {
    const map = makeMap()
    let p = settled(map)
    p = updatePlayer(p, { ...NO_INPUT, crouch: true }, map, DT)
    expect(p.state).toBe(PLAYER_STATES.CROUCH)
  })
})

describe('updatePlayer — attacks', () => {
  it('enters ATTACK_SCRATCH state when scratch pressed', () => {
    const map = makeMap()
    let p = settled(map)
    p = updatePlayer(p, { ...NO_INPUT, scratch: true }, map, DT)
    expect(p.state).toBe(PLAYER_STATES.ATTACK_SCRATCH)
    expect(p.stateTimer).toBeGreaterThan(0)
  })

  it('enters ATTACK_BITE state when bite pressed', () => {
    const map = makeMap()
    let p = settled(map)
    p = updatePlayer(p, { ...NO_INPUT, bite: true }, map, DT)
    expect(p.state).toBe(PLAYER_STATES.ATTACK_BITE)
  })

  it('cannot change attack state mid-attack', () => {
    const map = makeMap()
    let p = settled(map)
    p = updatePlayer(p, { ...NO_INPUT, scratch: true }, map, DT)
    expect(p.state).toBe(PLAYER_STATES.ATTACK_SCRATCH)
    // Hold bite too — should remain scratch
    p = updatePlayer(p, { ...NO_INPUT, bite: true }, map, DT)
    expect(p.state).toBe(PLAYER_STATES.ATTACK_SCRATCH)
  })

  it('returns to IDLE after attack timer expires', () => {
    const map = makeMap()
    let p = settled(map)
    p = updatePlayer(p, { ...NO_INPUT, scratch: true }, map, DT)
    // Simulate past attack duration
    const steps = Math.ceil(p.stateTimer / DT) + 5
    for (let i = 0; i < steps; i++) {
      p = updatePlayer(p, NO_INPUT, map, DT)
    }
    expect(p.state).toBe(PLAYER_STATES.IDLE)
  })
})

describe('hurtPlayer', () => {
  it('reduces health by 1', () => {
    const p = createPlayer(100, 100)
    const hurt = hurtPlayer(p)
    expect(hurt.health).toBe(MAX_HEALTH - 1)
  })

  it('does not stack hurt state', () => {
    let p = createPlayer(100, 100)
    p = hurtPlayer(p)
    const again = hurtPlayer(p)
    expect(again.health).toBe(p.health)
  })
})

describe('getAttackHitbox', () => {
  it('returns null when not attacking', () => {
    const p = createPlayer(100, 100)
    expect(getAttackHitbox(p)).toBeNull()
  })

  it('returns hitbox to the right when facing right', () => {
    let p = createPlayer(100, 100)
    p = { ...p, state: PLAYER_STATES.ATTACK_SCRATCH, facing: 1 }
    const hb = getAttackHitbox(p)
    expect(hb).not.toBeNull()
    expect(hb.x).toBeGreaterThan(p.x)
  })

  it('returns hitbox to the left when facing left', () => {
    let p = createPlayer(100, 100)
    p = { ...p, state: PLAYER_STATES.ATTACK_SCRATCH, facing: -1 }
    const hb = getAttackHitbox(p)
    expect(hb).not.toBeNull()
    expect(hb.x).toBeLessThan(p.x)
  })
})
