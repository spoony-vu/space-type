import { mulberry32 } from '../engine/rng'
import { FONT_SIZE } from '../engine/types'
import type { ShapedGlyph } from '../engine/font'
import type { Mode } from './mode'

export const depthfield: Mode = {
  id: 'depthfield',
  name: 'Depth field',
  invertDefault: true,
  params: [
    { kind: 'range', key: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, def: 1 },
    { kind: 'range', key: 'depth', label: 'Depth', min: 200, max: 4000, step: 10, def: 1800 },
    { kind: 'range', key: 'spreadX', label: 'Spread X', min: 0, max: 1200, step: 5, def: 420 },
    { kind: 'range', key: 'spreadY', label: 'Spread Y', min: 0, max: 1200, step: 5, def: 480 },
    { kind: 'range', key: 'scale', label: 'Letter scale', min: 0.2, max: 4, step: 0.05, def: 1.4 },
    { kind: 'range', key: 'drift', label: 'Drift', min: 0, max: 3, step: 0.01, def: 0.5 },
    { kind: 'checkbox', key: 'grid', label: 'Snap to grid', def: false },
  ],
  presets: [
    { name: 'Poster', values: { grid: true, drift: 0, depth: 1400, spreadX: 420, spreadY: 520, scale: 1.6, fg: '#ffffff', bg: '#000000' } },
    { name: 'Drift', values: { grid: false, drift: 0.8, depth: 2400, spreadX: 500, spreadY: 400, scale: 1.4, fg: '#ffffff', bg: '#000000' } },
    { name: 'Swarm', values: { grid: false, drift: 1.6, depth: 3600, spreadX: 900, spreadY: 800, scale: 1, fg: '#ffffff', bg: '#000000' } },
  ],
  build(lines, p, t) {
    const letters: ShapedGlyph[] = []
    for (const line of lines) for (const g of line.glyphs) if (g.contours.length) letters.push(g)
    if (!letters.length) return []
    const rand = mulberry32(Math.round(p.seed as number))
    const D = p.depth as number
    const scale = p.scale as number
    const spreadX = p.spreadX as number
    const spreadY = p.spreadY as number
    const grid = Boolean(p.grid)
    const n = letters.length

    const cells: { x: number; y: number }[] = []
    if (grid) {
      const cols = Math.ceil(Math.sqrt(n))
      const rows = Math.ceil(n / cols)
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        cells.push({
          x: cols > 1 ? (c / (cols - 1) - 0.5) * 2 * spreadX : 0,
          y: rows > 1 ? (r / (rows - 1) - 0.5) * 2 * spreadY : 0,
        })
      }
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[cells[i], cells[j]] = [cells[j], cells[i]]
      }
    }

    const zOff = t * (p.drift as number) * 120
    return letters.map((g, i) => {
      const px = grid ? cells[i].x : (rand() * 2 - 1) * spreadX
      const py = grid ? cells[i].y : (rand() * 2 - 1) * spreadY
      const z0 = rand() * D
      const z = ((((z0 - zOff) % D) + D) % D) - D / 2
      const cx = g.width / 2
      const contours = g.contours.map(c =>
        c.map(pt => ({
          x: px + (pt.x - cx) * scale,
          y: py + (pt.y + FONT_SIZE * 0.35) * scale,
          z,
        })),
      )
      return { contours }
    })
  },
}
