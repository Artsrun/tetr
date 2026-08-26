export const MIN_ZOOM = 1
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

export function clampView(view, size) {
  const scale = clamp(view.scale || 1, MIN_ZOOM, MAX_ZOOM)
  const vw = size.width / scale
  const vh = size.height / scale
  return {
    scale,
    x: clamp(view.x, 0, Math.max(0, size.width - vw)),
    y: clamp(view.y, 0, Math.max(0, size.height - vh)),
  }
}

/** Zoom so the world point under `screen` stays put. */
export function zoomAt(view, size, screen, nextScale) {
  const world = screenToWorld(screen, view, size)
  const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM)
  return clampView({
    scale,
    x: world.x - screen.x / scale,
    y: world.y - screen.y / scale,
  }, size)
}

export function pinchToView(startView, startA, startB, nowA, nowB, size) {
  const startDist = Math.hypot(startB.x - startA.x, startB.y - startA.y) || 1
  const nowDist = Math.hypot(nowB.x - nowA.x, nowB.y - nowA.y) || 1
  const mid = { x: (nowA.x + nowB.x) / 2, y: (nowA.y + nowB.y) / 2 }
  return zoomAt(startView, size, mid, startView.scale * (nowDist / startDist))
}

export function viewBox(view, size) {
  const scale = view.scale || 1
  return `${view.x} ${view.y} ${size.width / scale} ${size.height / scale}`
}
