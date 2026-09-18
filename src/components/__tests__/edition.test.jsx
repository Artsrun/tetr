import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App.jsx'
import Masthead from '../Masthead.jsx'
import { EDITIONS, V1, V2 } from '../../lib/edition.js'

const press = (label) =>
  fireEvent(screen.getByLabelText(label), new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

/** The edition is read off the URL once, at mount. */
const openWith = (search) => {
  window.history.replaceState({}, '', `/${search}`)
  return render(<App />)
}

beforeEach(() => localStorage.clear())
afterEach(() => window.history.replaceState({}, '', '/'))

describe('the default edition', () => {
  it('is the notebook as it shipped', () => {
    openWith('')
    expect(document.documentElement.getAttribute('data-edition')).toBe(V1)
    expect(document.title).toBe(EDITIONS[V1].title)
  })

  it('opens on one page', () => {
    openWith('')
    expect(document.querySelectorAll('.leaf')).toHaveLength(1)
    expect(screen.getByLabelText('Վերականգնել չափը').textContent).toBe('100%')
  })

  it('wears the mark alone, without the name', () => {
    openWith('')
    expect(document.querySelector('.masthead__name')).toBeNull()
    expect(document.querySelector('.masthead__mark').textContent).toBe(EDITIONS[V1].mark)
  })
})

describe('?v=2', () => {
  it('opens the rebrand', () => {
    openWith('?v=2')
    expect(document.documentElement.getAttribute('data-edition')).toBe(V2)
    expect(document.title).toBe(EDITIONS[V2].title)
  })

  it('wears its name', () => {
    openWith('?v=2')
    expect(screen.getByText(EDITIONS[V2].name)).toBeInTheDocument()
  })

  it('opens the notebook flat — two sheets', () => {
    openWith('?v=2')
    expect(document.querySelectorAll('.leaf')).toHaveLength(2)
    expect(screen.getByLabelText('Վերականգնել չափը').textContent).toBe('50%')
  })

  it('centres the spread on the window instead of pinning it to the top-left', () => {
    openWith('?v=2')
    // 390×700 phone at 0.5: window is 780×1400, world is 804×700, so y centres.
    expect(document.querySelector('.paper').getAttribute('viewBox')).toBe('0 -350 780 1400')
  })

  it('still draws on the same paper — a rebrand is a cover, not a line', () => {
    const { unmount } = openWith('?v=2')
    const v2Paper = document.querySelector('.leaf rect').getAttribute('fill')
    unmount()
    openWith('')
    expect(document.querySelector('.leaf rect').getAttribute('fill')).toBe(v2Paper)
  })

  it('gets its own first run, so the tour is not skipped by v1', () => {
    localStorage.setItem('tetr:wizard:v1', 'done')
    openWith('?v=2')
    expect(screen.getByRole('dialog', { name: 'Ուղեցույց' })).toBeInTheDocument()
  })
})

describe('the cover mark', () => {
  it('offers the other edition by name', () => {
    render(<Masthead edition={EDITIONS[V1]} />)
    expect(screen.getByLabelText(`Բացել «${EDITIONS[V2].name}» տարբերակը`)).toBeInTheDocument()
  })

  it('offers the way back from the rebrand', () => {
    render(<Masthead edition={EDITIONS[V2]} />)
    expect(screen.getByLabelText(`Բացել «${EDITIONS[V1].name}» տարբերակը`)).toBeInTheDocument()
  })
})
