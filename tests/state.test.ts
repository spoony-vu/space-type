import { describe, it, expect } from 'vitest'
import { encodeState, decodeState, type AppState } from '../src/state'

const state: AppState = {
  mode: 'cylinder',
  text: 'I TRY ALL THINGS. ø å 日本',
  caption: 'small caption',
  fontId: 'archivo-black',
  fg: '#111111',
  bg: '#ffffff',
  shade: '#9a9a9a',
  depthTint: 0.55,
  renderMode: 'fill',
  weight: 2,
  camera: { rotX: 0.14, rotY: 0, rotZ: 0, zoom: 1 },
  params: { cylinder: { radius: 300, spin: 0.35 }, depthfield: { seed: 7, grid: true } },
}

describe('state', () => {
  it('round-trips through encode/decode', () => {
    expect(decodeState(encodeState(state))).toEqual(state)
  })

  it('returns null for garbage', () => {
    expect(decodeState('%%%not-base64%%%')).toBeNull()
    expect(decodeState('')).toBeNull()
  })
})
