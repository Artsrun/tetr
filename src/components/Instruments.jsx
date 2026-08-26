import { CALLIPER, measure } from '../lib/instruments.js'

/**
 * Instruments render in a sibling <svg>, not the paper (CLAUDE.md) — a ruler
 * that ends up in someone's Figma file is a bug.
 */
export default function Instruments({ instrument, size }) {
  if (!instrument) return null
  const m = measure(instrument)
  const { a, b } = instrument
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)

  return (
    <svg
      className="instruments"
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      aria-hidden="true"
    >
      <g transform={`rotate(${angle} ${mid.x} ${mid.y})`}>
        <rect
          className="instrument__body"
          x={mid.x - Math.hypot(b.x - a.x, b.y - a.y) / 2}
          y={mid.y - (instrument.kind === CALLIPER ? 14 : 26)}
          width={Math.hypot(b.x - a.x, b.y - a.y)}
          height={instrument.kind === CALLIPER ? 28 : 52}
          rx="3"
        />
      </g>
      <circle className="instrument__handle" cx={a.x} cy={a.y} r="11" />
      <circle className="instrument__handle" cx={b.x} cy={b.y} r="11" />
      <text className="instrument__readout" x={mid.x} y={mid.y - 34} textAnchor="middle">
        {m.cells} □ · {m.angle}°
      </text>
    </svg>
  )
}
