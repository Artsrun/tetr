// MIN_ZOOM is below 1 on purpose: at 50% two sheets and the binding fit on a
// 390px phone, which is what a notebook looks like when you open it flat.
// See spread.js for who sits on which side.
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 2.5
export const ZOOM_STEP = 0.25

export const defaultView = () => ({ scale: 1, x: 0, y: 0 })

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

const neat = (n) => Math.round(n * 1000) / 1000

/** Screen point is relative to the SVG client box. */
export function screenToWorld(screen, view, size) {
  const scale = view.scale || 1
  return {
    x: neat(view.x + screen.x / scale),
    y: neat(view.y + screen.y / scale),
  }
}

/**
 * Pan bounds for one axis. When the window is wider than the world — which is
 * exactly what zooming out means — there is nothing to pan, so the world is
 * centred instead of pinned to the left edge with dead space beside it.
 */
function axis(value, world, span) {
  if (world <= span) return neat((world - span) / 2)
  return clamp(value, 0, world - span)
}

/**
 * `world` defaults to one sheet; a spread passes two sheets and the gutter.
 * It may also be a function of scale, because whether the notebook lies flat
 * depends on the scale being clamped to — see spread.isSpread.
 */
function worldFor(world, size, scale) {
  const w = typeof world === 'function' ? world(scale) : world
  return { width: w?.width || size.width, height: w?.height || size.height }
}

export function clampView(view, size, world = null) {
  const scale = clamp(view.scale || 1, MIN_ZOOM, MAX_ZOOM)
  const w = worldFor(world, size, scale)
  return {
    scale,
    x: axis(view.x, w.width, size.width / scale),
    y: axis(view.y, w.height, size.height / scale),
  }
}

/** Zoom so the world point under `screen` stays put. */
export function zoomAt(view, size, screen, nextScale, world = null) {
  const point = screenToWorld(screen, view, size)
  const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM)
  return clampView({
    scale,
    x: point.x - screen.x / scale,
    y: point.y - screen.y / scale,
  }, size, world)
}

export function pinchToView(startView, startA, startB, nowA, nowB, size, world = null) {
  const startDist = Math.hypot(startB.x - startA.x, startB.y - startA.y) || 1
  const nowDist = Math.hypot(nowB.x - nowA.x, nowB.y - nowA.y) || 1
  const mid = { x: (nowA.x + nowB.x) / 2, y: (nowA.y + nowB.y) / 2 }
  return zoomAt(startView, size, mid, startView.scale * (nowDist / startDist), world)
}

export function viewBox(view, size) {
  const scale = view.scale || 1
  return `${view.x} ${view.y} ${size.width / scale} ${size.height / scale}`
}
