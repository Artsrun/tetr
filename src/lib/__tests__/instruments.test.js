import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../constants.js'
import { CALLIPER, defaultCalliper, grabHandle, measure, translate } from '../instruments.js'

describe('defaults', () => {
  it('lays the calliper across the middle of the page', () => {
    const c = defaultCalliper(400, 800)
    expect(c.kind).toBe(CALLIPER)
    expect(c.a.y).toBe(400)
    expect((c.a.x + c.b.x) / 2).toBe(200)
  })

  it('keeps it inside the viewport on a narrow phone', () => {
    const c = defaultCalliper(320, 640)
    expect(c.a.x).toBeGreaterThanOrEqual(0)
    expect(c.b.x).toBeLessThanOrEqual(320)
  })
})

describe('measure', () => {
  it('reports length in grid cells, the notebook’s own unit', () => {
    const m = measure({ kind: CALLIPER, a: { x: 0, y: 0 }, b: { x: GRID_SIZE * 5, y: 0 } })
    expect(m.cells).toBe(5)
  })
  it('reports pixels and angle', () => {
    const m = measure({ kind: CALLIPER, a: { x: 0, y: 0 }, b: { x: 100, y: 0 } })
    expect(m.px).toBe(100)
    expect(m.angle).toBe(0)
  })
  it('is null with no instrument', () => expect(measure(null)).toBeNull())
})

describe('translate', () => {
  it('moves both endpoints together', () => {
    const c = translate({ kind: CALLIPER, a: { x: 0, y: 0 }, b: { x: 10, y: 0 } }, 5, 7)
    expect(c.a).toEqual({ x: 5, y: 7 })
    expect(c.b).toEqual({ x: 15, y: 7 })
  })
  it('preserves the kind', () => {
    expect(translate({ kind: CALLIPER, a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }, 1, 1).kind)
      .toBe(CALLIPER)
  })
})

describe('grabHandle', () => {
  const c = { kind: CALLIPER, a: { x: 0, y: 0 }, b: { x: 200, y: 0 } }
  it('finds the near end', () => expect(grabHandle({ x: 6, y: 4 }, c)).toBe('a'))
  it('finds the far end', () => expect(grabHandle({ x: 198, y: 3 }, c)).toBe('b'))
  it('returns null on the body, which drags the whole instrument', () => {
    expect(grabHandle({ x: 100, y: 0 }, c)).toBeNull()
  })
  it('returns null with no instrument', () => expect(grabHandle({ x: 0, y: 0 }, null)).toBeNull())
})

describe('the ruler is gone', () => {
  it('exports no ruler and no snapping — the paper never bends a stroke', async () => {
    const mod = await import('../instruments.js')
    expect(mod.RULER).toBeUndefined()
    expect(mod.defaultRuler).toBeUndefined()
    expect(mod.snapToInstrument).toBeUndefined()
  })
})
