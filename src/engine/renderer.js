import { TILE_SIZE, TILES, PLAYER_STATES } from '../constants.js'

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

export function renderFrame(ctx, { tilemap, player, cameraX, canvasWidth, canvasHeight }) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // Sky background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const startCol = Math.floor(cameraX / TILE_SIZE)
  const endCol = startCol + Math.ceil(canvasWidth / TILE_SIZE) + 1

  // Tiles
  for (let row = 0; row < tilemap.length; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (col < 0 || col >= tilemap[0].length) continue
      const tile = tilemap[row][col]
      if (tile === TILES.EMPTY) continue

      const sx = col * TILE_SIZE - cameraX
      const sy = row * TILE_SIZE

      ctx.fillStyle = TILE_COLORS[tile] ?? '#888'
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE)

      // Subtle grid line
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE)
    }
  }

  // Player
  const px = Math.round(player.x - cameraX)
  const py = Math.round(player.y)
  const color = PLAYER_COLOR[player.state] ?? '#e8a87c'

  ctx.fillStyle = color
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

  // Attack hitbox debug overlay
  if (player.state === PLAYER_STATES.ATTACK_SCRATCH || player.state === PLAYER_STATES.ATTACK_BITE) {
    const reach = 36
    const hbX = player.facing === 1 ? px + player.width : px - reach
    ctx.fillStyle = 'rgba(255,100,0,0.25)'
    ctx.fillRect(hbX, py + 4, reach, player.height - 8)
  }
}

export function computeCameraX(playerX, levelWidthPx, canvasWidth) {
  const target = playerX - canvasWidth / 2
  return Math.max(0, Math.min(target, levelWidthPx - canvasWidth))
}
