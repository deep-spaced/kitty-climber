import { TILE_SIZE, TILES, PLAYER_STATES, ENEMY_STATES, ENEMY_DYING_DURATION } from '../constants.js'
import { drawParticles } from './particles.js'

const TILE_COLORS = {
  [TILES.WALL]: '#5a4a3a',
  [TILES.FLOOR]: '#7a6a5a',
  [TILES.CEILING]: '#4a3a2a',
  [TILES.PLATFORM]: '#8a7a6a',
}

const PLAYER_COLOR = {
  [PLAYER_STATES.IDLE]:          '#e8a87c',
  [PLAYER_STATES.RUN]:           '#e8a87c',
  [PLAYER_STATES.JUMP]:          '#f0c090',
  [PLAYER_STATES.FALL]:          '#d09060',
  [PLAYER_STATES.CROUCH]:        '#c07850',
  [PLAYER_STATES.ATTACK_SCRATCH]:'#ff8844',
  [PLAYER_STATES.ATTACK_BITE]:   '#ff4422',
  [PLAYER_STATES.HURT]:          '#ff2200',
}

// Two-layer parallax cave decorations — purely cosmetic, no level data needed
function drawBackground(ctx, cameraX, canvasWidth, canvasHeight) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight)
  grad.addColorStop(0, '#0d0820')
  grad.addColorStop(1, '#1a1008')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Far layer: stalactite/stalagmite silhouettes (8% parallax)
  const W1 = canvasWidth + 160
  const farOff = cameraX * 0.08
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let i = 0; i < 25; i++) {
    const x = ((i * 211 - farOff) % W1 + W1) % W1 - 80
    const h = 14 + (i * 47) % 40
    ctx.fillRect(Math.round(x),                 0,              5, h)
    ctx.fillRect(Math.round(x + 22), canvasHeight - Math.round(h * 0.55), 4, Math.round(h * 0.55))
  }

  // Mid layer: vertical wall striations (22% parallax)
  const W2 = canvasWidth + 240
  const midOff = cameraX * 0.22
  ctx.fillStyle = 'rgba(255,255,255,0.012)'
  for (let i = 0; i < 14; i++) {
    const x = ((i * 380 - midOff) % W2 + W2) % W2 - 120
    ctx.fillRect(Math.round(x), 0, 2, canvasHeight)
  }
}

function drawTiles(ctx, tilemap, cameraX, canvasWidth) {
  const startCol = Math.floor(cameraX / TILE_SIZE)
  const endCol = startCol + Math.ceil(canvasWidth / TILE_SIZE) + 1

  for (let row = 0; row < tilemap.length; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (col < 0 || col >= tilemap[0].length) continue
      const tile = tilemap[row][col]
      if (tile === TILES.EMPTY) continue

      const sx = col * TILE_SIZE - cameraX
      const sy = row * TILE_SIZE

      ctx.fillStyle = TILE_COLORS[tile] ?? '#888'
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE)

      ctx.strokeStyle = 'rgba(0,0,0,0.18)'
      ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE)
    }
  }
}

