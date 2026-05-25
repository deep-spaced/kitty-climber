# Kitty Climber — Project Plan

## Tech Stack

- **Framework:** React (with Vite for fast dev/build)
- **Game Loop:** Custom `requestAnimationFrame` loop (no heavy game engine — keeps bundle small)
- **Rendering:** HTML5 Canvas via React ref
- **State:** React Context + `useReducer` for game state; local component state for UI overlays
- **Testing:** Vitest + React Testing Library
- **Language:** JavaScript (ES modules)

---

## Repository Structure

```
kitty-climber/
├── public/
│   └── assets/           # sprite sheets, audio (placeholder PNGs to start)
├── src/
│   ├── engine/           # platform-agnostic game logic
│   │   ├── gameLoop.js       # requestAnimationFrame driver
│   │   ├── physics.js        # gravity, collision detection
│   │   ├── levelGenerator.js # procedural tunnel generation
│   │   └── inputHandler.js   # keyboard mapping
│   ├── entities/         # game objects
│   │   ├── Player.js         # Edith — movement, attack, health
│   │   ├── Rat.js            # enemy AI, hit detection
│   │   ├── Kitten.js         # cage entity + release trigger
│   │   ├── Treat.js          # health pickup
│   │   └── Obstacle.js       # falling rocks, moving boards
│   ├── scenes/           # top-level game screens
│   │   ├── TitleScreen.jsx
│   │   ├── MapView.jsx       # Mount Twitchy overview, fog of war
│   │   ├── GameScene.jsx     # canvas + HUD wrapper
│   │   └── EndScreen.jsx     # disco ball celebration
│   ├── components/       # reusable React UI
│   │   ├── HUD.jsx           # health bar, treat count
│   │   └── Overlay.jsx       # pause / game-over modal
│   ├── hooks/
│   │   ├── useGameLoop.js    # drives engine tick inside React
│   │   ├── useInput.js       # keyboard state
│   │   └── useLevel.js       # level generation + entity lifecycle
│   ├── context/
│   │   └── GameContext.jsx   # global game state (score, lives, kittens found)
│   ├── constants.js          # tile size, gravity, speeds, key bindings
│   └── main.jsx
├── tests/
│   ├── engine/
│   ├── entities/
│   └── scenes/
├── index.html
├── vite.config.js
└── package.json
```

---

## Phased Build Plan

### Phase 1 — Scaffolding & Core Loop

**Goal:** Get a canvas on screen with a character that moves.

- [ ] `npm create vite@latest` — React template
- [ ] Configure Vitest
- [ ] `constants.js` — gravity, tile size (32px), key map
- [ ] `inputHandler.js` — track key-down/up state
- [ ] `useInput` hook — exposes `{ left, right, jump, attack, crouch }` booleans
- [ ] `useGameLoop` hook — `requestAnimationFrame` with fixed timestep (60 fps target)
- [ ] `physics.js` — apply gravity, AABB collision against tile map
- [ ] `Player.js` — position, velocity, state machine (`idle | run | jump | crouch | attack`)
- [ ] `GameScene.jsx` — mounts canvas, wires loop + input, draws player rectangle placeholder

**Tests:** physics collision, player state transitions, input mapping

---

### Phase 2 — Level Generation

**Goal:** A playable tunnel level with platforms.

- [ ] `levelGenerator.js` — procedural tunnel using a cellular automaton or corridor walk algorithm
  - Outputs a 2D tile array: `empty | wall | floor | ceiling`
  - Configurable width (long scroll) and height (~15 tiles)
  - Seed-based so levels are reproducible for testing
- [ ] Camera / viewport scroll — follows player horizontally
- [ ] Tile renderer on canvas (solid colored tiles initially)
- [ ] Obstacle spawning:
  - **Falling rocks** — periodic drop from ceiling tiles
  - **Moving boards** — horizontal platforms crossing pit gaps (sine-wave motion)
- [ ] `useLevel` hook — instantiates entities from generated map

