// Triple-tap detection is deliberately strict (CLAUDE.md): three taps, 600ms,
// within 30px, none of them a drag. This shares a surface with drawing, and
// three dots in one spot is a legitimate thing to draw. A false negative costs
// one repeated gesture; a false positive interrupts someone mid-drawing.

import { TRIPLE_TAP_MS, TRIPLE_TAP_RADIUS } from './constants.js'
import { dist } from './geometry.js'

export function createTapTracker({
  window: windowMs = TRIPLE_TAP_MS,
  radius = TRIPLE_TAP_RADIUS,
  count = 3,
} = {}) {
  let taps = []

  return {
    /** @returns true exactly once, on the tap that completes the gesture. */
    push(point, time = Date.now()) {
      taps = taps.filter((t) => time - t.time <= windowMs)

      if (taps.length && taps.some((t) => dist(t.point, point) > radius)) {
        taps = []
      }

      taps.push({ point, time })

      if (taps.length >= count) {
        taps = []
        return true
      }
      return false
    },
    reset() {
      taps = []
    },
    get size() {
      return taps.length
    },
  }
}