function drawPlayer(ctx, player, cameraX) {
  const px = Math.round(player.x - cameraX)
  const py = Math.round(player.y)
  const { width, height, facing, state } = player

  const baseColor = PLAYER_COLOR[state] ?? '#e8a87c'
  const hurt = state === PLAYER_STATES.HURT
  const bodyColor = hurt
    ? (Math.floor(Date.now() / 80) % 2 === 0 ? '#ffffff' : baseColor)
    : baseColor

  // --- Tail (behind body, opposite facing) ---
  const ts = facing === 1 ? -1 : 1   // tail side
  const tbx = facing === 1 ? px : px + width
  ctx.fillStyle = bodyColor
  ctx.fillRect(tbx + ts * 4, py + height - 14, 4, 8)
  ctx.fillRect(tbx + ts * 7, py + height - 20, 4, 6)

  // --- Body ---
  ctx.fillStyle = bodyColor
  ctx.fillRect(px, py + 8, width, height - 8)

  // --- Head ---
  ctx.fillRect(px + 2, py + 1, width - 4, 12)

  // --- Ears (cosmetic — sit above hitbox top) ---
  ctx.fillRect(px + 2,         py - 5, 5, 6)
  ctx.fillRect(px + width - 7, py - 5, 5, 6)
  ctx.fillRect(px + 3,         py - 8, 3, 3)
  ctx.fillRect(px + width - 6, py - 8, 3, 3)
  // Inner ear
  ctx.fillStyle = '#e06090'
  ctx.fillRect(px + 4,         py - 4, 2, 4)
  ctx.fillRect(px + width - 6, py - 4, 2, 4)

  // --- Eye ---
  ctx.fillStyle = '#1a1a1a'
  const eyeX = facing === 1 ? px + width - 10 : px + 5
  const eyeY = py + 4
  ctx.fillRect(eyeX, eyeY, 5, 4)
  ctx.fillStyle = '#fff'
  ctx.fillRect(eyeX + (facing === 1 ? 1 : 3), eyeY, 1, 1)

  // --- Nose ---
  ctx.fillStyle = '#e06080'
  ctx.fillRect(eyeX + (facing === 1 ? -3 : 4), eyeY + 4, 3, 2)

  // --- Tabby stripes ---
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(px + 4 + i * 7, py + 16, 3, 12)
  }

  // --- Legs (state-dependent animation) ---
  ctx.fillStyle = bodyColor
  if (state === PLAYER_STATES.RUN) {
    const f = Math.floor(Date.now() / 90) % 2
    const fLen = f === 0 ? 8 : 4
    const bLen = f === 0 ? 4 : 8
    ctx.fillRect(px + 3,         py + height - fLen, 6, fLen)
    ctx.fillRect(px + width - 9, py + height - bLen, 6, bLen)
  } else if (state === PLAYER_STATES.JUMP) {
    // Legs tucked
    ctx.fillRect(px + 3,         py + height - 5, 6, 5)
    ctx.fillRect(px + width - 9, py + height - 5, 6, 5)
  } else if (state === PLAYER_STATES.FALL) {
    // Legs stretched down
    ctx.fillRect(px + 3,         py + height - 9, 5, 9)
    ctx.fillRect(px + width - 8, py + height - 9, 5, 9)
  } else if (state === PLAYER_STATES.CROUCH) {
    ctx.fillRect(px + 2,         py + height - 4, 8, 4)
    ctx.fillRect(px + width - 10, py + height - 4, 8, 4)
  } else {
    // Idle / attack
    ctx.fillRect(px + 3,         py + height - 7, 6, 7)
    ctx.fillRect(px + width - 9, py + height - 7, 6, 7)
  }

  // --- Attack claw marks ---
  if (state === PLAYER_STATES.ATTACK_SCRATCH || state === PLAYER_STATES.ATTACK_BITE) {
    const reach = 36
    const hbX = facing === 1 ? px + width : px - reach
    ctx.fillStyle = 'rgba(255,100,0,0.25)'
    ctx.fillRect(hbX, py + 4, reach, height - 8)
    ctx.fillStyle = '#ff8844'
    for (let i = 0; i < 3; i++) {
      const cx = facing === 1 ? px + width + 2 + i * 5 : px - 4 - i * 5
      ctx.fillRect(cx, py + 6, 2, 10)
    }
  }
}

function drawEnemies(ctx, enemies, cameraX) {
  for (const enemy of enemies) {
    if (enemy.state === ENEMY_STATES.DEAD) continue

    const alpha = enemy.state === ENEMY_STATES.DYING
      ? Math.max(0, enemy.dyingTimer / ENEMY_DYING_DURATION)
      : 1
    ctx.globalAlpha = alpha

    const ex = Math.round(enemy.x - cameraX)
    const ey = Math.round(enemy.y)

    ctx.fillStyle = '#cc44cc'
    ctx.fillRect(ex, ey, enemy.width, enemy.height)

    // Eyes
    ctx.fillStyle = '#220022'
    const eyeY = ey + 7
    if (enemy.facing === 1) {
      ctx.fillRect(ex + enemy.width - 8, eyeY, 4, 4)
    } else {
      ctx.fillRect(ex + 4, eyeY, 4, 4)
    }

    // Ears
    ctx.fillStyle = '#cc44cc'
    ctx.fillRect(ex + 2,               ey - 4, 4, 5)
    ctx.fillRect(ex + enemy.width - 6, ey - 4, 4, 5)
    // Inner ear
    ctx.fillStyle = '#ff88ff'
    ctx.fillRect(ex + 3,               ey - 3, 2, 3)
    ctx.fillRect(ex + enemy.width - 5, ey - 3, 2, 3)

    // Stripes
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    for (let i = 0; i < 2; i++) {
      ctx.fillRect(ex + 4 + i * 7, ey + 14, 3, 10)
    }

    ctx.globalAlpha = 1
  }
}

