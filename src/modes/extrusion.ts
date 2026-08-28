import { CAM_DIST, FONT_SIZE } from '../engine/types'
import type { Glyph3D } from '../engine/renderer'
import type { Mode } from './mode'

export const extrusion: Mode = {
  id: 'extrusion',
  name: 'Extrusion',
  invertDefault: true,
  params: [
    { kind: 'range', key: 'depth', label: 'Smear depth', min: 0, max: 20000, step: 100, def: 9000 },
    { kind: 'range', key: 'steps', label: 'Smear steps', min: 2, max: 80, step: 1, def: 48 },
    { kind: 'range', key: 'vpX', label: 'Vanish X', min: -800, max: 800, step: 1, def: 0 },
    { kind: 'range', key: 'vpY', label: 'Vanish Y', min: -800, max: 800, step: 1, def: 0 },
    { kind: 'range', key: 'scale', label: 'Scale', min: 0.3, max: 2.5, step: 0.01, def: 1 },
    { kind: 'range', key: 'lineGap', label: 'Line gap', min: 100, max: 900, step: 1, def: 620 },
    { kind: 'range', key: 'breathe', label: 'Breathe', min: 0, max: 0.9, step: 0.01, def: 0.3 },
    { kind: 'range', key: 'breatheSpeed', label: 'Breathe speed', min: 0, max: 4, step: 0.01, def: 0.7 },
  ],
  presets: [
    { name: 'Filmabend', values: { depth: 12000, steps: 56, vpX: 60, vpY: 0, scale: 1.15, lineGap: 640, breathe: 0, fg: '#ffffff', bg: '#000000' } },
    { name: 'Pulse', values: { depth: 9000, steps: 48, vpX: 0, vpY: 0, scale: 1, breathe: 0.5, breatheSpeed: 0.9, fg: '#ffffff', bg: '#000000' } },
    { name: 'Corner pull', values: { depth: 15000, steps: 60, vpX: 420, vpY: -320, scale: 0.9, breathe: 0.15, breatheSpeed: 0.5, fg: '#ffffff', bg: '#000000' } },
    { name: 'Shallow slab', values: { depth: 2600, steps: 40, vpX: -180, vpY: 140, scale: 1.05, lineGap: 480, breathe: 0, fg: '#111111', bg: '#ffffff' } },
    { name: 'Collapse', values: { depth: 18000, steps: 72, vpX: 0, vpY: 60, scale: 1.3, lineGap: 700, breathe: 0.7, breatheSpeed: 1.4, fg: '#ffffff', bg: '#000000' } },
  ],
  build(lines, p, t) {
    const real = lines.filter(l => l.width > 0)
    if (!real.length) return []
    const steps = Math.max(2, Math.round(p.steps as number))
    const D = (p.depth as number) * (1 + (p.breathe as number) * Math.sin((p.breatheSpeed as number) * t))
    const vpx = p.vpX as number
    const vpy = p.vpY as number
    const sc = p.scale as number
    const out: Glyph3D[] = []
    real.forEach((line, li) => {
      const yBase = (li - (real.length - 1) / 2) * (p.lineGap as number) + FONT_SIZE * 0.35
      const kFar = CAM_DIST / (CAM_DIST + Math.max(D, 0))
      for (const g of line.glyphs) {
        if (!g.contours.length) continue
        for (let s = 0; s < steps; s++) {
          // uniform steps in screen scale, not depth, so the smear looks continuous
          const k = kFar + (1 - kFar) * (s / (steps - 1))
          const contours = g.contours.map(c =>
            c.map(pt => ({
              x: vpx + ((g.x - line.width / 2 + pt.x) * sc - vpx) * k,
              y: vpy + ((yBase + pt.y) * sc - vpy) * k,
              z: 0,
            })),
          )
          out.push({ contours })
        }
      }
    })
    return out
  },
}
