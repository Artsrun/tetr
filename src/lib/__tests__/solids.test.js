import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../constants.js'
import { flattenPath } from '../hit.js'
import {
  DEPTH_RATIO, SHAPE_CONE, SHAPE_CUBE, SHAPE_CYLINDER, SHAPE_PYRAMID, SHAPE_SPHERE,
  SOLIDS, depthOf, isSolid, solidFromBox,
} from '../solids.js'

const BOX = { x: 48, y: 48, w: 120, h: 120 }
const KINDS = [SHAPE_CUBE, SHAPE_CYLINDER, SHAPE_CONE, SHAPE_SPHERE, SHAPE_PYRAMID]

const bbox = (d) => {
  const pts = flattenPath(d)
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return {
    x: Math.min(...xs), y: Math.min(...ys),
    x2: Math.max(...xs), y2: Math.max(...ys),
  }
}
const subpaths = (d) => (d.match(/M/g) || []).length

describe('depth', () => {
  it('is half the shorter side — cabinet projection, not isometric', () => {
    expect(depthOf(240, 480)).toBe(120)
    expect(DEPTH_RATIO).toBe(0.5)
  })

  it('lands on a grid intersection so the back face sits on the paper', () => {
    for (const w of [24, 60, 96, 130, 240]) {
      expect(depthOf(w, w) % GRID_SIZE).toBe(0)
    }
  })

  it('never collapses below one cell — a flat cube is just a rectangle', () => {
    expect(depthOf(4, 4)).toBe(GRID_SIZE)
  })
})

describe('every solid', () => {
  it.each(KINDS)('%s draws something with length', (kind) => {
    const solid = solidFromBox(kind, BOX)
    expect(solid.d.length).toBeGreaterThan(10)
    expect(solid.length).toBeGreaterThan(0)
    expect(solid.points.length).toBeGreaterThanOrEqual(3)
  })

  it.each(KINDS)('%s writes only literals the export can carry', (kind) => {
    // No CSS vars, no filters, no fills — the same contract as the flat shapes.
    expect(solidFromBox(kind, BOX).d).toMatch(/^[MLAZ0-9\s.,-]+$/)
  })

  it.each(KINDS)('%s flattens, so the rubber can hit it', (kind) => {
    expect(flattenPath(solidFromBox(kind, BOX).d).length).toBeGreaterThan(3)
  })

  it.each(KINDS)('%s stays inside the drag box, apart from its depth', (kind) => {
    const b = bbox(solidFromBox(kind, BOX).d)
    const d = depthOf(BOX.w, BOX.h)
    expect(b.x).toBeGreaterThanOrEqual(BOX.x - 0.5)
    expect(b.y).toBeGreaterThanOrEqual(BOX.y - d - 0.5)
    expect(b.x2).toBeLessThanOrEqual(BOX.x + BOX.w + d + 0.5)
    expect(b.y2).toBeLessThanOrEqual(BOX.y + BOX.h + 0.5)
  })

  it('refuses a box too small to read as a figure', () => {
    for (const kind of KINDS) expect(solidFromBox(kind, { x: 0, y: 0, w: 0, h: 0 })).toBeNull()
  })

  it('refuses a kind it does not know', () => {
    expect(solidFromBox('dodecahedron', BOX)).toBeNull()
    expect(isSolid('dodecahedron')).toBe(false)
    expect(SOLIDS.every((s) => isSolid(s.id))).toBe(true)
  })
})

describe('cube', () => {
  const d = solidFromBox(SHAPE_CUBE, BOX).d

  it('is a front face plus a top and a right — three subpaths, no more', () => {
    expect(subpaths(d)).toBe(3)
  })

  it('sends the back face up and to the right by the depth', () => {
    const depth = depthOf(BOX.w, BOX.h)
    const b = bbox(d)
    expect(b.y).toBeCloseTo(BOX.y - depth, 1)
    expect(b.x2).toBeCloseTo(BOX.x + BOX.w + depth, 1)
  })

  it('leaves the corner behind the solid undrawn', () => {
    const depth = depthOf(BOX.w, BOX.h)
    const hidden = { x: BOX.x + depth, y: BOX.y + BOX.h - depth }
    const drawn = flattenPath(d)
    expect(drawn.some((p) => Math.hypot(p.x - hidden.x, p.y - hidden.y) < 1)).toBe(false)
  })
})

