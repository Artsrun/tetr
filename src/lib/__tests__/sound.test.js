import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CUE_NAMES, __reset, isMuted, play, setMuted, subscribe, toggleMute, unlock } from '../sound.js'

function fakeContext() {
  const started = []
  const ctx = {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: () => ({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (n) => n,
      start: (t) => started.push(t),
      stop: vi.fn(),
    }),
    createGain: () => ({
      gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (n) => n,
    }),
    createBiquadFilter: () => ({
      type: 'bandpass', frequency: { value: 0 }, Q: { value: 0 }, connect: (n) => n,
    }),
    createBuffer: (ch, frames) => ({ getChannelData: () => new Float32Array(frames) }),
    createBufferSource: () => ({
      buffer: null, connect: (n) => n, start: (t) => started.push(t), stop: vi.fn(),
    }),
  }
  ctx.started = started
  return ctx
}

let ctx
beforeEach(() => {
  __reset()
  ctx = fakeContext()
  window.AudioContext = vi.fn(() => ctx)
})
afterEach(() => {
  delete window.AudioContext
  __reset()
})

describe('cues', () => {
  it('ships nine of them', () => {
    expect(CUE_NAMES).toHaveLength(9)
  })

  it('plays every cue without a network request or an audio file', () => {
    for (const name of CUE_NAMES) expect(play(name)).toBe(true)
  })

  it('builds sound from nodes, not from a decoded buffer of a file', () => {
    play('tap')
    expect(ctx.started.length).toBeGreaterThan(0)
  })

  it('ignores an unknown cue instead of throwing', () => {
    expect(play('nope')).toBe(false)
  })

  it('schedules the celebrate chime as four timed pips', () => {
    play('celebrate')
    expect(ctx.started).toHaveLength(4)
    expect(Math.max(...ctx.started)).toBeCloseTo(0.3, 5)
  })
})

describe('mute', () => {
  it('starts unmuted', () => expect(isMuted()).toBe(false))

  it('is engine state — one guard, not a prop threaded through components', () => {
    setMuted(true)
    expect(play('tap')).toBe(false)
    expect(ctx.started).toHaveLength(0)
  })

  it('toggles and reports the new value', () => {
    expect(toggleMute()).toBe(true)
    expect(toggleMute()).toBe(false)
  })

  it('notifies subscribers', () => {
    const seen = []
    subscribe((m) => seen.push(m))
    setMuted(true)
    expect(seen).toEqual([true])
  })
})
