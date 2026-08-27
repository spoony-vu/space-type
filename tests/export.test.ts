import { describe, it, expect } from 'vitest'
import { frameName } from '../src/export/frames'
import { pickMimeType } from '../src/export/video'

describe('frameName', () => {
  it('zero-pads to 4 digits', () => {
    expect(frameName(0)).toBe('frame_0000.png')
    expect(frameName(123)).toBe('frame_0123.png')
  })
})

describe('pickMimeType', () => {
  it('prefers vp9, falls back to vp8, then plain webm, then null', () => {
    expect(pickMimeType(t => t.includes('vp9'))).toBe('video/webm;codecs=vp9')
    expect(pickMimeType(t => t.includes('vp8') && !t.includes('vp9'))).toBe('video/webm;codecs=vp8')
    expect(pickMimeType(t => t === 'video/webm')).toBe('video/webm')
    expect(pickMimeType(() => false)).toBeNull()
  })
})
