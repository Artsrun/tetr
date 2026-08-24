// Print goes through a hidden iframe (CLAUDE.md). window.print() on the live
// page would carry the toolbar, the stats panel and a viewport-height canvas
// onto the paper; the iframe gets a purpose-built A4 document containing only
// the drawing.

import { A4, PAPER } from './constants.js'
import { toSVG } from './export.js'

/**
 * The print SVG *nests* rather than transform-scaling (CLAUDE.md): a
 * transform: scale() scales stroke-width along with the geometry, so thin
 * lines print as hairlines that some printers drop entirely. An inner <svg>
 * with its own viewBox keeps stroke widths in page units.
 *
 * print-color-adjust: exact is load-bearing — browsers strip background fills
 * to save ink by default, which would erase the paper colour and the grid, the
 * entire point of printing a notebook.
 */
export function printDocument(strokes, { width, height, grid = true } = {}) {
  const inner = toSVG(strokes, { width, height, grid })
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')

  const box = A4.width - A4.margin * 2
  const scale = Math.min(box / width, (A4.height - A4.margin * 2) / height)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  return `<!doctype html>
<html lang="hy">
<head>
<meta charset="utf-8" />
<title>Տետր</title>
<style>
  @page { size: A4; margin: 10mm; }
  html, body {
    margin: 0; padding: 0; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet {
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: 100vh;
  }
  svg { display: block; background: ${PAPER}; }
</style>
</head>
<body>
  <div class="sheet">
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}">${inner}</svg>
  </div>
</body>
</html>`
}

export function print(strokes, opts = {}) {
  const html = printDocument(strokes, opts)
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(frame)

  const doc = frame.contentDocument
  doc.open()
  doc.write(html)
  doc.close()

  const go = () => {
    try {
      frame.contentWindow.focus()
      frame.contentWindow.print()
    } catch {}
    // Removing the frame immediately cancels the dialog in Safari.
    setTimeout(() => frame.remove(), 1000)
  }
  // Give the document a frame to lay out before the dialog blocks the thread.
  if (frame.contentWindow) setTimeout(go, 60)
  return frame
}
