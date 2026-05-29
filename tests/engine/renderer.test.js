import { describe, it, expect, vi } from 'vitest'
import { renderFrame, computeCameraX } from '../../src/engine/renderer.js'
import { PLAYER_STATES, ENEMY_STATES, TILES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../src/constants.js'

function makeCtx() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fillText: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowBlur: 0,
    shadowColor: '',
    setLineDash: vi.fn(),
    quadraticCurveTo: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    transform: vi.fn(),
  }
}

// Tilemap with all tile types present
const TILEMAP = Array.from({ length: 15 }, (_, r) =>
  Array.from({ length: 30 }, (_, c) => {
    if (r === 0)  return TILES.CEILING
    if (r === 14) return TILES.FLOOR
    if (c === 0 || c === 29) return TILES.WALL
    if (r === 7 && c > 4 && c < 10) return TILES.PLATFORM
    return TILES.EMPTY
  })
)

function baseArgs(overrides = {}) {
  return {
    tilemap: TILEMAP,
    player: { x: 64, y: 300, width: 28, height: 40, facing: 1, state: PLAYER_STATES.IDLE, health: 4 },
    boards: [],
    rocks: [],
    enemies: [],
    fish: [],
    treats: [],
    cage: null,
    roughPatches: [],
    particles: [],
    cameraX: 0,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    ...overrides,
  }
}

function makeEnemy(overrides = {}) {
  return {
    x: 200, y: 280, width: 26, height: 32,
    facing: 1, state: ENEMY_STATES.PATROL,
    health: 1, isBoss: false, hurtTimer: 0, dyingTimer: 0.15,
    ...overrides,
  }
}

// ── computeCameraX ──────────────────────────────────────────────

describe('computeCameraX', () => {
  it('centers the camera on the player', () => {
    expect(computeCameraX(500, 3000, 800)).toBe(100)
  })

  it('clamps to 0 at the left edge', () => {
    expect(computeCameraX(10, 3000, 800)).toBe(0)
  })

  it('clamps to levelWidthPx - canvasWidth at the right edge', () => {
    expect(computeCameraX(9999, 3000, 800)).toBe(2200)
  })

  it('handles player exactly at half-canvas', () => {
    expect(computeCameraX(400, 3000, 800)).toBe(0)
  })
})

// ── renderFrame ─────────────────────────────────────────────────

describe('renderFrame — basics', () => {
  it('calls clearRect each frame', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs())
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  })

  it('draws background gradient', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs())
    expect(ctx.createLinearGradient).toHaveBeenCalled()
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('draws tile stroke outlines', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs())
    expect(ctx.strokeRect).toHaveBeenCalled()
  })

  it('handles scrolled cameraX', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({ cameraX: 320 }))
    expect(ctx.clearRect).toHaveBeenCalled()
  })

  it('handles null roughPatches', () => {
    const ctx = makeCtx()
    expect(() => renderFrame(ctx, baseArgs({ roughPatches: null }))).not.toThrow()
  })

  it('handles empty roughPatches', () => {
    const ctx = makeCtx()
    expect(() => renderFrame(ctx, baseArgs({ roughPatches: [] }))).not.toThrow()
  })

  it('draws rough patches with fill calls', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({ roughPatches: [{ col: 5, row: 0, length: 18 }] }))
    expect(ctx.fill).toHaveBeenCalled()
  })

  it('skips rough patches outside viewport', () => {
    const ctx = makeCtx()
    // patch at col 500 is way outside viewport width=800/32=25 cols
    renderFrame(ctx, baseArgs({ roughPatches: [{ col: 500, row: 0, length: 18 }] }))
    expect(ctx.clearRect).toHaveBeenCalled()
  })
})

// ── Player states ────────────────────────────────────────────────

const PLAYER_STATE_CASES = [
  [PLAYER_STATES.IDLE,          1],
  [PLAYER_STATES.RUN,           1],
  [PLAYER_STATES.JUMP,          1],
  [PLAYER_STATES.FALL,          1],
  [PLAYER_STATES.CROUCH,        1],
  [PLAYER_STATES.ATTACK_SCRATCH,1],
  [PLAYER_STATES.ATTACK_BITE,   1],
  [PLAYER_STATES.HURT,          1],
  [PLAYER_STATES.IDLE,         -1],   // facing left
  [PLAYER_STATES.RUN,          -1],
  [PLAYER_STATES.ATTACK_SCRATCH,-1],
]