**Tests:** generator produces walkable paths, obstacles spawn within bounds

---

### Phase 3 — Enemies & Combat

**Goal:** Rats that fight back, treats that heal.

- [ ] `Rat.js` — simple patrol AI (reverse on wall/edge), chase range, attack cooldown
  - Animations: idle, walk, scratch, bite (sprite states, not assets yet)
  - Health: 1–3 hits randomized at spawn
- [ ] Hit detection — player attacks (`c` = scratch, `z` = bite) vs. rat hitbox
- [ ] Player damage — rat attack hits player, 4-hit health bar
- [ ] `Treat.js` — static pickup; restores 1 hit point
  - Scattered at generation time + dropped randomly (30% chance) on rat defeat
- [ ] `HUD.jsx` — health hearts / bar, treat count
- [ ] Game-over flow on 0 health

**Tests:** rat AI state machine, hit detection math, treat drop RNG (mock Math.random)

---

### Phase 4 — Kittens & Level Completion

**Goal:** Each level has a goal — rescue a kitten.

- [ ] `Kitten.js` — cage entity placed at tunnel end
  - Takes 3 hits to open; kitten appears, level-complete fires after short delay
- [ ] Level-complete overlay — transition to map view
- [ ] Progress tracked in `GameContext` (which kittens found)

**Tests:** cage hit counter, completion trigger

---

### Phase 5 — Map View & World Structure

**Goal:** Mount Twitchy overworld with fog of war.

- [ ] `MapView.jsx` — static SVG/canvas mountain silhouette (two peaks)
  - Four tunnel entrances as clickable markers
  - Unexplored tunnels hidden until player reaches the map area
- [ ] Navigation: press `m` in-game toggles map; select tunnel to enter
- [ ] Level ordering: Base → Peak 1 → Tallest Peak → Far Side

---

### Phase 6 — Sprites & Audio

**Goal:** Replace colored rectangles with actual art.

- [ ] Sprite sheet format — PNG atlas + JSON frame data (Aseprite-compatible)
- [ ] Sprite renderer utility — draws frame from atlas on canvas
- [ ] Edith sprites: idle, run (4 frames), jump, crouch, scratch, bite
- [ ] Rat sprites: idle, walk, scratch, bite, hurt, death
- [ ] Kitten cage sprite + open animation
- [ ] Treat sprite (sparkle animation)
- [ ] Background tiles: rock walls, dirt floor, mountain backdrop layers (parallax)
- [ ] Audio: jump, scratch, bite, hurt, treat pickup, level complete, disco end

---

### Phase 7 — End Game & Polish

**Goal:** All kittens found → disco celebration.

- [ ] `EndScreen.jsx` — disco ball drops, all characters dance (CSS animation + canvas combo)
- [ ] Title screen with start button
- [ ] Pause menu (Escape key)
- [ ] Local high-score / completion time (localStorage)
- [ ] Mobile: on-screen D-pad overlay (stretch goal)

---

## Controls Reference

| Key | Action |
|-----|--------|
| ← → | Move left / right |
| `x` | Jump |
| `c` | Scratch attack |
| `z` | Bite attack |
| `v` | Crouch |
| `m` | Toggle map view |

---

## Testing Strategy

- **Unit tests** (Vitest): pure functions — physics, level generator, entity state machines, hit detection
- **Integration tests** (Vitest + jsdom): hooks like `useInput`, `useGameLoop` with fake timers
- **Component tests** (React Testing Library): HUD renders correct health, overlay appears on game-over
- **Manual smoke tests** — run the dev server and walk through each phase checkpoint

---

## Milestone Summary

| Milestone | Deliverable |
|-----------|-------------|
| M1 | Moving character on canvas |
| M2 | Scrolling generated tunnel level |
| M3 | Rats, combat, health, treats |
| M4 | Kitten cages, level completion |
| M5 | Map view, all 4 levels navigable |
| M6 | Sprites and audio |
| M7 | End screen, title, polish |
