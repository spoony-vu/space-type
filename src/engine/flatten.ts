export interface Pt { x: number; y: number }

export interface Cmd {
  type: 'M' | 'L' | 'Q' | 'C' | 'Z'
  x?: number
  y?: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

const SEGS = 10

export function flatten(cmds: Cmd[]): Pt[][] {
  const contours: Pt[][] = []
  let cur: Pt[] = []
  let last: Pt = { x: 0, y: 0 }
  for (const c of cmds) {
    if (c.type === 'M') {
      if (cur.length) contours.push(cur)
      last = { x: c.x!, y: c.y! }
      cur = [last]
    } else if (c.type === 'L') {
      last = { x: c.x!, y: c.y! }
      cur.push(last)
    } else if (c.type === 'Q') {
      for (let i = 1; i <= SEGS; i++) {
        const t = i / SEGS
        const u = 1 - t
        cur.push({
          x: u * u * last.x + 2 * u * t * c.x1! + t * t * c.x!,
          y: u * u * last.y + 2 * u * t * c.y1! + t * t * c.y!,
        })
      }
      last = { x: c.x!, y: c.y! }
    } else if (c.type === 'C') {
      for (let i = 1; i <= SEGS; i++) {
        const t = i / SEGS
        const u = 1 - t
        cur.push({
          x: u * u * u * last.x + 3 * u * u * t * c.x1! + 3 * u * t * t * c.x2! + t * t * t * c.x!,
          y: u * u * u * last.y + 3 * u * u * t * c.y1! + 3 * u * t * t * c.y2! + t * t * t * c.y!,
        })
      }
      last = { x: c.x!, y: c.y! }
    } else if (c.type === 'Z') {
      if (cur.length) {
        contours.push(cur)
        cur = []
      }
    }
  }
  if (cur.length) contours.push(cur)
  return contours
}
