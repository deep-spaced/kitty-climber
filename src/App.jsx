import { useState, useRef, useCallback } from 'react'
import TitleScene from './scenes/TitleScene.jsx'
import GameScene from './scenes/GameScene.jsx'
import EndScreen from './scenes/EndScreen.jsx'
import { getHighScore, saveHighScore } from './engine/storage.js'
import { LEVEL_COUNT } from './constants.js'

export default function App() {
  const [scene, setScene] = useState('title')
  const [levelIndex, setLevelIndex] = useState(0)
  const [seed, setSeed] = useState(1)
  const [gameKey, setGameKey] = useState(0)
  const [highScore, setHighScore] = useState(() => getHighScore())
  const [finalScore, setFinalScore] = useState(0)
  const startScoreRef = useRef(0)

  const handleStart = useCallback(() => setScene('playing'), [])

  const handleLevelClear = useCallback((score) => {
    if (levelIndex >= LEVEL_COUNT - 1) {
      saveHighScore(score)
      const best = getHighScore()
      setHighScore(best)
      setFinalScore(score)
      startScoreRef.current = 0
      setScene('end')
    } else {
      startScoreRef.current = score
      setLevelIndex((prev) => prev + 1)
      setSeed((prev) => prev + 17)
      setGameKey((prev) => prev + 1)
    }
  }, [levelIndex])

  const handleGameOver = useCallback((score) => {
    saveHighScore(score)
    setHighScore(getHighScore())
    startScoreRef.current = 0
    setLevelIndex(0)
    setSeed(1)
    setGameKey((prev) => prev + 1)
    setScene('title')
  }, [])

  const handleReplay = useCallback(() => {
    setLevelIndex(0)
    setSeed(1)
    setGameKey((prev) => prev + 1)
    setScene('playing')
  }, [])

  if (scene === 'title') {
    return <TitleScene onStart={handleStart} highScore={highScore} />
  }

  if (scene === 'end') {
    return (
      <EndScreen
        score={finalScore}
        highScore={highScore}
        isNewRecord={finalScore >= highScore && finalScore > 0}
        onReplay={handleReplay}
      />
    )
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
