import { useCallback, useEffect, useState } from 'react'
import ToolButton from './ToolButton.jsx'

export const WIZARD_KEY = 'tetr:wizard:v1'

export const STEPS = [
  {
    id: 'draw',
    kicker: '1 / 4',
    title: 'Գծիր մատով',
    body: 'Թղղթը վանդակավոր տետր է։ Մեկ հպումը կետ է, քաշելը՝ գիծ։',
  },
  {
    id: 'shape',
    kicker: '2 / 4',
    title: 'Պատկեր ընտրիր',
    body: 'Գիծ, ուղղանկյուն, շրջան, եռանկյուն։ Մաշիր անկյունից անկյուն։',
  },
  {
    id: 'lock',
    kicker: '3 / 4',
    title: 'Վանդակը բռնում է',
    body: 'Գրեթե քառակուսի կամ շրջան՝ կողպվում է։ Կլիկը նշանակում է՝ նստեց։',
  },
  {
    id: 'ruler',
    kicker: '4 / 4',
    title: 'Երեք հպում',
    body: 'Նույն կետին երեք անգամ՝ քանոն։ Եւս երեքը՝ կարկին։ Եւս երեքը՝ հանվում է։',
  },
]

function readDone() {
  try {
    return localStorage.getItem(WIZARD_KEY) === 'done'
  } catch {
    return false
  }
}

function writeDone() {
  try {
    localStorage.setItem(WIZARD_KEY, 'done')
  } catch {}
}

export default function Wizard({ replay = 0, onOpenChange }) {
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(() => !readDone())

  useEffect(() => {
    if (!replay) return
    setStep(0)
    setOpen(true)
  }, [replay])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  const close = useCallback(() => {
    writeDone()
    setOpen(false)
  }, [])

  const next = useCallback(() => {
    setStep((i) => {
      if (i >= STEPS.length - 1) {
        writeDone()
        setOpen(false)
        return i
      }
      return i + 1
    })
  }, [])

  if (!open) return null

  const current = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <div className="coach" role="dialog" aria-label="Ուղեցույց" aria-describedby="coach-body">
      <div className="coach__pips" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s.id} className={`coach__pip ${i === step ? 'is-on' : ''} ${i < step ? 'is-done' : ''}`} />
        ))}
      </div>
      <p className="coach__kicker">{current.kicker}</p>
      <h2 className="coach__title">{current.title}</h2>
      <p className="coach__body" id="coach-body">{current.body}</p>
      <div className="coach__row">
        <ToolButton label="Բաց թողնել" className="coach__skip" cue="tap" onPress={close}>
          Բաց թողել
        </ToolButton>
        <ToolButton label={last ? 'Հասկացա' : 'Հաջորդ'} className="coach__next" cue="tap" onPress={next}>
          {last ? 'Հասկացա' : 'Հաջորդ'}
        </ToolButton>
      </div>
    </div>
  )
}
