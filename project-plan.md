# Kitty Climber — Project Plan

## Tech Stack

- **Framework:** React 18 (with Vite)
- **Game Loop:** Custom `requestAnimationFrame` loop
- **Rendering:** HTML5 Canvas via React ref; React only for HUD/overlays
- **State:** `useRef` for mutable game state; React state for UI
- **Testing:** Vitest + React Testing Library (jsdom)
- **Language:** JavaScript ES modules

---

## Repository Structure

```
src/
  constants.js          — all magic numbers and enums
  engine/               — pure JS (no React): physics, input, gameLoop, levelGenerator, renderer, particles, storage
  entities/             — pure JS: Player, Enemy, Obstacle
  hooks/                — React hooks bridging engine ↔ React: useInput, useGameLoop, useLevel, useAudio
  components/           — React UI: HUD, DPad
  scenes/               — top-level scene components: TitleScene, MapView, GameScene, EndScreen
  audio/                — AudioEngine (Web Audio API, procedural SFX)
tests/                  — mirrors src/ structure
```

---

## Phased Build Plan

### ✅ Phase 1 — Scaffolding & Core Loop (v0.1.0)

- Vite + React 18 scaffold
- `constants.js` — gravity, tile size, key map
- `inputHandler.js` + `useInput` hook
- `useGameLoop` — fixed-timestep rAF loop
- `physics.js` — gravity, AABB tile collision
- `Player.js` — position, velocity, state machine
- `GameScene.jsx` — canvas mount, loop, placeholder rendering

---

### ✅ Phase 2 — Procedural Levels & Obstacles (v0.2.0)

- `levelGenerator.js` — seeded corridor walk, smooth tunnel, platforms, pits
- Camera scroll following player
- Tile renderer
- Falling rocks (periodic ceiling drops)
- Moving boards (sine-wave across pits)
- `useLevel` hook — entity lifecycle

---

### ✅ Phase 3 — Enemies, Combat & Collectibles (v0.3–0.5)

- `Enemy.js` — patrol AI, wall/edge reversal, 1-hit defeat
- **Boss rat** — 4-hit guard placed before the cage
- Hit detection — player attacks vs enemy hitboxes
- Player damage — enemy contact damages player
- `Treat.js` collectible — restores 1 HP on pickup
- Fish collectibles — score bonus
- `HUD.jsx` — health bar, score, fish count
- Game-over flow on 0 health
- Particle system (hit, death, collect, land, heal)

---

### ✅ Phase 4 — Kittens & Level Completion (v0.6)

- Kitten cage entity at tunnel end — 3-hit to open
- Kitten escape animation on free
- Level-complete flow with score carry-over
- 4-level arc (Base → First Peak → Tallest Peak → Far Side)

---

### ✅ Phase 5 — Polish, Audio & Infrastructure (v0.7)

- `AudioEngine.js` — procedural SFX via Web Audio (jump, land, hurt, kill, collect, levelClear, gameOver, heal, cage)
- High score persistence (localStorage)
- `TitleScene.jsx` — controls reference, high score display, any-key start
- `EndScreen.jsx` — disco ball canvas animation, score display, replay
- `DPad.jsx` — on-screen mobile controls
- Pause (Escape key)
- GitHub Pages deployment (Vite base config + Actions workflow)

---

### ✅ Phase 6 — Bug Fixes & Feel (v0.8.0)

- Variable jump height — hold X for full jump, tap for short hop
- Platform riding — player moves with moving boards
- Rocks fall from stalactite ceiling patches (deterministic spawn points)
- Platform clearance guarantee — no platform requires crouching

---

### 🔄 Phase 7 — Map View / Level Select (current)

**Goal:** Replace direct-to-level flow with a Mount Twitchy overworld map.

- `MapView.jsx` — canvas mountain with two peaks, snow caps, moon/stars
- 4 tunnel-entrance nodes connected by a dashed path
- Nodes show state: locked (gray), available (orange glow), cleared (green + kitten icon)
- Sequential unlock — level N available only after level N−1 is cleared
- Click or Enter to start the available level
- After level clear → return to map; after all 4 cleared → end screen
- After game over → return to map to retry current level

---

### Backlog

- Rat health variety (1–3 hits, randomised at spawn) per project definition
- Treats dropped on rat defeat (30% chance) per project definition
- In-game `m` key mini-map overlay (overview of discovered tunnel)
- Tabby striping / sprite improvements for Edith
- Enemy scratch/bite animations

---

## Testing Strategy

- **Unit tests** (Vitest): pure functions — physics, level generator, entity state machines
- **Integration tests** (Vitest + jsdom): hooks with fake timers
- **Component tests** (React Testing Library): HUD, EndScreen, MapView render/interaction
- **Manual smoke tests** — dev server walk-through each phase checkpoint

---

## Controls Reference

| Key | Action |
|-----|--------|
| ← → | Move |
| `x` | Jump (hold for higher) |
| `c` | Scratch attack |
| `z` | Bite attack |
| `v` | Crouch |
| `m` | Map view (in-game, backlog) |
| `Esc` | Pause |
