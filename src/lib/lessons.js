// School algebra and geometry, read back off the page.
//
// Pure functions and copy — no DOM, no React. The panel and the calliper both
// read from here, so the number under the instrument and the sentence in the
// panel can never disagree.
//
// The unit chain is the notebook's own: one cell is 5mm on real Soviet grid
// paper, so every length can be said in cells, millimetres or centimetres
// without inventing a scale nobody can check against a ruler.

import { GRID_SIZE } from './constants.js'

export const CELL_MM = 5

export const normalizeAngle = (deg) => ((Number(deg) % 360) + 360) % 360

export const ANGLE_KINDS = [
  { id: 'zero', label: 'Զրոյական անկյուն', range: '0°' },
  { id: 'acute', label: 'Սուր անկյուն', range: '0°–90°' },
  { id: 'right', label: 'Ուղիղ անկյուն', range: '90°' },
  { id: 'obtuse', label: 'Բութ անկյուն', range: '90°–180°' },
  { id: 'straight', label: 'Փռված անկյուն', range: '180°' },
  { id: 'reflex', label: 'Գոգավոր անկյուն', range: '180°–360°' },
]

const kind = (id) => ANGLE_KINDS.find((k) => k.id === id)

/** The name a textbook gives this angle. Exact 90° and 180° are their own. */
export function classifyAngle(deg) {
  const a = normalizeAngle(deg)
  if (a === 0) return kind('zero')
  if (a < 90) return kind('acute')
  if (a === 90) return kind('right')
  if (a < 180) return kind('obtuse')
  if (a === 180) return kind('straight')
  return kind('reflex')
}

/** Together make 90°. Null when there is nothing left of the right angle. */
export function complement(deg) {
  const a = normalizeAngle(deg)
  return a < 90 ? Math.round((90 - a) * 10) / 10 : null
}

/** Together make 180° — the two angles either side of a straight line. */
export function supplement(deg) {
  const a = normalizeAngle(deg)
  return a < 180 ? Math.round((180 - a) * 10) / 10 : null
}

export const toRadians = (deg) => (normalizeAngle(deg) * Math.PI) / 180
export const fromRadians = (rad) => normalizeAngle((rad * 180) / Math.PI)

/** Fraction of a full turn — the way a protractor is actually read. */
export const turnOf = (deg) => Math.round((normalizeAngle(deg) / 360) * 1000) / 1000

const round1 = (n) => Math.round(n * 10) / 10

/** One span of ink, said three ways. */
export function explainSpan(px) {
  const cells = round1(px / GRID_SIZE)
  const mm = round1(cells * CELL_MM)
  return { px: Math.round(px), cells, mm, cm: round1(mm / 10) }
}

/** Everything the panel says about one angle. */
export function explainAngle(deg) {
  const a = Math.round(normalizeAngle(deg) * 10) / 10
  return {
    deg: a,
    kind: classifyAngle(a),
    complement: complement(a),
    supplement: supplement(a),
    radians: Math.round(toRadians(a) * 1000) / 1000,
    turn: turnOf(a),
  }
}

/**
 * The arc a protractor would sweep, from the x axis round to `deg`. Drawn at
 * the calliper's pivot, so the reading sits on the shape it describes.
 */
export function angleArcPath(center, radius, deg) {
  const a = normalizeAngle(deg)
  const rad = toRadians(a)
  const x0 = center.x + radius
  const y0 = center.y
  const x1 = center.x + Math.cos(rad) * radius
  const y1 = center.y + Math.sin(rad) * radius
  const large = a > 180 ? 1 : 0
  const r = Math.round(radius * 100) / 100
  const f = (n) => Math.round(n * 100) / 100
  return `M ${f(x0)} ${f(y0)} A ${r} ${r} 0 ${large} 1 ${f(x1)} ${f(y1)}`
}

/** Right triangle from two legs — the calliper's span as a hypotenuse. */
export function pythagoras(a, b) {
  return Math.round(Math.hypot(a, b) * 100) / 100
}

export const LESSON_GROUPS = [
  { id: 'angles', label: 'Անկյուն' },
  { id: 'measure', label: 'Չափ' },
  { id: 'algebra', label: 'Հանրահաշիվ' },
]

