import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Canvas from './components/Canvas.jsx'
import Celebration from './components/Celebration.jsx'
import Hint from './components/Hint.jsx'
import Instruments from './components/Instruments.jsx'
import Stats from './components/Stats.jsx'
import Toolbar from './components/Toolbar.jsx'
import Wizard from './components/Wizard.jsx'
import { useDrawing } from './hooks/useDrawing.js'
import { load, usePersist } from './hooks/usePersist.js'
import { usePWA } from './hooks/usePWA.js'
import { DEFAULT_COLOR, DEFAULT_WIDTH } from './lib/constants.js'
import { download, filename, toSVG } from './lib/export.js'
import { SHAPE_FREE } from './lib/shapes.js'
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

  const canvasRef = useRef(null)
  const tapsRef = useRef(createTapTracker())
  const dragRef = useRef(null)

  usePersist(drawing.strokes)

  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const saved = load()
    if (saved?.strokes?.length) drawing.restore(saved)
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
    const svg = toSVG(drawing.strokes, { width: size.width, height: size.height })
    download(svg, filename())
  }, [drawing.strokes, size])

  const handlePrint = useCallback(
    (grid = true) => {
      print(drawing.strokes, { width: size.width, height: size.height, grid })
    },
    [drawing.strokes, size],
  )

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
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawing, handleExport, handlePrint])

  const byColor = useMemo(() => drawing.stats.byColor, [drawing.stats.byColor])

  return (
    <div className="app">
      <Canvas
        ref={canvasRef}
        drawing={drawing}
        style={style}
        instrument={instrument}
        size={size}
        onTap={handleTap}
        onDragInstrument={handleInstrumentDrag}
      />
      <Instruments instrument={instrument} size={size} />
      <Toolbar
        style={style}
        setStyle={setStyle}
        drawing={drawing}
        byColor={byColor}
        onExport={handleExport}
        onPrint={handlePrint}
      />
      <Hint shape={style.shape} />
      <Stats
        stats={drawing.stats}
        offline={pwa.offline}
        onHelp={() => setCoachTick((n) => n + 1)}
      />
      <Wizard replay={coachTick} />
      <Celebration active={party} />
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
