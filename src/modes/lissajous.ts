import type { Glyph3D } from '../engine/renderer'
import type { Mode } from './mode'

export const lissajous: Mode = {
  id: 'lissajous',
  name: 'Lissajous',
  invertDefault: true,
  params: [
    { kind: 'range', key: 'freqX', label: 'Freq X', min: 1, max: 9, step: 1, def: 3 },
    { kind: 'range', key: 'freqY', label: 'Freq Y', min: 1, max: 9, step: 1, def: 2 },
    { kind: 'range', key: 'freqZ', label: 'Freq Z', min: 0, max: 9, step: 1, def: 1 },
    { kind: 'range', key: 'ampX', label: 'Amp X', min: 0, max: 900, step: 5, def: 430 },
    { kind: 'range', key: 'ampY', label: 'Amp Y', min: 0, max: 900, step: 5, def: 260 },
    { kind: 'range', key: 'ampZ', label: 'Amp Z', min: 0, max: 900, step: 5, def: 320 },
    { kind: 'range', key: 'delta', label: 'Phase delta', min: 0, max: 3.14, step: 0.01, def: 1.57 },
    { kind: 'range', key: 'speed', label: 'Speed', min: -2, max: 2, step: 0.01, def: 0.4 },
    { kind: 'range', key: 'xScale', label: 'X scale', min: 0.2, max: 3, step: 0.01, def: 1 },
    { kind: 'range', key: 'yScale', label: 'Y scale', min: 0.2, max: 3, step: 0.01, def: 1 },
  ],
  presets: [
    { name: 'Orbit', values: { freqX: 1, freqY: 2, freqZ: 1, ampX: 480, ampY: 240, ampZ: 300, delta: 1.57, speed: 0.35, fg: '#ffffff', bg: '#000000' } },
    { name: 'Knot', values: { freqX: 3, freqY: 2, freqZ: 5, ampX: 420, ampY: 300, ampZ: 260, delta: 1.05, speed: 0.4, fg: '#ffffff', bg: '#000000' } },
    { name: 'Weave', values: { freqX: 5, freqY: 4, freqZ: 1, ampX: 520, ampY: 320, ampZ: 160, delta: 1.57, speed: 0.25, fg: '#ffffff', bg: '#000000' } },
    { name: 'Infinity', values: { freqX: 2, freqY: 1, freqZ: 0, ampX: 520, ampY: 260, ampZ: 0, delta: 1.57, speed: 0.5, fg: '#ffffff', bg: '#000000' } },
  ],
  build(lines, p, t) {
    const line = lines[0]
    if (!line || line.width <= 0) return []
    const phase = (p.speed as number) * t
    const out: Glyph3D[] = []
    for (const g of line.glyphs) {
      if (!g.contours.length) continue
      const contours = g.contours.map(c =>
        c.map(pt => {
          const u = (g.x + pt.x * (p.xScale as number)) / line.width
          const th = u * Math.PI * 2
          return {
            x: (p.ampX as number) * Math.sin((p.freqX as number) * th + (p.delta as number) + phase),
            y: (p.ampY as number) * Math.sin((p.freqY as number) * th + phase) + pt.y * (p.yScale as number),
            z: (p.ampZ as number) * Math.sin((p.freqZ as number) * th + phase),
          }
        }),
      )
      out.push({ contours })
    }
    return out
  },
}
