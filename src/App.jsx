import { useState, useRef, useCallback } from 'react'
import TitleScene from './scenes/TitleScene.jsx'
import MapView from './scenes/MapView.jsx'
import GameScene from './scenes/GameScene.jsx'
import EndScreen from './scenes/EndScreen.jsx'
import { getHighScore, saveHighScore } from './engine/storage.js'
import { LEVEL_COUNT } from './constants.js'

const randomSeed = () => Math.floor(Math.random() * 0xFFFFFF) + 1

export default function App() {
  const [scene, setScene]               = useState('title')
  const [levelsCleared, setLevelsCleared] = useState(0)
  const [gameKey, setGameKey]           = useState(0)
  const [highScore, setHighScore]       = useState(() => getHighScore())
  const [finalScore, setFinalScore]     = useState(0)
  const [baseSeed, setBaseSeed]         = useState(randomSeed)
  const startScoreRef = useRef(0)

  const handleStart = useCallback(() => {
    setBaseSeed(randomSeed())
    setScene('map')
  }, [])

  const handleMapEnter = useCallback(() => {
    setGameKey((k) => k + 1)
    setScene('playing')
  }, [])

  const handleLevelClear = useCallback((score) => {
    const newCleared = levelsCleared + 1
    if (newCleared >= LEVEL_COUNT) {
      saveHighScore(score)
      setHighScore(getHighScore())
      setFinalScore(score)
      startScoreRef.current = 0
      setLevelsCleared(newCleared)
      setScene('end')
    } else {
      startScoreRef.current = score
      setLevelsCleared(newCleared)
      setScene('map')
    }
  }, [levelsCleared])

  const handleGameOver = useCallback((score) => {
    saveHighScore(score)
    setHighScore(getHighScore())
    startScoreRef.current = 0
    setBaseSeed(randomSeed())
    setGameKey((k) => k + 1)
    setScene('map')
  }, [])

  const handleReplay = useCallback(() => {
    setLevelsCleared(0)
    startScoreRef.current = 0
    setBaseSeed(randomSeed())
    setGameKey((k) => k + 1)
    setScene('map')
  }, [])

  if (scene === 'title') {
    return <TitleScene onStart={handleStart} highScore={highScore} />
  }

  if (scene === 'map') {
    return <MapView levelsCleared={levelsCleared} onEnter={handleMapEnter} />
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

  // scene === 'playing': level index and seed are derived from levelsCleared
  const levelIndex = levelsCleared
  const seed       = baseSeed + levelIndex * 17

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
