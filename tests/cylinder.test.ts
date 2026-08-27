import { describe, it, expect } from 'vitest'
import { cylinder } from '../src/modes/cylinder'
import { defaultParams } from '../src/modes/mode'
import type { ShapedLine } from '../src/engine/font'

const line: ShapedLine = {
  width: 100,
  glyphs: [
    { char: 'A', x: 0, width: 50, contours: [[{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: -40 }]] },
    { char: 'B', x: 50, width: 50, contours: [[{ x: 0, y: 0 }, { x: 40, y: -40 }]] },
  ],
}

describe('cylinder', () => {
  it('wraps outline points onto the cylinder surface', () => {
    const p = { ...defaultParams(cylinder), radius: 200, spin: 0, waveCount: 0, waveAmp: 0, ripple: 0 }
    const out = cylinder.build([line], p, 0)
    expect(out).toHaveLength(2)
    const first = out[0].contours[0][0]
    expect(first.x).toBeCloseTo(0)
    expect(first.z).toBeCloseTo(200)
    for (const g of out) for (const c of g.contours) for (const pt of c) {
      expect(Math.hypot(pt.x, pt.z)).toBeCloseTo(200, 5)
    }
  })

  it('spins over time', () => {
    const p = { ...defaultParams(cylinder), spin: 1 }
    const a = cylinder.build([line], p, 0)[0].contours[0][0]
    const b = cylinder.build([line], p, 0.5)[0].contours[0][0]
    expect(a.x).not.toBeCloseTo(b.x)
  })

  it('emits copies × rings × glyphs', () => {
    const p = { ...defaultParams(cylinder), copies: 2, rings: 3 }
    expect(cylinder.build([line], p, 0)).toHaveLength(12)
  })

  it('applies vertical wave displacement', () => {
    const flat = { ...defaultParams(cylinder), waveCount: 2, waveAmp: 0, spin: 0 }
    const wavy = { ...defaultParams(cylinder), waveCount: 2, waveAmp: 100, spin: 0, waveSpeed: 0 }
    const a = cylinder.build([line], flat, 0)[1].contours[0][1]
    const b = cylinder.build([line], wavy, 0)[1].contours[0][1]
    expect(a.y).not.toBeCloseTo(b.y)
  })

  it('returns empty for empty input', () => {
    expect(cylinder.build([], defaultParams(cylinder), 0)).toEqual([])
  })
})
