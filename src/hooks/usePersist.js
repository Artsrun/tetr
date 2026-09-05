import { useEffect, useRef } from 'react'
import { STORAGE_KEY } from '../lib/constants.js'

export const slim = (strokes) =>
  strokes.map(({ id, d, color, width, pencil, length }) => ({
    id, d, color, width, pencil, length,
  }))

function toBook(input) {
  if (Array.isArray(input)) {
    return { index: 0, pages: [{ strokes: slim(input), redo: [] }] }
  }
  const pages = (input?.pages || [{ strokes: input?.strokes || [], redo: [] }]).map((p) => ({
    strokes: slim(p.strokes || []),
    redo: slim(p.redo || []),
  }))
  return {
    index: Math.max(0, Math.min(input?.index || 0, Math.max(0, pages.length - 1))),
    pages: pages.length ? pages : [{ strokes: [], redo: [] }],
  }
}

export function save(input, key = STORAGE_KEY) {
  try {
    const book = toBook(input)
    // v:1 + top-level strokes: old loaders keep working. pages is additive.
    localStorage.setItem(
      key,
      JSON.stringify({
        v: 1,
        at: Date.now(),
        index: book.index,
        pages: book.pages,
        strokes: book.pages[book.index]?.strokes || [],
      }),
    )
    return true
  } catch {
    return false
  }
}

export function load(key = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (Array.isArray(parsed.pages) && parsed.pages.length) {
      const index = Math.max(0, Math.min(parsed.index || 0, parsed.pages.length - 1))
      return {
        v: parsed.v || 1,
        at: parsed.at,
        index,
        pages: parsed.pages,
        strokes: parsed.pages[index]?.strokes || parsed.strokes || [],
      }
    }
    if (!Array.isArray(parsed.strokes)) return null
    return {
      v: parsed.v || 1,
      at: parsed.at,
      index: 0,
      pages: [{ strokes: parsed.strokes, redo: [] }],
      strokes: parsed.strokes,
    }
  } catch {
    return null
  }
}

export function clearSaved(key = STORAGE_KEY) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export function usePersist(book, { enabled = true, delay = 800 } = {}) {
  const latest = useRef(book)
  latest.current = book
  const pages = Array.isArray(book) ? book : book?.pages
  const index = Array.isArray(book) ? 0 : book?.index

  useEffect(() => {
    if (!enabled) return
    const t = setTimeout(() => save(latest.current), delay)
    return () => clearTimeout(t)
  }, [pages, index, enabled, delay])

  useEffect(() => {
    if (!enabled) return
    const flush = () => save(latest.current)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled])
}
