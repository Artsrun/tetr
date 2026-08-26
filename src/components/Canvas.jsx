import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { GRID, GRID_SIZE, GRID_WIDTH, LINECAP, LINEJOIN, MARGIN_LINE, PAPER, PENCIL_OPACITY, PEN_OPACITY, TAP_DRAG_LIMIT } from '../lib/constants.js'
import { dist } from '../lib/geometry.js'
import { snapToInstrument } from '../lib/instruments.js'
import { PENCIL_FILTER, PENCIL_FILTER_ID, filterRef } from '../lib/pencil.js'
import { unlock } from '../lib/sound.js'

/**
 * touch-action: none on the SVG and overscroll-behavior: none on body — set in
 * index.css. Without both, a downward stroke scrolls the page or triggers
 * pull-to-refresh (CLAUDE.md).
 */
const Canvas = forwardRef(function Canvas(
  { drawing, style, instrument, size, onTap, onDragInstrument },
  ref,
) {
  const svgRef = useRef(null)
  const startRef = useRef(null)
  const movedRef = useRef(0)

  /**
   * The single coordinate source. Ruler snapping happens here, at the source,
   * so every consumer — drawing, gestures, instruments — sees the same point
   * (CLAUDE.md).
   */
  const at = useCallback(
    (e) => {
      const rect = svgRef.current?.getBoundingClientRect?.() || { left: 0, top: 0 }
      let point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      point = snapToInstrument(point, instrument)
      return point
    },
    [instrument],
  )

  useImperativeHandle(ref, () => ({ at, node: () => svgRef.current }), [at])

  const handleDown = useCallback(
    (e) => {
      unlock() // First pointerdown anywhere primes audio (iOS).
      if (e.button != null && e.button > 0) return
      e.preventDefault()
      svgRef.current?.setPointerCapture?.(e.pointerId)

      const point = at(e)
      startRef.current = { point, time: Date.now(), id: e.pointerId }
      movedRef.current = 0

      if (onDragInstrument?.(point, 'down')) return
      drawing.begin(point, style)
    },
    [at, drawing, style, onDragInstrument],
  )

  const handleMove = useCallback(
    (e) => {
      if (!startRef.current) return
      e.preventDefault()

      if (onDragInstrument?.(at(e), 'move')) return
      if (!drawing.isDrawing()) return

      // getCoalescedEvents replays the samples the browser batched between
      // frames. On 120Hz displays it is the difference between a smooth curve
      // and a faceted one (CLAUDE.md).
      const events = e.nativeEvent?.getCoalescedEvents?.() || []
      const raw = events.length ? events : [e]

      const points = raw.map((ev) => at(ev))
      const first = points[0]
      if (first) movedRef.current += dist(startRef.current.point, first)

      drawing.extend(points)
    },
    [at, drawing, onDragInstrument],
  )

  const handleUp = useCallback(
    (e) => {
      const start = startRef.current
      startRef.current = null
      if (!start) return
      svgRef.current?.releasePointerCapture?.(e.pointerId)

      if (onDragInstrument?.(at(e), 'up')) return

      const point = at(e)
      const travelled = dist(start.point, point)

      // A tap is a tap only if it never became a drag.
      if (travelled <= TAP_DRAG_LIMIT) {
        const consumed = onTap?.(point)
        // The gesture handler calls drawing.cancel() when it consumes the tap,
        // so a completed triple-tap doesn't also commit three dots.
        if (consumed) return
      }
      drawing.commit()
    },
    [at, drawing, onTap, onDragInstrument],
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
      viewBox={`0 0 ${width} ${height}`}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <defs>
        {/* The filter stays in <defs> even when pencil is off — adding and
            removing it forces Safari to re-rasterize every stroke on toggle. */}
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

      {/* Committed strokes render from state normally. Pencil is per-stroke —
          strokes record how they were drawn, so switching tools doesn't
          retroactively rewrite the page. */}
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

      {/* The live stroke. useDrawing writes this node's `d` directly. */}
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
