import { useRef } from 'react'
import { TILES, TILE_SIZE } from '../constants.js'

/** Builds a flat ground tilemap for Phase 1 testing. */
function buildTestLevel(cols = 80, rows = 15) {
  const map = Array.from({ length: rows }, () => Array(cols).fill(TILES.EMPTY))

  // Floor
  for (let c = 0; c < cols; c++) map[rows - 1][c] = TILES.FLOOR

  // Ceiling
  for (let c = 0; c < cols; c++) map[0][c] = TILES.CEILING

  // Left/right walls
  for (let r = 0; r < rows; r++) {
    map[r][0] = TILES.WALL
    map[r][cols - 1] = TILES.WALL
  }

  // A few platforms
  for (let c = 5; c <= 10; c++) map[rows - 4][c] = TILES.PLATFORM
  for (let c = 15; c <= 22; c++) map[rows - 6][c] = TILES.PLATFORM
  for (let c = 28; c <= 35; c++) map[rows - 4][c] = TILES.PLATFORM

  return map
}

export function useLevel() {
  const tilemapRef = useRef(buildTestLevel())

  return {
    tilemap: tilemapRef.current,
    levelWidthPx: tilemapRef.current[0].length * TILE_SIZE,
    levelHeightPx: tilemapRef.current.length * TILE_SIZE,
  }
}
