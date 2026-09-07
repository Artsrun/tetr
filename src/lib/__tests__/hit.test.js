import { describe, expect, it } from 'vitest'
import { flattenPath, idsHitAt, strokeHits } from '../hit.js'

describe('flattenPath', () => {
  it('reads a line', () => {
    expect(flattenPath('M 0 0 L 10 0')).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ])
  })

  it('reads a notebook rect (H V Z)', () => {
    const pts = flattenPath('M 0 0 H 10 V 8 H 0 Z')
    expect(pts[0]).toEqual({ x: 0, y: 0 })
    expect(pts.some((p) => p.x === 10 && p.y === 0)).toBe(true)
    expect(pts.some((p) => p.x === 10 && p.y === 8)).toBe(true)
  })

  it('follows the sweep flag: sweep 0 dips below the chord, 1 rises above', () => {
    const below = flattenPath('M 0 0 A 50 50 0 0 0 100 0')
    const above = flattenPath('M 0 0 A 50 50 0 0 1 100 0')
    expect(Math.max(...below.map((p) => p.y))).toBeGreaterThan(40)
    expect(Math.min(...above.map((p) => p.y))).toBeLessThan(-40)
  })

  it('walks a whole ellipse, both halves', () => {
    const pts = flattenPath('M 0 0 A 50 20 0 1 0 100 0 A 50 20 0 1 0 0 0')
    expect(Math.max(...pts.map((p) => p.y))).toBeGreaterThan(15)
    expect(Math.min(...pts.map((p) => p.y))).toBeLessThan(-15)
  })

  it('returns empty for empty d', () => {
    expect(flattenPath('')).toEqual([])
    expect(flattenPath(null)).toEqual([])
  })
})

describe('strokeHits', () => {
  it('hits a straight stroke near the line', () => {
    const s = { d: 'M 0 0 L 40 0', width: 2 }
    expect(strokeHits(s, { x: 20, y: 3 }, 4)).toBe(true)
    expect(strokeHits(s, { x: 20, y: 30 }, 4)).toBe(false)
  })

  it('prefers stored points when present', () => {
    const s = { d: 'M 0 0 L 1 1', points: [{ x: 100, y: 100 }, { x: 140, y: 100 }], width: 2 }
    expect(strokeHits(s, { x: 120, y: 102 }, 4)).toBe(true)
  })
})

describe('idsHitAt', () => {
  it('returns only the strokes under the point', () => {
    const strokes = [
      { id: 'a', d: 'M 0 0 L 20 0', width: 2 },
      { id: 'b', d: 'M 0 40 L 20 40', width: 2 },
    ]
    expect(idsHitAt(strokes, { x: 10, y: 1 }, 6)).toEqual(['a'])
  })
})
