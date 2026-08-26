import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { GRID, GRID_SIZE, GRID_WIDTH, LINECAP, LINEJOIN, MARGIN_LINE, PAPER, PENCIL_OPACITY, PEN_OPACITY, TAP_DRAG_LIMIT } from '../lib/constants.js'
import { dist } from '../lib/geometry.js'
import { snapToInstrument } from '../lib/instruments.js'
import { PENCIL_FILTER, PENCIL_FILTER_ID, filterRef } from '../lib/pencil.js'
import { isShape, shapeFromDrag } from '../lib/shapes.js'
import { play, unlock } from '../lib/sound.js'
import { defaultView, pinchToView, screenToWorld, viewBox as toViewBox } from '../lib/zoom.js'

const Canvas = forwardRef(function Canvas(
  { drawing, style, instrument, size, view = defaultView(), onViewChange, onTap, onDragInstrument },
  ref,
) {
  const svgRef = useRef(null)
  const startRef = useRef(null)
  const movedRef = useRef(0)
  const shapeLockRef = useRef(null)
  const pointersRef = useRef(new Map())
  const pinchRef = useRef(null)

  const screenOf = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect?.() || { left: 0, top: 0, width: size.width, height: size.height }
    return {
      x: ((e.clientX - rect.left) / (rect.width || 1)) * size.width,
      y: ((e.clientY - rect.top) / (rect.height || 1)) * size.height,
    }
  }, [size])

  const at = useCallback(
    (e) => {
      let point = screenToWorld(screenOf(e), view, size)
      point = snapToInstrument(point, instrument)
      return point
    },
    [instrument, screenOf, view, size],
  )

  useImperativeHandle(ref, () => ({ at, node: () => svgRef.current }), [at])

  const handleDown = useCallback(
    (e) => {
      unlock()
      if (e.button != null && e.button > 0) return
      e.preventDefault()
      svgRef.current?.setPointerCapture?.(e.pointerId)

      const screen = screenOf(e)
      pointersRef.current.set(e.pointerId, screen)

      if (pointersRef.current.size >= 2) {
        drawing.cancel()
        startRef.current = null
        const pts = [...pointersRef.current.values()]
        pinchRef.current = { view, a: pts[0], b: pts[1] }
        return
      }

      const point = at(e)
      startRef.current = { point, time: Date.now(), id: e.pointerId }
      movedRef.current = 0
      shapeLockRef.current = null

      if (onDragInstrument?.(point, 'down')) return
      if (isShape(style.shape)) return
      drawing.begin(point, style)
    },
    [at, drawing, style, onDragInstrument, screenOf, view],
  )

  const handleMove = useCallback(
    (e) => {
      e.preventDefault()
      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, screenOf(e))
      }
      if (pinchRef.current && pointersRef.current.size >= 2) {
        const pts = [...pointersRef.current.values()]
        onViewChange?.(pinchToView(
          pinchRef.current.view,
          pinchRef.current.a,
          pinchRef.current.b,
          pts[0],
          pts[1],
          size,
        ))
        return
      }
      if (!startRef.current) return
      if (onDragInstrument?.(at(e), 'move')) return
      if (isShape(style.shape)) {
        const now = at(e)
        movedRef.current = dist(startRef.current.point, now)
        const fig = shapeFromDrag(style.shape, startRef.current.point, now)
        if (fig.locked && fig.locked !== shapeLockRef.current) play('snap')
        shapeLockRef.current = fig.locked
        drawing.preview?.(fig.d)
        return
      }
      if (!drawing.isDrawing()) return
      const events = e.nativeEvent?.getCoalescedEvents?.() || []
      const raw = events.length ? events : [e]
      const points = raw.map((ev) => at(ev))
      const first = points[0]
      if (first) movedRef.current += dist(startRef.current.point, first)
      drawing.extend(points)
    },
    [at, drawing, onDragInstrument, style.shape, screenOf, size, onViewChange],
  )

  const handleUp = useCallback(
    (e) => {
      pointersRef.current.delete(e.pointerId)
      const pinched = !!pinchRef.current
      if (pointersRef.current.size < 2) pinchRef.current = null
      const start = startRef.current
      startRef.current = null
      svgRef.current?.releasePointerCapture?.(e.pointerId)
      if (!start || pinched) return
      if (onDragInstrument?.(at(e), 'up')) return
      const point = at(e)
      const travelled = dist(start.point, point)
      if (travelled <= TAP_DRAG_LIMIT) {
        drawing.preview?.('')
        const consumed = onTap?.(point)
        if (consumed) return
        if (isShape(style.shape)) return
      }
      if (isShape(style.shape)) {
        const fig = shapeFromDrag(style.shape, start.point, point)
        drawing.commitPath(fig.d, style, {
          points: fig.points,
          length: fig.length,
          cue: fig.locked ? 'snap' : 'stroke',
        })
        return
      }
      drawing.commit()
    },
    [at, drawing, onTap, onDragInstrument, style],
  )

  const { width, height } = size
  const cols = Math.ceil(width / GRID_SIZE)
  const rows = Math.ceil(height / GRID_SIZE)

  return (
    <svg
      ref={svgRef}
      className="paper"
      width={width}
      height={height}
      viewBox={toViewBox(view, size)}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <defs>
        <filter id={PENCIL_FILTER_ID} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={PENCIL_FILTER.baseFrequency}
            numOctaves={PENCIL_FILTER.numOctaves}
            seed={PENCIL_FILTER.seed}
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale={PENCIL_FILTER.scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <rect width={width} height={height} fill={PAPER} />
      <g className="grid" shapeRendering="crispEdges" aria-hidden="true">
        {Array.from({ length: cols }, (_, i) => (
          <line
            key={`v${i}`}
            x1={(i + 1) * GRID_SIZE} y1={0}
            x2={(i + 1) * GRID_SIZE} y2={height}
            stroke={GRID} strokeWidth={GRID_WIDTH}
          />
        ))}
        {Array.from({ length: rows }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0} y1={(i + 1) * GRID_SIZE}
            x2={width} y2={(i + 1) * GRID_SIZE}
            stroke={GRID} strokeWidth={GRID_WIDTH}
          />
        ))}
        <line
          x1={GRID_SIZE * 3} y1={0} x2={GRID_SIZE * 3} y2={height}
          stroke={MARGIN_LINE} strokeWidth={1}
        />
      </g>
      <g className="strokes" fill="none">
        {drawing.strokes.map((s) => (
          <path
            key={s.id}
            d={s.d}
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap={LINECAP}
            strokeLinejoin={LINEJOIN}
            strokeOpacity={s.pencil ? PENCIL_OPACITY : PEN_OPACITY}
            filter={filterRef(s.pencil)}
          />
        ))}
      </g>
      <path
        ref={drawing.liveRef}
        className="live"
        d=""
        fill="none"
        stroke={style.color}
        strokeWidth={style.width}
        strokeLinecap={LINECAP}
        strokeLinejoin={LINEJOIN}
        strokeOpacity={style.pencil ? PENCIL_OPACITY : PEN_OPACITY}
        filter={filterRef(style.pencil)}
      />
    </svg>
  )
})

export default Canvas
