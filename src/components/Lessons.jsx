import { useEffect, useRef, useState } from 'react'
import { measure } from '../lib/instruments.js'
import {
  LESSON_GROUPS, explainAngle, explainSpan, lessonsIn, pythagoras,
} from '../lib/lessons.js'
import ToolButton from './ToolButton.jsx'

/** What the calliper is reading, said in words. Null when it is put away. */
function Reading({ instrument }) {
  if (!instrument) return null
  const m = measure(instrument)
  const span = explainSpan(m.px)
  const a = explainAngle(m.angle)
  const dx = Math.abs(instrument.b.x - instrument.a.x)
  const dy = Math.abs(instrument.b.y - instrument.a.y)

  return (
    <div className="lessons__reading">
      <p className="lessons__kicker">Կարկինը ցույց է տալիս</p>
      <p className="lessons__reading-line">
        <b>{span.cells} □</b> = {span.mm} մմ = {span.cm} սմ
      </p>
      <p className="lessons__reading-line">
        <b>{a.deg}°</b> · {a.kind.label} · {a.radians} rad · {a.turn} պտույտ
      </p>
      <p className="lessons__reading-note">
        {a.complement === null ? '' : `Լրացուցիչը՝ ${a.complement}°։ `}
        {a.supplement === null ? '' : `Հարակիցը՝ ${a.supplement}°։ `}
        {dx > 1 && dy > 1
          ? `Էջերը ${explainSpan(dx).cells} □ և ${explainSpan(dy).cells} □, ներքնաձիգը՝ ${explainSpan(pythagoras(dx, dy)).cells} □։`
          : ''}
      </p>
    </div>
  )
}

/**
 * The explanation over the measurement. Everything here is school algebra and
 * geometry — the same maths the grid was printed for — and all of it comes out
 * of lessons.js, so the panel and the calliper can never disagree.
 */
export default function Lessons({ instrument, onClose }) {
  const [group, setGroup] = useState(LESSON_GROUPS[0].id)
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="lessons"
      role="dialog"
      aria-label="Անկյուն և չափ"
      onPointerDown={(e) => {
        if (!ref.current?.contains(e.target)) onClose?.()
      }}
    >
      <div className="lessons__card" ref={ref}>
        <div className="lessons__head">
          <h2 className="lessons__title">Անկյուն և չափ</h2>
          <ToolButton label="Փակել" className="lessons__close" onPress={onClose}>✕</ToolButton>
        </div>

        <Reading instrument={instrument} />

        <div className="lessons__tabs" role="group" aria-label="Բաժիններ">
          {LESSON_GROUPS.map((g) => (
            <ToolButton
              key={g.id}
              label={g.label}
              className="lessons__tab"
              active={group === g.id}
              onPress={() => setGroup(g.id)}
            >
              {g.label}
            </ToolButton>
          ))}
        </div>

        <div className="lessons__list">
          {lessonsIn(group).map((l) => (
            <article key={l.id} className="lessons__item">
              <h3 className="lessons__item-title">{l.title}</h3>
              <p className="lessons__formula">{l.formula}</p>
              <p className="lessons__body">{l.body}</p>
            </article>
          ))}
        </div>

        <p className="lessons__foot">
          Երեք հպում թղթին՝ կարկինը դուրս է գալիս և չափում է հենց այս վանդակներով։
        </p>
      </div>
    </div>
  )
}
