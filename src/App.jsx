import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Canvas from './components/Canvas.jsx'
import Celebration from './components/Celebration.jsx'
import ExportDialog from './components/ExportDialog.jsx'
import Hint from './components/Hint.jsx'
import Instruments from './components/Instruments.jsx'
import Stats from './components/Stats.jsx'
import Toolbar from './components/Toolbar.jsx'
import ToolSheet from './components/ToolSheet.jsx'
import Wizard from './components/Wizard.jsx'
import { useDrawing } from './hooks/useDrawing.js'
import { load, usePersist } from './hooks/usePersist.js'
import { usePWA } from './hooks/usePWA.js'
import { DEFAULT_COLOR, DEFAULT_WIDTH } from './lib/constants.js'
// export serializes in ExportDialog so the review popup owns the file
import { SHAPE_FREE } from './lib/shapes.js'
import { ZOOM_STEP, clampView, defaultView, zoomAt } from './lib/zoom.js'
import { createTapTracker } from './lib/gestures.js'
import { CALLIPER, RULER, defaultCalliper, defaultRuler, grabHandle, translate } from './lib/instruments.js'
import { print } from './lib/print.js'
import { play } from './lib/sound.js'

function useViewport() {
  const [size, setSize] = useState(() => ({
    width: typeof window === 'undefined' ? 390 : window.innerWidth,
    height: typeof window === 'undefined' ? 700 : window.innerHeight,
  }))
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])
  return size
}

export default function App() {
  const size = useViewport()
  const drawing = useDrawing()
  const pwa = usePWA()

  const [style, setStyle] = useState({
    color: DEFAULT_COLOR,
    width: DEFAULT_WIDTH,
    pencil: true,
    shape: SHAPE_FREE,
  })
  const [instrument, setInstrument] = useState(null)
  const [party, setParty] = useState(false)
  const [coachTick, setCoachTick] = useState(0)
  const [view, setView] = useState(defaultView)
  const [exportOpen, setExportOpen] = useState(false)

  const canvasRef = useRef(null)
  const tapsRef = useRef(createTapTracker())
  const dragRef = useRef(null)

  usePersist({ pages: drawing.pages, index: drawing.pageIndex })

  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const saved = load()
    if (saved?.pages?.length || saved?.strokes?.length) drawing.restore(saved)
  }, [drawing])

  const celebrate = useCallback(() => {
    play('celebrate')
    setParty(true)
    setTimeout(() => setParty(false), 410)
  }, [])

  const handleTap = useCallback(
    (point) => {
      if (!tapsRef.current.push(point)) return false
      drawing.cancel()
      setInstrument((cur) => {
        if (!cur) return defaultRuler(size.width, size.height)
        if (cur.kind === RULER) return defaultCalliper(size.width, size.height)
        return null
      })
      celebrate()
      return true
    },
    [drawing, size.width, size.height, celebrate],
  )

  const handleInstrumentDrag = useCallback(
    (point, phase) => {
      if (!instrument) return false
      if (phase === 'down') {
        const handle = grabHandle(point, instrument)
        const near = handle || isNearBody(point, instrument)
        if (!near) return false
        dragRef.current = { handle, last: point }
        return true
      }
      if (!dragRef.current) return false
      if (phase === 'move') {
        const { handle, last } = dragRef.current
        setInstrument((cur) => {
          if (!cur) return cur
          if (handle) return { ...cur, [handle]: point }
          return translate(cur, point.x - last.x, point.y - last.y)
        })
        dragRef.current.last = point
        return true
      }
      dragRef.current = null
      return true
    },
    [instrument],
  )

  const handleExport = useCallback(() => {
    setExportOpen(true)
  }, [])

  const handlePrint = useCallback(
    (grid = true) => {
      print(drawing.strokes, { width: size.width, height: size.height, grid })
    },
    [drawing.strokes, size],
  )

  const bumpZoom = useCallback((delta) => {
    setView((cur) => zoomAt(
      cur,
      size,
      { x: size.width / 2, y: size.height / 2 },
      cur.scale + delta,
    ))
  }, [size])

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'z') {
        e.preventDefault()
        e.shiftKey ? drawing.redo() : drawing.undo()
      } else if (key === 's') {
        e.preventDefault()
        handleExport()
      } else if (key === 'p') {
        e.preventDefault()
        handlePrint(true)
      }
    }
    const onPlain = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target?.closest?.('input, textarea')) return
      if (e.key === '[') drawing.goPage(drawing.pageIndex - 1)
      if (e.key === ']') drawing.goPage(drawing.pageIndex + 1)
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        bumpZoom(ZOOM_STEP)
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        bumpZoom(-ZOOM_STEP)
      }
      if (e.key === '0') setView(defaultView())
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keydown', onPlain)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onPlain)
    }
  }, [drawing, handleExport, handlePrint, bumpZoom])

  const byColor = useMemo(() => drawing.stats.byColor, [drawing.stats.byColor])

  return (
    <div className="app">
      <Canvas
        ref={canvasRef}
        drawing={drawing}
        style={style}
        instrument={instrument}
        size={size}
        view={view}
        onViewChange={(next) => setView(clampView(next, size))}
        onTap={handleTap}
        onDragInstrument={handleInstrumentDrag}
      />
      <Instruments instrument={instrument} size={size} view={view} />
      <ToolSheet
        value={style.shape}
        onChange={(shape) => setStyle((s) => ({ ...s, shape }))}
      />
      <Toolbar
        style={style}
        setStyle={setStyle}
        drawing={drawing}
        byColor={byColor}
        view={view}
        onExport={handleExport}
        onPrint={handlePrint}
        onPrevPage={() => drawing.goPage(drawing.pageIndex - 1)}
        onNextPage={() => drawing.goPage(drawing.pageIndex + 1)}
        onAddPage={drawing.addPage}
        onZoomIn={() => bumpZoom(ZOOM_STEP)}
        onZoomOut={() => bumpZoom(-ZOOM_STEP)}
        onZoomReset={() => setView(defaultView())}
      />
      <Hint shape={style.shape} />
      <Stats
        stats={drawing.stats}
        offline={pwa.offline}
        onHelp={() => setCoachTick((n) => n + 1)}
      />
      <Wizard replay={coachTick} />
      <Celebration active={party} />
      {exportOpen && (
        <ExportDialog
          strokes={drawing.strokes}
          size={size}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}

function isNearBody(point, instrument) {
  const { a, b } = instrument
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  if (len === 0) return false
  const t = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / (len * len)
  if (t < 0 || t > 1) return false
  const px = a.x + t * (b.x - a.x)
  const py = a.y + t * (b.y - a.y)
  const reach = instrument.kind === CALLIPER ? 16 : 28
  return Math.hypot(point.x - px, point.y - py) <= reach
}
