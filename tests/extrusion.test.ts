import { describe, it, expect } from 'vitest'
import { extrusion } from '../src/modes/extrusion'
import { defaultParams } from '../src/modes/mode'
import type { ShapedLine } from '../src/engine/font'

const line: ShapedLine = {
  width: 100,
  glyphs: [{ char: 'F', x: 0, width: 100, contours: [[{ x: 0, y: -80 }, { x: 80, y: -80 }, { x: 80, y: 0 }]] }],
}

describe('extrusion', () => {
  it('emits steps copies per glyph, far first (smaller extent first)', () => {
    const p = { ...defaultParams(extrusion), steps: 3, breathe: 0 }
    const out = extrusion.build([line], p, 0)
    expect(out).toHaveLength(3)
    const extent = (i: number) => Math.max(...out[i].contours[0].map(pt => Math.hypot(pt.x, pt.y)))
    expect(extent(0)).toBeLessThan(extent(2))
  })

  it('near copy is at full scale', () => {
    const p = { ...defaultParams(extrusion), steps: 2, scale: 1, vpX: 0, vpY: 0, breathe: 0 }
    const out = extrusion.build([line], p, 0)
    const near = out[1].contours[0][1]
    expect(near.x).toBeCloseTo(30)
  })

  it('converges toward the vanishing point', () => {
    const p = { ...defaultParams(extrusion), steps: 2, vpX: 300, vpY: -200, depth: 100000, breathe: 0 }
    const out = extrusion.build([line], p, 0)
    const far = out[0].contours[0][0]
    expect(far.x).toBeCloseTo(300, -1)
    expect(far.y).toBeCloseTo(-200, -1)
  })

  it('stacks multiple lines vertically', () => {
    const p = { ...defaultParams(extrusion), steps: 2, breathe: 0 }
    const out = extrusion.build([line, line], p, 0)
    expect(out).toHaveLength(4)
    const y0 = out[1].contours[0][2].y
    const y1 = out[3].contours[0][2].y
    expect(y1).toBeGreaterThan(y0)
  })

  it('breathes over time', () => {
    const p = { ...defaultParams(extrusion), steps: 2, breathe: 0.5, breatheSpeed: 1 }
    const a = extrusion.build([line], p, 0)[0].contours[0][0]
    const b = extrusion.build([line], p, 1.2)[0].contours[0][0]
    expect(a.x).not.toBeCloseTo(b.x)
  })
})
