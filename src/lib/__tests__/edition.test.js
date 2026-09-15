import { describe, expect, it } from 'vitest'
import {
  EDITIONS, V1, V2, applyEdition, editionFrom, editionHref, isV2, otherEdition,
} from '../edition.js'

describe('editionFrom', () => {
  it('defaults to the notebook as it shipped', () => {
    expect(editionFrom('').id).toBe(V1)
    expect(editionFrom('?colour=red').id).toBe(V1)
  })

  it('opens the rebrand on ?v=2', () => {
    expect(editionFrom('?v=2').id).toBe(V2)
  })

  it('takes the leading question mark or not', () => {
    expect(editionFrom('v=2').id).toBe(V2)
  })

  it('accepts ?v=v2 and ?version=2 as the same door', () => {
    expect(editionFrom('?v=v2').id).toBe(V2)
    expect(editionFrom('?version=2').id).toBe(V2)
  })

  it('falls back to v1 rather than 404ing on a version that is not there', () => {
    expect(editionFrom('?v=99').id).toBe(V1)
  })

  it('keeps the rebrand off the default URL', () => {
    expect(editionFrom('?v=1').id).toBe(V1)
  })
})

describe('the editions themselves', () => {
  it('each carry a name, a mark and a title', () => {
    for (const e of Object.values(EDITIONS)) {
      expect(e.name).toBeTruthy()
      expect(e.mark).toBeTruthy()
      expect(e.title).toContain(e.name)
    }
  })

  it('are named differently — that is the whole point of a rebrand', () => {
    expect(EDITIONS[V1].name).not.toBe(EDITIONS[V2].name)
  })

  it('open v2 flat, on a spread', () => {
    expect(EDITIONS[V2].spreadOnOpen).toBe(true)
    expect(EDITIONS[V1].spreadOnOpen).toBe(false)
  })
})

describe('switching', () => {
  it('points each edition at the other one', () => {
    expect(otherEdition(EDITIONS[V1]).id).toBe(V2)
    expect(otherEdition(EDITIONS[V2]).id).toBe(V1)
    expect(isV2(EDITIONS[V2])).toBe(true)
  })

  it('adds v=2 without losing the rest of the query', () => {
    expect(editionHref(EDITIONS[V2], 'http://x/tetr/?from=link')).toBe('/tetr/?from=link&v=2')
  })

  it('drops the param entirely going back to v1', () => {
    expect(editionHref(EDITIONS[V1], 'http://x/?v=2&from=link')).toBe('/?from=link')
  })

  it('keeps the hash', () => {
    expect(editionHref(EDITIONS[V2], 'http://x/#draw')).toBe('/?v=2#draw')
  })
})

describe('applyEdition', () => {
  it('sets the title and the stylesheet hook', () => {
    applyEdition(EDITIONS[V2], document)
    expect(document.documentElement.getAttribute('data-edition')).toBe(V2)
    expect(document.title).toBe(EDITIONS[V2].title)
    applyEdition(EDITIONS[V1], document)
    expect(document.documentElement.getAttribute('data-edition')).toBe(V1)
  })

  it('updates theme-color when the tag is there', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', '#000000')
    document.head.appendChild(meta)
    applyEdition(EDITIONS[V2], document)
    expect(meta.getAttribute('content')).toBe(EDITIONS[V2].themeColor)
    meta.remove()
  })

  it('does nothing without a document instead of throwing', () => {
    expect(applyEdition(EDITIONS[V2], null)).toBe(false)
  })
})
