import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { FontStore } from '../src/engine/font'

const store = new FontStore()

beforeAll(() => {
  const buf = readFileSync('public/fonts/ArchivoBlack-Regular.ttf')
  store.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
})

describe('FontStore', () => {
  it('is ready after parsing', () => {
    expect(store.ready).toBe(true)
  })

  it('shapes a line with advancing pen positions', () => {
    const line = store.shapeLine('HI', 160)
    expect(line.glyphs).toHaveLength(2)
    expect(line.glyphs[0].x).toBe(0)
    expect(line.glyphs[1].x).toBeGreaterThan(0)
    expect(line.width).toBeGreaterThan(line.glyphs[1].x)
  })

  it('produces non-empty contours with baseline-relative coords', () => {
    const line = store.shapeLine('H', 160)
    const contours = line.glyphs[0].contours
    expect(contours.length).toBeGreaterThan(0)
    const ys = contours.flat().map(p => p.y)
    expect(Math.min(...ys)).toBeLessThan(0)
  })

  it('gives spaces an advance but no contours', () => {
    const line = store.shapeLine('A B', 160)
    expect(line.glyphs[1].contours).toHaveLength(0)
    expect(line.glyphs[1].width).toBeGreaterThan(0)
  })

  it('shapes an empty string to width 0', () => {
    expect(store.shapeLine('', 160)).toEqual({ glyphs: [], width: 0, size: 160 })
  })
})
