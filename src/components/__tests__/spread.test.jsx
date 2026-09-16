import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App.jsx'

const paper = () => document.querySelector('.paper')
const pointer = (type, x, y) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y })

const tap = (x, y) => {
  fireEvent(paper(), pointer('pointerdown', x, y))
  fireEvent(paper(), pointer('pointerup', x, y))
}

const stroke = (from, to) => {
  fireEvent(paper(), pointer('pointerdown', from[0], from[1]))
  fireEvent(paper(), pointer('pointermove', to[0], to[1]))
  fireEvent(paper(), pointer('pointerup', to[0], to[1]))
}

const press = (label) =>
  fireEvent(screen.getByLabelText(label), new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

const sheetsOn = () => document.querySelectorAll('.leaf')
const inkOn = (page) => document.querySelectorAll(`.leaf[data-page="${page}"] .strokes path`)
const folio = () => document.querySelector('.folio__mark').textContent

/** Two presses of − takes 100% → 75% → 50%, the zoom-out floor. */
const openFlat = () => {
  press('Փոքրացնել՝ երկու էջ')
  press('Փոքրացնել')
}

beforeEach(() => localStorage.clear())

describe('zooming out', () => {
  it('starts on one sheet at full size', () => {
    render(<App />)
    expect(sheetsOn()).toHaveLength(1)
  })

  it('lays the notebook flat — two sheets on screen', () => {
    render(<App />)
    openFlat()
    expect(sheetsOn()).toHaveLength(2)
    expect(screen.getByLabelText('Վերականգնել չափը').textContent).toBe('50%')
  })

  it('will not zoom out past the floor', () => {
    render(<App />)
    openFlat()
    expect(screen.getByLabelText('Փոքրացնել')).toBeDisabled()
  })

  it('shows the page that does not exist yet as a ghost', () => {
    render(<App />)
    openFlat()
    expect(document.querySelectorAll('.leaf__paper.is-ghost')).toHaveLength(1)
  })

  it('comes back to one sheet on reset', () => {
    render(<App />)
    openFlat()
    press('Վերականգնել չափը')
    expect(sheetsOn()).toHaveLength(1)
  })
})

describe('a spread is a notebook, not a canvas', () => {
  it('adds the page when the ghost sheet is tapped', () => {
    render(<App />)
    openFlat()
    expect(folio()).toContain('1 / 1')
    tap(300, 300) // over the right-hand sheet
    expect(folio()).toContain('2 / 2')
  })

  it('turns to the facing page when it is tapped', () => {
    render(<App />)
    openFlat()
    tap(300, 300) // adds page 2 and goes to it
    tap(50, 300) // back to the left-hand sheet
    expect(folio()).toContain('1 / 2')
  })

  it('never drops ink on the page you are not writing on', () => {
    render(<App />)
    openFlat()
    tap(300, 300)
    expect(inkOn(0)).toHaveLength(0)
    expect(inkOn(1)).toHaveLength(0)
  })

  it("draws on the active sheet in that page's own coordinates", () => {
    render(<App />)
    openFlat()
    tap(300, 300) // now on page 2, the right-hand sheet
    stroke([300, 200], [340, 260])
    expect(inkOn(1)).toHaveLength(1)
    // The world x of that touch is past 414 — the stroke is stored page-local,
    // so the first coordinate has to be well inside one sheet's width.
    const d = inkOn(1)[0].getAttribute('d')
    expect(Number(d.split(' ')[1])).toBeLessThan(390)
  })

  it("keeps each page's ink on its own sheet", () => {
    render(<App />)
    stroke([40, 40], [120, 160]) // page 1, at full size
    openFlat()
    tap(300, 300) // page 2
    stroke([300, 200], [340, 260])
    expect(inkOn(0)).toHaveLength(1)
    expect(inkOn(1)).toHaveLength(1)
  })
})
