// Every cue is synthesized from oscillators and generated noise. There is no
// audio file in this repo and there must never be one (CLAUDE.md): nothing
// licensed, zero bytes shipped, and it works offline by construction.
//
// Mute is engine state, not a prop — every control calls play() directly and
// one guard here beats threading a flag through six components.

let ctx = null
let muted = false
let unlocked = false

const listeners = new Set()

function context() {
  if (ctx) return ctx
  const Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!Ctor) return null
  try {
    ctx = new Ctor()
  } catch {
    ctx = null
  }
  return ctx
}

export function unlock() {
  if (unlocked) return
  const ac = context()
  if (!ac) return
  unlocked = true
  if (ac.state === 'suspended') ac.resume().catch(() => {})
  try {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    gain.gain.value = 0
    osc.connect(gain).connect(ac.destination)
    osc.start()
    osc.stop(ac.currentTime + 0.01)
  } catch {}
}

export const isMuted = () => muted

export function setMuted(next) {
  muted = !!next
  listeners.forEach((fn) => fn(muted))
}

export function toggleMute() {
  setMuted(!muted)
  return muted
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function tone(ac, { freq, type = 'sine', at = 0, dur = 0.12, gain = 0.05, sweep }) {
  const t0 = ac.currentTime + at
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweep), t0 + dur)

  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  osc.connect(amp).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(ac, { at = 0, dur = 0.08, gain = 0.04, freq = 1800, q = 0.7 }) {
  const t0 = ac.currentTime + at
  const frames = Math.max(1, Math.floor(ac.sampleRate * dur))
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1

  const src = ac.createBufferSource()
  src.buffer = buffer

  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = q

  const amp = ac.createGain()
  amp.gain.setValueAtTime(gain, t0)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  src.connect(filter).connect(amp).connect(ac.destination)
  src.start(t0)
  src.stop(t0 + dur)
}

// Nine cues. Each is a shape, not a sample.
const CUES = {
  tap: (ac) => tone(ac, { freq: 660, type: 'triangle', dur: 0.05, gain: 0.035 }),
  snap: (ac) => tone(ac, { freq: 880, type: 'triangle', dur: 0.045, gain: 0.03 }),
  stroke: (ac) => noise(ac, { dur: 0.06, gain: 0.022, freq: 2400, q: 0.5 }),
  undo: (ac) => tone(ac, { freq: 520, type: 'sine', dur: 0.14, gain: 0.045, sweep: 330 }),
  redo: (ac) => tone(ac, { freq: 330, type: 'sine', dur: 0.14, gain: 0.045, sweep: 520 }),
  arm: (ac) => tone(ac, { freq: 300, type: 'square', dur: 0.07, gain: 0.028 }),
  clear: (ac) => {
    noise(ac, { dur: 0.22, gain: 0.05, freq: 900, q: 0.3 })
    tone(ac, { freq: 180, type: 'sine', dur: 0.22, gain: 0.04, sweep: 90 })
  },
  flip: (ac) => {
    noise(ac, { dur: 0.09, gain: 0.03, freq: 1400, q: 0.6 })
    tone(ac, { freq: 420, type: 'triangle', dur: 0.08, gain: 0.03, sweep: 280 })
  },
  celebrate: (ac) => {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) =>
      tone(ac, { freq, type: 'triangle', at: i * 0.1, dur: 0.18, gain: 0.04 }),
    )
  },
}

export const CUE_NAMES = Object.keys(CUES)

export function play(name) {
  if (muted) return false
  const cue = CUES[name]
  if (!cue) return false
  const ac = context()
  if (!ac) return false
  if (ac.state === 'suspended') ac.resume().catch(() => {})
  try {
    cue(ac)
    return true
  } catch {
    return false
  }
}

export function __reset() {
  ctx = null
  muted = false
  unlocked = false
  listeners.clear()
}
