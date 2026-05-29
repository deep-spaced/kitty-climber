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
  [PLAYER_STATES.ATTACK_BITE]:   '#e8a87c',
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

  // Squash-and-stretch: pivot at feet so the cat stays grounded
  ctx.save()
  const pivotX = px + width / 2
  const pivotY = py + height
  if (state === PLAYER_STATES.RUN) {
    // Wide and low while running
    ctx.translate(pivotX, pivotY)
    ctx.scale(1.30, 0.76)
    ctx.translate(-pivotX, -pivotY)
  } else if (state === PLAYER_STATES.JUMP) {
    // Tall and narrow on the way up
    ctx.translate(pivotX, pivotY)
    ctx.scale(0.82, 1.18)
    ctx.translate(-pivotX, -pivotY)
  } else if (state === PLAYER_STATES.FALL) {
    // Slightly stretched while falling
    ctx.translate(pivotX, pivotY)
    ctx.scale(0.86, 1.12)
    ctx.translate(-pivotX, -pivotY)
  }

  const isLunge = state === PLAYER_STATES.ATTACK_BITE
  // Whole-body lunge shift — head leads by an extra nudge
  const lunge = isLunge ? facing * 10 : 0
  const headExtra = isLunge ? facing * 4 : 0
  const headDip = isLunge ? 4 : 0

  const baseColor = PLAYER_COLOR[state] ?? '#e8a87c'
  const hurt = state === PLAYER_STATES.HURT
  const bodyColor = hurt
    ? (Math.floor(Date.now() / 80) % 2 === 0 ? '#ffffff' : baseColor)
    : baseColor

  // Motion-blur streaks behind the body during lunge
  if (isLunge) {
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = `rgba(232,168,124,${0.13 - i * 0.03})`
      ctx.fillRect(px + lunge - facing * i * 5, py + 8, width, height - 8)
    }
  }

  const ts = facing === 1 ? -1 : 1
  // Tail-side back legs — push further back during lunge
  const tbx = facing === 1 ? px + lunge : px + lunge + width
  const backLegShift = isLunge ? -facing * 4 : 0
  ctx.fillStyle = bodyColor
  ctx.fillRect(tbx + ts * 4 + backLegShift, py + height - 14, 4, 8)
  ctx.fillRect(tbx + ts * 7 + backLegShift, py + height - 20, 4, 6)

  // Main body — shifted by lunge
  ctx.fillStyle = bodyColor
  ctx.fillRect(px + lunge, py + 8, width, height - 8)
  // Head block — leads the body by headExtra, dips by headDip
  ctx.fillRect(px + lunge + headExtra + 2, py + 1 + headDip, width - 4, 12)

  // Ears (follow head position)
  ctx.fillRect(px + lunge + headExtra + 2,         py + headDip - 5, 5, 6)
  ctx.fillRect(px + lunge + headExtra + width - 7, py + headDip - 5, 5, 6)
  ctx.fillRect(px + lunge + headExtra + 3,         py + headDip - 8, 3, 3)
  ctx.fillRect(px + lunge + headExtra + width - 6, py + headDip - 8, 3, 3)
  ctx.fillStyle = '#e06090'
  ctx.fillRect(px + lunge + headExtra + 4,         py + headDip - 4, 2, 4)
  ctx.fillRect(px + lunge + headExtra + width - 6, py + headDip - 4, 2, 4)

  // Eyes (follow head)
  ctx.fillStyle = '#1a1a1a'
  const eyeX = facing === 1
    ? px + lunge + headExtra + width - 10
    : px + lunge + headExtra + 5
  const eyeY = py + headDip + 4
  // Squinted during lunge — half height
  ctx.fillRect(eyeX, eyeY, 5, isLunge ? 2 : 4)
  ctx.fillStyle = '#fff'
  ctx.fillRect(eyeX + (facing === 1 ? 1 : 3), eyeY, 1, 1)

  // Nose
  ctx.fillStyle = '#e06080'
  ctx.fillRect(eyeX + (facing === 1 ? -3 : 4), eyeY + (isLunge ? 2 : 4), 3, 2)

  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let i = 0; i < 3; i++) ctx.fillRect(px + lunge + 4 + i * 7, py + 16, 3, 12)

  // Front legs — reach forward during lunge
  const frontLegShift = isLunge ? facing * 4 : 0
  const fbx = facing === 1 ? px + lunge : px + lunge + width
  ctx.fillStyle = bodyColor
  if (state === PLAYER_STATES.RUN) {
    const f = Math.floor(Date.now() / 90) % 2
    const fLen = f === 0 ? 8 : 4
    const bLen = f === 0 ? 4 : 8
    ctx.fillRect(px + lunge + 3,         py + height - fLen, 6, fLen)
    ctx.fillRect(px + lunge + width - 9, py + height - bLen, 6, bLen)
  } else if (state === PLAYER_STATES.JUMP) {
    ctx.fillRect(px + lunge + 3,         py + height - 5, 6, 5)
    ctx.fillRect(px + lunge + width - 9, py + height - 5, 6, 5)
  } else if (state === PLAYER_STATES.FALL) {
    ctx.fillRect(px + lunge + 3,         py + height - 9, 5, 9)
    ctx.fillRect(px + lunge + width - 8, py + height - 9, 5, 9)
  } else if (state === PLAYER_STATES.CROUCH) {
    ctx.fillRect(px + lunge + 2,          py + height - 4, 8, 4)
    ctx.fillRect(px + lunge + width - 10, py + height - 4, 8, 4)
  } else if (isLunge) {
    // Front legs: reach forward; back legs: splay behind (already shifted via tbx/backLegShift)
    const fLegX = facing === 1 ? px + lunge + width - 9 + frontLegShift : px + lunge + 3 + frontLegShift
    ctx.fillRect(fLegX, py + height - 9, 6, 9)
    // Second front leg slightly behind
    const fLeg2X = facing === 1 ? px + lunge + width - 9 : px + lunge + 3
    ctx.fillRect(fLeg2X - facing * 2, py + height - 7, 5, 7)
  } else {
    ctx.fillRect(px + 3,         py + height - 7, 6, 7)
    ctx.fillRect(px + width - 9, py + height - 7, 6, 7)
  }

  if (state === PLAYER_STATES.ATTACK_SCRATCH) {
    // Three curved claws fanning forward from the paw
    // Each claw: thick at root, curves outward, tapers to a sharp tip
    const rootX = facing === 1 ? px + width - 2 : px + 2
    const rootY = py + Math.round(height * 0.38)
    const clawLen = 28
    // Fan angles relative to straight-forward: top, mid, bottom claw
    const fanAngles = [-0.55, -0.12, 0.30]
    const baseAngle = facing === 1 ? 0 : Math.PI
    // Soft glow under the whole fan
    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = '#ffcc66'
    ctx.beginPath()
    ctx.arc(rootX, rootY, clawLen + 6, baseAngle - 0.75, baseAngle + 0.55)
    ctx.lineTo(rootX, rootY)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    // Draw each claw as a filled tapered bezier shape
    for (let i = 0; i < fanAngles.length; i++) {
      const angle = baseAngle + fanAngles[i]
      // Tip position — baseAngle already encodes direction, no facing multiplier needed
      const tipX = rootX + Math.cos(angle) * clawLen
      const tipY = rootY + Math.sin(angle) * clawLen
      // Control point — curves the claw outward (hooking shape)
      const hookAngle = angle + (facing === 1 ? 0.4 : -0.4)
      const cpX = rootX + Math.cos(hookAngle) * clawLen * 0.6
      const cpY = rootY + Math.sin(hookAngle) * clawLen * 0.6
      // Perpendicular offset at root for claw width (tapers to 0 at tip)
      const perpAngle = angle + Math.PI * 0.5
      const halfW = 2.5 - i * 0.3
      const ox = Math.cos(perpAngle) * halfW
      const oy = Math.sin(perpAngle) * halfW
      ctx.beginPath()
      ctx.moveTo(rootX + ox, rootY + oy)
      ctx.quadraticCurveTo(cpX + ox * 0.4, cpY + oy * 0.4, tipX, tipY)
      ctx.quadraticCurveTo(cpX - ox * 0.4, cpY - oy * 0.4, rootX - ox, rootY - oy)
      ctx.closePath()
      // Gradient-like: bright ivory body, white tip implied by shape
      ctx.fillStyle = i === 1 ? '#f0e0b0' : '#ddd0a0'
      ctx.fill()
      ctx.strokeStyle = '#c8a060'
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
    ctx.lineWidth = 1
  } else if (isLunge) {
    // Open mouth integrated into the lunged head position
    // The head leading edge is at the front of (px + lunge + headExtra + head rect)
    const mouthEdgeX = facing === 1
      ? px + lunge + headExtra + width - 2
      : px + lunge + headExtra + 2
    const mouthY = py + headDip + 7
    const mouthW = 8
    // Pink mouth interior
    ctx.fillStyle = '#cc2244'
    const mInteriorX = facing === 1 ? mouthEdgeX - mouthW : mouthEdgeX
    ctx.fillRect(mInteriorX, mouthY - 3, mouthW, 7)
    // Upper lip / jaw
    ctx.fillStyle = bodyColor
    ctx.fillRect(mInteriorX - 1, mouthY - 5, mouthW + 2, 3)
    // Lower lip / jaw
    ctx.fillRect(mInteriorX - 1, mouthY + 3, mouthW + 2, 3)
    // Teeth — two sharp fangs
    ctx.fillStyle = '#f8f8e8'
    const fang1X = facing === 1 ? mouthEdgeX - 3 : mouthEdgeX
    const fang2X = facing === 1 ? mouthEdgeX - 6 : mouthEdgeX + 3
    ctx.fillRect(fang1X, mouthY - 4, 2, 4)  // upper fang
    ctx.fillRect(fang2X, mouthY - 4, 2, 3)  // upper fang 2
    ctx.fillRect(fang1X, mouthY + 2, 2, 4)  // lower fang
    ctx.fillRect(fang2X, mouthY + 3, 2, 3)  // lower fang 2
  }

  ctx.restore()
}

