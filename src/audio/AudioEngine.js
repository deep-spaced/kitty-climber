/**
 * All sounds are synthesized with Web Audio API — no audio files needed.
 * Each play* helper is standalone; createAudioEngine composes them with
 * a shared AudioContext so callers don't manage the context directly.
 *
 * Background music:
 *   "Up the Ladder" by Eric Matyas — soundimage.org (royalty-free, attribution required)
 *   Played via HTMLAudioElement so it works independently of the Web Audio context.
 *   startMusic() / stopMusic() / pauseMusic() / resumeMusic()
 */

import { MUSIC_VOLUME } from '../constants.js'

// Path resolved relative to Vite's base URL at build time
const MUSIC_SRC = `${import.meta.env.BASE_URL}music/up-the-ladder.mp3`

// ---------------------------------------------------------------------------
// HTMLAudio-based music player — created once per engine instance
// ---------------------------------------------------------------------------

function createMusicPlayer() {
  let el = null
  let wanted = false

  function getEl() {
    if (!el) {
      try {
        el = new Audio(MUSIC_SRC)
        el.loop   = true
        el.volume = MUSIC_VOLUME
      } catch (_) {
        el = null
      }
    }
    return el
  }

  return {
    want()   { wanted = true },
    unwant() { wanted = false; const a = getEl(); if (a) { a.pause(); a.currentTime = 0 } },
    tryPlay() {
      if (!wanted) return
      getEl()?.play().catch(() => {})
    },
    pause()  { getEl()?.pause() },
    resume() { wanted = true; getEl()?.play().catch(() => {}) },
    isPlaying() { const a = getEl(); return a ? !a.paused : false },
  }
}

function osc(ctx, type, freq, gain, duration, freqEnd = freq) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  const t = ctx.currentTime
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (freqEnd !== freq) o.frequency.linearRampToValueAtTime(freqEnd, t + duration)
  g.gain.setValueAtTime(gain, t)
  g.gain.linearRampToValueAtTime(0.001, t + duration)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(t)
  o.stop(t + duration)
}

function chord(ctx, type, notes, gain, stepDuration, noteDuration) {
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const t = ctx.currentTime + i * stepDuration
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(gain, t)
    g.gain.linearRampToValueAtTime(0.001, t + noteDuration)
    o.connect(g)
    g.connect(ctx.destination)
    o.start(t)
    o.stop(t + noteDuration)
  })
}

export function createAudioEngine(ctx) {
  const music = createMusicPlayer()

  function play(fn) {
    if (ctx.state === 'suspended') ctx.resume()
    // Start music on first SFX — guaranteed to be inside a user gesture
    music.tryPlay()
    try { fn() } catch (_) { /* AudioContext blocked or unavailable */ }
  }

  return {
    jump()       { play(() => osc(ctx, 'sine',     200, 0.22, 0.14, 560)) },
    land()       { play(() => osc(ctx, 'triangle',  90, 0.30, 0.09,  50)) },
    hurt()       { play(() => osc(ctx, 'sawtooth', 380, 0.35, 0.28,  90)) },
    kill()       { play(() => osc(ctx, 'sine',     440, 0.28, 0.16, 880)) },

    attack() {
      play(() => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        const f = ctx.createBiquadFilter()
        const t = ctx.currentTime
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(900, t)
        f.type = 'bandpass'
        f.frequency.value = 3000
        f.Q.value = 0.9
        g.gain.setValueAtTime(0.18, t)
        g.gain.linearRampToValueAtTime(0.001, t + 0.09)
        o.connect(f)
        f.connect(g)
        g.connect(ctx.destination)
        o.start(t)
        o.stop(t + 0.09)
      })
    },

    bite() {
      play(() => {
        // Low chomping thud: pitch drops fast from 320→80 Hz, triangle wave
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        const t = ctx.currentTime
        o.type = 'triangle'
        o.frequency.setValueAtTime(320, t)
        o.frequency.exponentialRampToValueAtTime(80, t + 0.12)
        g.gain.setValueAtTime(0.28, t)
        g.gain.linearRampToValueAtTime(0.001, t + 0.14)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(t)
        o.stop(t + 0.14)
      })
    },

    // Ascending C-E-G arpeggio
    collect()    { play(() => chord(ctx, 'sine', [523, 659, 784], 0.22, 0.07, 0.12)) },

    // Ascending C-E-G-C fanfare
    levelClear() { play(() => chord(ctx, 'sine', [523, 659, 784, 1047], 0.28, 0.11, 0.24)) },

    // Descending E-A-E dirge
    gameOver()   { play(() => chord(ctx, 'triangle', [330, 220, 165], 0.28, 0.24, 0.30)) },

    // Gentle ascending C-E-G-A shimmer
    heal()       { play(() => chord(ctx, 'sine', [523, 659, 784, 880], 0.16, 0.07, 0.18)) },

    // Metallic cage clang
    cage() {
      play(() => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        const t = ctx.currentTime
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(220, t)
        o.frequency.exponentialRampToValueAtTime(70, t + 0.18)
        g.gain.setValueAtTime(0.28, t)
        g.gain.linearRampToValueAtTime(0.001, t + 0.22)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(t)
        o.stop(t + 0.22)
      })
    },

    // --- Music controls ---
    startMusic()  { music.want();   music.tryPlay() },
    stopMusic()   { music.unwant() },
    pauseMusic()  { music.pause()  },
    resumeMusic() { music.resume() },
  }
}
