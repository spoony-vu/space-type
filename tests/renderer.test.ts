import { describe, it, expect } from 'vitest'
import { projectGlyphs, renderFrame, decimate, countPoints, mixHex, type Glyph3D, type ScreenGlyph } from '../src/engine/renderer'
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
    renderFrame(ctx, 100, 100, [near, far], { mode: 'fill', weight: 2, fg: '#000000', bg: '#ffffff', shade: '#888888', depthTint: 0, split: 0.5 })
    expect(ctx.calls[0]).toBe('fillRect')
    const firstMove = ctx.calls.findIndex(c => c.startsWith('moveTo'))
    expect(ctx.calls[firstMove]).toBe('moveTo:99')
    expect(ctx.calls).toContain('fill')
    expect(ctx.calls).not.toContain('stroke')
  })

  it('strokes in stroke mode', () => {
    const ctx = stubCtx()
    renderFrame(ctx, 100, 100, [{ contours: [[{ x: 0, y: 0 }, { x: 1, y: 1 }]], depth: 0 }], { mode: 'stroke', weight: 2, fg: '#000000', bg: '#ffffff', shade: '#888888', depthTint: 0, split: 0.5 })
    expect(ctx.calls).toContain('stroke')
    expect(ctx.calls).not.toContain('fill')
  })

  it('fills near glyphs and strokes far glyphs in both mode', () => {
    const near: ScreenGlyph = { contours: [[{ x: 1, y: 0 }, { x: 2, y: 0 }]], depth: -100 }
    const far: ScreenGlyph = { contours: [[{ x: 99, y: 0 }, { x: 98, y: 0 }]], depth: 100 }
    const ctx = stubCtx()
    renderFrame(ctx, 100, 100, [near, far], { mode: 'both', weight: 2, fg: '#000000', bg: '#ffffff', shade: '#888888', depthTint: 0, split: 0.5 })
    const strokeIdx = ctx.calls.indexOf('stroke')
    const fillIdx = ctx.calls.lastIndexOf('fill')
    expect(strokeIdx).toBeGreaterThan(0)
    expect(fillIdx).toBeGreaterThan(strokeIdx)
  })
})

describe('mixHex', () => {
  it('interpolates between two hex colors', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('rgb(0,0,0)')
    expect(mixHex('#000000', '#ffffff', 1)).toBe('rgb(255,255,255)')
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('rgb(128,128,128)')
  })
})

describe('depth tint', () => {
  function tintCtx() {
    const fills: string[] = []
    const ctx = {
      _fill: '',
      set fillStyle(v: string) { this._fill = v },
      get fillStyle() { return this._fill },
      strokeStyle: '', lineWidth: 0, lineJoin: '',
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: function (this: { _fill: string }) { fills.push(this._fill) },
      stroke: () => {},
    }
    return { ctx: ctx as unknown as CanvasRenderingContext2D, fills }
  }

  it('shades far glyphs toward the shade color, keeps near glyphs at fg', () => {
    const { ctx, fills } = tintCtx()
    const near: ScreenGlyph = { contours: [[{ x: 0, y: 0 }, { x: 1, y: 0 }]], depth: -100 }
    const far: ScreenGlyph = { contours: [[{ x: 0, y: 0 }, { x: 1, y: 0 }]], depth: 100 }
    renderFrame(ctx, 10, 10, [near, far], { mode: 'fill', weight: 1, fg: '#000000', bg: '#ffffff', shade: '#888888', depthTint: 1, split: 0.5 })
    expect(fills[0]).toBe('rgb(136,136,136)')
    expect(fills[1]).toBe('rgb(0,0,0)')
  })

  it('leaves color uniform when tint is 0', () => {
    const { ctx, fills } = tintCtx()
    const near: ScreenGlyph = { contours: [[{ x: 0, y: 0 }, { x: 1, y: 0 }]], depth: -100 }
    const far: ScreenGlyph = { contours: [[{ x: 0, y: 0 }, { x: 1, y: 0 }]], depth: 100 }
    renderFrame(ctx, 10, 10, [near, far], { mode: 'fill', weight: 1, fg: '#000000', bg: '#ffffff', shade: '#888888', depthTint: 0, split: 0.5 })
    expect(fills).toEqual(['#000000', '#000000'])
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
