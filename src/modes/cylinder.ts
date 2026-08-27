import type { Glyph3D } from '../engine/renderer'
import type { Mode } from './mode'

export const cylinder: Mode = {
  id: 'cylinder',
  name: 'Cylinder',
  invertDefault: false,
  params: [
    { kind: 'range', key: 'radius', label: 'Radius', min: 80, max: 700, step: 1, def: 300 },
    { kind: 'range', key: 'copies', label: 'Copies', min: 1, max: 6, step: 1, def: 1 },
    { kind: 'range', key: 'rings', label: 'Rings', min: 1, max: 10, step: 1, def: 1 },
    { kind: 'range', key: 'ringGap', label: 'Ring gap', min: 0, max: 400, step: 1, def: 170 },
    { kind: 'range', key: 'ringTwist', label: 'Ring twist', min: -3.14, max: 3.14, step: 0.01, def: 0 },
    { kind: 'range', key: 'spin', label: 'Spin', min: -2, max: 2, step: 0.01, def: 0.35 },
    { kind: 'range', key: 'waveCount', label: 'Wave count', min: 0, max: 12, step: 1, def: 0 },
    { kind: 'range', key: 'waveAmp', label: 'Wave height', min: 0, max: 300, step: 1, def: 0 },
    { kind: 'range', key: 'waveSpeed', label: 'Wave speed', min: -4, max: 4, step: 0.01, def: 1 },
    { kind: 'range', key: 'ripple', label: 'Ripple', min: 0, max: 0.6, step: 0.01, def: 0 },
    { kind: 'range', key: 'xScale', label: 'X scale', min: 0.2, max: 3, step: 0.01, def: 1 },
    { kind: 'range', key: 'yScale', label: 'Y scale', min: 0.2, max: 3, step: 0.01, def: 1 },
  ],
  presets: [
    { name: 'Simple', values: { radius: 300, copies: 1, rings: 1, spin: 0.35, waveCount: 0, waveAmp: 0, ripple: 0, xScale: 1, yScale: 1, fg: '#111111', bg: '#ffffff' } },
    { name: 'Crown', values: { radius: 320, rings: 1, spin: 0.25, waveCount: 6, waveAmp: 110, waveSpeed: 1.2, ripple: 0, fg: '#111111', bg: '#ffffff' } },
    { name: 'Jellyfish', values: { radius: 280, rings: 2, ringGap: 220, spin: 0.4, waveCount: 3, waveAmp: 150, waveSpeed: 0.8, ripple: 0.22, fg: '#111111', bg: '#ffffff' } },
    { name: 'Zebra', values: { radius: 340, copies: 2, rings: 7, ringGap: 95, ringTwist: 0.35, spin: 0.3, waveCount: 0, waveAmp: 0, yScale: 0.8, fg: '#111111', bg: '#ffffff' } },
  ],
  build(lines, p, t) {
    const line = lines[0]
    if (!line || line.width <= 0) return []
    const radius = p.radius as number
    const copies = Math.round(p.copies as number)
    const rings = Math.round(p.rings as number)
    const span = (Math.PI * 2) / copies
    const wave = (theta: number) => (p.waveCount as number) * theta + (p.waveSpeed as number) * t
    const out: Glyph3D[] = []
    for (let ring = 0; ring < rings; ring++) {
      const yBase = (ring - (rings - 1) / 2) * (p.ringGap as number)
      const phase = (p.spin as number) * t + ring * (p.ringTwist as number)
      for (let k = 0; k < copies; k++) {
        for (const g of line.glyphs) {
          if (!g.contours.length) continue
          const contours = g.contours.map(c =>
            c.map(pt => {
              const ax = g.x + pt.x * (p.xScale as number)
              const theta = (ax / line.width) * span + k * span + phase
              const r = radius * (1 + (p.ripple as number) * Math.sin(wave(theta)))
              return {
                x: r * Math.sin(theta),
                y: yBase + pt.y * (p.yScale as number) + (p.waveAmp as number) * Math.sin(wave(theta)),
                z: r * Math.cos(theta),
              }
            }),
          )
          out.push({ contours })
        }
      }
    }
    return out
  },
}
