import { describe, expect, it } from 'vitest'
import { GRID, PAPER, PENCIL_OPACITY, PEN_OPACITY } from '../constants.js'
import { filename, gridMarkup, strokeMarkup, toSVG } from '../export.js'

const stroke = (over = {}) => ({
  id: 's1', d: 'M 0 0 L 10 10', color: '#1f3a6e', width: 2.2, pencil: false, ...over,
})

describe('toSVG', () => {
  it('is well-formed standalone SVG with the xmlns Figma needs', () => {
    const svg = toSVG([stroke()], { width: 390, height: 700 })
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
  })

  it('writes literal colours, never CSS variables', () => {
    // Cloning the live DOM would carry var(--grid) into the file, which
    // resolves to nothing outside the page — Figma opens a blank rectangle.
    const svg = toSVG([stroke()], { width: 100, height: 100 })
    expect(svg).not.toContain('var(')
    expect(svg).toContain(PAPER)
    expect(svg).toContain(GRID)
  })

  it('never carries the pencil filter — consumers rasterize filters on import', () => {
    const svg = toSVG([stroke({ pencil: true })], { width: 100, height: 100 })
    expect(svg).not.toContain('filter')
    expect(svg).not.toContain('feTurbulence')
  })

  it('carries the graphite feel as stroke-opacity instead', () => {
    const svg = toSVG([stroke({ pencil: true })], { width: 100, height: 100 })
    expect(svg).toContain(`stroke-opacity="${PENCIL_OPACITY}"`)
  })

  it('gives pen strokes full opacity', () => {
    const svg = toSVG([stroke({ pencil: false })], { width: 100, height: 100 })
    expect(svg).toContain(`stroke-opacity="${PEN_OPACITY}"`)
  })

  it('sets a viewBox matching the drawing surface', () => {
    expect(toSVG([], { width: 390, height: 700 })).toContain('viewBox="0 0 390 700"')
  })

  it('paints the paper so the export is not transparent', () => {
    expect(toSVG([], { width: 10, height: 10 })).toContain(`fill="${PAPER}"`)
  })

  it('can omit the grid', () => {
    const svg = toSVG([], { width: 200, height: 200, grid: false })
    expect(svg).not.toContain('id="grid"')
  })

  it('draws the margin line only when asked', () => {
    expect(toSVG([], { width: 200, height: 200 })).not.toContain('#c98b8b')
    expect(toSVG([], { width: 200, height: 200, margin: true })).toContain('#c98b8b')
  })

  it('includes one path per stroke', () => {
    const svg = toSVG([stroke({ id: 'a' }), stroke({ id: 'b' })], { width: 50, height: 50 })
    expect(svg.match(/<path /g)).toHaveLength(2)
  })

  it('survives an empty drawing', () => {
    expect(() => toSVG([], { width: 50, height: 50 })).not.toThrow()
  })

  it('rounds the canvas size to whole pixels', () => {
    expect(toSVG([], { width: 390.7, height: 700.2 })).toContain('width="391"')
  })

  it('escapes markup that would otherwise break the document', () => {
    const svg = toSVG([stroke({ color: '"><script>x' })], { width: 10, height: 10 })
    expect(svg).not.toContain('<script>')
    expect(svg).toContain('&lt;script&gt;')
  })
})

describe('gridMarkup', () => {
  it('spaces lines one cell apart', () => {
    const g = gridMarkup(100, 50, 25)
    expect(g.match(/<line /g)).toHaveLength(3 + 1) // x at 25,50,75 · y at 25
  })
  it('draws nothing inside a single cell', () => {
    expect(gridMarkup(10, 10, 24).match(/<line /g)).toBeNull()
  })
})

describe('strokeMarkup', () => {
  it('sets round caps so a tap reads as a dot', () => {
    expect(strokeMarkup(stroke())).toContain('stroke-linecap="round"')
  })
  it('keeps the path data verbatim', () => {
    expect(strokeMarkup(stroke({ d: 'M 1 2 L 3 4' }))).toContain('d="M 1 2 L 3 4"')
  })
})

describe('filename', () => {
  it('is timestamped and sortable', () => {
    expect(filename(new Date(2026, 7, 24, 14, 32))).toBe('tetr-2026-08-24-1432.svg')
  })
  it('zero-pads every field', () => {
    expect(filename(new Date(2026, 0, 5, 4, 7))).toBe('tetr-2026-01-05-0407.svg')
  })
  it('ends in .svg', () => expect(filename()).toMatch(/\.svg$/))
})
