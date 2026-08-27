import { project, type Camera } from './camera'
import type { Vec3 } from './types'

export interface Glyph3D { contours: Vec3[][] }

export interface ScreenGlyph {
  contours: { x: number; y: number }[][]
  depth: number
}

export interface RenderStyle {
  mode: 'fill' | 'stroke'
  weight: number
  fg: string
  bg: string
}

export function projectGlyphs(glyphs: Glyph3D[], cam: Camera, cx: number, cy: number): ScreenGlyph[] {
  return glyphs.map(g => {
    let depthSum = 0
    let count = 0
    const contours = g.contours.map(c =>
      c.map(p => {
        const pr = project(p, cam, cx, cy)
        depthSum += pr.depth
        count++
        return { x: pr.x, y: pr.y }
      }),
    )
    return { contours, depth: count ? depthSum / count : 0 }
  })
}

export function renderFrame(ctx: CanvasRenderingContext2D, w: number, h: number, glyphs: ScreenGlyph[], style: RenderStyle): void {
  ctx.fillStyle = style.bg
  ctx.fillRect(0, 0, w, h)
  const sorted = [...glyphs].sort((a, b) => b.depth - a.depth)
  for (const g of sorted) {
    ctx.beginPath()
    for (const c of g.contours) {
      if (c.length < 2) continue
      ctx.moveTo(c[0].x, c[0].y)
      for (let i = 1; i < c.length; i++) ctx.lineTo(c[i].x, c[i].y)
      ctx.closePath()
    }
    if (style.mode === 'fill') {
      ctx.fillStyle = style.fg
      ctx.fill('evenodd')
    } else {
      ctx.strokeStyle = style.fg
      ctx.lineWidth = style.weight
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
  }
}

export function countPoints(glyphs: Glyph3D[]): number {
  let total = 0
  for (const g of glyphs) for (const c of g.contours) total += c.length
  return total
}

export function decimate(glyphs: Glyph3D[], maxPoints: number): Glyph3D[] {
  const total = countPoints(glyphs)
  if (total <= maxPoints) return glyphs
  const step = Math.ceil(total / maxPoints)
  return glyphs.map(g => ({
    contours: g.contours.map(c => (c.length <= 8 ? c : c.filter((_, i) => i % step === 0))),
  }))
}
