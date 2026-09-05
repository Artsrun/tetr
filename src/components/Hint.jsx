import { SHAPE_ELLIPSE, SHAPE_ERASE, SHAPE_FREE, SHAPE_LINE, SHAPE_RECT, SHAPE_TRIANGLE } from '../lib/shapes.js'

const COPY = {
  [SHAPE_FREE]: 'Մատով գծիր · երկու մատ՝ խոշորացում',
  [SHAPE_LINE]: 'Քաշիր գիծ · մոտ 15°՝ կողպվում է',
  [SHAPE_RECT]: 'Քաշիր ուղղանկյուն · քառակուսին ինքն է նստում',
  [SHAPE_ELLIPSE]: 'Քաշիր օվալ · շրջանը կողպվում է',
  [SHAPE_TRIANGLE]: 'Քաշիր եռանկյուն · հավասարակողմը նստում է',
  [SHAPE_ERASE]: 'Ռետին · անցիր գծի վրայով',
}

export default function Hint({ shape = SHAPE_FREE }) {
  return (
    <p className="hint" role="status">
      {COPY[shape] || COPY[SHAPE_FREE]}
    </p>
  )
}
