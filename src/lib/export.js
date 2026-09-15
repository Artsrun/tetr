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
import { flattenPath } from './hit.js'

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const CROP_PAD = 8

function strokePoints(stroke) {
  if (stroke.points && stroke.points.length) return stroke.points
  return flattenPath(stroke.d)
}

/** Tight ink box plus stroke-width padding. Null when nothing is drawn. */
export function cropFrame(strokes, extra = CROP_PAD) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  let half = 0
  for (const s of strokes) {
    half = Math.max(half, (s.width || 0) / 2)
    for (const pt of strokePoints(s)) {
      if (pt.x < minX) minX = pt.x
      if (pt.y < minY) minY = pt.y
      if (pt.x > maxX) maxX = pt.x
      if (pt.y > maxY) maxY = pt.y
    }
  }
  if (minX === Infinity) return null
  const pad = half + extra
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(1, maxX - minX + pad * 2),
    height: Math.max(1, maxY - minY + pad * 2),
  }
}

export function gridMarkup(width, height, gridSize = GRID_SIZE, origin = { x: 0, y: 0 }) {
  const x0 = origin.x
  const y0 = origin.y
  const x1 = x0 + width
  const y1 = y0 + height
  const lines = []
  const firstX = Math.ceil((x0 + 1e-9) / gridSize) * gridSize
  const firstY = Math.ceil((y0 + 1e-9) / gridSize) * gridSize
  for (let x = firstX; x < x1; x += gridSize) {
    lines.push(
      `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${GRID}" stroke-width="${GRID_WIDTH}" />`,
    )
  }
  for (let y = firstY; y < y1; y += gridSize) {
    lines.push(
      `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${GRID}" stroke-width="${GRID_WIDTH}" />`,
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

export function toSVG(strokes, {
  width, height, grid = true, margin = false, background = true, crop = false,
} = {}) {
  const frame = crop ? cropFrame(strokes) : null
  const ox = frame ? frame.x : 0
  const oy = frame ? frame.y : 0
  const w = Math.round(frame ? frame.width : width)
  const h = Math.round(frame ? frame.height : height)
  const vx = Math.round(ox * 100) / 100
  const vy = Math.round(oy * 100) / 100

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vx} ${vy} ${w} ${h}">`,
  ]
  // background defaults on so existing callers / print / old tests stay papered.
  if (background) parts.push(`  <rect x="${vx}" y="${vy}" width="${w}" height="${h}" fill="${PAPER}" />`)
  if (grid) parts.push(`  ${gridMarkup(w, h, GRID_SIZE, { x: vx, y: vy })}`)
  if (margin && !frame) {
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

export function downloadUrl(url, name = filename()) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  return name
}
