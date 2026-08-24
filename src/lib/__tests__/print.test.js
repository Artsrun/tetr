import { describe, expect, it } from 'vitest'
import { A4 } from '../constants.js'
import { printDocument } from '../print.js'

const stroke = { id: 's1', d: 'M 0 0 L 10 10', color: '#1f3a6e', width: 2.2, pencil: false }

describe('printDocument', () => {
  it('is a complete standalone document', () => {
    const html = printDocument([stroke], { width: 390, height: 700 })
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('</html>')
  })

  it('sets A4 page geometry', () => {
    expect(printDocument([], { width: 390, height: 700 })).toContain('size: A4')
  })

  it('keeps print-color-adjust: exact — without it the paper and grid vanish', () => {
    const html = printDocument([], { width: 390, height: 700 })
    expect(html).toContain('print-color-adjust: exact')
    expect(html).toContain('-webkit-print-color-adjust: exact')
  })

  it('nests an inner viewBox rather than transform-scaling', () => {
    // transform: scale() scales stroke-width too, so thin lines print as
    // hairlines that some printers drop entirely.
    const html = printDocument([stroke], { width: 390, height: 700 })
    expect(html).not.toContain('transform: scale')
    expect(html).toContain('viewBox="0 0 390 700"')
  })

  it('fits the drawing inside the printable area', () => {
    const html = printDocument([], { width: 390, height: 700 })
    const width = Number(html.match(/<svg[^>]*width="(\d+)"/)[1])
    expect(width).toBeLessThanOrEqual(A4.width - A4.margin * 2)
  })

  it('carries the strokes onto the page', () => {
    expect(printDocument([stroke], { width: 100, height: 100 })).toContain(stroke.d)
  })

  it('carries no toolbar or stats markup', () => {
    const html = printDocument([stroke], { width: 100, height: 100 })
    expect(html).not.toContain('toolbar')
    expect(html).not.toContain('stats')
  })

  it('can print without the grid (long-press)', () => {
    expect(printDocument([], { width: 100, height: 100, grid: false })).not.toContain('id="grid"')
  })

  it('prints the grid by default', () => {
    expect(printDocument([], { width: 100, height: 100 })).toContain('id="grid"')
  })
})
