import { useCallback, useMemo, useRef, useState } from 'react'
import { GRID_SIZE, PENCIL_OPACITY, PEN_OPACITY } from '../lib/constants.js'
import { pathLength, toPath } from '../lib/geometry.js'
import { play } from '../lib/sound.js'

let seq = 0
const nextId = () => `s${++seq}${Date.now().toString(36)}`

const emptyPage = () => ({ strokes: [], redo: [] })
export const MAX_PAGES = 12

export function useDrawing() {
  const [book, setBook] = useState({ pages: [emptyPage()], index: 0 })
  const page = book.pages[book.index] || emptyPage()
  const { strokes, redo: redoStack } = page

  const setHistory = useCallback((updater) => {
    setBook((prev) => {
      const pages = prev.pages.slice()
      const cur = pages[prev.index] || emptyPage()
      const next = typeof updater === 'function' ? updater(cur) : updater
      if (next === cur) return prev
      pages[prev.index] = next
      return { ...prev, pages }
    })
  }, [])

  const liveRef = useRef(null)
  const pointsRef = useRef([])
  const styleRef = useRef(null)
  const drawingRef = useRef(false)

  const begin = useCallback((point, style) => {
    drawingRef.current = true
    pointsRef.current = [point]
    styleRef.current = style
    if (liveRef.current) {
      liveRef.current.setAttribute('d', toPath(pointsRef.current))
      liveRef.current.setAttribute('stroke', style.color)
      liveRef.current.setAttribute('stroke-width', String(style.width))
      liveRef.current.setAttribute(
        'stroke-opacity',
        String(style.pencil ? PENCIL_OPACITY : PEN_OPACITY),
      )
    }
  }, [])

  const extend = useCallback((points) => {
    if (!drawingRef.current) return
    const list = Array.isArray(points) ? points : [points]
    if (!list.length) return
    pointsRef.current.push(...list)
    if (liveRef.current) liveRef.current.setAttribute('d', toPath(pointsRef.current))
  }, [])

  const commit = useCallback(() => {
    if (!drawingRef.current) return null
    drawingRef.current = false
    const points = pointsRef.current
    const style = styleRef.current
    pointsRef.current = []
    if (!points.length || !style) return null
    const stroke = {
      id: nextId(),
      d: toPath(points),
      points,
      color: style.color,
      width: style.width,
      pencil: !!style.pencil,
      length: pathLength(points),
    }
    setHistory((prev) => ({ strokes: [...prev.strokes, stroke], redo: [] }))
    if (liveRef.current) liveRef.current.setAttribute('d', '')
    play('stroke')
    return stroke
  }, [setHistory])

  const preview = useCallback((d) => {
    if (liveRef.current) liveRef.current.setAttribute('d', d || '')
  }, [])

  const commitPath = useCallback((d, style, extras = {}) => {
    drawingRef.current = false
    pointsRef.current = []
    if (!d || !style) {
      if (liveRef.current) liveRef.current.setAttribute('d', '')
      return null
    }
    const stroke = {
      id: nextId(),
      d,
      points: extras.points,
      color: style.color,
      width: style.width,
      pencil: !!style.pencil,
      length: extras.length || 0,
    }
    setHistory((prev) => ({ strokes: [...prev.strokes, stroke], redo: [] }))
    if (liveRef.current) liveRef.current.setAttribute('d', '')
    play(extras.cue || 'stroke')
    return stroke
  }, [setHistory])

  const cancel = useCallback(() => {
    drawingRef.current = false
    pointsRef.current = []
    if (liveRef.current) liveRef.current.setAttribute('d', '')
  }, [])

  const undo = useCallback(() => {
    let moved = null
    setHistory((prev) => {
      if (!prev.strokes.length) return prev
      moved = prev.strokes[prev.strokes.length - 1]
      return { strokes: prev.strokes.slice(0, -1), redo: [...prev.redo, moved] }
    })
    if (moved) play('undo')
    return moved
  }, [setHistory])

  const redo = useCallback(() => {
    let moved = null
    setHistory((prev) => {
      if (!prev.redo.length) return prev
      moved = prev.redo[prev.redo.length - 1]
      return { strokes: [...prev.strokes, moved], redo: prev.redo.slice(0, -1) }
    })
    if (moved) play('redo')
    return moved
  }, [setHistory])

  const clear = useCallback(() => {
    let cleared = []
    setHistory((prev) => {
      cleared = prev.strokes
      return { strokes: [], redo: [...prev.redo, ...prev.strokes] }
    })
    play('clear')
    return cleared
  }, [setHistory])

  const restore = useCallback((saved) => {
    if (saved?.pages && Array.isArray(saved.pages) && saved.pages.length) {
      const pages = saved.pages.map((p) => ({
        strokes: Array.isArray(p.strokes) ? p.strokes : [],
        redo: Array.isArray(p.redo) ? p.redo : [],
      }))
      const index = Math.max(0, Math.min(saved.index || 0, pages.length - 1))
      setBook({ pages, index })
      return true
    }
    if (!saved || !Array.isArray(saved.strokes)) return false
    setBook({ pages: [{ strokes: saved.strokes, redo: [] }], index: 0 })
    return true
  }, [])

  const addPage = useCallback(() => {
    let added = false
    setBook((prev) => {
      if (prev.pages.length >= MAX_PAGES) return prev
      added = true
      return { pages: [...prev.pages, emptyPage()], index: prev.pages.length }
    })
    if (added) play('flip')
    return added
  }, [])

  const goPage = useCallback((i) => {
    let changed = false
    setBook((prev) => {
      const index = Math.max(0, Math.min(i, prev.pages.length - 1))
      if (index === prev.index) return prev
      changed = true
      return { ...prev, index }
    })
    if (changed) play('flip')
    return changed
  }, [])

  const removePage = useCallback(() => {
    let removed = false
    setBook((prev) => {
      if (prev.pages.length <= 1) {
        if (!prev.pages[0]?.strokes.length) return prev
        removed = true
        return { pages: [emptyPage()], index: 0 }
      }
      removed = true
      const pages = prev.pages.slice()
      pages.splice(prev.index, 1)
      return { pages, index: Math.min(prev.index, pages.length - 1) }
    })
    if (removed) play('flip')
    return removed
  }, [])

  const stats = useMemo(() => {
    const total = strokes.reduce((sum, s) => sum + (s.length || 0), 0)
    const byColor = {}
    for (const s of strokes) byColor[s.color] = (byColor[s.color] || 0) + (s.length || 1)
    return {
      strokes: strokes.length,
      cells: Math.round(total / GRID_SIZE),
      metres: Math.round(total / 37.8 / 10) / 10,
      byColor,
      pencilShare: strokes.length
        ? strokes.filter((s) => s.pencil).length / strokes.length
        : 0,
    }
  }, [strokes])

  return {
    strokes,
    stats,
    liveRef,
    isDrawing: () => drawingRef.current,
    begin,
    extend,
    commit,
    preview,
    commitPath,
    cancel,
    undo,
    redo,
    clear,
    restore,
    addPage,
    goPage,
    removePage,
    pageIndex: book.index,
    pageCount: book.pages.length,
    pages: book.pages,
    canAddPage: book.pages.length < MAX_PAGES,
    canUndo: strokes.length > 0,
    canRedo: redoStack.length > 0,
  }
}
