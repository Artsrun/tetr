import { describe, expect, it } from 'vitest'
import { GRID, PAPER, PENCIL_OPACITY, PEN_OPACITY, WHITE } from '../constants.js'
import { cropFrame, filename, gridMarkup, strokeMarkup, svgSize, toSVG } from '../export.js'

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
    expect(g.match(/<line /g)).toHaveLength(3 + 1)
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
  it('can take an extension', () => {
    expect(filename(new Date(2026, 7, 24, 14, 32), 'png')).toBe('tetr-2026-08-24-1432.png')
  })
})

describe('cropFrame', () => {
  it('pads ink by half the stroke width plus a gutter', () => {
    const box = cropFrame([stroke({ d: 'M 10 10 L 30 10', width: 4 })])
    expect(box.x).toBe(10 - 2 - 8)
    expect(box.y).toBe(10 - 2 - 8)
    expect(box.width).toBe(20 + 20)
    expect(box.height).toBe(20)
  })
  it('reads a persisted stroke that has only d, no points', () => {
    const box = cropFrame([{ d: 'M 0 0 L 8 0', width: 2 }])
    expect(box).not.toBeNull()
    expect(box.width).toBeGreaterThan(8)
  })
  it('is null when the page is blank', () => {
    expect(cropFrame([])).toBeNull()
    expect(cropFrame([{ d: '', width: 2 }])).toBeNull()
  })
})

describe('toSVG crop', () => {
  it('shrinks the viewBox to the ink frame', () => {
    const svg = toSVG([stroke({ d: 'M 100 80 L 140 80', width: 2 })], {
      width: 800, height: 1200, grid: false, background: false, crop: true,
    })
    expect(svg).toMatch(/viewBox="91 71 58 18"/)
    expect(svg).not.toContain('viewBox="0 0 800 1200"')
  })
  it('does not dump a full-page grid into a cropped file', () => {
    const full = toSVG([stroke({ d: 'M 10 10 L 20 10' })], { width: 800, height: 600, crop: false })
    const cut = toSVG([stroke({ d: 'M 10 10 L 20 10' })], { width: 800, height: 600, crop: true })
    expect((cut.match(/<line /g) || []).length).toBeLessThan((full.match(/<line /g) || []).length)
  })
  it('falls back to the page when there is nothing to crop', () => {
    const svg = toSVG([], { width: 200, height: 300, crop: true, grid: false })
    expect(svg).toContain('viewBox="0 0 200 300"')
  })
})

describe('toSVG fill', () => {
  it('paints a custom paper colour', () => {
    const svg = toSVG([], { width: 20, height: 20, grid: false, fill: WHITE })
    expect(svg).toContain(`fill="${WHITE}"`)
    expect(svg).not.toContain(PAPER)
  })
  it('omits the rect when fill is null', () => {
    const svg = toSVG([], { width: 20, height: 20, grid: false, fill: null })
    expect(svg).not.toContain('<rect')
  })
})

describe('svgSize', () => {
  it('reads the serialized attributes', () => {
    expect(svgSize(toSVG([], { width: 120, height: 80, grid: false }))).toEqual({ width: 120, height: 80 })
  })
})
