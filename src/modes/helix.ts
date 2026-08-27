import type { Glyph3D } from '../engine/renderer'
import type { Mode } from './mode'

export const helix: Mode = {
  id: 'helix',
  name: 'Helix',
  invertDefault: false,
  params: [
    { kind: 'range', key: 'radius', label: 'Radius', min: 80, max: 700, step: 1, def: 280 },
    { kind: 'range', key: 'turns', label: 'Turns', min: 1, max: 8, step: 0.25, def: 3 },
    { kind: 'range', key: 'pitch', label: 'Pitch', min: 0, max: 600, step: 1, def: 240 },
    { kind: 'range', key: 'spin', label: 'Spin', min: -2, max: 2, step: 0.01, def: 0.35 },
    { kind: 'range', key: 'waveCount', label: 'Wave count', min: 0, max: 12, step: 1, def: 0 },
    { kind: 'range', key: 'waveAmp', label: 'Wave height', min: 0, max: 300, step: 1, def: 0 },
    { kind: 'range', key: 'waveSpeed', label: 'Wave speed', min: -4, max: 4, step: 0.01, def: 1 },
    { kind: 'range', key: 'ripple', label: 'Ripple', min: 0, max: 0.6, step: 0.01, def: 0 },
    { kind: 'range', key: 'xScale', label: 'X scale', min: 0.2, max: 3, step: 0.01, def: 1 },
    { kind: 'range', key: 'yScale', label: 'Y scale', min: 0.2, max: 3, step: 0.01, def: 1 },
  ],
  presets: [
    { name: 'Spring', values: { radius: 280, turns: 3, pitch: 240, spin: 0.35, waveCount: 0, waveAmp: 0, fg: '#111111', bg: '#ffffff' } },
    { name: 'Tornado', values: { radius: 200, turns: 6, pitch: 150, spin: 0.7, waveCount: 4, waveAmp: 40, ripple: 0.3, fg: '#111111', bg: '#ffffff' } },
    { name: 'Ribbon', values: { radius: 420, turns: 1.5, pitch: 420, spin: 0.2, yScale: 1.4, fg: '#111111', bg: '#ffffff' } },
  ],
  build(lines, p, t) {
    const line = lines[0]
    if (!line || line.width <= 0) return []
    const radius = p.radius as number
    const turns = p.turns as number
    const wave = (theta: number) => (p.waveCount as number) * theta + (p.waveSpeed as number) * t
    const out: Glyph3D[] = []
    for (const g of line.glyphs) {
      if (!g.contours.length) continue
      const contours = g.contours.map(c =>
        c.map(pt => {
          const frac = (g.x + pt.x * (p.xScale as number)) / line.width
          const theta = frac * Math.PI * 2 * turns + (p.spin as number) * t
          const r = radius * (1 + (p.ripple as number) * Math.sin(wave(theta)))
          return {
            x: r * Math.sin(theta),
            y: (frac - 0.5) * turns * (p.pitch as number) + pt.y * (p.yScale as number) + (p.waveAmp as number) * Math.sin(wave(theta)),
            z: -r * Math.cos(theta),
          }
        }),
      )
      out.push({ contours })
    }
    return out
  },
}
