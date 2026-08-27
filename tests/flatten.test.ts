import { describe, it, expect } from 'vitest'
import { flatten, type Cmd } from '../src/engine/flatten'

describe('flatten', () => {
  it('converts M/L/Z into one contour', () => {
    const cmds: Cmd[] = [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 0 },
      { type: 'L', x: 10, y: 10 },
      { type: 'L', x: 0, y: 10 },
      { type: 'Z' },
    ]
    const out = flatten(cmds)
    expect(out).toHaveLength(1)
    expect(out[0]).toHaveLength(4)
    expect(out[0][3]).toEqual({ x: 0, y: 10 })
  })

  it('handles two contours (glyph with a hole)', () => {
    const cmds: Cmd[] = [
      { type: 'M', x: 0, y: 0 }, { type: 'L', x: 10, y: 0 }, { type: 'L', x: 5, y: 10 }, { type: 'Z' },
      { type: 'M', x: 2, y: 2 }, { type: 'L', x: 8, y: 2 }, { type: 'L', x: 5, y: 8 }, { type: 'Z' },
    ]
    expect(flatten(cmds)).toHaveLength(2)
  })

  it('subdivides quadratic curves and lands on the endpoint', () => {
    const cmds: Cmd[] = [
      { type: 'M', x: 0, y: 0 },
      { type: 'Q', x1: 5, y1: 10, x: 10, y: 0 },
      { type: 'Z' },
    ]
    const c = flatten(cmds)[0]
    expect(c.length).toBeGreaterThan(5)
    const last = c[c.length - 1]
    expect(last.x).toBeCloseTo(10)
    expect(last.y).toBeCloseTo(0)
    const mid = c[Math.floor(c.length / 2)]
    expect(mid.y).toBeGreaterThan(2)
  })

  it('subdivides cubic curves and lands on the endpoint', () => {
    const cmds: Cmd[] = [
      { type: 'M', x: 0, y: 0 },
      { type: 'C', x1: 0, y1: 10, x2: 10, y2: 10, x: 10, y: 0 },
      { type: 'Z' },
    ]
    const c = flatten(cmds)[0]
    const last = c[c.length - 1]
    expect(last.x).toBeCloseTo(10)
    expect(last.y).toBeCloseTo(0)
  })
})
