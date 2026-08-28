import { describe, it, expect } from 'vitest'
import { buildConfig, buildUpdates, syncFromDial } from '../src/ui/dialpanel'
import { cylinder } from '../src/modes/cylinder'
import type { AppState } from '../src/state'

function makeState(): AppState {
  return {
    mode: 'cylinder',
    text: 'HI',
    caption: '',
    fontId: 'archivo-black',
    fg: '#111111',
    bg: '#ffffff',
    renderMode: 'fill',
    weight: 2,
    camera: { rotX: 0.14, rotY: 0, rotZ: 0, zoom: 1 },
    params: { cylinder: { radius: 300, spin: 0.35 } },
  }
}

describe('buildConfig', () => {
  it('maps range params to [value, min, max, step] and folders for camera/style', () => {
    const cfg = buildConfig(cylinder, makeState()) as Record<string, any>
    expect(cfg.Radius).toEqual([300, 80, 700, 1])
    expect(cfg.Camera['Rotate X']).toEqual([0.14, -1.6, 1.6, 0.01])
    expect(cfg.Style.Ink).toEqual({ type: 'color', default: '#111111' })
    expect(cfg.Style.Render).toEqual({ type: 'select', options: ['fill', 'stroke'], default: 'fill' })
  })

  it('falls back to param defaults for missing values', () => {
    const s = makeState()
    const cfg = buildConfig(cylinder, s) as Record<string, any>
    expect(cfg.Copies[0]).toBe(1)
  })
})

describe('syncFromDial', () => {
  it('writes dial values back into app state', () => {
    const s = makeState()
    syncFromDial(
      {
        Radius: 500,
        Spin: -1,
        Camera: { 'Rotate X': 0.5, Zoom: 2 },
        Style: { Ink: '#ff0000', Paper: '#000000', Render: 'stroke', Weight: 4 },
      },
      cylinder,
      s,
    )
    expect(s.params.cylinder.radius).toBe(500)
    expect(s.params.cylinder.spin).toBe(-1)
    expect(s.camera.rotX).toBe(0.5)
    expect(s.camera.zoom).toBe(2)
    expect(s.fg).toBe('#ff0000')
    expect(s.renderMode).toBe('stroke')
    expect(s.weight).toBe(4)
  })
})

describe('buildUpdates', () => {
  it('round-trips with syncFromDial', () => {
    const s = makeState()
    s.params.cylinder.radius = 444
    s.fg = '#00ff00'
    const u = buildUpdates(cylinder, s) as Record<string, any>
    expect(u.Radius).toBe(444)
    expect(u.Style.Ink).toBe('#00ff00')
    const s2 = makeState()
    syncFromDial(u, cylinder, s2)
    expect(s2.params.cylinder.radius).toBe(444)
    expect(s2.fg).toBe('#00ff00')
  })
})
