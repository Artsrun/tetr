import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App.jsx'
import Lessons from '../Lessons.jsx'
import { LESSONS, explainSpan } from '../../lib/lessons.js'

const paper = () => document.querySelector('.paper')
const pointer = (type, x, y) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y })

const tap = (x, y) => {
  fireEvent(paper(), pointer('pointerdown', x, y))
  fireEvent(paper(), pointer('pointerup', x, y))
}

const press = (label) =>
  fireEvent(screen.getByLabelText(label), new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

const tripleTap = (x, y) => {
  tap(x, y)
  tap(x, y)
  tap(x, y)
}

const CALLIPER = { kind: 'calliper', a: { x: 100, y: 100 }, b: { x: 196, y: 100 } }

beforeEach(() => localStorage.clear())

describe('the panel', () => {
  it('opens from the toolbar', () => {
    render(<App />)
    expect(screen.queryByLabelText('Անկյուն և չափ')).not.toBeNull()
    press('Անկյուն և չափ')
    expect(screen.getByRole('dialog', { name: 'Անկյուն և չափ' })).toBeInTheDocument()
  })

  it('opens and closes on g', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'g' })
    expect(screen.getByRole('dialog', { name: 'Անկյուն և չափ' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'g' })
    expect(screen.queryByRole('dialog', { name: 'Անկյուն և չափ' })).toBeNull()
  })

  it('closes on Escape', () => {
    render(<App />)
    press('Անկյուն և չափ')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Անկյուն և չափ' })).toBeNull()
  })

  it('closes on the close button', () => {
    render(<App />)
    press('Անկյուն և չափ')
    press('Փակել')
    expect(screen.queryByRole('dialog', { name: 'Անկյուն և չափ' })).toBeNull()
  })

  it('starts on the angles and switches to algebra', () => {
    render(<Lessons onClose={() => {}} />)
    expect(screen.getByText('Անկյան տեսակները')).toBeInTheDocument()
    expect(screen.queryByText('Համեմատություն')).toBeNull()
    press('Հանրահաշիվ')
    expect(screen.getByText('Համեմատություն')).toBeInTheDocument()
  })

  it('shows a formula with every lesson', () => {
    render(<Lessons onClose={() => {}} />)
    const angles = LESSONS.filter((l) => l.group === 'angles')
    // getByText normalises runs of whitespace; the formulas space out around ·
    for (const l of angles) {
      expect(screen.getByText(l.formula.replace(/\s+/g, ' '))).toBeInTheDocument()
    }
  })

  it('says nothing about a reading when the calliper is away', () => {
    render(<Lessons onClose={() => {}} />)
    expect(screen.queryByText('Կարկինը ցույց է տալիս')).toBeNull()
  })
})

describe('the reading, explained', () => {
  it('names what the calliper is measuring', () => {
    render(<Lessons instrument={CALLIPER} onClose={() => {}} />)
    expect(screen.getByText('Կարկինը ցույց է տալիս')).toBeInTheDocument()
    expect(screen.getByText(`${explainSpan(96).cells} □`)).toBeInTheDocument()
    expect(screen.getByText(/Սուր անկյուն|Զրոյական անկյուն/)).toBeInTheDocument()
  })

  it('carries the reading through from a calliper the page put out', () => {
    render(<App />)
    tripleTap(140, 300)
    press('Անկյուն և չափ')
    expect(screen.getByText('Կարկինը ցույց է տալիս')).toBeInTheDocument()
  })
})

describe('the calliper itself', () => {
  it('names the angle over the measurement', () => {
    render(<App />)
    tripleTap(140, 300)
    const lesson = document.querySelector('.instrument__lesson')
    expect(lesson.textContent).toContain('անկյուն')
  })

  it('draws the arc it is reading', () => {
    render(<App />)
    tripleTap(140, 300)
    expect(document.querySelector('.instrument__arc').getAttribute('d')).toMatch(/^M .* A /)
  })

  it('reads the span in cells and millimetres', () => {
    render(<App />)
    tripleTap(140, 300)
    expect(document.querySelector('.instrument__readout').textContent).toContain('մմ')
  })
})
