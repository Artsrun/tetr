import { describe, expect, it } from 'vitest'
import { createTapTracker } from '../gestures.js'

const P = (x, y) => ({ x, y })

describe('triple-tap tracker', () => {
  it('fires on the third tap', () => {
    const t = createTapTracker()
    expect(t.push(P(10, 10), 0)).toBe(false)
    expect(t.push(P(10, 10), 100)).toBe(false)
    expect(t.push(P(10, 10), 200)).toBe(true)
  })

  it('does not fire on two taps — three dots is a legitimate thing to draw', () => {
    const t = createTapTracker()
    t.push(P(10, 10), 0)
    expect(t.push(P(10, 10), 100)).toBe(false)
  })

  it('rejects taps spread beyond 600ms', () => {
    const t = createTapTracker()
    t.push(P(10, 10), 0)
    t.push(P(10, 10), 300)
    expect(t.push(P(10, 10), 900)).toBe(false)
  })

  it('rejects taps spread beyond 30px', () => {
    const t = createTapTracker()
    t.push(P(10, 10), 0)
    t.push(P(10, 10), 100)
    expect(t.push(P(200, 200), 200)).toBe(false)
  })

  it('accepts a little wobble inside the radius', () => {
    const t = createTapTracker()
    t.push(P(100, 100), 0)
    t.push(P(112, 96), 90)
    expect(t.push(P(96, 108), 180)).toBe(true)
  })

  it('starts a fresh cluster after a distant tap', () => {
    const t = createTapTracker()
    t.push(P(10, 10), 0)
    t.push(P(300, 300), 50) // resets, then counts as the first of a new cluster
    t.push(P(300, 300), 100)
    expect(t.push(P(300, 300), 150)).toBe(true)
  })

  it('resets after firing, so six taps fire twice not four times', () => {
    const t = createTapTracker()
    let fires = 0
    for (let i = 0; i < 6; i++) if (t.push(P(10, 10), i * 50)) fires++
    expect(fires).toBe(2)
  })

  it('can be reset by hand', () => {
    const t = createTapTracker()
    t.push(P(10, 10), 0)
    t.push(P(10, 10), 50)
    t.reset()
    expect(t.size).toBe(0)
    expect(t.push(P(10, 10), 100)).toBe(false)
  })

  it('honours a custom window and radius', () => {
    const t = createTapTracker({ window: 100, radius: 5 })
    t.push(P(0, 0), 0)
    expect(t.push(P(0, 0), 200)).toBe(false)
  })
})
