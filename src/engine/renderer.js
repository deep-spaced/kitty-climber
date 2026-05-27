import {
  TILE_SIZE, TILES, PLAYER_STATES, ENEMY_STATES, ENEMY_DYING_DURATION,
  BOSS_ENEMY_HEALTH, CAGE_HEALTH,
} from '../constants.js'
import { drawParticles } from './particles.js'

const TILE_COLORS = {
  [TILES.WALL]:     '#5a4a3a',
  [TILES.FLOOR]:    '#7a6a5a',
  [TILES.CEILING]:  '#4a3a2a',
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

function drawBackground(ctx, cameraX, canvasWidth, canvasHeight) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight)
  grad.addColorStop(0, '#0d0820')
  grad.addColorStop(1, '#1a1008')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const W1 = canvasWidth + 160
  const farOff = cameraX * 0.08
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let i = 0; i < 25; i++) {
    const x = ((i * 211 - farOff) % W1 + W1) % W1 - 80
    const h = 14 + (i * 47) % 40
    ctx.fillRect(Math.round(x),                 0,              5, h)
    ctx.fillRect(Math.round(x + 22), canvasHeight - Math.round(h * 0.55), 4, Math.round(h * 0.55))
  }

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

  const ts = facing === 1 ? -1 : 1
  const tbx = facing === 1 ? px : px + width
  ctx.fillStyle = bodyColor
  ctx.fillRect(tbx + ts * 4, py + height - 14, 4, 8)
  ctx.fillRect(tbx + ts * 7, py + height - 20, 4, 6)

  ctx.fillStyle = bodyColor
  ctx.fillRect(px, py + 8, width, height - 8)
  ctx.fillRect(px + 2, py + 1, width - 4, 12)

  ctx.fillRect(px + 2,         py - 5, 5, 6)
  ctx.fillRect(px + width - 7, py - 5, 5, 6)
  ctx.fillRect(px + 3,         py - 8, 3, 3)
  ctx.fillRect(px + width - 6, py - 8, 3, 3)
  ctx.fillStyle = '#e06090'
  ctx.fillRect(px + 4,         py - 4, 2, 4)
  ctx.fillRect(px + width - 6, py - 4, 2, 4)

  ctx.fillStyle = '#1a1a1a'
  const eyeX = facing === 1 ? px + width - 10 : px + 5
  const eyeY = py + 4
  ctx.fillRect(eyeX, eyeY, 5, 4)
  ctx.fillStyle = '#fff'
  ctx.fillRect(eyeX + (facing === 1 ? 1 : 3), eyeY, 1, 1)

  ctx.fillStyle = '#e06080'
  ctx.fillRect(eyeX + (facing === 1 ? -3 : 4), eyeY + 4, 3, 2)

  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let i = 0; i < 3; i++) ctx.fillRect(px + 4 + i * 7, py + 16, 3, 12)

  ctx.fillStyle = bodyColor
  if (state === PLAYER_STATES.RUN) {
    const f = Math.floor(Date.now() / 90) % 2
    const fLen = f === 0 ? 8 : 4
    const bLen = f === 0 ? 4 : 8
    ctx.fillRect(px + 3,         py + height - fLen, 6, fLen)
    ctx.fillRect(px + width - 9, py + height - bLen, 6, bLen)
  } else if (state === PLAYER_STATES.JUMP) {
    ctx.fillRect(px + 3,         py + height - 5, 6, 5)
    ctx.fillRect(px + width - 9, py + height - 5, 6, 5)
  } else if (state === PLAYER_STATES.FALL) {
    ctx.fillRect(px + 3,         py + height - 9, 5, 9)
    ctx.fillRect(px + width - 8, py + height - 9, 5, 9)
  } else if (state === PLAYER_STATES.CROUCH) {
    ctx.fillRect(px + 2,          py + height - 4, 8, 4)
    ctx.fillRect(px + width - 10, py + height - 4, 8, 4)
  } else {
    ctx.fillRect(px + 3,         py + height - 7, 6, 7)
    ctx.fillRect(px + width - 9, py + height - 7, 6, 7)
  }

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

