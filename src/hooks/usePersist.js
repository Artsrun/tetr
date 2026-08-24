import { useEffect, useRef } from 'react'
import { STORAGE_KEY } from '../lib/constants.js'

/**
 * Autosave to localStorage.
 *
 * Persistence drops `points` before writing (CLAUDE.md): only the rendered `d`
 * string is kept. Points are ~20× the size and are only needed for live
 * smoothing, which by definition isn't happening for a committed stroke.
 *
 * localStorage over IndexedDB, and pagehide over beforeunload, for the same
 * reason: iOS never fires beforeunload when an app is swiped away, and
 * synchronous writes survive abrupt termination.
 */
export const slim = (strokes) =>
  strokes.map(({ id, d, color, width, pencil, length }) => ({
    id, d, color, width, pencil, length,
  }))

export function save(strokes, key = STORAGE_KEY) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ v: 1, at: Date.now(), strokes: slim(strokes) }),
    )
    return true
  } catch {
    // Quota, private mode, disabled storage — never break drawing over it.
    return false
  }
}

export function load(key = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.strokes)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearSaved(key = STORAGE_KEY) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export function usePersist(strokes, { enabled = true, delay = 800 } = {}) {
  const latest = useRef(strokes)
  latest.current = strokes

  useEffect(() => {
    if (!enabled) return
    const t = setTimeout(() => save(latest.current), delay)
    return () => clearTimeout(t)
  }, [strokes, enabled, delay])

  useEffect(() => {
    if (!enabled) return
    const flush = () => save(latest.current)
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    return () => window.removeEventListener('pagehide', flush)
  }, [enabled])
}