function drawSingleEnemy(ctx, enemy, ex, ey) {
  const { width, height, facing, isBoss, health, hurtTimer, state } = enemy
  const flash = (hurtTimer ?? 0) > 0 && Math.floor(Date.now() / 60) % 2 === 0
  // Boss is darker gray; normal rat is mid-gray
  const baseColor = isBoss ? '#666666' : '#909090'
  const bodyColor = flash ? '#ffffff' : baseColor

  // Body
  ctx.fillStyle = bodyColor
  ctx.fillRect(ex, ey, width, height)

  // Darker underbelly on lower half
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(ex + 2, ey + Math.round(height * 0.5), width - 4, Math.round(height * 0.5))

  // Eyes
  const eyeOff = Math.round(width * 0.2)
  const eyeW = isBoss ? 5 : 3
  const eyeH = isBoss ? 4 : 3
  const eyeY = ey + Math.round(height * 0.25)
  ctx.fillStyle = '#111111'
  if (facing === 1) {
    ctx.fillRect(ex + width - eyeOff - eyeW, eyeY, eyeW, eyeH)
  } else {
    ctx.fillRect(ex + eyeOff, eyeY, eyeW, eyeH)
  }

  // Boss-only: angry eyebrow (dark slash above the eye)
  if (isBoss) {
    ctx.fillStyle = '#333333'
    if (facing === 1) {
      ctx.fillRect(ex + width - eyeOff - eyeW - 1, eyeY - 3, eyeW + 2, 2)
    } else {
      ctx.fillRect(ex + eyeOff - 1, eyeY - 3, eyeW + 2, 2)
    }
  }

  // Ears — small round rat ears on top corners
  const earW = isBoss ? 7 : 5
  const earH = isBoss ? 5 : 4
  ctx.fillStyle = bodyColor
  ctx.fillRect(ex + 3,               ey - earH, earW, earH)
  ctx.fillRect(ex + width - earW - 3, ey - earH, earW, earH)
  ctx.fillStyle = '#c08080'  // pinkish inner ear for all rats
  ctx.fillRect(ex + 4,               ey - earH + 1, earW - 2, earH - 1)
  ctx.fillRect(ex + width - earW - 2, ey - earH + 1, earW - 2, earH - 1)

  // Nose
  const noseX = facing === 1 ? ex + width - 3 : ex + 1
  ctx.fillStyle = '#d08080'
  ctx.fillRect(noseX, ey + Math.round(height * 0.45), isBoss ? 4 : 3, 2)

  // Attack animation — lunge with motion streak and red tint
  if (state === ENEMY_STATES.ATTACK) {
    const streakDir = facing === 1 ? -1 : 1
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = `rgba(100,100,100,${0.12 - i * 0.03})`
      ctx.fillRect(ex + streakDir * i * 5, ey + 2, width, height - 4)
    }
    ctx.fillStyle = flash ? '#ffffff' : '#cc2222'
    ctx.fillRect(ex, ey, width, height)
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.fillRect(ex + 2, ey + Math.round(height * 0.5), width - 4, Math.round(height * 0.5))
    // Claws extending forward
    const clawBaseX = facing === 1 ? ex + width : ex
    const clawY = ey + Math.round(height * 0.5)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 3; i++) {
      const cx = facing === 1 ? clawBaseX + 2 + i * 4 : clawBaseX - 4 - i * 4
      ctx.fillRect(cx, clawY - 4 + i * 3, 3, 5)
    }
    // Red eyes
    ctx.fillStyle = '#ff0000'
    if (facing === 1) {
      ctx.fillRect(ex + width - eyeOff - eyeW, eyeY, eyeW, eyeH)
    } else {
      ctx.fillRect(ex + eyeOff, eyeY, eyeW, eyeH)
    }
  }

  // Health bar for boss
  if (isBoss && state !== ENEMY_STATES.DYING) {
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
