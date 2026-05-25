# Kitty Climber — Claude Instructions

## Project overview

A 2D side-scrolling platformer built with React 18 + Vite. Game logic lives in plain JS modules; React is used only for the UI shell and HUD overlay. Rendering is canvas-based via `src/engine/renderer.js`.

## Architecture

```
src/
  constants.js          — all magic numbers and enums live here
  engine/               — pure JS: physics, input, gameLoop, levelGenerator, renderer
  entities/             — plain JS classes: Player, Obstacle
  hooks/                — React hooks that bridge engine ↔ React: useInput, useGameLoop, useLevel
  components/           — React UI components (HUD, etc.)
  scenes/               — top-level scene components (GameScene)
```

Engine modules are framework-agnostic — they must not import React. React hooks are the only permitted bridge between engine state and the component tree.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # production build
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
```

## Testing

- Framework: **Vitest** with **jsdom** environment and **@testing-library/react**
- Test files live in `tests/` mirroring `src/` structure (e.g. `tests/engine/physics.test.js`)
- Component tests go in `tests/components/`
- Setup file: `src/test-setup.js` (imports `@testing-library/jest-dom`)
- Engine and entity tests use plain Vitest — no React renderer needed
- Do not mock internal modules; test against real implementations

## Code conventions

- Plain JavaScript (no TypeScript)
- ES modules (`"type": "module"` in package.json) — always use `import`/`export`, never `require`
- All game constants go in `src/constants.js` — never hardcode numbers elsewhere
- Style objects in components should be static constants, not inline functions that allocate on every render
- No CSS files — styling is done via inline style objects

## Versioning & commits

- Version is bumped once per development phase (0.1.0, 0.2.0, …)
- Each phase ends with a single commit summarizing everything done in that phase
- Format: `feat: Phase N — <short description> (vX.Y.0)`
