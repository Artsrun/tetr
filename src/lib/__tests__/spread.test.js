import { describe, expect, it } from 'vitest'
import {
  GUTTER, SPREAD_ZOOM, activeOrigin, isSpread, sheetAtX, sheetX, sheets, spreadPages, worldOf,
} from '../spread.js'

const SIZE = { width: 390, height: 700 }

describe('isSpread', () => {
  it('is off at full size', () => {
    expect(isSpread(1)).toBe(false)
  })

  it('opens flat at the zoom-out floor', () => {
    expect(isSpread(0.5)).toBe(true)
    expect(isSpread(SPREAD_ZOOM)).toBe(true)
  })
})

describe('worldOf', () => {
  it('is one sheet when the notebook is closed', () => {
    expect(worldOf(SIZE, false)).toEqual({ width: 390, height: 700 })
  })

  it('is two sheets and the binding when it is open', () => {
    expect(worldOf(SIZE, true)).toEqual({ width: 390 * 2 + GUTTER, height: 700 })
  })

  it('fits both sheets on a phone at the zoom-out floor', () => {
    // 390 / 0.5 = 780 of window against 804 of world — near enough that both
    // pages are on screen, which is the whole point of zooming out.
    expect(worldOf(SIZE, true).width - SIZE.width / 0.5).toBeLessThan(GUTTER + 1)
  })
})

describe('spreadPages', () => {
  it('puts even pages on the left, like a book', () => {
    expect(spreadPages(0, 4).map((s) => s.index)).toEqual([0, 1])
    expect(spreadPages(1, 4).map((s) => s.index)).toEqual([0, 1])
    expect(spreadPages(2, 4).map((s) => s.index)).toEqual([2, 3])
    expect(spreadPages(3, 4).map((s) => s.index)).toEqual([2, 3])
  })

  it('marks the page that does not exist yet as a ghost', () => {
    const [left, right] = spreadPages(0, 1)
    expect(left.ghost).toBe(false)
    expect(right.ghost).toBe(true)
  })
})

describe('sheets', () => {
  it('is the single page unchanged when not spread', () => {
    expect(sheets({ scale: 1, index: 2, count: 4, width: 390 }))
      .toEqual([{ index: 2, slot: 0, x: 0, ghost: false, active: true }])
  })

  it('lays the second sheet a gutter to the right', () => {
    const list = sheets({ scale: 0.5, index: 0, count: 2, width: 390 })
    expect(list.map((s) => s.x)).toEqual([0, sheetX(1, 390)])
    expect(sheetX(1, 390)).toBe(390 + GUTTER)
  })

  it('marks only the page being drawn on as active', () => {
    const list = sheets({ scale: 0.5, index: 3, count: 4, width: 390 })
    expect(list.map((s) => s.active)).toEqual([false, true])
  })

  it('never makes a ghost active', () => {
    const list = sheets({ scale: 0.5, index: 0, count: 1, width: 390 })
    expect(list[1].ghost).toBe(true)
    expect(list[1].active).toBe(false)
  })
})

describe('activeOrigin', () => {
  it('is zero for a left-hand page', () => {
    expect(activeOrigin(sheets({ scale: 0.5, index: 0, count: 2, width: 390 }))).toBe(0)
  })

  it('shifts a right-hand page by a sheet and the gutter', () => {
    expect(activeOrigin(sheets({ scale: 0.5, index: 1, count: 2, width: 390 })))
      .toBe(390 + GUTTER)
  })
})

describe('sheetAtX', () => {
  const list = sheets({ scale: 0.5, index: 0, count: 2, width: 390 })

  it('finds the sheet under a world x', () => {
    expect(sheetAtX(list, 10, 390).index).toBe(0)
    expect(sheetAtX(list, 500, 390).index).toBe(1)
  })

  it('returns nothing in the binding', () => {
    expect(sheetAtX(list, 400, 390)).toBeNull()
  })

  it('returns nothing off the edge', () => {
    expect(sheetAtX(list, 9000, 390)).toBeNull()
  })
})
