const PARTICLE_GRAVITY = 380  // px/s² — lighter than game gravity for floaty feel

export function createParticle(x, y, vx, vy, color, life) {
  return { x, y, vx, vy, color, life, maxLife: life }
}

// Emit n particles in random directions from (x, y)
function burst(n, x, y, speed, colors, lifetime) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
    const s = speed * (0.4 + Math.random() * 0.6)
    return createParticle(
      x + (Math.random() - 0.5) * 6,
      y + (Math.random() - 0.5) * 6,
      Math.cos(angle) * s,
      Math.sin(angle) * s,
      colors[Math.floor(Math.random() * colors.length)],
      lifetime * (0.6 + Math.random() * 0.4),
    )
  })
}

// Player takes a hit — orange/red sparks
export function emitHit(x, y) {
  return burst(8, x, y, 190, ['#ff4422', '#ff8844', '#ffcc44'], 0.32)
}

// Enemy dies — purple sparkle burst
export function emitDeath(x, y) {
  return burst(10, x, y, 150, ['#cc44cc', '#ee66ee', '#ff88ff', '#aa22aa'], 0.44)
}

// Fish collected — gold upward shower
export function emitCollect(x, y) {
  return burst(6, x, y, 120, ['#f0a030', '#ffe060', '#fff090'], 0.28)
}

// Treat collected — pink/violet sparkles drifting upward
export function emitHeal(x, y) {
  return Array.from({ length: 8 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI
    const s = 60 + Math.random() * 80
    const colors = ['#ff88cc', '#cc66ff', '#ffbbee', '#aa44ff']
    return createParticle(
      x + (Math.random() - 0.5) * 8,
      y + (Math.random() - 0.5) * 8,
      Math.cos(angle) * s,
      Math.sin(angle) * s,
      colors[Math.floor(Math.random() * colors.length)],
      0.48 + Math.random() * 0.22,
    )
  })
}

// Player lands from a jump — sideways dust puffs
export function emitLand(x, y) {
  return Array.from({ length: 4 }, (_, i) => {
    const dir = i < 2 ? 1 : -1
    return createParticle(
      x + dir * Math.random() * 8,
      y,
      dir * (25 + Math.random() * 55),
      -12 - Math.random() * 28,
      i % 2 === 0 ? '#7a6a5a' : '#9a8a7a',
      0.17 + Math.random() * 0.08,
    )
  })
}

export function updateParticles(particles, dt) {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + PARTICLE_GRAVITY * dt,
      life: p.life - dt,
    }))
    .filter((p) => p.life > 0)
}

export function drawParticles(ctx, particles, cameraX) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    const sz = Math.max(1, Math.round(2 + alpha))
    ctx.fillRect(
      Math.round(p.x - cameraX - sz / 2),
      Math.round(p.y - sz / 2),
      sz, sz,
    )
  }
  ctx.globalAlpha = 1
}
