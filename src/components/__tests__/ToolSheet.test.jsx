import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ToolSheet from '../ToolSheet.jsx'
import { SHAPE_FREE, SHAPE_RECT, SHAPE_SPHERE, TOOLS, TOOL_GROUPS } from '../../lib/shapes.js'

const press = (el) => fireEvent(el, new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
const tab = () => screen.getByLabelText(/Գործիքներ|Փակել գործիքները/)

describe('ToolSheet', () => {
  it('keeps the list closed until the tab is pressed', () => {
    render(<ToolSheet value={SHAPE_FREE} onChange={() => {}} />)
    expect(screen.getByRole('group', { hidden: true })).toHaveAttribute('hidden')
    press(tab())
    expect(screen.getByRole('group')).not.toHaveAttribute('hidden')
  })

  it('offers every tool, rubber included', () => {
    render(<ToolSheet value={SHAPE_FREE} onChange={() => {}} />)
    press(tab())
    TOOLS.forEach((t) => expect(screen.getByLabelText(t.label)).toBeTruthy())
  })

  it('shelves the flat tools apart from the solids', () => {
    render(<ToolSheet value={SHAPE_FREE} onChange={() => {}} />)
    press(tab())
    TOOL_GROUPS.forEach((g) => expect(screen.getByText(g.label)).toBeTruthy())
  })

  it('picks a solid too', () => {
    const onChange = vi.fn()
    render(<ToolSheet value={SHAPE_FREE} onChange={onChange} />)
    press(tab())
    press(screen.getByLabelText('Գունդ'))
    expect(onChange).toHaveBeenCalledWith(SHAPE_SPHERE)
  })

  it('picks a tool and gets out of the way', () => {
    const onChange = vi.fn()
    render(<ToolSheet value={SHAPE_FREE} onChange={onChange} />)
    press(tab())
    press(screen.getByLabelText('Ուղղանկյուն'))
    expect(onChange).toHaveBeenCalledWith(SHAPE_RECT)
    expect(screen.getByRole('group', { hidden: true })).toHaveAttribute('hidden')
  })

  it('pressing the active shape again falls back to freehand', () => {
    const onChange = vi.fn()
    render(<ToolSheet value={SHAPE_RECT} onChange={onChange} />)
    press(tab())
    press(screen.getByLabelText('Ուղղանկյուն'))
    expect(onChange).toHaveBeenCalledWith(SHAPE_FREE)
  })

  it('closes on a touch outside, so the next stroke reaches the paper', () => {
    render(<ToolSheet value={SHAPE_FREE} onChange={() => {}} />)
    press(tab())
    press(document.body)
    expect(screen.getByRole('group', { hidden: true })).toHaveAttribute('hidden')
  })

  it('closes on Escape', () => {
    render(<ToolSheet value={SHAPE_FREE} onChange={() => {}} />)
    press(tab())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('group', { hidden: true })).toHaveAttribute('hidden')
  })

  it('marks the tab while a shape tool is armed', () => {
    render(<ToolSheet value={SHAPE_RECT} onChange={() => {}} />)
    expect(tab()).toHaveAttribute('aria-pressed', 'true')
  })
})
