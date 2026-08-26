import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Canvas from '../Canvas.jsx'
import { GRID_SIZE, PENCIL_OPACITY } from '../../lib/constants.js'
import { PENCIL_FILTER_ID } from '../../lib/pencil.js'
import { RULER } from '../../lib/instruments.js'

const SIZE = { width: 390, height: 700 }
const STYLE = { color: '#1f3a6e', width: 2.2, pencil: false }

function stubDrawing(over = {}) {
  return {
    strokes: [],
    liveRef: { current: null },
    isDrawing: () => true,
    begin: vi.fn(),
    extend: vi.fn(),
    commit: vi.fn(),
    cancel: vi.fn(),
    ...over,
  }
}

const pointer = (type, x, y, extra = {}) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, ...extra })

const paper = () => document.querySelector('.paper')

const setup = (props = {}) => {
  const drawing = props.drawing || stubDrawing()
  render(<Canvas drawing={drawing} style={STYLE} size={SIZE} instrument={null} {...props} />)
  return drawing
}

describe('grid', () => {
  it('rules the page at one cell per line', () => {
    setup()
    const verticals = document.querySelectorAll('.grid line[x1][y1="0"]')
    expect(verticals.length).toBeGreaterThan(Math.floor(SIZE.width / GRID_SIZE) - 2)
  })

  it('draws the red margin line', () => {
    setup()
    expect(document.querySelector('line[stroke="#c98b8b"]')).toBeTruthy()
  })

  it('hides the grid from assistive tech', () => {
    setup()
    expect(document.querySelector('.grid')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('pencil filter', () => {
  it('stays in defs even when pencil is off — Safari re-rasterizes on toggle', () => {
    setup({ style: { ...STYLE, pencil: false } })
    expect(document.querySelector(`#${PENCIL_FILTER_ID}`)).toBeTruthy()
  })

  it('is an SVG filter, not a canvas', () => {
    setup()
    expect(document.querySelector('feTurbulence')).toBeTruthy()
    expect(document.querySelector('feDisplacementMap')).toBeTruthy()
    expect(document.querySelector('canvas')).toBeNull()
  })

  it('applies to the live stroke only when pencil is on', () => {
    setup({ style: { ...STYLE, pencil: true } })
    expect(document.querySelector('.live').getAttribute('filter'))
      .toBe(`url(#${PENCIL_FILTER_ID})`)
  })

  it('is per-stroke: a pencil stroke keeps its grain beside a pen stroke', () => {
    const drawing = stubDrawing({
      strokes: [
        { id: 'a', d: 'M 0 0 L 1 1', color: '#000', width: 2, pencil: true },
        { id: 'b', d: 'M 2 2 L 3 3', color: '#000', width: 2, pencil: false },
      ],
    })
    setup({ drawing })
    const paths = document.querySelectorAll('.strokes path')
    expect(paths[0].getAttribute('filter')).toBe(`url(#${PENCIL_FILTER_ID})`)
    expect(paths[1].getAttribute('filter')).toBeNull()
    expect(paths[0].getAttribute('stroke-opacity')).toBe(String(PENCIL_OPACITY))
  })
})

describe('the drawing path', () => {
  it('begins a stroke on pointerdown', () => {
    const drawing = setup()
    paper().dispatchEvent(pointer('pointerdown', 50, 60))
    expect(drawing.begin).toHaveBeenCalledWith({ x: 50, y: 60 }, STYLE)
  })

  it('extends on move', () => {
    const drawing = setup()
    paper().dispatchEvent(pointer('pointerdown', 10, 10))
    paper().dispatchEvent(pointer('pointermove', 20, 30))
    expect(drawing.extend).toHaveBeenCalledWith([{ x: 20, y: 30 }])
  })

  it('ignores a move that never started with a down', () => {
    const drawing = setup()
    paper().dispatchEvent(pointer('pointermove', 20, 30))
    expect(drawing.extend).not.toHaveBeenCalled()
  })

  it('commits on pointerup', () => {
    const drawing = setup()
    paper().dispatchEvent(pointer('pointerdown', 10, 10))
    paper().dispatchEvent(pointer('pointerup', 90, 90))
    expect(drawing.commit).toHaveBeenCalled()
  })

  it('commits on pointercancel too, so a stroke is never orphaned', () => {
    const drawing = setup()
    paper().dispatchEvent(pointer('pointerdown', 10, 10))
    paper().dispatchEvent(pointer('pointercancel', 40, 40))
    expect(drawing.commit).toHaveBeenCalled()
  })

  it('replays coalesced samples — on 120Hz that is smooth vs faceted', () => {
    const drawing = setup()
    paper().dispatchEvent(pointer('pointerdown', 0, 0))

    const move = pointer('pointermove', 30, 30)
    move.getCoalescedEvents = () => [
      { clientX: 10, clientY: 10 },
      { clientX: 20, clientY: 20 },
      { clientX: 30, clientY: 30 },
    ]
    paper().dispatchEvent(move)

    expect(drawing.extend).toHaveBeenCalledWith([
      { x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 30 },
    ])
  })

  it('prevents default so a downward stroke cannot scroll the page', () => {
    setup()
    const down = pointer('pointerdown', 10, 10)
    paper().dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
  })

  it('captures the pointer so a stroke off the edge keeps drawing', () => {
    setup()
    const spy = vi.spyOn(Element.prototype, 'setPointerCapture')
    paper().dispatchEvent(pointer('pointerdown', 10, 10))
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('ignores a right-click', () => {
    const drawing = setup()
    paper().dispatchEvent(pointer('pointerdown', 10, 10, { button: 2 }))
    expect(drawing.begin).not.toHaveBeenCalled()
  })
})

describe('taps and gestures', () => {
  it('offers a tap that never moved to the gesture handler', () => {
    const onTap = vi.fn(() => false)
    setup({ onTap })
    paper().dispatchEvent(pointer('pointerdown', 40, 40))
    paper().dispatchEvent(pointer('pointerup', 41, 41))
    expect(onTap).toHaveBeenCalledWith({ x: 41, y: 41 })
  })

  it('does not treat a drag as a tap', () => {
    const onTap = vi.fn(() => false)
    setup({ onTap })
    paper().dispatchEvent(pointer('pointerdown', 40, 40))
    paper().dispatchEvent(pointer('pointerup', 200, 300))
    expect(onTap).not.toHaveBeenCalled()
  })

  it('does not commit a stroke when the gesture consumed the tap', () => {
    const drawing = setup({ onTap: () => true })
    paper().dispatchEvent(pointer('pointerdown', 40, 40))
    paper().dispatchEvent(pointer('pointerup', 40, 40))
    expect(drawing.commit).not.toHaveBeenCalled()
  })

  it('still commits a plain dot when the gesture declines it', () => {
    const drawing = setup({ onTap: () => false })
    paper().dispatchEvent(pointer('pointerdown', 40, 40))
    paper().dispatchEvent(pointer('pointerup', 40, 40))
    expect(drawing.commit).toHaveBeenCalled()
  })
})

describe('ruler snapping happens at the coordinate source', () => {
  const ruler = { kind: RULER, a: { x: 0, y: 100 }, b: { x: 390, y: 100 } }

  it('snaps the point every consumer sees, not just the drawn one', () => {
    const drawing = setup({ instrument: ruler })
    paper().dispatchEvent(pointer('pointerdown', 150, 106))
    expect(drawing.begin).toHaveBeenCalledWith({ x: 150, y: 100 }, STYLE)
  })

  it('leaves freehand alone away from the ruler', () => {
    const drawing = setup({ instrument: ruler })
    paper().dispatchEvent(pointer('pointerdown', 150, 400))
    expect(drawing.begin).toHaveBeenCalledWith({ x: 150, y: 400 }, STYLE)
  })

  it('hands snapped points to the gesture handler too', () => {
    const onTap = vi.fn(() => false)
    setup({ instrument: ruler, onTap })
    paper().dispatchEvent(pointer('pointerdown', 200, 104))
    paper().dispatchEvent(pointer('pointerup', 200, 104))
    expect(onTap).toHaveBeenCalledWith({ x: 200, y: 100 })
  })
})
