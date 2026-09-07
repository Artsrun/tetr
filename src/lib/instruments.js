// The calliper — the triple-tap easter egg. It measures; it does not guide.
//
// There was a ruler here too, and the drawing surface snapped to its edge.
// It went: the shape tools already lay a straight line on the grid, and a
// ruler that silently bends a freehand stroke is the app fighting the finger.
// What is left is the one instrument that only reads the page back to you.
//
// Instruments render in a sibling <svg>, not the paper (CLAUDE.md): a calliper
// that ends up in someone's Figma file is a bug.

import { GRID_SIZE } from './constants.js'
import { angleOf, dist } from './geometry.js'

export const CALLIPER = 'calliper'

/** A calliper lying across the middle of the page, at rest. */
export function defaultCalliper(width, height) {
  const span = Math.min(width * 0.42, 160)
  const cx = width / 2
  const cy = height / 2
  return {
    kind: CALLIPER,
    a: { x: cx - span / 2, y: cy },
    b: { x: cx + span / 2, y: cy },
  }
}

export function measure(instrument) {
  if (!instrument) return null
  const px = dist(instrument.a, instrument.b)
  return {
    px: Math.round(px),
    cells: Math.round((px / GRID_SIZE) * 10) / 10,
    angle: Math.round(angleOf(instrument.a, instrument.b)),
  }
}

/** Drag the whole instrument by a delta; endpoints move together. */
export function translate(instrument, dx, dy) {
  return {
    ...instrument,
    a: { x: instrument.a.x + dx, y: instrument.a.y + dy },
    b: { x: instrument.b.x + dx, y: instrument.b.y + dy },
  }
}

/** Which end (if any) a pointer grabbed. Null means the body. */
export function grabHandle(point, instrument, radius = 28) {
  if (!instrument) return null
  if (dist(point, instrument.a) <= radius) return 'a'
  if (dist(point, instrument.b) <= radius) return 'b'
  return null
}
