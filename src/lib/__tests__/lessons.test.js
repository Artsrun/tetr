import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../constants.js'
import {
  CELL_MM, LESSONS, LESSON_GROUPS, angleArcPath, classifyAngle, complement, explainAngle,
  explainSpan, fromRadians, lessonsIn, normalizeAngle, pythagoras, supplement, toRadians, turnOf,
} from '../lessons.js'

describe('classifyAngle', () => {
  it('names every kind a textbook names', () => {
    expect(classifyAngle(0).id).toBe('zero')
    expect(classifyAngle(0).label).toBe('Զրոյական անկյուն')
    expect(classifyAngle(45).id).toBe('acute')
    expect(classifyAngle(90).id).toBe('right')
    expect(classifyAngle(120).id).toBe('obtuse')
    expect(classifyAngle(180).id).toBe('straight')
    expect(classifyAngle(270).id).toBe('reflex')
  })

  it('treats 90 and 180 as their own kind, not as the range either side', () => {
    expect(classifyAngle(89.9).id).toBe('acute')
    expect(classifyAngle(90.1).id).toBe('obtuse')
    expect(classifyAngle(179.9).id).toBe('obtuse')
    expect(classifyAngle(180.1).id).toBe('reflex')
  })

  it('wraps a negative heading before naming it', () => {
    expect(classifyAngle(-45).id).toBe('reflex')
    expect(normalizeAngle(-45)).toBe(315)
    expect(normalizeAngle(400)).toBe(40)
  })

  it('carries the range it is describing', () => {
    expect(classifyAngle(45).range).toBe('0°–90°')
  })
})

describe('complement and supplement', () => {
  it('complete the right angle and the straight one', () => {
    expect(complement(30)).toBe(60)
    expect(supplement(30)).toBe(150)
  })

  it('have nothing to complete once the angle is past them', () => {
    expect(complement(90)).toBeNull()
    expect(complement(120)).toBeNull()
    expect(supplement(180)).toBeNull()
    expect(supplement(200)).toBeNull()
  })
})

describe('radians and turns', () => {
  it('converts both ways', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI, 6)
    expect(fromRadians(Math.PI)).toBeCloseTo(180, 6)
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 6)
  })

  it('reads an angle as a fraction of a full turn', () => {
    expect(turnOf(90)).toBe(0.25)
    expect(turnOf(360)).toBe(0)
  })
})

describe('explainSpan', () => {
  it('says one length in cells, millimetres and centimetres', () => {
    const s = explainSpan(GRID_SIZE * 4)
    expect(s.cells).toBe(4)
    expect(s.mm).toBe(4 * CELL_MM)
    expect(s.cm).toBe(2)
  })

  it('keeps the notebook unit honest — one cell is 5mm', () => {
    expect(explainSpan(GRID_SIZE).mm).toBe(5)
  })
})

describe('explainAngle', () => {
  it('bundles everything the panel says about one reading', () => {
    const a = explainAngle(30)
    expect(a.deg).toBe(30)
    expect(a.kind.id).toBe('acute')
    expect(a.complement).toBe(60)
    expect(a.supplement).toBe(150)
    expect(a.radians).toBeCloseTo(0.524, 3)
  })
})

describe('pythagoras', () => {
  it('gets the schoolbook triangle right', () => {
    expect(pythagoras(3, 4)).toBe(5)
    expect(pythagoras(GRID_SIZE * 3, GRID_SIZE * 4)).toBe(GRID_SIZE * 5)
  })
})

describe('angleArcPath', () => {
  const c = { x: 100, y: 100 }

  it('sweeps from the x axis to the angle', () => {
    const d = angleArcPath(c, 10, 90)
    expect(d).toBe('M 110 100 A 10 10 0 0 1 100 110')
  })

  it('takes the long way round past a straight angle', () => {
    expect(angleArcPath(c, 10, 270)).toContain(' 1 1 ')
  })
})

describe('the lessons themselves', () => {
  it('every one belongs to a group that exists', () => {
    const ids = LESSON_GROUPS.map((g) => g.id)
    for (const l of LESSONS) expect(ids).toContain(l.group)
  })

  it('every one carries a title, a formula and a body', () => {
    for (const l of LESSONS) {
      expect(l.title.length).toBeGreaterThan(0)
      expect(l.formula.length).toBeGreaterThan(0)
      expect(l.body.length).toBeGreaterThan(20)
    }
  })

  it('covers angles, measurement and algebra', () => {
    for (const g of LESSON_GROUPS) expect(lessonsIn(g.id).length).toBeGreaterThan(2)
  })

  it('has unique ids', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length)
  })
})