function drawSingleEnemy(ctx, enemy, ex, ey) {
  const { width, height, facing, isBoss, health, hurtTimer, state } = enemy
  const flash = (hurtTimer ?? 0) > 0 && Math.floor(Date.now() / 60) % 2 === 0
  const baseColor = isBoss ? '#7a1a8a' : '#cc44cc'
  const bodyColor = flash ? '#ffffff' : baseColor

  ctx.fillStyle = bodyColor
  ctx.fillRect(ex, ey, width, height)

  // Eyes
  ctx.fillStyle = '#220022'
  const eyeOff = isBoss ? 11 : 8
  const eyeW = isBoss ? 6 : 4
  const eyeH = isBoss ? 5 : 4
  const eyeY = ey + Math.round(height * 0.22)
  if (facing === 1) {
    ctx.fillRect(ex + width - eyeOff, eyeY, eyeW, eyeH)
  } else {
    ctx.fillRect(ex + eyeOff - eyeW, eyeY, eyeW, eyeH)
  }

  // Boss angry eyebrow
  if (isBoss) {
    ctx.fillStyle = '#440044'
    if (facing === 1) {
      ctx.fillRect(ex + width - eyeOff - 1, eyeY - 4, eyeW + 2, 2)
    } else {
      ctx.fillRect(ex + eyeOff - eyeW - 1, eyeY - 4, eyeW + 2, 2)
    }
  }

  // Ears
  const earW = isBoss ? 7 : 4
  const earH = isBoss ? 8 : 5
  ctx.fillStyle = bodyColor
  ctx.fillRect(ex + 2,               ey - earH, earW,     earH)
  ctx.fillRect(ex + width - earW - 2, ey - earH, earW,     earH)
  ctx.fillStyle = isBoss ? '#ee88ff' : '#ff88ff'
  ctx.fillRect(ex + 3,               ey - earH + 1, earW - 2, earH - 2)
  ctx.fillRect(ex + width - earW - 1, ey - earH + 1, earW - 2, earH - 2)

  // Stripes
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  const stripes = isBoss ? 3 : 2
  for (let i = 0; i < stripes; i++) {
    ctx.fillRect(ex + 4 + i * 8, ey + Math.round(height * 0.44), 4, isBoss ? 14 : 10)
  }

  // Health bar for boss (only while alive/patrolling)
  if (isBoss && state === ENEMY_STATES.PATROL) {
    const segW = Math.floor(width / BOSS_ENEMY_HEALTH) - 1
    for (let i = 0; i < BOSS_ENEMY_HEALTH; i++) {
      ctx.fillStyle = i < health ? '#ff2244' : '#333'
      ctx.fillRect(ex + i * (segW + 1), ey - 9, segW, 5)
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

    drawSingleEnemy(ctx, enemy, ex, ey)

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
    for (let i = 0; i < board.width; i += 12) ctx.fillRect(sx + i, sy, 2, board.height)
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

function drawTreats(ctx, treats, cameraX) {
  const pulse = 0.65 + Math.sin(Date.now() / 280) * 0.35
  for (const t of treats) {
    if (t.collected) continue
    const tx = Math.round(t.x - cameraX)
    const ty = Math.round(t.y)
    ctx.globalAlpha = pulse
    ctx.fillStyle = '#cc66ff'
    ctx.fillRect(tx + 4, ty, 4, 12)
    ctx.fillRect(tx, ty + 4, 12, 4)
    ctx.fillStyle = '#ffbbff'
    ctx.fillRect(tx + 5, ty + 1, 2, 2)
    ctx.globalAlpha = 1
  }
}

function drawRoughPatches(ctx, roughPatches, cameraX, canvasWidth) {
  if (!roughPatches || roughPatches.length === 0) return
  const startCol = Math.floor(cameraX / TILE_SIZE) - 1
  const endCol   = startCol + Math.ceil(canvasWidth / TILE_SIZE) + 2

  for (const patch of roughPatches) {
    const { col, row, length } = patch
    if (col < startCol || col > endCol) continue

    const sx = Math.round(col * TILE_SIZE - cameraX)
    const sy = (row + 1) * TILE_SIZE  // bottom edge of ceiling tile
    const half = Math.round(TILE_SIZE * 0.38)
    const midX = sx + Math.round(TILE_SIZE / 2)

    ctx.fillStyle = '#3a2a1a'
    ctx.beginPath()
    ctx.moveTo(midX - half, sy)
    ctx.lineTo(midX + half, sy)
    ctx.lineTo(midX, sy + length)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#554433'
    ctx.beginPath()
    ctx.moveTo(midX - half + 2, sy)
    ctx.lineTo(midX + 3, sy)
    ctx.lineTo(midX, sy + length)
    ctx.closePath()
    ctx.fill()
  }
}

function drawKitten(ctx, cx, cy, freed, freedTimer) {
  // Small golden kitten (about 10×14 px)
  const bounce = freed ? Math.round(Math.sin(freedTimer * 12) * 3) : 0
  const color = '#f5c040'
  ctx.fillStyle = color
  // Body
  ctx.fillRect(cx - 5, cy - 8 + bounce, 10, 8)
  // Head
  ctx.fillRect(cx - 4, cy - 14 + bounce, 8, 7)
  // Ears
  ctx.fillRect(cx - 4, cy - 17 + bounce, 3, 3)
  ctx.fillRect(cx + 1, cy - 17 + bounce, 3, 3)
  // Eye
  ctx.fillStyle = '#220000'
  ctx.fillRect(cx + 1, cy - 12 + bounce, 2, 2)
  // Tail
  ctx.fillStyle = color
  ctx.fillRect(cx + 5, cy - 5 + bounce, 3, 5)
  ctx.fillRect(cx + 7, cy - 8 + bounce, 2, 3)
}

function drawCage(ctx, cage, cameraX) {
  if (!cage) return
  const cx = Math.round(cage.x - cameraX)
  const cy = Math.round(cage.y)
  const { width, height, freed, freedTimer, health } = cage

  // Dark interior
  ctx.fillStyle = '#130a18'
  ctx.fillRect(cx + 3, cy, width - 6, height)

  // Kitten inside / outside
  if (!freed) {
    drawKitten(ctx, cx + Math.floor(width / 2), cy + height - 2, false, 0)
  } else {
    // Kitten escaping to the left of the cage
    const escapeDist = Math.min(freedTimer * 80, 28)
    drawKitten(ctx, cx - Math.round(escapeDist), cy + height - 2, true, freedTimer)
  }

  // Bars (drawn over kitten when locked)
  if (!freed) {
    ctx.fillStyle = '#999'
    const barSpacing = 9
    for (let bx = cx + 3; bx < cx + width - 3; bx += barSpacing) {
      ctx.fillRect(bx, cy, 3, height)
    }
  } else {
    // Broken bars: draw partial/bent remnants
    ctx.fillStyle = '#666'
    ctx.fillRect(cx + 3, cy, 3, Math.round(height * 0.4))
    ctx.fillRect(cx + width - 6, cy, 3, Math.round(height * 0.3))
    ctx.fillRect(cx + 12, cy + Math.round(height * 0.6), 3, Math.round(height * 0.4))
  }

  // Top and bottom frame bars
  ctx.fillStyle = freed ? '#666' : '#aaa'
  ctx.fillRect(cx, cy, width, 4)
  ctx.fillRect(cx, cy + height - 4, width, 4)

  // Chain / hook at top centre
  ctx.fillStyle = '#888'
  ctx.fillRect(cx + Math.floor(width / 2) - 1, cy - 14, 2, 14)
  ctx.fillRect(cx + Math.floor(width / 2) - 4, cy - 16, 8, 3)

  // Hit-point indicators above cage (only while locked)
  if (!freed) {
    for (let i = 0; i < CAGE_HEALTH; i++) {
      ctx.fillStyle = i < health ? '#ffcc00' : '#333'
      ctx.fillRect(cx + 4 + i * 15, cy - 25, 11, 6)
    }
  }
}

export function renderFrame(ctx, {
  tilemap, player, boards, rocks, enemies, fish, treats, cage,
  roughPatches, particles, cameraX, canvasWidth, canvasHeight,
}) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  drawBackground(ctx, cameraX, canvasWidth, canvasHeight)
  drawTiles(ctx, tilemap, cameraX, canvasWidth)
  drawRoughPatches(ctx, roughPatches, cameraX, canvasWidth)
  drawBoards(ctx, boards ?? [], cameraX)
  drawRocks(ctx, rocks ?? [], cameraX)
  drawFish(ctx, fish ?? [], cameraX)
  drawTreats(ctx, treats ?? [], cameraX)
  if (cage) drawCage(ctx, cage, cameraX)
  drawEnemies(ctx, enemies ?? [], cameraX)
  drawParticles(ctx, particles ?? [], cameraX)
  drawPlayer(ctx, player, cameraX)
}

export function computeCameraX(playerX, levelWidthPx, canvasWidth) {
  const target = playerX - canvasWidth / 2
  return Math.max(0, Math.min(target, levelWidthPx - canvasWidth))
}
