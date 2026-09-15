import { useCallback, useEffect, useState } from 'react'
import ToolButton from './ToolButton.jsx'

export const WIZARD_KEY = 'tetr:wizard:v1'

/** Each edition gets its own key: a new cover deserves its own first run. */
export const wizardKey = (edition) =>
  !edition || edition.id === 'v1' ? WIZARD_KEY : `tetr:wizard:${edition.id}`

const RAW_STEPS = [
  {
    id: 'draw',
    title: 'Գծիր մատով',
    body: 'Թուղթը վանդակավոր տետր է։ Մեկ հպումը կետ է, քաշելը՝ գիծ։ Մատիտը խշշում է, գրիչը՝ սահում։',
  },
  {
    id: 'shape',
    title: 'Պատկեր ընտրիր',
    body: 'Աջ եզրի լեզվակը բացում է գործիքները՝ հարթ պատկերներ, ռետին, և ծավալայիններ՝ խորանարդ, գլան, կոն, գունդ, բուրգ։ Քաշիր անկյունից անկյուն։',
  },
  {
    id: 'lock',
    title: 'Վանդակը բռնում է',
    body: 'Գրեթե քառակուսի կամ շրջան՝ կողպվում է։ Կլիկը նշանակում է՝ նստեց։',
  },
  {
    id: 'spread',
    title: 'Բացիր տետրը',
    body: 'Փոքրացրու մինչև 50%՝ երկու էջ միասին։ Հարևան էջին հպվելը թերթում է, դատարկ թերթին՝ ավելացնում։',
  },
  {
    id: 'calliper',
    title: 'Երեք հպում',
    body: 'Նույն կետին երեք անգամ՝ կարկին։ Չափում է վանդակ, միլիմետր ու աստիճան, և անունն էլ ասում՝ սուր, ուղիղ թե բութ։ 📐 կոճակը բացում է բանաձևերը։',
  },
]

export const STEPS = RAW_STEPS.map((s, i) => ({
  ...s,
  kicker: `${i + 1} / ${RAW_STEPS.length}`,
}))

function readDone(key) {
  try {
    return localStorage.getItem(key) === 'done'
  } catch {
    return false
  }
}

function writeDone(key) {
  try {
    localStorage.setItem(key, 'done')
  } catch {}
}

export default function Wizard({ replay = 0, onOpenChange, edition }) {
  const key = wizardKey(edition)
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(() => !readDone(key))

  useEffect(() => {
    if (!replay) return
    setStep(0)
    setOpen(true)
  }, [replay])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  const close = useCallback(() => {
    writeDone(key)
    setOpen(false)
  }, [key])

  const next = useCallback(() => {
    setStep((i) => {
      if (i >= STEPS.length - 1) {
        writeDone(key)
        setOpen(false)
        return i
      }
      return i + 1
    })
  }, [key])

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
      {step === 0 && edition?.tagline && <p className="coach__tagline">{edition.tagline}</p>}
      <p className="coach__body" id="coach-body">{current.body}</p>
      <div className="coach__row">
        <ToolButton label="Բաց թողնել" className="coach__skip" cue="tap" onPress={close}>
          Բաց թողնել
        </ToolButton>
        <ToolButton label={last ? 'Հասկացա' : 'Հաջորդ'} className="coach__next" cue="tap" onPress={next}>
          {last ? 'Հասկացա' : 'Հաջորդ'}
        </ToolButton>
      </div>
    </div>
  )
}
