import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../constants.js'
import { flattenPath } from '../hit.js'
import {
  SHAPE_CONE, SHAPE_CUBE, SHAPE_CYLINDER, SHAPE_ELLIPSE, SHAPE_ERASE, SHAPE_FREE,
  SHAPE_LINE, SHAPE_PYRAMID, SHAPE_RECT, SHAPE_SPHERE, SHAPE_TRIANGLE,
  SHAPES, TOOLS, TOOL_GROUPS, isErase, isShape, isSolid, shapeFromDrag, snapToGrid,
} from '../shapes.js'

const drag = (kind, a, b) => shapeFromDrag(kind, a, b)

describe('the toolbox', () => {
  it('offers every tool exactly once', () => {
    const ids = TOOLS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('shelves every tool, and nothing that is not a tool', () => {
    const shelved = TOOL_GROUPS.flatMap((g) => g.tools.map((t) => t.id))
    expect(shelved.sort()).toEqual(TOOLS.map((t) => t.id).sort())
  })

  it('counts the rubber as a tool but not as a shape', () => {
    expect(SHAPES.some((s) => s.id === SHAPE_ERASE)).toBe(false)
    expect(isErase(SHAPE_ERASE)).toBe(true)
    expect(isShape(SHAPE_ERASE)).toBe(false)
    expect(isShape(SHAPE_FREE)).toBe(false)
    expect(isShape(SHAPE_RECT)).toBe(true)
  })

  it('labels every tool — the sheet reads them out', () => {
    expect(TOOLS.every((t) => typeof t.label === 'string' && t.label.length)).toBe(true)
  })

  it('knows which five are solids', () => {
    expect([SHAPE_CUBE, SHAPE_CYLINDER, SHAPE_CONE, SHAPE_SPHERE, SHAPE_PYRAMID]
      .every(isSolid)).toBe(true)
    expect([SHAPE_RECT, SHAPE_ELLIPSE, SHAPE_TRIANGLE, SHAPE_LINE, SHAPE_FREE, SHAPE_ERASE]
      .some(isSolid)).toBe(false)
  })
})

describe('snapToGrid', () => {
  it('pulls a point to the nearest cell corner', () => {
    expect(snapToGrid({ x: GRID_SIZE * 2 + 3, y: GRID_SIZE * 3 - 4 }))
      .toEqual({ x: GRID_SIZE * 2, y: GRID_SIZE * 3 })
  })
})

describe('flat shapes', () => {
  it('draws a line between two grid-snapped ends', () => {
    const f = drag(SHAPE_LINE, { x: 2, y: 1 }, { x: 96, y: 3 })
    expect(f.d).toBe('M 0 0 L 96 0')
    expect(f.length).toBe(96)
  })

  it('locks a line that is nearly on a detent', () => {
    expect(drag(SHAPE_LINE, { x: 0, y: 0 }, { x: 96, y: 6 }).locked).toBe('angle')
  })

  it('closes a rectangle and reports its perimeter', () => {
    const f = drag(SHAPE_RECT, { x: 0, y: 0 }, { x: 96, y: 48 })
    expect(f.d.endsWith('Z')).toBe(true)
    expect(f.length).toBeCloseTo(2 * (96 + 48), 5)
  })

  it('locks a near-square, a near-circle and a near-equilateral', () => {
    expect(drag(SHAPE_RECT, { x: 0, y: 0 }, { x: 96, y: 100 }).locked).toBe('square')
    expect(drag(SHAPE_ELLIPSE, { x: 0, y: 0 }, { x: 96, y: 100 }).locked).toBe('circle')
    expect(drag(SHAPE_TRIANGLE, { x: 0, y: 0 }, { x: 96, y: 82 }).locked).toBe('equilateral')
  })

  it('leaves a deliberate oblong alone', () => {
    expect(drag(SHAPE_RECT, { x: 0, y: 0 }, { x: 240, y: 48 }).locked).toBeNull()
  })

  it('writes nothing for a drag that never left the cell', () => {
    expect(drag(SHAPE_RECT, { x: 1, y: 1 }, { x: 3, y: 2 }).d).toBe('')
  })

  it('returns an empty figure for a kind it does not know', () => {
    expect(drag('spiral', { x: 0, y: 0 }, { x: 96, y: 96 })).toEqual({
      d: '', points: [], length: 0, locked: null,
    })
  })
})

describe('solids come through the same door', () => {
  const KINDS = [SHAPE_CUBE, SHAPE_CYLINDER, SHAPE_CONE, SHAPE_SPHERE, SHAPE_PYRAMID]

  it.each(KINDS)('%s commits as ordinary ink — a `d`, points and a length', (kind) => {
    const f = drag(kind, { x: 25, y: 25 }, { x: 143, y: 143 })
    expect(f.d).toBeTruthy()
    expect(f.points.length).toBeGreaterThan(2)
    expect(f.length).toBeGreaterThan(0)
    expect(flattenPath(f.d).length).toBeGreaterThan(3)
  })

  // Measured on the recorded vertices, not the flattened arcs: the rubber's
  // arc sampler is an approximation, the grid is not.
  it.each(KINDS)('%s stands on the grid, like every other figure', (kind) => {
    const f = drag(kind, { x: 25, y: 25 }, { x: 143, y: 143 })
    const left = Math.min(...f.points.map((p) => p.x))
    const foot = Math.max(...f.points.map((p) => p.y))
    expect(left % GRID_SIZE).toBeCloseTo(0, 5)
    expect(foot % GRID_SIZE).toBeCloseTo(0, 5)
  })

  it('locks a near-square drag into an actual cube', () => {
    expect(drag(SHAPE_CUBE, { x: 0, y: 0 }, { x: 96, y: 100 }).locked).toBe('cube')
  })

  it('does not force a cylinder to be as tall as it is wide', () => {
    expect(drag(SHAPE_CYLINDER, { x: 0, y: 0 }, { x: 96, y: 100 }).locked).toBeNull()
  })

  it('writes nothing for a drag too small to be a solid', () => {
    expect(drag(SHAPE_CUBE, { x: 1, y: 1 }, { x: 3, y: 2 })).toEqual({
      d: '', points: [], length: 0, locked: null,
    })
  })
})
