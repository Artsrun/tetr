import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CUE_NAMES, __reset, isMuted, play, setMuted, startStroke, subscribe, toggleMute, unlock,
} from '../sound.js'

function fakeContext() {
  const started = []
  const sources = []
  const gains = []
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
    createGain: () => {
      const node = {
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        connect: (n) => n,
      }
      gains.push(node)
      return node
    },
    createBiquadFilter: () => ({
      type: 'bandpass',
      frequency: { value: 0, setTargetAtTime: vi.fn() },
      Q: { value: 0 },
      connect: (n) => n,
    }),
    createBuffer: (ch, frames) => ({ getChannelData: () => new Float32Array(frames) }),
    createBufferSource: () => {
      const node = {
        buffer: null,
        loop: false,
        playbackRate: { value: 1 },
        connect: (n) => n,
        start: (t) => started.push(t),
        stop: vi.fn(),
      }
      sources.push(node)
      return node
    },
  }
  ctx.started = started
  ctx.sources = sources
  ctx.gains = gains
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

describe('the drawing voice', () => {
  it('runs for the length of the stroke, not as a one-shot', () => {
    const voice = startStroke({ pencil: true })
    expect(voice.silent).toBe(false)
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].loop).toBe(true)
  })

  it('is generated noise — no decoded file anywhere in it', () => {
    startStroke({ pencil: true })
    expect(ctx.sources[0].buffer).toBeTruthy()
    expect(ctx.started).toHaveLength(1)
  })

  it('gives the pencil and the pen different voices', () => {
    const pencilFilter = []
    const original = ctx.createBiquadFilter
    ctx.createBiquadFilter = () => {
      const f = original()
      pencilFilter.push(f)
      return f
    }
    startStroke({ pencil: true })
    startStroke({ pencil: false })
    expect(pencilFilter[0].frequency.value).not.toBe(pencilFilter[1].frequency.value)
  })

  it('rides the hand — a faster stroke is louder than a slow one', () => {
    const voice = startStroke({ pencil: true })
    const amp = ctx.gains[ctx.gains.length - 1]
    voice.move(0.1)
    voice.move(4)
    const [slow] = amp.gain.setTargetAtTime.mock.calls[0]
    const [fast] = amp.gain.setTargetAtTime.mock.calls[1]
    expect(fast).toBeGreaterThan(slow)
  })

  it('fades out rather than cutting, and stops the source', () => {
    const voice = startStroke({ pencil: true })
    const amp = ctx.gains[ctx.gains.length - 1]
    voice.stop()
    expect(amp.gain.setTargetAtTime).toHaveBeenCalledWith(0, expect.any(Number), expect.any(Number))
    expect(ctx.sources[0].stop).toHaveBeenCalled()
  })

  it('ignores a move after it has stopped', () => {
    const voice = startStroke({ pencil: true })
    const amp = ctx.gains[ctx.gains.length - 1]
    voice.stop()
    amp.gain.setTargetAtTime.mockClear()
    voice.move(2)
    expect(amp.gain.setTargetAtTime).not.toHaveBeenCalled()
  })

  it('is silent when muted, and callers still need no guard', () => {
    setMuted(true)
    const voice = startStroke({ pencil: true })
    expect(voice.silent).toBe(true)
    expect(ctx.sources).toHaveLength(0)
    expect(() => {
      voice.move(3)
      voice.stop()
    }).not.toThrow()
  })

  it('returns a usable voice with no AudioContext at all', () => {
    __reset()
    delete window.AudioContext
    const voice = startStroke({ pencil: false })
    expect(voice.silent).toBe(true)
    expect(() => voice.stop()).not.toThrow()
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