export const LESSONS = [
  {
    id: 'kinds',
    group: 'angles',
    title: 'Անկյան տեսակները',
    formula: '0° · <90° · 90° · >90° · 180°',
    body: 'Սուր՝ 90°-ից փոքր։ Ուղիղ՝ ճիշտ 90°։ Բութ՝ 90°-ի և 180°-ի միջև։ Փռված՝ 180°, ուղիղ գիծ։ Ավելին՝ գոգավոր։',
  },
  {
    id: 'complement',
    group: 'angles',
    title: 'Լրացուցիչ և հարակից',
    formula: 'α + β = 90°  ·  α + β = 180°',
    body: 'Երկու անկյուն լրացուցիչ են, եթե գումարը 90° է, և հարակից՝ եթե 180°։ Վանդակի անկյունը 90° է, ուրեմն 30°-ի լրացուցիչը 60° է։',
  },
  {
    id: 'triangle',
    group: 'angles',
    title: 'Եռանկյան անկյունները',
    formula: 'α + β + γ = 180°',
    body: 'Ցանկացած եռանկյան երեք անկյունների գումարը 180° է։ Հավասարակողմում՝ երեքն էլ 60°։ Ուղղանկյունում մեկը 90° է, մյուս երկուսը միասին՝ նույնպես 90°։',
  },
  {
    id: 'radians',
    group: 'angles',
    title: 'Աստիճան և ռադիան',
    formula: 'π rad = 180°  ·  1 rad ≈ 57,3°',
    body: 'Ռադիանը շառավղին հավասար աղեղի անկյունն է։ Աստիճանից ռադիան՝ բազմապատկիր π/180-ով։ 90° = π/2, 60° = π/3, 45° = π/4։',
  },
  {
    id: 'cell',
    group: 'measure',
    title: 'Վանդակի գինը',
    formula: '1 □ = 5 մմ = 0,5 սմ',
    body: 'Սովետական տետրի վանդակը 5 միլիմետր է։ Երկու վանդակ՝ 1 սանտիմետր, քսանը՝ 10 սմ։ Բոլոր չափումներն այստեղ հենց այդ վանդակով են։',
  },
  {
    id: 'pythagoras',
    group: 'measure',
    title: 'Պյութագորասի թեորեմ',
    formula: 'a² + b² = c²',
    body: 'Ուղղանկյուն եռանկյան էջերի քառակուսիների գումարը հավասար է ներքնաձիգի քառակուսուն։ 3 և 4 վանդակ՝ ներքնաձիգը ճիշտ 5 վանդակ։',
  },
  {
    id: 'area',
    group: 'measure',
    title: 'Պարագիծ և մակերես',
    formula: 'P = 2(a+b) · S = a·b · S = a·h/2',
    body: 'Ուղղանկյան պարագիծը կողմերի կրկնակի գումարն է, մակերեսը՝ արտադրյալը։ Եռանկյան մակերեսը հիմքի և բարձրության արտադրյալի կեսն է։ Շրջանինը՝ πr²։',
  },
  {
    id: 'circle',
    group: 'measure',
    title: 'Շրջանագիծ',
    formula: 'C = 2πr  ·  S = πr²',
    body: 'Շրջանագծի երկարությունը շառավղից 2π անգամ մեծ է՝ մոտ 6,28։ Աղեղի երկարությունը՝ C·α/360°։',
  },
  {
    id: 'proportion',
    group: 'algebra',
    title: 'Համեմատություն',
    formula: 'a/b = c/d  ⇒  a·d = b·c',
    body: 'Խաչաձև բազմապատկումը լուծում է մասշտաբի ամեն խնդիր։ Եթե 4 վանդակը 2 սմ է, ապա 10 վանդակը՝ x, և x = 10·2/4 = 5 սմ։',
  },
  {
    id: 'scale',
    group: 'algebra',
    title: 'Մասշտաբ՝ գծային ֆունկցիա',
    formula: 'y = k·x',
    body: 'Խոշորացումը k գործակից է․ 50%-ը k = 0,5 է, 200%-ը՝ k = 2։ Երկարությունը փոխվում է k անգամ, մակերեսը՝ k² անգամ։ Անկյունը չի փոխվում։',
  },
  {
    id: 'slope',
    group: 'algebra',
    title: 'Թեքություն և անկյուն',
    formula: 'k = Δy/Δx = tg α',
    body: 'Գծի թեքությունը բարձրացման և առաջացման հարաբերությունն է։ Մեկ վանդակ վեր, մեկ առաջ՝ k = 1, այսինքն 45°։ Երկու վեր, մեկ առաջ՝ մոտ 63°։',
  },
  {
    id: 'square',
    group: 'algebra',
    title: 'Կրճատ բազմապատկում',
    formula: '(a+b)² = a² + 2ab + b²',
    body: 'Քառակուսու կողմը մեծացրու b-ով՝ մակերեսը մեծանում է երկու ուղղանկյունով և մեկ փոքր քառակուսով։ Վանդակների վրա դա ուղղակի երևում է։',
  },
]

export const lessonsIn = (group) => LESSONS.filter((l) => l.group === group)
