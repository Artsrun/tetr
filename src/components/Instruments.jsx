import { measure } from '../lib/instruments.js'
import { angleArcPath, classifyAngle, explainSpan, supplement } from '../lib/lessons.js'
import { defaultView, viewBox as toViewBox } from '../lib/zoom.js'

const CALLIPER_HALF = 14
const ARC_R = 34

/**
 * The calliper, and the sentence the calliper is a picture of. The reading
 * names the angle the way a textbook would and shows the arc it is measuring,
 * so the number is never just a number — see lessons.js for the words.
 *
 * Still a sibling <svg>, never the paper (CLAUDE.md): an instrument that ends
 * up in someone's Figma file is a bug.
 */
export default function Instruments({ instrument, size, view = defaultView(), originX = 0 }) {
  if (!instrument) return null
  const m = measure(instrument)
  const { a, b } = instrument
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
  const span = explainSpan(m.px)
  const kind = classifyAngle(m.angle)
  const sup = supplement(m.angle)

  return (
    <svg
      className="instruments"
      width={size.width}
      height={size.height}
      viewBox={toViewBox(view, size)}
      aria-hidden="true"
    >
      <g transform={originX ? `translate(${originX} 0)` : undefined}>
        <path className="instrument__arc" d={angleArcPath(a, ARC_R, m.angle)} fill="none" />
        <line className="instrument__base" x1={a.x} y1={a.y} x2={a.x + ARC_R + 10} y2={a.y} />
        <g transform={`rotate(${angle} ${mid.x} ${mid.y})`}>
          <rect
            className="instrument__body"
            x={mid.x - Math.hypot(b.x - a.x, b.y - a.y) / 2}
            y={mid.y - CALLIPER_HALF}
            width={Math.hypot(b.x - a.x, b.y - a.y)}
            height={CALLIPER_HALF * 2}
            rx="3"
          />
        </g>
        <circle className="instrument__handle" cx={a.x} cy={a.y} r="11" />
        <circle className="instrument__handle" cx={b.x} cy={b.y} r="11" />
        <text className="instrument__readout" x={mid.x} y={mid.y - 34} textAnchor="middle">
          {span.cells} □ · {span.mm} մմ · {m.angle}°
        </text>
        <text className="instrument__lesson" x={mid.x} y={mid.y - 20} textAnchor="middle">
          {kind.label}{sup === null ? '' : ` · հարակիցը ${sup}°`}
        </text>
      </g>
    </svg>
  )
}