function drawBoards(ctx, boards, cameraX) {
  for (const board of boards) {
    const sx = Math.round(board.x - cameraX)
    const sy = Math.round(board.y)
    ctx.fillStyle = '#b8895a'
    ctx.fillRect(sx, sy, board.width, board.height)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let i = 0; i < board.width; i += 12) {
      ctx.fillRect(sx + i, sy, 2, board.height)
    }
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(sx, sy, board.width, 2)
  }
}

function drawRocks(ctx, rocks, cameraX) {
  for (const rock of rocks) {
    if (!rock.active) continue
    const sx = Math.round(rock.x - cameraX)
    const sy = Math.round(rock.y)
    ctx.fillStyle = '#888070'
    ctx.fillRect(sx, sy, rock.width, rock.height)
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(sx + 2, sy + 2, rock.width - 6, 4)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(sx + 2, sy + rock.height - 5, rock.width - 4, 4)
  }
}

function drawFish(ctx, fish, cameraX) {
  for (const f of fish) {
    if (f.collected) continue
    const fx = Math.round(f.x - cameraX)
    const fy = Math.round(f.y)
    ctx.fillStyle = '#d07818'
    ctx.fillRect(fx, fy, 4, 4)
    ctx.fillRect(fx, fy + 8, 4, 4)
    ctx.fillStyle = '#f0a030'
    ctx.fillRect(fx + 4, fy + 2, 12, 8)
    ctx.fillStyle = 'rgba(255,240,160,0.5)'
    ctx.fillRect(fx + 6, fy + 3, 8, 3)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(fx + 13, fy + 3, 2, 2)
  }
}

function drawGoal(ctx, goalX, cameraX, canvasWidth, canvasHeight) {
  const sx = goalX - cameraX
  if (sx > canvasWidth + 32 || sx < -32) return
  const grad = ctx.createLinearGradient(sx, 0, sx + 16, 0)
  grad.addColorStop(0,   'rgba(0,255,160,0)')
  grad.addColorStop(0.5, 'rgba(0,255,160,0.55)')
  grad.addColorStop(1,   'rgba(0,255,160,0)')
  ctx.fillStyle = grad
  ctx.fillRect(sx - 8, 0, 32, canvasHeight)
  ctx.fillStyle = 'rgba(0,255,160,0.9)'
  ctx.fillRect(sx + 6, 0, 4, canvasHeight)
}

export function renderFrame(ctx, { tilemap, player, boards, rocks, enemies, fish, particles, goalX, cameraX, canvasWidth, canvasHeight }) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  drawBackground(ctx, cameraX, canvasWidth, canvasHeight)
  drawTiles(ctx, tilemap, cameraX, canvasWidth)
  if (goalX != null) drawGoal(ctx, goalX, cameraX, canvasWidth, canvasHeight)
  drawBoards(ctx, boards ?? [], cameraX)
  drawRocks(ctx, rocks ?? [], cameraX)
  drawFish(ctx, fish ?? [], cameraX)
  drawEnemies(ctx, enemies ?? [], cameraX)
  drawParticles(ctx, particles ?? [], cameraX)
  drawPlayer(ctx, player, cameraX)
}

export function computeCameraX(playerX, levelWidthPx, canvasWidth) {
  const target = playerX - canvasWidth / 2
  return Math.max(0, Math.min(target, levelWidthPx - canvasWidth))
}
