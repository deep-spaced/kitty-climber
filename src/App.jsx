import { useState, useRef, useCallback } from 'react'
import TitleScene from './scenes/TitleScene.jsx'
import GameScene from './scenes/GameScene.jsx'
import { getHighScore, saveHighScore } from './engine/storage.js'

export default function App() {
  const [scene, setScene] = useState('title')
  const [levelIndex, setLevelIndex] = useState(0)
  const [seed, setSeed] = useState(1)
  const [gameKey, setGameKey] = useState(0)
  const [highScore, setHighScore] = useState(() => getHighScore())
  const startScoreRef = useRef(0)

  const handleStart = useCallback(() => setScene('playing'), [])

  const handleLevelClear = useCallback((score) => {
    startScoreRef.current = score
    setLevelIndex((prev) => prev + 1)
    setSeed((prev) => prev + 17)
    setGameKey((prev) => prev + 1)
  }, [])

  const handleGameOver = useCallback((score) => {
    saveHighScore(score)
    setHighScore(getHighScore())
    startScoreRef.current = 0
    setLevelIndex(0)
    setSeed(1)
    setGameKey((prev) => prev + 1)
    setScene('title')
  }, [])

  if (scene === 'title') {
    return <TitleScene onStart={handleStart} highScore={highScore} />
  }

  return (
    <GameScene
      key={gameKey}
      seed={seed}
      levelIndex={levelIndex}
      initialScore={startScoreRef.current}
      onLevelClear={handleLevelClear}
      onGameOver={handleGameOver}
    />
  )
}
