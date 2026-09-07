import {
  SHAPE_CONE, SHAPE_CUBE, SHAPE_CYLINDER, SHAPE_ELLIPSE, SHAPE_ERASE, SHAPE_FREE,
  SHAPE_LINE, SHAPE_PYRAMID, SHAPE_RECT, SHAPE_SPHERE, SHAPE_TRIANGLE,
} from '../lib/shapes.js'

const COPY = {
  [SHAPE_FREE]: 'Մատով գծիր · երկու մատ՝ խոշորացում',
  [SHAPE_LINE]: 'Քաշիր գիծ · մոտ 15°՝ կողպվում է',
  [SHAPE_RECT]: 'Քաշիր ուղղանկյուն · քառակուսին ինքն է նստում',
  [SHAPE_ELLIPSE]: 'Քաշիր օվալ · շրջանը կողպվում է',
  [SHAPE_TRIANGLE]: 'Քաշիր եռանկյուն · հավասարակողմը նստում է',
  [SHAPE_CUBE]: 'Քաշիր դեմքը · խորությունը ընկնում է վանդակի վրա',
  [SHAPE_CYLINDER]: 'Քաշիր գլան · հիմքերը օվալ են նստում',
  [SHAPE_CONE]: 'Քաշիր կոն · գագաթը հիմքի կենտրոնում է',
  [SHAPE_SPHERE]: 'Քաշիր գունդ · հասարակածով',
  [SHAPE_PYRAMID]: 'Քաշիր բուրգ · չորս կող, մեկ գագաթ',
  [SHAPE_ERASE]: 'Ռետին · անցիր գծի վրայով',
}

export default function Hint({ shape = SHAPE_FREE }) {
  return (
    <p className="hint" role="status">
      {COPY[shape] || COPY[SHAPE_FREE]}
    </p>
  )
}
