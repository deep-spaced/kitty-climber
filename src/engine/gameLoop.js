const FIXED_DT = 1 / 60  // 60 fps target

/**
 * Creates a game loop that calls `update(dt)` and `render()` each frame
 * using a fixed-timestep accumulator pattern.
 */
export function createGameLoop({ update, render }) {
  let rafId = null
  let lastTime = null
  let accumulator = 0

  function tick(timestamp) {
    if (lastTime === null) lastTime = timestamp
    const elapsed = Math.min((timestamp - lastTime) / 1000, 0.1) // cap at 100ms
    lastTime = timestamp
    accumulator += elapsed

    while (accumulator >= FIXED_DT) {
      update(FIXED_DT)
      accumulator -= FIXED_DT
    }

    render()
    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (rafId !== null) return
    lastTime = null
    accumulator = 0
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  return { start, stop }
}
