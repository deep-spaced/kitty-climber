import { useRef } from 'react'
import { createAudioEngine } from '../audio/AudioEngine.js'

/**
 * Returns a stable `play(soundName)` function and a stable `music` object.
 * AudioContext is created lazily on first call so it's always triggered
 * by a user gesture, satisfying browser autoplay policy.
 *
 * music.start()  — begin background music
 * music.stop()   — stop and fade out
 * music.pause()  — pause with fade
 * music.resume() — resume from pause
 */
export function useAudio() {
  const engineRef = useRef(null)

  function getEngine() {
    if (!engineRef.current) {
      engineRef.current = createAudioEngine(new AudioContext())
    }
    return engineRef.current
  }

  const playRef = useRef((name) => {
    try { getEngine()[name]?.() } catch (_) {}
  })

  // Stable music control object — methods delegate to the engine lazily
  const musicRef = useRef({
    start()  { try { getEngine().startMusic()  } catch (_) {} },
    stop()   { try { getEngine().stopMusic()   } catch (_) {} },
    pause()  { try { getEngine().pauseMusic()  } catch (_) {} },
    resume() { try { getEngine().resumeMusic() } catch (_) {} },
  })

  return { play: playRef.current, music: musicRef.current }
}
