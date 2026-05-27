import {
  TILES, TILE_SIZE,
  ENEMY_WIDTH, ENEMY_HEIGHT,
  FISH_WIDTH, FISH_HEIGHT,
  TREAT_WIDTH, TREAT_HEIGHT,
  BOSS_ENEMY_WIDTH, BOSS_ENEMY_HEIGHT,
  CAGE_WIDTH, CAGE_HEIGHT,
} from '../constants.js'

// Mulberry32 seeded PRNG — fast, good distribution
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function smoothArray(arr, passes = 3) {
  let out = arr.slice()
  for (let p = 0; p < passes; p++) {
    const next = out.slice()
    for (let i = 1; i < out.length - 1; i++) {
      next[i] = (out[i - 1] + out[i] + out[i + 1]) / 3
    }
    out = next
  }
  return out
}

/**
 * Generate a tunnel level as a 2D tile array.
 *
 * Returns:
 *   map          — 2D tile array [row][col]
 *   floorRows    — bottom tunnel row per column (or null for pit columns)
 *   ceilRows     — top tunnel row per column
 *   movingBoards — array of board descriptors { col, row, width, amplitude, speed, phase }
 *   rockSpawns   — array of { col, row } ceiling positions where rocks can drop
 *   enemySpawns  — regular patrol enemies
 *   bossSpawn    — { x, y } for the boss guard, or null
 *   cageSpawn    — { x, y, width, height } for the end-of-level kitten cage
 *   spawnX/Y     — player start in px
 */
