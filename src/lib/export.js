// SVG serialization from state — NOT DOM cloning (CLAUDE.md). Cloning the live
// SVG would carry var(--grid) into the file, which resolves to nothing outside
// the page, and Figma opens a blank rectangle. Every value written here is a
// literal. That is why the constants exist in both JS and CSS.
//
// The pencil filter is deliberately absent: Figma and most SVG consumers
// rasterize filters on import, so a filtered export would arrive as a bitmap.
// Strokes carry stroke-opacity only — the graphite feel survives and the
// geometry stays editable.

import {
  GRID, GRID_SIZE, GRID_WIDTH, LINECAP, LINEJOIN,
  MARGIN_LINE, PAPER, PENCIL_OPACITY, PEN_OPACITY,
} from './constants.js'

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export function gridMarkup(width, height, gridSize = GRID_SIZE) {
  const lines = []
  for (let x = gridSize; x < width; x += gridSize) {
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${GRID}" stroke-width="${GRID_WIDTH}" />`,
    )
  }
  for (let y = gridSize; y < height; y += gridSize) {
    lines.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${GRID}" stroke-width="${GRID_WIDTH}" />`,
    )
  }
  return `<g id="grid" shape-rendering="crispEdges">\n    ${lines.join('\n    ')}\n  </g>`
}

export function strokeMarkup(stroke) {
  const opacity = stroke.pencil ? PENCIL_OPACITY : PEN_OPACITY
  return (
    `<path d="${esc(stroke.d)}" fill="none" stroke="${esc(stroke.color)}" ` +
    `stroke-width="${stroke.width}" stroke-linecap="${LINECAP}" ` +
    `stroke-linejoin="${LINEJOIN}" stroke-opacity="${opacity}" />`
  )
}

export function toSVG(strokes, { width, height, grid = true, margin = false, background = true } = {}) {
  const w = Math.round(width)
  const h = Math.round(height)

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
  ]
  // background defaults on so existing callers / print / old tests stay papered.
  if (background) parts.push(`  <rect width="${w}" height="${h}" fill="${PAPER}" />`)
  if (grid) parts.push(`  ${gridMarkup(w, h)}`)
  if (margin) {
    const x = GRID_SIZE * 3
    parts.push(
      `  <line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${MARGIN_LINE}" stroke-width="1" />`,
    )
  }

  const paths = strokes.map((s) => `    ${strokeMarkup(s)}`).join('\n')
  parts.push(`  <g id="strokes" fill="none">\n${paths}\n  </g>`)
  parts.push('</svg>')

  return parts.join('\n')
}

/** tetr-2026-08-24-1432.svg — sortable, and never collides within a minute. */
export function filename(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return (
    `tetr-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `-${p(date.getHours())}${p(date.getMinutes())}.svg`
  )
}

export function download(svg, name = filename()) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking synchronously cancels the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return name
}
