import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../constants.js'
import {
  CALLIPER, RULER, defaultCalliper, defaultRuler,
  grabHandle, measure, snapToInstrument, translate,
} from '../instruments.js'

describe('defaults', () => {
  it('lays the ruler across the middle of the page', () => {
    const r = defaultRuler(400, 800)
    expect(r.kind).toBe(RULER)
    expect(r.a.y).toBe(400)
    expect((r.a.x + r.b.x) / 2).toBe(200)
  })

  it('keeps the ruler inside the viewport on a narrow phone', () => {
    const r = defaultRuler(320, 640)
    expect(r.a.x).toBeGreaterThanOrEqual(0)
    expect(r.b.x).toBeLessThanOrEqual(320)
  })

  it('makes a calliper too', () => {
    expect(defaultCalliper(400, 800).kind).toBe(CALLIPER)
  })
})

describe('snapToInstrument', () => {
  const ruler = { kind: RULER, a: { x: 0, y: 100 }, b: { x: 300, y: 100 } }

  it('snaps a nearby point onto the ruler edge', () => {
    expect(snapToInstrument({ x: 150, y: 106 }, ruler)).toEqual({ x: 150, y: 100 })
  })

  it('leaves a point alone when no instrument is out', () => {
    const p = { x: 5, y: 5 }
    expect(snapToInstrument(p, null)).toBe(p)
  })

  it('does not snap to the calliper — it measures, it does not guide', () => {
    const p = { x: 150, y: 102 }
    const calliper = { ...ruler, kind: CALLIPER }
    expect(snapToInstrument(p, calliper)).toBe(p)
  })

  it('leaves a distant point free for freehand drawing', () => {
    const p = { x: 150, y: 400 }
    expect(snapToInstrument(p, ruler)).toBe(p)
  })
})

describe('measure', () => {
  it('reports length in grid cells, the notebook’s own unit', () => {
    const m = measure({ kind: RULER, a: { x: 0, y: 0 }, b: { x: GRID_SIZE * 5, y: 0 } })
    expect(m.cells).toBe(5)
  })
  it('reports pixels and angle', () => {
    const m = measure({ kind: RULER, a: { x: 0, y: 0 }, b: { x: 100, y: 0 } })
    expect(m.px).toBe(100)
    expect(m.angle).toBe(0)
  })
  it('is null with no instrument', () => expect(measure(null)).toBeNull())
})

describe('translate', () => {
  it('moves both endpoints together', () => {
    const r = translate({ kind: RULER, a: { x: 0, y: 0 }, b: { x: 10, y: 0 } }, 5, 7)
    expect(r.a).toEqual({ x: 5, y: 7 })
    expect(r.b).toEqual({ x: 15, y: 7 })
  })
  it('preserves the kind', () => {
    expect(translate({ kind: CALLIPER, a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }, 1, 1).kind)
      .toBe(CALLIPER)
  })
})

describe('grabHandle', () => {
  const r = { kind: RULER, a: { x: 0, y: 0 }, b: { x: 200, y: 0 } }
  it('finds the near end', () => expect(grabHandle({ x: 6, y: 4 }, r)).toBe('a'))
  it('finds the far end', () => expect(grabHandle({ x: 198, y: 3 }, r)).toBe('b'))
  it('returns null on the body, which drags the whole ruler', () => {
    expect(grabHandle({ x: 100, y: 0 }, r)).toBeNull()
  })
  it('returns null with no instrument', () => expect(grabHandle({ x: 0, y: 0 }, null)).toBeNull())
})
