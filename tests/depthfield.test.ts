import { describe, it, expect } from 'vitest'
import { depthfield } from '../src/modes/depthfield'
import { defaultParams } from '../src/modes/mode'
import { mulberry32 } from '../src/engine/rng'
import type { ShapedLine } from '../src/engine/font'

const line: ShapedLine = {
  width: 200,
  glyphs: ['P', 'E', 'R', 'S'].map((char, i) => ({
    char, x: i * 50, width: 50,
    contours: [[{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: -40 }]],
  })),
}

describe('mulberry32', () => {
  it('is deterministic per seed and varies across seeds', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const c = mulberry32(43)
    const seq = [a(), a(), a()]
    expect([b(), b(), b()]).toEqual(seq)
    expect(c()).not.toBe(seq[0])
    for (const v of seq) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1) }
  })
})

describe('depthfield', () => {
  it('emits one glyph per letter, deterministically per seed', () => {
    const p = { ...defaultParams(depthfield), seed: 7, drift: 0 }
    const a = depthfield.build([line], p, 0)
    const b = depthfield.build([line], p, 0)
    expect(a).toHaveLength(4)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('changes layout with seed', () => {
    const a = depthfield.build([line], { ...defaultParams(depthfield), seed: 1, drift: 0 }, 0)
    const b = depthfield.build([line], { ...defaultParams(depthfield), seed: 2, drift: 0 }, 0)
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
  })

  it('spreads letters through depth within bounds', () => {
    const p = { ...defaultParams(depthfield), seed: 3, depth: 2000, drift: 0 }
    const zs = depthfield.build([line], p, 0).map(g => g.contours[0][0].z)
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(200)
    for (const z of zs) { expect(z).toBeGreaterThanOrEqual(-1000); expect(z).toBeLessThan(1000) }
  })

  it('drifts letters through depth over time', () => {
    const p = { ...defaultParams(depthfield), seed: 3, drift: 1 }
    const a = depthfield.build([line], p, 0).map(g => g.contours[0][0].z)
    const b = depthfield.build([line], p, 2).map(g => g.contours[0][0].z)
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
  })

  it('snaps x/y to a grid when grid is on', () => {
    const p = { ...defaultParams(depthfield), seed: 5, grid: true, drift: 0, spreadX: 400, spreadY: 400 }
    const out = depthfield.build([line], p, 0)
    const xs = new Set(out.map(g => Math.round(g.contours[0][0].x)))
    expect(xs.size).toBeLessThanOrEqual(2)
  })
})
