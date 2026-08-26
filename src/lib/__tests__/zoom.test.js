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
  it('will not zoom out past the paper', () => {
    expect(clampView({ scale: 0.4, x: 0, y: 0 }, SIZE).scale).toBe(MIN_ZOOM)
  })

  it('keeps the window on the page', () => {
    const next = clampView({ scale: 2, x: 900, y: 900 }, SIZE)
    expect(next.x).toBe(200)
    expect(next.y).toBe(400)
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
