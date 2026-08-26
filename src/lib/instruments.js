// Ruler and calliper math — the triple-tap easter egg.
//
// Instruments render in a sibling <svg>, not the paper (CLAUDE.md): a ruler
// that ends up in someone's Figma file is a bug.

import { GRID_SIZE, SNAP_DISTANCE } from './constants.js'
import { angleOf, dist, projectToLine } from './geometry.js'

export const RULER = 'ruler'
export const CALLIPER = 'calliper'

/** A ruler laid across the middle of the page, at rest. */
export function defaultRuler(width, height) {
  const len = Math.min(width * 0.8, 520)
  const cx = width / 2
  const cy = height / 2
  return {
    kind: RULER,
    a: { x: cx - len / 2, y: cy },
    b: { x: cx + len / 2, y: cy },
  }
}

export function defaultCalliper(width, height) {
  const cx = width / 2
  const cy = height / 2
  return {
    kind: CALLIPER,
    a: { x: cx - 80, y: cy },
    b: { x: cx + 80, y: cy },
  }
}

/** Ruler snapping happens at the coordinate source — see Canvas.at(). */
export function snapToInstrument(point, instrument, snapDistance = SNAP_DISTANCE) {
  if (!instrument || instrument.kind !== RULER) return point
  return projectToLine(point, instrument.a, instrument.b, snapDistance)
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
