import { useRef } from 'react'
import { createAudioEngine } from '../audio/AudioEngine.js'

/**
 * Returns a stable `play(soundName)` function.
 * AudioContext is created lazily on first call so it's always triggered
 * by a user gesture, satisfying browser autoplay policy.
 */
export function useAudio() {
  const engineRef = useRef(null)
  const playRef = useRef((name) => {
    try {
      if (!engineRef.current) {
        engineRef.current = createAudioEngine(new AudioContext())
      }
      engineRef.current[name]?.()
    } catch (_) {
      // AudioContext unavailable (test environment, blocked by browser, etc.)
    }
  })
  return playRef.current  // identity-stable — safe to use in useCallback deps
}
