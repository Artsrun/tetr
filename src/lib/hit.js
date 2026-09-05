// Pure math. Hit-test ink so the rubber can remove strokes without writing
// a new stroke type — persistence and export stay on the existing shape.

import { dist, distToSegment } from './geometry.js'

const TOKEN = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

function arcPoints(from, rx, ry, x1, y1, steps = 10) {
  const pts = []
  const cx = (from.x + x1) / 2
  const cy = (from.y + y1) / 2
  const a0 = Math.atan2(from.y - cy, from.x - cx)
  const a1 = Math.atan2(y1 - cy, x1 - cx)
  let delta = a1 - a0
  if (delta <= 0) delta += Math.PI * 2
  const arx = Math.abs(rx) || Math.hypot(x1 - from.x, y1 - from.y) / 2
  const ary = Math.abs(ry) || arx
  for (let i = 1; i <= steps; i++) {
    const a = a0 + (delta * i) / steps
    pts.push({ x: cx + Math.cos(a) * arx, y: cy + Math.sin(a) * ary })
  }
  return pts
}

/** Flatten a path `d` into a polyline. Covers the commands this app writes. */
export function flattenPath(d) {
  if (!d) return []
  const out = []
  let cmd = 'M'
  let cur = { x: 0, y: 0 }
  let start = { x: 0, y: 0 }
  const nums = []
  const flushCmd = () => {
    if (!cmd) return
    const n = nums.slice()
    nums.length = 0
    const take = () => n.shift()
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    if (C === 'Z') {
      out.push({ ...start })
      cur = { ...start }
      return
    }
    while (n.length) {
      if (C === 'M' || C === 'L') {
        const x = take()
        const y = take()
        if (x == null || y == null) return
        cur = rel ? { x: cur.x + x, y: cur.y + y } : { x, y }
        out.push({ ...cur })
        if (C === 'M') start = { ...cur }
        cmd = C === 'M' ? (rel ? 'l' : 'L') : cmd
      } else if (C === 'H') {
        const x = take()
        if (x == null) return
        cur = { x: rel ? cur.x + x : x, y: cur.y }
        out.push({ ...cur })
      } else if (C === 'V') {
        const y = take()
        if (y == null) return
        cur = { x: cur.x, y: rel ? cur.y + y : y }
        out.push({ ...cur })
      } else if (C === 'C') {
        const x1 = take(), y1 = take(), x2 = take(), y2 = take(), x = take(), y = take()
        if (y == null) return
        const p1 = rel ? { x: cur.x + x1, y: cur.y + y1 } : { x: x1, y: y1 }
        const p2 = rel ? { x: cur.x + x2, y: cur.y + y2 } : { x: x2, y: y2 }
        const p3 = rel ? { x: cur.x + x, y: cur.y + y } : { x, y }
        for (let i = 1; i <= 6; i++) out.push(cubic(cur, p1, p2, p3, i / 6))
        cur = p3
      } else if (C === 'A') {
        const rx = take(), ry = take()
        take(); take(); take()
        const x = take(), y = take()
        if (y == null) return
        const dest = rel ? { x: cur.x + x, y: cur.y + y } : { x, y }
        out.push(...arcPoints(cur, rx, ry, dest.x, dest.y))
        cur = dest
      } else {
        n.length = 0
      }
    }
  }

  d.replace(TOKEN, (_, c, num) => {
    if (c) {
      flushCmd()
      cmd = c
    } else {
      nums.push(Number(num))
    }
    return ''
  })
  flushCmd()
  return out
}

export function strokeHits(stroke, point, extra = 0) {
  const radius = (stroke.width || 2) / 2 + extra
  const pts = (stroke.points && stroke.points.length >= 1)
    ? stroke.points
    : flattenPath(stroke.d)
  if (!pts.length) return false
  if (pts.length === 1) return dist(point, pts[0]) <= radius
  for (let i = 1; i < pts.length; i++) {
    if (distToSegment(point, pts[i - 1], pts[i]) <= radius) return true
  }
  return false
}

export function idsHitAt(strokes, point, extra = 14) {
  const ids = []
  for (const s of strokes) {
    if (strokeHits(s, point, extra)) ids.push(s.id)
  }
  return ids
}
