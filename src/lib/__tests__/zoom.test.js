import { describe, expect, it } from 'vitest'
import {
  MAX_ZOOM, MIN_ZOOM, clampView, defaultView, pinchToView, screenToWorld, viewBox, zoomAt,
} from '../zoom.js'

const SIZE = { width: 400, height: 800 }

describe('screenToWorld', () => {
  it('is identity at 1×', () => {
    expect(screenToWorld({ x: 40, y: 80 }, defaultView(), SIZE)).toEqual({ x: 40, y: 80 })
  })

  it('maps the same screen point to a smaller world window when zoomed', () => {
    const view = { scale: 2, x: 0, y: 0 }
    expect(screenToWorld({ x: 200, y: 400 }, view, SIZE)).toEqual({ x: 100, y: 200 })
  })
})

describe('clampView', () => {
  it('zooms out to half — far enough for two sheets', () => {
    expect(MIN_ZOOM).toBe(0.5)
    expect(clampView({ scale: 0.1, x: 0, y: 0 }, SIZE).scale).toBe(MIN_ZOOM)
  })

  it('keeps the window on the page', () => {
    const next = clampView({ scale: 2, x: 900, y: 900 }, SIZE)
    expect(next.x).toBe(200)
    expect(next.y).toBe(400)
  })

  it('centres a world smaller than the window instead of pinning it left', () => {
    // At 0.5 the window is twice the sheet, so half a sheet of margin each side.
    const next = clampView({ scale: 0.5, x: 0, y: 0 }, SIZE)
    expect(next.x).toBe(-200)
    expect(next.y).toBe(-400)
  })

  it('pans across a spread world that is wider than the window', () => {
    const world = { width: 824, height: 800 }
    const next = clampView({ scale: 0.5, x: 999, y: 0 }, SIZE, world)
    expect(next.x).toBe(824 - 800)
  })

  it('takes the world as a function of the scale it settles on', () => {
    const world = (scale) => (scale <= 0.8 ? { width: 824, height: 800 } : SIZE)
    expect(clampView({ scale: 0.5, x: 999, y: 0 }, SIZE, world).x).toBe(24)
    expect(clampView({ scale: 1, x: 999, y: 0 }, SIZE, world).x).toBe(0)
  })
})

describe('zoomAt', () => {
  it('holds the world point under the finger', () => {
    const screen = { x: 200, y: 400 }
    const next = zoomAt(defaultView(), SIZE, screen, 2)
    expect(screenToWorld(screen, next, SIZE).x).toBeCloseTo(200)
    expect(screenToWorld(screen, next, SIZE).y).toBeCloseTo(400)
  })
})

describe('pinchToView', () => {
  it('zooms in when the fingers move apart', () => {
    const next = pinchToView(
      defaultView(),
      { x: 180, y: 400 },
      { x: 220, y: 400 },
      { x: 100, y: 400 },
      { x: 300, y: 400 },
      SIZE,
    )
    expect(next.scale).toBeGreaterThan(1)
    expect(next.scale).toBeLessThanOrEqual(MAX_ZOOM)
  })
})

describe('viewBox', () => {
  it('writes an SVG viewBox for the current window', () => {
    expect(viewBox({ scale: 2, x: 10, y: 20 }, SIZE)).toBe('10 20 200 400')
  })
})
