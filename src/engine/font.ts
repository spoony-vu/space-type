import opentype from 'opentype.js'
import { flatten, type Cmd, type Pt } from './flatten'

export interface ShapedGlyph {
  char: string
  x: number
  width: number
  contours: Pt[][]
}

export interface ShapedLine {
  glyphs: ShapedGlyph[]
  width: number
  size: number
}

export class FontStore {
  private font: opentype.Font | null = null
  private cache = new Map<string, Pt[][]>()

  parse(buf: ArrayBuffer): void {
    this.font = opentype.parse(buf)
    this.cache.clear()
  }

  async loadUrl(url: string): Promise<void> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`font fetch failed: ${res.status}`)
    this.parse(await res.arrayBuffer())
  }

  get ready(): boolean {
    return this.font !== null
  }

  shapeLine(text: string, size: number): ShapedLine {
    const font = this.font
    if (!font || !text) return { glyphs: [], width: 0, size }
    const scale = size / font.unitsPerEm
    const glyphs: ShapedGlyph[] = []
    let x = 0
    for (const char of text) {
      const glyph = font.charToGlyph(char)
      const width = (glyph.advanceWidth ?? 0) * scale
      const key = `${char}:${size}`
      let contours = this.cache.get(key)
      if (!contours) {
        contours = flatten(glyph.getPath(0, 0, size).commands as Cmd[])
        this.cache.set(key, contours)
      }
      glyphs.push({ char, x, width, contours })
      x += width
    }
    return { glyphs, width: x, size }
  }
}
