import { TILE_SIZE, TILES, PLAYER_STATES, ENEMY_STATES } from '../constants.js'

const TILE_COLORS = {
  [TILES.WALL]: '#5a4a3a',
  [TILES.FLOOR]: '#7a6a5a',
  [TILES.CEILING]: '#4a3a2a',
  [TILES.PLATFORM]: '#8a7a6a',
}

const PLAYER_COLOR = {
  [PLAYER_STATES.IDLE]: '#e8a87c',
  [PLAYER_STATES.RUN]: '#e8a87c',
  [PLAYER_STATES.JUMP]: '#f0c090',
  [PLAYER_STATES.FALL]: '#d09060',
  [PLAYER_STATES.CROUCH]: '#c07850',
  [PLAYER_STATES.ATTACK_SCRATCH]: '#ff8844',
  [PLAYER_STATES.ATTACK_BITE]: '#ff4422',
  [PLAYER_STATES.HURT]: '#ff2200',
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
  const color = PLAYER_COLOR[player.state] ?? '#e8a87c'

  // Flash white when hurt
  ctx.fillStyle = player.state === PLAYER_STATES.HURT
    ? (Math.floor(Date.now() / 80) % 2 === 0 ? '#ffffff' : color)
    : color
  ctx.fillRect(px, py, player.width, player.height)

  // Eyes — indicate facing direction
  ctx.fillStyle = '#222'
  const eyeY = py + 8
  if (player.facing === 1) {
    ctx.fillRect(px + player.width - 10, eyeY, 5, 5)
  } else {
    ctx.fillRect(px + 5, eyeY, 5, 5)
  }

  // Tabby stripes
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(px + 4 + i * 7, py + 16, 4, 12)
  }

  // Attack hitbox indicator
  if (player.state === PLAYER_STATES.ATTACK_SCRATCH || player.state === PLAYER_STATES.ATTACK_BITE) {
    const reach = 36
    const hbX = player.facing === 1 ? px + player.width : px - reach
    ctx.fillStyle = 'rgba(255,100,0,0.25)'
    ctx.fillRect(hbX, py + 4, reach, player.height - 8)
  }
}

function drawBoards(ctx, boards, cameraX) {
  for (const board of boards) {
    const sx = Math.round(board.x - cameraX)
    const sy = Math.round(board.y)
    // Board body
    ctx.fillStyle = '#b8895a'
    ctx.fillRect(sx, sy, board.width, board.height)
    // Wood grain lines
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let i = 0; i < board.width; i += 12) {
      ctx.fillRect(sx + i, sy, 2, board.height)
    }
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(sx, sy, board.width, 2)
  }
}

function drawEnemies(ctx, enemies, cameraX) {
  for (const enemy of enemies) {
    if (enemy.state === ENEMY_STATES.DEAD) continue
    const ex = Math.round(enemy.x - cameraX)
    const ey = Math.round(enemy.y)

    ctx.fillStyle = '#cc44cc'
    ctx.fillRect(ex, ey, enemy.width, enemy.height)

    // Eyes — indicate facing direction
    ctx.fillStyle = '#220022'
    const eyeY = ey + 7
    if (enemy.facing === 1) {
      ctx.fillRect(ex + enemy.width - 8, eyeY, 4, 4)
    } else {
      ctx.fillRect(ex + 4, eyeY, 4, 4)
    }

    // Stripes
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    for (let i = 0; i < 2; i++) {
      ctx.fillRect(ex + 4 + i * 7, ey + 14, 3, 10)
    }
  }
}

function drawFish(ctx, fish, cameraX) {
  for (const f of fish) {
    if (f.collected) continue
    const fx = Math.round(f.x - cameraX)
    const fy = Math.round(f.y)

    // Tail fins (two small triangles faked with rects)
    ctx.fillStyle = '#d07818'
    ctx.fillRect(fx, fy, 4, 4)
    ctx.fillRect(fx, fy + 8, 4, 4)

    // Body
    ctx.fillStyle = '#f0a030'
    ctx.fillRect(fx + 4, fy + 2, 12, 8)

    // Belly highlight
    ctx.fillStyle = 'rgba(255,240,160,0.5)'
    ctx.fillRect(fx + 6, fy + 3, 8, 3)

    // Eye
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(fx + 13, fy + 3, 2, 2)
  }
}

function drawGoal(ctx, goalX, cameraX, canvasWidth, canvasHeight) {
  const sx = goalX - cameraX
  if (sx > canvasWidth + 32 || sx < -32) return

  // Glowing pillar
  const grad = ctx.createLinearGradient(sx, 0, sx + 16, 0)
  grad.addColorStop(0, 'rgba(0,255,160,0)')
  grad.addColorStop(0.5, 'rgba(0,255,160,0.55)')
  grad.addColorStop(1, 'rgba(0,255,160,0)')
  ctx.fillStyle = grad
  ctx.fillRect(sx - 8, 0, 32, canvasHeight)

  // Bright center stripe
  ctx.fillStyle = 'rgba(0,255,160,0.9)'
  ctx.fillRect(sx + 6, 0, 4, canvasHeight)
}

function drawRocks(ctx, rocks, cameraX) {
  for (const rock of rocks) {
    if (!rock.active) continue
    const sx = Math.round(rock.x - cameraX)
    const sy = Math.round(rock.y)
    // Rock body
    ctx.fillStyle = '#888070'
    ctx.fillRect(sx, sy, rock.width, rock.height)
    // Slight highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(sx + 2, sy + 2, rock.width - 6, 4)
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(sx + 2, sy + rock.height - 5, rock.width - 4, 4)
  }
}

export function renderFrame(ctx, { tilemap, player, boards, rocks, enemies, fish, goalX, cameraX, canvasWidth, canvasHeight }) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // Cave background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight)
  grad.addColorStop(0, '#0d0820')
  grad.addColorStop(1, '#1a1008')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  drawTiles(ctx, tilemap, cameraX, canvasWidth)
  if (goalX != null) drawGoal(ctx, goalX, cameraX, canvasWidth, canvasHeight)
  drawBoards(ctx, boards ?? [], cameraX)
  drawRocks(ctx, rocks ?? [], cameraX)
  drawFish(ctx, fish ?? [], cameraX)
  drawEnemies(ctx, enemies ?? [], cameraX)
  drawPlayer(ctx, player, cameraX)
}

export function computeCameraX(playerX, levelWidthPx, canvasWidth) {
  const target = playerX - canvasWidth / 2
  return Math.max(0, Math.min(target, levelWidthPx - canvasWidth))
}
