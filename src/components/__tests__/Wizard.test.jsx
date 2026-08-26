import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import Wizard, { STEPS, WIZARD_KEY } from '../Wizard.jsx'

const press = (label) =>
  fireEvent(screen.getByLabelText(label), new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

beforeEach(() => localStorage.clear())

describe('Wizard', () => {
  it('starts on the first lesson', () => {
    render(<Wizard />)
    expect(screen.getByText(STEPS[0].title)).toBeInTheDocument()
  })

  it('advances through the lessons', () => {
    render(<Wizard />)
    press('Հաջորդ')
    expect(screen.getByText(STEPS[1].title)).toBeInTheDocument()
  })

  it('remembers a skip so the next visit is quiet', () => {
    render(<Wizard />)
    press('Բաց թողնել')
    expect(localStorage.getItem(WIZARD_KEY)).toBe('done')
    expect(screen.queryByLabelText('Ուղեցույց')).toBeNull()
  })

  it('reopens from the start when asked', () => {
    localStorage.setItem(WIZARD_KEY, 'done')
    const { rerender } = render(<Wizard replay={0} />)
    expect(screen.queryByText(STEPS[0].title)).toBeNull()
    rerender(<Wizard replay={1} />)
    expect(screen.getByText(STEPS[0].title)).toBeInTheDocument()
  })
})
