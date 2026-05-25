import { useState, useCallback } from 'react'
import GameScene from './scenes/GameScene.jsx'

export default function App() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [seed, setSeed] = useState(1)
  const [gameKey, setGameKey] = useState(0)

  const handleLevelClear = useCallback(() => {
    setLevelIndex((prev) => prev + 1)
    setSeed((prev) => prev + 17)
    setGameKey((prev) => prev + 1)
  }, [])

  const handleGameOver = useCallback(() => {
    setLevelIndex(0)
    setSeed(1)
    setGameKey((prev) => prev + 1)
  }, [])

  return (
    <GameScene
      key={gameKey}
      seed={seed}
      levelIndex={levelIndex}
      onLevelClear={handleLevelClear}
      onGameOver={handleGameOver}
    />
  )
}
