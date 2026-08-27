import { describe, it, expect } from 'vitest'
import { FONT_SIZE, CAM_DIST } from '../src/engine/types'

describe('scaffold', () => {
  it('exposes shared constants', () => {
    expect(FONT_SIZE).toBe(160)
    expect(CAM_DIST).toBe(1400)
  })
})
