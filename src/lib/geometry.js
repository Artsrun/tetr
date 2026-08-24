// Pure math. No DOM, no React — everything here is tested directly.
import { ANGLE_DETENT, ANGLE_TOLERANCE, SNAP_DISTANCE } from './constants.js'

export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)

export const round = (n, places = 2) => {
  const f = 10 ** places
  return Math.round(n * f) / f
}

/**
 * Catmull-Rom → cubic Bézier. Interpolating, not approximating: the curve
 * passes through every recorded point (CLAUDE.md — quadratic midpoint
 * smoothing drifts inside sharp corners and feels like the app fighting you).
 */
export function toPath(points) {
  if (!points || points.length === 0) return ''
  const p = dedupe(points)

  // A single sample is a dot. Zero-length path with a round cap renders as one.
  if (p.length === 1) return `M ${round(p[0].x)} ${round(p[0].y)} l 0 0`
  if (p.length === 2) {
    return `M ${round(p[0].x)} ${round(p[0].y)} L ${round(p[1].x)} ${round(p[1].y)}`
  }

  let d = `M ${round(p[0].x)} ${round(p[0].y)}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] || p2

    // Standard Catmull-Rom (tension 0.5) control points.
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`
  }
  return d
}

/** Consecutive identical samples produce NaN control points. Drop them. */
export function dedupe(points) {
  const out = []
  for (const pt of points) {
    const last = out[out.length - 1]
    if (!last || last.x !== pt.x || last.y !== pt.y) out.push(pt)
  }
  return out
}

/** Total drawn length in px — the stats panel reports metres of ink. */
export function pathLength(points) {
  let total = 0
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i])
  return total
}

export function bounds(strokes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const s of strokes) {
    for (const pt of s.points || []) {
      if (pt.x < minX) minX = pt.x
      if (pt.y < minY) minY = pt.y
      if (pt.x > maxX) maxX = pt.x
      if (pt.y > maxY) maxY = pt.y
    }
  }
  if (minX === Infinity) return null
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * Project a point onto the ruler's *infinite* line, not the segment
 * (CLAUDE.md — a ruler you can only draw along the middle of is worse than a
 * real one). Returns the original point when it is further than SNAP_DISTANCE.
 */
export function projectToLine(point, a, b, snapDistance = SNAP_DISTANCE) {
  const vx = b.x - a.x
  const vy = b.y - a.y
  const len2 = vx * vx + vy * vy
  if (len2 === 0) return point

  const t = ((point.x - a.x) * vx + (point.y - a.y) * vy) / len2
  // Rounded: the projection is float-noisy (199.99999999999997), and a snapped
  // point is meant to be exact — it feeds drawing, gestures and the export.
  const proj = { x: round(a.x + t * vx, 4), y: round(a.y + t * vy, 4) }
  return dist(point, proj) <= snapDistance ? proj : point
}

/**
 * Snap a heading to the nearest 15° detent, but only within 4° of it
 * (CLAUDE.md — constant snapping makes freehand impossible).
 */
export function snapAngle(from, to, detent = ANGLE_DETENT, tolerance = ANGLE_TOLERANCE) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  if (len === 0) return to

  const deg = (Math.atan2(dy, dx) * 180) / Math.PI
  const nearest = Math.round(deg / detent) * detent
  let delta = Math.abs(deg - nearest)
  if (delta > 180) delta = 360 - delta
  if (delta > tolerance) return to

  const rad = (nearest * Math.PI) / 180
  return { x: from.x + Math.cos(rad) * len, y: from.y + Math.sin(rad) * len }
}

/** Angle of a→b in degrees, normalised to [0, 360). Used by the calliper. */
export function angleOf(a, b) {
  const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
  return (deg + 360) % 360
}

/** Centroid of a tap cluster — triple-tap needs all three inside one radius. */
export function centroid(points) {
  if (!points.length) return null
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / points.length, y: sum.y / points.length }
}
