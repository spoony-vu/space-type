import { describe, it, expect } from 'vitest'
import { lissajous } from '../src/modes/lissajous'
import { defaultParams } from '../src/modes/mode'
import type { ShapedLine } from '../src/engine/font'

const line: ShapedLine = {
  width: 100,
  size: 160,
  glyphs: [
    { char: 'A', x: 0, width: 50, contours: [[{ x: 0, y: 0 }, { x: 40, y: -40 }]] },
    { char: 'B', x: 50, width: 50, contours: [[{ x: 0, y: 0 }, { x: 40, y: -40 }]] },
  ],
}

describe('lissajous', () => {
  it('keeps x within ampX and z flat when freqZ is 0 at phase 0', () => {
    const p = { ...defaultParams(lissajous), ampX: 400, freqZ: 0, speed: 0 }
    const out = lissajous.build([line], p, 0)
    for (const g of out) for (const c of g.contours) for (const pt of c) {
      expect(Math.abs(pt.x)).toBeLessThanOrEqual(400 + 1e-9)
      expect(pt.z).toBeCloseTo(0)
    }
  })

  it('is deterministic and animates with speed', () => {
    const p = { ...defaultParams(lissajous), speed: 1 }
    const a = lissajous.build([line], p, 0)
    const b = lissajous.build([line], p, 0)
    const c = lissajous.build([line], p, 1)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c))
  })

  it('closes the loop: u=0 and u=1 land on the same curve point', () => {
    const closed: ShapedLine = {
      width: 100,
      size: 160,
      glyphs: [
        { char: 'A', x: 0, width: 100, contours: [[{ x: 0, y: 0 }]] },
        { char: 'B', x: 100, width: 0, contours: [[{ x: 0, y: 0 }]] },
      ],
    }
    const p = { ...defaultParams(lissajous), speed: 0 }
    const out = lissajous.build([closed], p, 0)
    const first = out[0].contours[0][0]
    const last = out[1].contours[0][0]
    expect(first.x).toBeCloseTo(last.x)
    expect(first.y).toBeCloseTo(last.y)
    expect(first.z).toBeCloseTo(last.z)
  })

  it('is empty for empty input', () => {
    expect(lissajous.build([], defaultParams(lissajous), 0)).toEqual([])
  })
})
