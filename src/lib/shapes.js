// Pure math. No DOM, no React — same contract as geometry.js.
//
// Shapes are ink, not objects: they commit as a normal stroke `d`, so undo,
// export, print and persistence do not know they exist. The only special
// behaviour is how the path is born — drag a box, lock to the notebook grid,
// and snap to the proportion a set-square would have given you.

import { GRID_SIZE } from './constants.js'
import { dist, pathLength, round, snapAngle } from './geometry.js'

export const SHAPE_FREE = 'free'
export const SHAPE_LINE = 'line'
export const SHAPE_RECT = 'rect'
export const SHAPE_ELLIPSE = 'ellipse'
export const SHAPE_TRIANGLE = 'triangle'

export const SHAPES = [
  { id: SHAPE_FREE, label: 'Ազատ' },
  { id: SHAPE_LINE, label: 'Գիծ' },
  { id: SHAPE_RECT, label: 'Ուղղանկյուն' },
  { id: SHAPE_ELLIPSE, label: 'Շրջան' },
  { id: SHAPE_TRIANGLE, label: 'Եռանկյուն' },
]

export const isShape = (id) => id && id !== SHAPE_FREE

/** Lock a near-square / near-circle when the sides are within this ratio. */
export const PROPORTION_LOCK = 0.14

export function snapToGrid(point, size = GRID_SIZE) {
  return {
    x: Math.round(point.x / size) * size,
    y: Math.round(point.y / size) * size,
  }
}

function box(a, b) {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const w = Math.abs(b.x - a.x)
  const h = Math.abs(b.y - a.y)
  return { x, y, w, h, x2: x + w, y2: y + h }
}

function lockSquare(start, end, tolerance = PROPORTION_LOCK) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  const long = Math.max(adx, ady)
  const short = Math.min(adx, ady)
  if (long === 0) return { end, locked: false }
  if ((long - short) / long > tolerance) {
    return { end, locked: false }
  }
  const side = long
  return {
    end: {
      x: start.x + Math.sign(dx || 1) * side,
      y: start.y + Math.sign(dy || 1) * side,
    },
    locked: true,
  }
}

function ellipsePath(cx, cy, rx, ry) {
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  if (rx < 0.5 && ry < 0.5) return ''
  const x0 = round(cx - rx)
  const x1 = round(cx + rx)
  const y = round(cy)
  const arx = round(Math.max(rx, 0.5))
  const ary = round(Math.max(ry, 0.5))
  return `M ${x0} ${y} A ${arx} ${ary} 0 1 0 ${x1} ${y} A ${arx} ${ary} 0 1 0 ${x0} ${y}`
}

function rectPath(x, y, w, h) {
  if (w < 0.5 && h < 0.5) return ''
  return `M ${round(x)} ${round(y)} H ${round(x + w)} V ${round(y + h)} H ${round(x)} Z`
}

function trianglePath(start, end) {
  const midX = (start.x + end.x) / 2
  const baseLeft = { x: start.x, y: end.y }
  const baseRight = { x: end.x, y: end.y }
  const apex = { x: midX, y: start.y }
  const base = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)
  const eqH = base * Math.sqrt(3) / 2
  let locked = false
  if (base > 0 && Math.abs(height - eqH) / Math.max(base, height, 1) <= PROPORTION_LOCK) {
    const dir = Math.sign(start.y - end.y) || -1
    apex.y = end.y + dir * eqH
    locked = true
  }
  const d = (
    `M ${round(apex.x)} ${round(apex.y)} ` +
    `L ${round(baseLeft.x)} ${round(baseLeft.y)} ` +
    `L ${round(baseRight.x)} ${round(baseRight.y)} Z`
  )
  const points = [apex, baseLeft, baseRight, apex]
  return { d, points, locked }
}

/**
 * Build a shape from a drag. Start/end are grid-snapped so the figure sits
 * on the notebook like it was drawn against a set-square. Near-square and
 * near-circle drags lock; a line near 15° locks to the detent.
 */
export function shapeFromDrag(kind, rawStart, rawEnd, { grid = GRID_SIZE } = {}) {
  const start = snapToGrid(rawStart, grid)
  let end = snapToGrid(rawEnd, grid)
  let locked = null

  if (kind === SHAPE_LINE) {
    const angled = snapAngle(start, end)
    if (angled !== end) {
      end = snapToGrid(angled, grid)
      locked = 'angle'
    }
    const d = `M ${round(start.x)} ${round(start.y)} L ${round(end.x)} ${round(end.y)}`
    const points = [start, end]
    return { d, points, length: dist(start, end), locked }
  }

  if (kind === SHAPE_RECT) {
    const sq = lockSquare(start, end)
    if (sq.locked) {
      end = snapToGrid(sq.end, grid)
      locked = 'square'
    }
    const { x, y, w, h } = box(start, end)
    const d = rectPath(x, y, w, h)
    const points = [
      { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
    ]
    return { d, points, length: pathLength([...points, points[0]]), locked }
  }

  if (kind === SHAPE_ELLIPSE) {
    const sq = lockSquare(start, end)
    if (sq.locked) {
      end = snapToGrid(sq.end, grid)
      locked = 'circle'
    }
    const { x, y, w, h } = box(start, end)
    const rx = w / 2
    const ry = h / 2
    const cx = x + rx
    const cy = y + ry
    const d = ellipsePath(cx, cy, rx, ry)
    const length = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)
    return {
      d,
      points: [
        { x: cx - rx, y: cy },
        { x: cx, y: cy - ry },
        { x: cx + rx, y: cy },
        { x: cx, y: cy + ry },
      ],
      length,
      locked,
    }
  }

  if (kind === SHAPE_TRIANGLE) {
    const built = trianglePath(start, end)
    return {
      d: built.d,
      points: built.points,
      length: pathLength(built.points),
      locked: built.locked ? 'equilateral' : null,
    }
  }

  return { d: '', points: [], length: 0, locked: null }
}
