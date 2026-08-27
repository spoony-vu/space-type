import { describe, it, expect } from 'vitest'
import { projectGlyphs, renderFrame, decimate, countPoints, type Glyph3D, type ScreenGlyph } from '../src/engine/renderer'
import { defaultCamera } from '../src/engine/camera'

function square(z: number): Glyph3D {
  return { contours: [[{ x: 0, y: 0, z }, { x: 10, y: 0, z }, { x: 10, y: 10, z }, { x: 0, y: 10, z }]] }
}

function stubCtx() {
  const calls: string[] = []
  return {
    calls,
    fillStyle: '', strokeStyle: '', lineWidth: 0, lineJoin: '',
    fillRect: (..._a: number[]) => calls.push('fillRect'),
    beginPath: () => calls.push('beginPath'),
    moveTo: (x: number, _y: number) => calls.push(`moveTo:${Math.round(x)}`),
    lineTo: () => calls.push('lineTo'),
    closePath: () => calls.push('closePath'),
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
  } as unknown as CanvasRenderingContext2D & { calls: string[] }
}

describe('projectGlyphs', () => {
  it('averages depth per glyph', () => {
    const out = projectGlyphs([square(0), square(500)], defaultCamera(), 0, 0)
    expect(out[0].depth).toBeCloseTo(0)
    expect(out[1].depth).toBeCloseTo(500)
  })
})

describe('renderFrame', () => {
  it('clears background then draws far glyphs first', () => {
    const near: ScreenGlyph = { contours: [[{ x: 1, y: 0 }, { x: 2, y: 0 }]], depth: -100 }
    const far: ScreenGlyph = { contours: [[{ x: 99, y: 0 }, { x: 98, y: 0 }]], depth: 100 }
    const ctx = stubCtx()
    renderFrame(ctx, 100, 100, [near, far], { mode: 'fill', weight: 2, fg: '#000', bg: '#fff' })
    expect(ctx.calls[0]).toBe('fillRect')
    const firstMove = ctx.calls.findIndex(c => c.startsWith('moveTo'))
    expect(ctx.calls[firstMove]).toBe('moveTo:99')
    expect(ctx.calls).toContain('fill')
    expect(ctx.calls).not.toContain('stroke')
  })

  it('strokes in stroke mode', () => {
    const ctx = stubCtx()
    renderFrame(ctx, 100, 100, [{ contours: [[{ x: 0, y: 0 }, { x: 1, y: 1 }]], depth: 0 }], { mode: 'stroke', weight: 2, fg: '#000', bg: '#fff' })
    expect(ctx.calls).toContain('stroke')
    expect(ctx.calls).not.toContain('fill')
  })
})

describe('decimate', () => {
  it('leaves small scenes alone', () => {
    const g = [square(0)]
    expect(decimate(g, 100)).toBe(g)
  })

  it('reduces point count below the cap', () => {
    const big: Glyph3D = { contours: [Array.from({ length: 1000 }, (_, i) => ({ x: i, y: 0, z: 0 }))] }
    const out = decimate([big], 500)
    expect(countPoints(out)).toBeLessThanOrEqual(510)
    expect(countPoints(out)).toBeGreaterThan(100)
  })
})