export function generateLevel(seed, { cols = 120, rows = 15, levelIndex = 0 } = {}) {
  const rand = mulberry32(seed)

  const TUNNEL_HEIGHT = 9  // clear tiles between ceiling and floor tiles
  const HALF = Math.floor(TUNNEL_HEIGHT / 2)  // 4

  // --- Tunnel center-line: random walk, then smooth ---
  let center = Math.floor(rows / 2)
  const rawCenters = [center]
  for (let c = 1; c < cols; c++) {
    const r = rand()
    if (c > 4 && c < cols - 4) {
      if (r < 0.25) center = Math.max(HALF + 2, center - 1)
      else if (r < 0.5) center = Math.min(rows - HALF - 3, center + 1)
    }
    rawCenters.push(center)
  }
  const centers = smoothArray(rawCenters, 4).map(Math.round)

  // --- Carve tunnel ---
  const map = Array.from({ length: rows }, () => Array(cols).fill(TILES.WALL))
  const floorRows = []
  const ceilRows  = []

  for (let c = 0; c < cols; c++) {
    const top = centers[c] - HALF
    const bot = centers[c] + HALF
    ceilRows.push(top)
    floorRows.push(bot)

    for (let r = top; r <= bot; r++) {
      if (r >= 0 && r < rows) map[r][c] = TILES.EMPTY
    }
    if (top >= 0 && top < rows) map[top][c] = TILES.CEILING
    if (bot >= 0 && bot < rows) map[bot][c] = TILES.FLOOR
  }

  // Hard boundary columns
  for (let r = 0; r < rows; r++) {
    map[r][0] = TILES.WALL
    map[r][cols - 1] = TILES.WALL
  }

  // --- Platforms: 4–6 ledges, with guaranteed headroom on both sides ---
  // Player height = 40px = 1.25 tiles. Need ≥2 clear tiles above AND below.
  // With TUNNEL_HEIGHT=9: floorR - ceilR = 8, valid range is ceilR+3 … ceilR+5.
  const platformCount = 4 + Math.floor(rand() * 3)
  const platforms = []
  for (let i = 0; i < platformCount; i++) {
    const col = 8 + Math.floor(rand() * (cols - 24))
    const ceilR  = ceilRows[col]
    const floorR = floorRows[col]

    // Enforce clearance: 2+ EMPTY tiles above platform, 2+ EMPTY tiles below
    const midYMin = ceilR + 3
    const midYMax = floorR - 3
    if (midYMax < midYMin) continue  // tunnel too narrow — skip

    const midY = midYMin + Math.floor(rand() * (midYMax - midYMin + 1))
    const width = 4 + Math.floor(rand() * 5)

    let overlaps = false
    for (const p of platforms) {
      if (Math.abs(p.col - col) < p.width + width + 2) { overlaps = true; break }
    }
    if (!overlaps) {
      platforms.push({ col, row: midY, width })
      for (let dc = 0; dc < width && col + dc < cols - 1; dc++) {
        const pc = col + dc
        if (map[midY][pc] !== TILES.EMPTY) continue
        // Re-check clearance at this specific column (ceiling varies along the tunnel)
        const pcCeilR  = ceilRows[pc]
        const pcFloorR = floorRows[pc]
        if (pcFloorR === null) continue
        if (midY - pcCeilR < 3) continue   // < 2 clear tiles above
        if (pcFloorR - midY < 3) continue  // < 2 clear tiles below
        map[midY][pc] = TILES.PLATFORM
      }
    }
  }

  // --- Pits: remove floor tiles in 2–3 segments ---
  const pitCount = 2 + Math.floor(rand() * 2)
  const pits = []
  for (let i = 0; i < pitCount; i++) {
    const col = 12 + Math.floor(rand() * (cols - 30))
    const width = 3 + Math.floor(rand() * 3)

    let overlaps = false
    for (const p of pits) {
      if (Math.abs(p.col - col) < p.width + width + 6) { overlaps = true; break }
    }
    if (!overlaps) {
      pits.push({ col, width })
      for (let dc = 0; dc < width && col + dc < cols - 1; dc++) {
        const r = floorRows[col + dc]
        if (r >= 0 && r < rows) {
          map[r][col + dc] = TILES.WALL
          floorRows[col + dc] = null
        }
      }
    }
  }

  // --- Moving boards: one per pit ---
  const movingBoards = pits.map((pit) => {
    const col = pit.col
    const row = floorRows[col - 1] ?? floorRows[col + pit.width] ?? centers[col] + HALF
    return {
      col,
      row,
      width: pit.width + 1,
      amplitude: (pit.width * TILE_SIZE) / 2,
      speed: 1.2 + rand() * 0.8,
      phase: rand() * Math.PI * 2,
    }
  })

  // --- Rough ceiling patches: stalactite clusters that also serve as rock spawn points ---
  const roughPatches = []
  let patchCol = 8 + Math.floor(rand() * 6)
  while (patchCol < cols - 8) {
    roughPatches.push({
      col: patchCol,
      row: ceilRows[patchCol],
      length: 10 + Math.floor(rand() * 20),  // stalactite length in px
    })
    patchCol += 6 + Math.floor(rand() * 10)
  }

  // Shuffle patches using Fisher-Yates so rock spawns are distributed
  for (let i = roughPatches.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [roughPatches[i], roughPatches[j]] = [roughPatches[j], roughPatches[i]]
  }

  const rockSpawnCount = 5 + levelIndex * 2
  const rockSpawns = roughPatches
    .slice(0, Math.min(rockSpawnCount, roughPatches.length))
    .map((p) => ({ col: p.col, row: p.row }))

  const spawnX = TILE_SIZE * 2
  const spawnY = (floorRows[2] - 3) * TILE_SIZE

  // --- Goal column and cage ---
  const goalCol = cols - 7

  const cageFloorRow = floorRows[goalCol] ?? floorRows[goalCol - 1] ?? floorRows[goalCol + 1]
  const cageSpawn = {
    x: goalCol * TILE_SIZE + Math.floor((TILE_SIZE - CAGE_WIDTH) / 2),
    y: cageFloorRow * TILE_SIZE - CAGE_HEIGHT,
    width: CAGE_WIDTH,
    height: CAGE_HEIGHT,
  }

  // --- Boss spawn: large guard enemy placed before the cage ---
  const bossCol = goalCol - 12
  const bossFloorRow = floorRows[bossCol] ?? floorRows[bossCol - 1] ?? floorRows[bossCol + 1]
  const bossSpawn = bossFloorRow !== null ? {
    col: bossCol,
    x: bossCol * TILE_SIZE + Math.floor((TILE_SIZE - BOSS_ENEMY_WIDTH) / 2),
    y: bossFloorRow * TILE_SIZE - BOSS_ENEMY_HEIGHT,
  } : null

  // --- Regular enemy spawns: patrol enemies on floor, away from start/goal/boss ---
  const enemyCount = 3 + Math.min(levelIndex, 3)
  const enemySpawns = []
  for (let i = 0; i < enemyCount; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const col = 15 + Math.floor(rand() * (goalCol - 25))
      if (floorRows[col] === null) continue
      const tooClose = enemySpawns.some((e) => Math.abs(e.col - col) < 10)
      if (tooClose) continue
      const floorRow = floorRows[col]
      enemySpawns.push({
        col,
        x: col * TILE_SIZE + Math.floor((TILE_SIZE - ENEMY_WIDTH) / 2),
        y: floorRow * TILE_SIZE - ENEMY_HEIGHT,
      })
      break
    }
  }

  // --- Fish collectibles ---
  const fishCount = 6 + levelIndex
  const fishSpawns = []
  for (let i = 0; i < fishCount; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const col = 8 + Math.floor(rand() * (goalCol - 12))
      if (floorRows[col] === null) continue
      const ceilR  = ceilRows[col]
      const floorR = floorRows[col]
      const tunnelInterior = floorR - ceilR - 2
      if (tunnelInterior < 2) continue
      const row = ceilR + 1 + Math.floor(rand() * tunnelInterior)
      const tooClose = fishSpawns.some((f) => Math.abs(f.col - col) < 5)
      if (tooClose) continue
      fishSpawns.push({
        col,
        x: col * TILE_SIZE + Math.floor((TILE_SIZE - FISH_WIDTH) / 2),
        y: row * TILE_SIZE + Math.floor((TILE_SIZE - FISH_HEIGHT) / 2),
        width: FISH_WIDTH,
        height: FISH_HEIGHT,
      })
      break
    }
  }

  // --- Treat spawns ---
  const treatCount = 2 + Math.floor(rand() * 2)
  const treatSpawns = []
  for (let i = 0; i < treatCount; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const col = 10 + Math.floor(rand() * (goalCol - 15))
      if (floorRows[col] === null) continue
      const tooClose = treatSpawns.some((t) => Math.abs(t.col - col) < 8)
        || fishSpawns.some((f) => Math.abs(f.col - col) < 5)
      if (tooClose) continue
      const floorRow = floorRows[col]
      treatSpawns.push({
        col,
        x: col * TILE_SIZE + Math.floor((TILE_SIZE - TREAT_WIDTH) / 2),
        y: floorRow * TILE_SIZE - TREAT_HEIGHT,
        width: TREAT_WIDTH,
        height: TREAT_HEIGHT,
      })
      break
    }
  }

  return {
    map, floorRows, ceilRows,
    movingBoards, rockSpawns, roughPatches,
    enemySpawns, bossSpawn, cageSpawn,
    fishSpawns, treatSpawns,
    spawnX, spawnY,
  }
}
