import { useCallback, useMemo, useRef, useState } from 'react'
import { GRID_SIZE, PENCIL_OPACITY, PEN_OPACITY } from '../lib/constants.js'
import { pathLength, toPath } from '../lib/geometry.js'
import { play } from '../lib/sound.js'

let seq = 0
const nextId = () => `s${++seq}${Date.now().toString(36)}`

/**
 * All stroke state, history and derived stats.
 *
 * The live stroke bypasses React (CLAUDE.md): during a drag we mutate the
 * <path> node directly through liveRef. Pointermove fires up to 120×/sec, and
 * a setState per event means a reconcile per event — the line visibly trails
 * the finger. Committed strokes render from state normally.
 */
export function useDrawing() {
  const [history, setHistory] = useState({ strokes: [], redo: [] })
  const { strokes, redo: redoStack } = history

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
  }, [])

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
  }, [])

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
  }, [])

  const redo = useCallback(() => {
    let moved = null
    setHistory((prev) => {
      if (!prev.redo.length) return prev
      moved = prev.redo[prev.redo.length - 1]
      return { strokes: [...prev.strokes, moved], redo: prev.redo.slice(0, -1) }
    })
    if (moved) play('redo')
    return moved
  }, [])

  const clear = useCallback(() => {
    let cleared = []
    setHistory((prev) => {
      cleared = prev.strokes
      return { strokes: [], redo: [...prev.redo, ...prev.strokes] }
    })
    play('clear')
    return cleared
  }, [])

  const restore = useCallback((saved) => {
    if (!saved || !Array.isArray(saved.strokes)) return false
    setHistory({ strokes: saved.strokes, redo: [] })
    return true
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
    canUndo: strokes.length > 0,
    canRedo: redoStack.length > 0,
  }
}
