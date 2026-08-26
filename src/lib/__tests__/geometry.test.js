import { describe, expect, it } from 'vitest'
import {
  angleOf, bounds, centroid, dedupe, dist, pathLength,
  projectToLine, round, snapAngle, toPath,
} from '../geometry.js'

describe('dist', () => {
  it('measures a 3-4-5 triangle', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
  it('is zero for identical points', () => {
    expect(dist({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(0)
  })
  it('is symmetric', () => {
    const a = { x: 1, y: 7 }; const b = { x: -4, y: 2 }
    expect(dist(a, b)).toBe(dist(b, a))
  })
})

describe('round', () => {
  it('defaults to two places', () => expect(round(1.23456)).toBe(1.23))
  it('honours an explicit precision', () => expect(round(1.23456, 4)).toBe(1.2346))
  it('leaves integers alone', () => expect(round(5)).toBe(5))
})

describe('toPath', () => {
  it('returns empty string for no points', () => {
    expect(toPath([])).toBe('')
    expect(toPath(null)).toBe('')
  })

  it('renders a single point as a zero-length line, so a tap draws a dot', () => {
    expect(toPath([{ x: 4, y: 9 }])).toBe('M 4 9 l 0 0')
  })

  it('renders two points as a straight line, not a curve', () => {
    expect(toPath([{ x: 0, y: 0 }, { x: 10, y: 5 }])).toBe('M 0 0 L 10 5')
  })

  it('emits one cubic segment per gap for three or more points', () => {
    const d = toPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 10 }])
    expect(d.match(/C/g)).toHaveLength(2)
  })

  it('interpolates: the curve passes through every recorded point', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 4 }, { x: 20, y: 0 }, { x: 30, y: 8 }]
    const d = toPath(pts)
    // Each point appears as a segment endpoint.
    for (const p of pts.slice(1)) expect(d).toContain(`${p.x} ${p.y}`)
  })

  it('never emits NaN when samples repeat', () => {
    const d = toPath([{ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 1 }, { x: 5, y: 5 }])
    expect(d).not.toContain('NaN')
  })

  it('rounds coordinates so the export stays small', () => {
    const d = toPath([{ x: 0.123456, y: 0.987654 }, { x: 9.87654, y: 3.14159 }])
    expect(d).toBe('M 0.12 0.99 L 9.88 3.14')
  })
})

describe('dedupe', () => {
  it('drops consecutive identical samples', () => {
    expect(dedupe([{ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 }])).toHaveLength(2)
  })
  it('keeps a repeat that is not consecutive', () => {
    expect(dedupe([{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 1 }])).toHaveLength(3)
  })
  it('handles an empty list', () => expect(dedupe([])).toEqual([]))
})

describe('pathLength', () => {
  it('sums the segments', () => {
    expect(pathLength([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 3, y: 8 }])).toBe(9)
  })
  it('is zero for a single point', () => {
    expect(pathLength([{ x: 1, y: 1 }])).toBe(0)
  })
})

describe('bounds', () => {
  it('spans every point of every stroke', () => {
    const b = bounds([
      { points: [{ x: 0, y: 0 }, { x: 10, y: 4 }] },
      { points: [{ x: -5, y: 20 }] },
    ])
    expect(b).toEqual({ x: -5, y: 0, width: 15, height: 20 })
  })
  it('returns null when there is nothing drawn', () => {
    expect(bounds([])).toBeNull()
    expect(bounds([{ points: [] }])).toBeNull()
  })
})

describe('projectToLine', () => {
  const a = { x: 0, y: 0 }
  const b = { x: 100, y: 0 }

  it('snaps a nearby point onto the line', () => {
    expect(projectToLine({ x: 50, y: 6 }, a, b)).toEqual({ x: 50, y: 0 })
  })

  it('leaves a far point untouched — no snapping across the page', () => {
    const p = { x: 50, y: 400 }
    expect(projectToLine(p, a, b)).toBe(p)
  })

  it('projects onto the infinite line, not the segment', () => {
    // Well past b: a ruler you can only draw along the middle of is worse
    // than a real one.
    expect(projectToLine({ x: 500, y: 5 }, a, b)).toEqual({ x: 500, y: 0 })
  })

  it('projects before a as readily as after b', () => {
    expect(projectToLine({ x: -80, y: 4 }, a, b)).toEqual({ x: -80, y: 0 })
  })

  it('returns the point for a degenerate zero-length ruler', () => {
    const p = { x: 3, y: 3 }
    expect(projectToLine(p, a, a)).toBe(p)
  })

  it('honours a custom snap distance', () => {
    const p = { x: 10, y: 30 }
    expect(projectToLine(p, a, b, 40)).toEqual({ x: 10, y: 0 })
    expect(projectToLine(p, a, b, 10)).toBe(p)
  })
})

describe('snapAngle', () => {
  const from = { x: 0, y: 0 }

  it('snaps within 4° of a detent', () => {
    const out = snapAngle(from, { x: 100, y: 3 })
    expect(out.y).toBeCloseTo(0, 6)
  })

  it('leaves freehand alone beyond the tolerance', () => {
    const to = { x: 100, y: 40 } // ~21.8°, 6.8° off the 15° detent
    expect(snapAngle(from, to)).toBe(to)
  })

  it('preserves length when it snaps', () => {
    const to = { x: 100, y: 2 }
    const out = snapAngle(from, to)
    expect(Math.hypot(out.x, out.y)).toBeCloseTo(Math.hypot(to.x, to.y), 6)
  })

  it('snaps to 45° as well as to the axis', () => {
    const out = snapAngle(from, { x: 100, y: 98 })
    expect(out.x).toBeCloseTo(out.y, 6)
  })

  it('returns the point when there is no movement', () => {
    const to = { x: 0, y: 0 }
    expect(snapAngle(from, to)).toBe(to)
  })
})

describe('angleOf', () => {
  it('reads 0° along +x', () => expect(angleOf({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(0))
  it('reads 90° down the screen', () => expect(angleOf({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(90))
  it('normalises to [0, 360)', () => {
    expect(angleOf({ x: 0, y: 0 }, { x: 0, y: -5 })).toBe(270)
  })
})

describe('centroid', () => {
  it('averages the cluster', () => {
    expect(centroid([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 9 }])).toEqual({ x: 5, y: 3 })
  })
  it('is null for an empty cluster', () => expect(centroid([])).toBeNull())
})