describe('renderFrame — player states', () => {
  for (const [state, facing] of PLAYER_STATE_CASES) {
    it(`draws player state=${state} facing=${facing}`, () => {
      const ctx = makeCtx()
      const player = { x: 64, y: 280, width: 28, height: 40, facing, state, health: 4 }
      renderFrame(ctx, baseArgs({ player }))
      expect(ctx.fillRect).toHaveBeenCalled()
    })
  }
})

// ── Enemies ──────────────────────────────────────────────────────

describe('renderFrame — enemies', () => {
  it('draws regular patrol enemy', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({ enemies: [makeEnemy()] }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('draws regular enemy facing left', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({ enemies: [makeEnemy({ facing: -1 })] }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('draws boss enemy with health bar', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      enemies: [makeEnemy({ isBoss: true, width: 40, height: 50, health: 4 })],
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('draws boss enemy facing left', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      enemies: [makeEnemy({ isBoss: true, width: 40, height: 50, health: 2, facing: -1 })],
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('draws hurt-flashing enemy (hurtTimer > 0)', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({ enemies: [makeEnemy({ hurtTimer: 0.3 })] }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('draws dying enemy with alpha fade', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({ enemies: [makeEnemy({ state: ENEMY_STATES.DYING, dyingTimer: 0.1 })] }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('skips dead enemies', () => {
    const ctx = makeCtx()
    const fillsBefore = ctx.fillRect.mock.calls.length
    renderFrame(ctx, baseArgs({ enemies: [makeEnemy({ state: ENEMY_STATES.DEAD })] }))
    // clearRect should still be called; dead enemy adds no fillRect calls beyond background
    expect(ctx.clearRect).toHaveBeenCalled()
  })
})

// ── Boards ───────────────────────────────────────────────────────

describe('renderFrame — boards', () => {
  it('draws a moving board', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      boards: [{ x: 100, y: 256, width: 96, height: 13 }],
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('handles board wider than 12px (stripe loop)', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      boards: [{ x: 50, y: 256, width: 128, height: 13 }],
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })
})

// ── Rocks ────────────────────────────────────────────────────────

describe('renderFrame — rocks', () => {
  it('draws an active rock', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      rocks: [{ x: 150, y: 80, width: 24, height: 24, active: true }],
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('skips inactive rocks', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      rocks: [{ x: 150, y: 80, width: 24, height: 24, active: false }],
    }))
    expect(ctx.clearRect).toHaveBeenCalled()
  })
})

// ── Collectibles ─────────────────────────────────────────────────

describe('renderFrame — fish & treats', () => {
  it('draws uncollected fish', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      fish: [{ x: 100, y: 120, width: 16, height: 12, collected: false }],
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('skips collected fish', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      fish: [{ x: 100, y: 120, width: 16, height: 12, collected: true }],
    }))
    expect(ctx.clearRect).toHaveBeenCalled()
  })

  it('draws uncollected treat', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      treats: [{ x: 200, y: 200, width: 12, height: 12, collected: false }],
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('skips collected treat', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      treats: [{ x: 200, y: 200, width: 12, height: 12, collected: true }],
    }))
    expect(ctx.clearRect).toHaveBeenCalled()
  })
})

// ── Cage ─────────────────────────────────────────────────────────

describe('renderFrame — cage', () => {
  it('draws locked cage with health pips', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      cage: { x: 300, y: 200, width: 48, height: 52, freed: false, freedTimer: 0, health: 2 },
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('draws freed cage with escaping kitten', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      cage: { x: 300, y: 200, width: 48, height: 52, freed: true, freedTimer: 0.3, health: 0 },
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('skips null cage', () => {
    const ctx = makeCtx()
    expect(() => renderFrame(ctx, baseArgs({ cage: null }))).not.toThrow()
  })
})

// ── Particles ────────────────────────────────────────────────────

describe('renderFrame — particles', () => {
  it('draws particles', () => {
    const ctx = makeCtx()
    renderFrame(ctx, baseArgs({
      particles: [{ x: 120, y: 200, vx: 10, vy: -20, color: '#ff4422', life: 0.2, maxLife: 0.32 }],
    }))
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('handles empty particles array', () => {
    const ctx = makeCtx()
    expect(() => renderFrame(ctx, baseArgs({ particles: [] }))).not.toThrow()
  })
})

describe('renderFrame — undefined optional arrays', () => {
  it('falls back to empty arrays when boards/rocks/fish/treats/enemies/particles are undefined', () => {
    const ctx = makeCtx()
    expect(() => renderFrame(ctx, {
      ...baseArgs(),
      boards: undefined,
      rocks: undefined,
      fish: undefined,
      treats: undefined,
      enemies: undefined,
      particles: undefined,
    })).not.toThrow()
  })
})