describe('pyramid', () => {
  const solid = solidFromBox(SHAPE_PYRAMID, BOX)

  it('is a silhouette plus one lateral edge', () => {
    expect(subpaths(solid.d)).toBe(2)
  })

  it('puts the apex over the centre of the base, depth included', () => {
    const depth = depthOf(BOX.w, BOX.h)
    expect(solid.points[0]).toEqual({ x: BOX.x + BOX.w / 2 + depth / 2, y: BOX.y })
  })
})

describe('cylinder', () => {
  it('keeps the two bases apart even when squat', () => {
    const squat = { x: 0, y: 0, w: 240, h: 48 }
    const b = bbox(solidFromBox(SHAPE_CYLINDER, squat).d)
    expect(b.y2 - b.y).toBeLessThanOrEqual(squat.h + 0.5)
    expect(solidFromBox(SHAPE_CYLINDER, squat).points.length).toBeGreaterThan(4)
  })

  it('draws a top ellipse, two sides and the near half of the base', () => {
    expect(subpaths(solidFromBox(SHAPE_CYLINDER, BOX).d)).toBe(4)
  })
})

describe('cone', () => {
  const solid = solidFromBox(SHAPE_CONE, BOX)

  it('stands its apex on the centre line of the base', () => {
    expect(solid.points).toContainEqual({ x: BOX.x + BOX.w / 2, y: BOX.y })
  })

  it('rests the base on the bottom of the drag', () => {
    expect(bbox(solid.d).y2).toBeCloseTo(BOX.y + BOX.h, 0)
  })
})

describe('sphere', () => {
  it('is round whatever box you drag it in', () => {
    const b = bbox(solidFromBox(SHAPE_SPHERE, { x: 0, y: 0, w: 240, h: 120 }).d)
    expect(b.x2 - b.x).toBeCloseTo(b.y2 - b.y, 0)
  })

  it('sits in the middle of the drag', () => {
    const b = bbox(solidFromBox(SHAPE_SPHERE, { x: 0, y: 0, w: 240, h: 120 }).d)
    expect((b.x + b.x2) / 2).toBeCloseTo(120, 0)
    expect((b.y + b.y2) / 2).toBeCloseTo(60, 0)
  })

  it('carries an equator, or it is only a circle', () => {
    expect(subpaths(solidFromBox(SHAPE_SPHERE, BOX).d)).toBe(2)
  })
})

// The rubber hit-tests a stroke's `points` as one polyline (hit.js), so those
// vertices have to walk the ink — not cut across it.
describe('what the rubber sees', () => {
  const near = (p, poly) => {
    let best = Infinity
    for (let i = 1; i < poly.length; i++) {
      const a = poly[i - 1]
      const b = poly[i]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len2 = dx * dx + dy * dy
      const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0
      best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)))
    }
    return best
  }

  it.each(KINDS)('%s puts every drawn point within a rubber’s width of the trace', (kind) => {
    const solid = solidFromBox(kind, BOX)
    for (const p of flattenPath(solid.d)) {
      expect(near(p, solid.points)).toBeLessThan(6)
    }
  })

  it.each(KINDS)('%s never invents an edge the pen did not draw', (kind) => {
    const solid = solidFromBox(kind, BOX)
    const drawn = flattenPath(solid.d)
    for (let i = 1; i < solid.points.length; i++) {
      const a = solid.points[i - 1]
      const b = solid.points[i]
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      expect(near(mid, drawn)).toBeLessThan(6)
    }
  })
})
