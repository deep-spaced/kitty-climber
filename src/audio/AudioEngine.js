/**
 * All sounds are synthesized with Web Audio API — no audio files needed.
 * Each play* helper is standalone; createAudioEngine composes them with
 * a shared AudioContext so callers don't manage the context directly.
 *
 * Music system:
 *   startMusic() / stopMusic() / pauseMusic() / resumeMusic()
 *   Lazy chiptune: square-wave melody over a bass pulse + triangle click.
 *   Uses a look-ahead scheduler (ctx.currentTime) for drift-free looping.
 */

import {
  MUSIC_VOLUME,
  MUSIC_TEMPO_BPM,
  MUSIC_MELODY_GAIN,
  MUSIC_BASS_GAIN,
  MUSIC_PERC_GAIN,
} from '../constants.js'

// ---------------------------------------------------------------------------
// Music sequencer data
// ---------------------------------------------------------------------------

// C minor pentatonic: C3 Eb3 F3 G3 Bb3 C4 Eb4 F4 G4 Bb4
const MELODY_NOTES = [
  130.81, 155.56, 174.61, 196.00, 233.08,
  261.63, 311.13, 349.23, 392.00, 466.16,
]

// Melody sequence (indices into MELODY_NOTES, null = rest)
// 16 steps at a quarter-note each, slow wandering feel
const MELODY_SEQ = [0, null, 2, 1, null, 3, 2, null, 4, 3, null, 5, null, 4, 6, null]

// Bass root + fifth alternating (C2 / G2)
const BASS_ROOT  = 65.41
const BASS_FIFTH = 98.00
const BASS_SEQ   = [
  BASS_ROOT, null, BASS_FIFTH, null,
  BASS_ROOT, null, BASS_FIFTH, null,
  BASS_ROOT, null, BASS_FIFTH, null,
  BASS_ROOT, null, BASS_FIFTH, null,
]

// Percussion: 1 = kick-click on beat 1 & 3 of a 4-beat bar (every 4 steps)
const PERC_SEQ = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]

// ---------------------------------------------------------------------------
// Low-level note schedulers (pure functions, no React)
// ---------------------------------------------------------------------------

function scheduleNote(ctx, masterGain, freq, relGain, startTime, duration) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.setValueAtTime(freq, startTime)
  g.gain.setValueAtTime(relGain, startTime)
  g.gain.linearRampToValueAtTime(0.0001, startTime + duration)
  o.connect(g)
  g.connect(masterGain)
  o.start(startTime)
  o.stop(startTime + duration)
}

function schedulePerc(ctx, masterGain, startTime) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(180, startTime)
  o.frequency.linearRampToValueAtTime(60, startTime + 0.04)
  g.gain.setValueAtTime(1.0, startTime)
  g.gain.linearRampToValueAtTime(0.0001, startTime + 0.06)
  o.connect(g)
  g.connect(masterGain)
  o.start(startTime)
  o.stop(startTime + 0.07)
}

// ---------------------------------------------------------------------------
// Music sequencer factory — returns { start, stop, pause, resume }
// ---------------------------------------------------------------------------

function createMusicSequencer(ctx) {
  const SEQ_LEN     = MELODY_SEQ.length   // 16 steps
  const BEAT_SEC    = 60 / MUSIC_TEMPO_BPM  // seconds per beat
  // Each step = one quarter note
  const STEP_SEC    = BEAT_SEC
  const NOTE_DUR    = STEP_SEC * 0.72     // note length (legato-ish)

  // Master gain for all music — allows fade without touching SFX
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(MUSIC_VOLUME, ctx.currentTime)
  masterGain.connect(ctx.destination)

  let schedulerTimer = null   // setTimeout handle
  let stepIndex      = 0
  let nextStepTime   = 0      // ctx.currentTime of next step to schedule
  let running        = false
  let pausedAt       = 0      // ctx.currentTime when paused (for offset calc)
  let pauseOffset    = 0      // accumulated paused duration

  const LOOKAHEAD_SEC  = 0.10  // schedule this far ahead
  const SCHEDULE_INTERVAL_MS = 50  // how often the scheduler fires

  function scheduleStep(step, atTime) {
    // Melody
    const melIdx = MELODY_SEQ[step]
    if (melIdx !== null) {
      scheduleNote(ctx, masterGain, MELODY_NOTES[melIdx], MUSIC_MELODY_GAIN, atTime, NOTE_DUR)
    }

    // Bass
    const bassFreq = BASS_SEQ[step]
    if (bassFreq !== null) {
      scheduleNote(ctx, masterGain, bassFreq, MUSIC_BASS_GAIN, atTime, NOTE_DUR * 1.4)
    }

    // Percussion
    if (PERC_SEQ[step]) {
      schedulePerc(ctx, masterGain, atTime)
    }
  }

  function tick() {
    // Schedule all steps that fall within the look-ahead window
    while (nextStepTime < ctx.currentTime + LOOKAHEAD_SEC) {
      scheduleStep(stepIndex % SEQ_LEN, nextStepTime)
      stepIndex  = (stepIndex + 1) % SEQ_LEN
      nextStepTime += STEP_SEC
    }
    schedulerTimer = setTimeout(tick, SCHEDULE_INTERVAL_MS)
  }

  return {
    start() {
      if (running) return
      running      = true
      stepIndex    = 0
      nextStepTime = ctx.currentTime + 0.05
      masterGain.gain.setValueAtTime(MUSIC_VOLUME, ctx.currentTime)
      tick()
    },

    stop() {
      if (!running) return
      running = false
      clearTimeout(schedulerTimer)
      schedulerTimer = null
      masterGain.gain.cancelScheduledValues(ctx.currentTime)
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime)
      masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
    },

    pause() {
      if (!running) return
      running  = false
      pausedAt = ctx.currentTime
      clearTimeout(schedulerTimer)
      schedulerTimer = null
      masterGain.gain.cancelScheduledValues(ctx.currentTime)
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime)
      masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15)
    },

    resume() {
      if (running) return
      running      = true
      pauseOffset  = ctx.currentTime - pausedAt
      nextStepTime = Math.max(nextStepTime + pauseOffset, ctx.currentTime + 0.05)
      masterGain.gain.cancelScheduledValues(ctx.currentTime)
      masterGain.gain.linearRampToValueAtTime(MUSIC_VOLUME, ctx.currentTime + 0.15)
      tick()
    },

    isRunning() { return running },
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
  // Whether the game wants music playing (set by startMusic/stopMusic)
  let musicWanted = false

  // Music sequencer — created once, lazily
  let musicSeq = null
  function getMusicSeq() {
    if (!musicSeq) musicSeq = createMusicSequencer(ctx)
    return musicSeq
  }

  function play(fn) {
    if (ctx.state === 'suspended') ctx.resume()
    // Start music on the first SFX play — guaranteed user-gesture context
    if (musicWanted && !getMusicSeq().isRunning()) {
      getMusicSeq().start()
    }
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
    startMusic() {
      musicWanted = true
      // Start immediately if context is already running (e.g. after a prior SFX)
      try { if (ctx.state === 'running') getMusicSeq().start() } catch (_) {}
    },
    stopMusic() {
      musicWanted = false
      try { getMusicSeq().stop() } catch (_) {}
    },
    pauseMusic()  { try { getMusicSeq().pause()  } catch (_) {} },
    resumeMusic() {
      musicWanted = true
      try { getMusicSeq().resume() } catch (_) {}
    },
  }
}
