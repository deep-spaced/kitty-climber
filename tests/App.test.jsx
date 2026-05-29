import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'

// Mock all scene components to avoid canvas / rAF dependencies
vi.mock('../src/scenes/TitleScene.jsx', () => ({
  default: ({ onStart }) => <button data-testid="title" onClick={onStart}>TitleScene</button>,
}))

vi.mock('../src/scenes/MapView.jsx', () => ({
  default: ({ levelsCleared, onEnter }) => (
    <div data-testid="map">
      <span data-testid="cleared">cleared={levelsCleared}</span>
      <button data-testid="map-enter" onClick={onEnter}>Enter</button>
    </div>
  ),
}))

vi.mock('../src/scenes/GameScene.jsx', () => ({
  default: ({ levelIndex, initialScore, onLevelClear, onGameOver }) => (
    <div data-testid="game">
      <span data-testid="level-idx">level={levelIndex}</span>
      <span data-testid="init-score">score={initialScore}</span>
      <button data-testid="clear" onClick={() => onLevelClear(100)}>Clear</button>
      <button data-testid="gameover" onClick={() => onGameOver(50)}>GameOver</button>
    </div>
  ),
}))

vi.mock('../src/scenes/EndScreen.jsx', () => ({
  default: ({ score, highScore, isNewRecord, onReplay }) => (
    <div data-testid="end">
      <span data-testid="end-score">score={score}</span>
      <span data-testid="end-hs">hs={highScore}</span>
      {isNewRecord && <span data-testid="new-record">NEW</span>}
      <button data-testid="replay" onClick={onReplay}>Replay</button>
    </div>
  ),
}))

vi.mock('../src/engine/storage.js', () => ({
  getHighScore: vi.fn(() => 0),
  saveHighScore: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('App — initial state', () => {
  it('shows title screen on first load', () => {
    render(<App />)
    expect(screen.getByTestId('title')).toBeTruthy()
  })
})

describe('App — title → map navigation', () => {
  it('navigates to map after title click', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    expect(screen.getByTestId('map')).toBeTruthy()
    expect(screen.getByTestId('cleared').textContent).toBe('cleared=0')
  })
})

describe('App — map → playing', () => {
  it('starts level 0 when map enter is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    fireEvent.click(screen.getByTestId('map-enter'))
    expect(screen.getByTestId('game')).toBeTruthy()
    expect(screen.getByTestId('level-idx').textContent).toBe('level=0')
  })
})

describe('App — level clear', () => {
  it('returns to map after clearing level 0', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    fireEvent.click(screen.getByTestId('map-enter'))
    fireEvent.click(screen.getByTestId('clear'))
    expect(screen.getByTestId('map')).toBeTruthy()
    expect(screen.getByTestId('cleared').textContent).toBe('cleared=1')
  })

  it('carries score to the next level start', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    fireEvent.click(screen.getByTestId('map-enter'))
    fireEvent.click(screen.getByTestId('clear'))      // score = 100
    fireEvent.click(screen.getByTestId('map-enter'))  // enter level 1
    expect(screen.getByTestId('init-score').textContent).toBe('score=100')
  })

  it('goes to end screen after all 4 levels are cleared', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByTestId('map-enter'))
      fireEvent.click(screen.getByTestId('clear'))
    }
    expect(screen.getByTestId('end')).toBeTruthy()
  })

  it('shows accumulated score on end screen', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByTestId('map-enter'))
      fireEvent.click(screen.getByTestId('clear'))
    }
    // Each clear gives 100; last clear's value is in finalScore
    expect(screen.getByTestId('end-score').textContent).toBe('score=100')
  })
})

describe('App — game over', () => {
  it('returns to map after game over', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    fireEvent.click(screen.getByTestId('map-enter'))
    fireEvent.click(screen.getByTestId('gameover'))
    expect(screen.getByTestId('map')).toBeTruthy()
    expect(screen.getByTestId('cleared').textContent).toBe('cleared=0')
  })

  it('does not advance levelsCleared on game over', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    fireEvent.click(screen.getByTestId('map-enter'))
    fireEvent.click(screen.getByTestId('clear'))  // level 0 cleared → cleared=1
    fireEvent.click(screen.getByTestId('map-enter'))
    fireEvent.click(screen.getByTestId('gameover'))
    expect(screen.getByTestId('cleared').textContent).toBe('cleared=1')
  })
})

describe('App — replay', () => {
  it('returns to map at level 0 when replay is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('title'))
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByTestId('map-enter'))
      fireEvent.click(screen.getByTestId('clear'))
    }
    fireEvent.click(screen.getByTestId('replay'))
    expect(screen.getByTestId('map')).toBeTruthy()
    expect(screen.getByTestId('cleared').textContent).toBe('cleared=0')
  })
})
