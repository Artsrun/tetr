// Zoom far enough out and the notebook lies flat: two sheets, one binding.
//
// Pure geometry — which page sits on which side, and where its origin lands in
// world coordinates. Nothing here knows about React or the DOM, so the layout
// is testable without rendering a page.
//
// A sheet is one page's worth of paper. Strokes are always stored page-local,
// so the only thing a spread adds is an x offset per sheet; the active sheet's
// offset is subtracted back out before any point reaches the drawing hook.

import { GRID_SIZE } from './constants.js'

/** At or below this zoom the second sheet earns its place on a 390px phone. */
export const SPREAD_ZOOM = 0.8

/** One cell of binding between the sheets — the gutter of a real notebook. */
export const GUTTER = GRID_SIZE

export const isSpread = (scale) => (scale || 1) <= SPREAD_ZOOM

export const sheetX = (slot, width) => slot * (width + GUTTER)

/** The world a view can pan over: one sheet, or two and the gutter. */
export function worldOf(size, spread) {
  return {
    width: spread ? size.width * 2 + GUTTER : size.width,
    height: size.height,
  }
}

/**
 * Which pages are on screen. The left sheet is even-indexed, like a book
 * opened flat, so page 3 never jumps sides just because you turned to it.
 * The right slot may be a ghost — paper that does not exist yet.
 */
export function spreadPages(index, count) {
  const left = Math.max(0, index - (Math.max(0, index) % 2))
  const right = left + 1
  return [
    { index: left, slot: 0, ghost: left >= count },
    { index: right, slot: 1, ghost: right >= count },
  ]
}

/**
 * The sheets to paint, in paint order, with their world origins. Off a spread
 * this is exactly one sheet at x=0 — the single-page render path is unchanged.
 */
export function sheets({ scale, index, count, width }) {
  if (!isSpread(scale)) {
    return [{ index, slot: 0, x: 0, ghost: false, active: true }]
  }
  return spreadPages(index, count).map((s) => ({
    ...s,
    x: sheetX(s.slot, width),
    active: !s.ghost && s.index === index,
  }))
}

/** Where the active page's origin sits in world coordinates. */
export function activeOrigin(list) {
  const hit = list.find((s) => s.active)
  return hit ? hit.x : 0
}

/** Which sheet a world x landed on. Null in the gutter or off the edges. */
export function sheetAtX(list, x, width) {
  for (const s of list) {
    if (x >= s.x && x <= s.x + width) return s
  }
  return null
}
