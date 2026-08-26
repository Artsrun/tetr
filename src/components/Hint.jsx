import { SHAPE_ELLIPSE, SHAPE_FREE, SHAPE_LINE, SHAPE_RECT, SHAPE_TRIANGLE } from '../lib/shapes.js'

const COPY = {
  [SHAPE_FREE]: 'Մատով գծիր · երկու մատ՝ խոշորացում',
  [SHAPE_LINE]: 'Մաշիր գիծ · մոտ 15°՝ կողպվում է',
  [SHAPE_RECT]: 'Մաշիր արկղ · քառակուսին ինքն է նստում',
  [SHAPE_ELLIPSE]: 'Մաշիր օվալ · շրջանը կողպվում է',
  [SHAPE_TRIANGLE]: 'Մաշիր եռանկյուն · հավասարակողմը նստում է',
}

export default function Hint({ shape = SHAPE_FREE }) {
  return (
    <p className="hint" role="status">
      {COPY[shape] || COPY[SHAPE_FREE]}
    </p>
  )
}
