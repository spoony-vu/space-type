import { describe, it, expect } from 'vitest'
import { FONTS, fontById } from '../src/ui/fonts'

describe('font list', () => {
  it('has unique ids and bundled defaults first', () => {
    expect(FONTS[0].id).toBe('archivo-black')
    expect(FONTS[1].id).toBe('space-mono')
    expect(new Set(FONTS.map(f => f.id)).size).toBe(FONTS.length)
    for (const f of FONTS) expect(f.url).toMatch(/\.ttf$/)
  })

  it('looks up by id with fallback to first', () => {
    expect(fontById('space-mono').name).toBe('Space Mono')
    expect(fontById('nope').id).toBe('archivo-black')
  })
})
