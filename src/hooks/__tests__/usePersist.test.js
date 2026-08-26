import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY } from '../../lib/constants.js'
import { clearSaved, load, save, slim } from '../usePersist.js'

const stroke = (over = {}) => ({
  id: 's1',
  d: 'M 0 0 L 10 10',
  points: Array.from({ length: 200 }, (_, i) => ({ x: i, y: i })),
  color: '#1f3a6e',
  width: 2.2,
  pencil: true,
  length: 14.1,
  ...over,
})

beforeEach(() => localStorage.clear())

describe('slim', () => {
  it('drops points — they are ~20× the size and only live smoothing needs them', () => {
    expect(slim([stroke()])[0].points).toBeUndefined()
  })

  it('keeps everything needed to re-render the stroke', () => {
    expect(slim([stroke()])[0]).toEqual({
      id: 's1', d: 'M 0 0 L 10 10', color: '#1f3a6e', width: 2.2, pencil: true, length: 14.1,
    })
  })

  it('is dramatically smaller than the raw stroke', () => {
    const raw = JSON.stringify([stroke()]).length
    expect(JSON.stringify(slim([stroke()])).length).toBeLessThan(raw / 10)
  })
})

describe('save / load', () => {
  it('round-trips a drawing', () => {
    save([stroke()])
    expect(load().strokes).toHaveLength(1)
  })

  it('writes synchronously, so an abrupt termination cannot lose it', () => {
    save([stroke()])
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('stamps a version and a time', () => {
    save([stroke()])
    const saved = load()
    expect(saved.v).toBe(1)
    expect(saved.at).toBeGreaterThan(0)
  })

  it('returns null when nothing is stored', () => expect(load()).toBeNull())

  it('returns null on corrupt data rather than throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(load()).toBeNull()
  })

  it('returns null when the shape is wrong', () => {
    localStorage.setItem(STORAGE_KEY, '{"v":1}')
    expect(load()).toBeNull()
  })

  it('never breaks drawing when storage refuses the write', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(save([stroke()])).toBe(false)
    spy.mockRestore()
  })

  it('clears', () => {
    save([stroke()])
    clearSaved()
    expect(load()).toBeNull()
  })
})
