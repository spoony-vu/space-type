import { describe, it, expect } from 'vitest'
import { helix } from '../src/modes/helix'
import { defaultParams } from '../src/modes/mode'
import type { ShapedLine } from '../src/engine/font'

const line: ShapedLine = {
  width: 100,
  glyphs: [
    { char: 'A', x: 0, width: 50, contours: [[{ x: 0, y: 0 }, { x: 40, y: -40 }]] },
    { char: 'B', x: 50, width: 50, contours: [[{ x: 0, y: 0 }, { x: 40, y: -40 }]] },
  ],
}

describe('helix', () => {
  it('rises along the text', () => {
    const p = { ...defaultParams(helix), pitch: 300, turns: 2, spin: 0, waveAmp: 0 }
    const out = helix.build([line], p, 0)
    const yA = out[0].contours[0][0].y
    const yB = out[1].contours[0][0].y
    expect(Math.abs(yB - yA)).toBeGreaterThan(50)
  })

  it('stays on the cylinder radius', () => {
    const p = { ...defaultParams(helix), radius: 250, ripple: 0 }
    for (const g of helix.build([line], p, 0)) for (const c of g.contours) for (const pt of c) {
      expect(Math.hypot(pt.x, pt.z)).toBeCloseTo(250, 5)
    }
  })

  it('starts at angle zero without spin', () => {
    const p = { ...defaultParams(helix), turns: 3, spin: 0 }
    const out = helix.build([line], p, 0)
    const first = out[0].contours[0][0]
    expect(Math.atan2(first.x, -first.z)).toBeCloseTo(0)
  })

  it('is empty for empty input', () => {
    expect(helix.build([], defaultParams(helix), 0)).toEqual([])
  })
})
