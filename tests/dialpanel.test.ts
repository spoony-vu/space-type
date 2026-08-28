import { describe, it, expect } from 'vitest'
import { buildConfig, buildUpdates, syncFromDial } from '../src/ui/dialpanel'
import { cylinder } from '../src/modes/cylinder'
import { depthfield } from '../src/modes/depthfield'
import type { AppState } from '../src/state'

const MODES = [cylinder, depthfield]

function makeState(): AppState {
  return {
    mode: 'cylinder',
    text: 'HI',
    caption: '',
    fontId: 'archivo-black',
    fontSize: 160,
    fg: '#111111',
    bg: '#ffffff',
    shade: '#9a9a9a',
    depthTint: 0.55,
    renderMode: 'fill',
    split: 0.5,
    weight: 2,
    camera: { rotX: 0.14, rotY: 0, rotZ: 0, zoom: 1 },
    params: { cylinder: { radius: 300, spin: 0.35 }, depthfield: { seed: 1 } },
  }
}

describe('buildConfig', () => {
  it('includes mode/text/font controls, params, folders, presets and export actions', () => {
    const cfg = buildConfig(cylinder, MODES, makeState()) as Record<string, any>
    expect(cfg.Mode.type).toBe('select')
    expect(cfg.Mode.default).toBe('cylinder')
    expect(cfg.Text).toMatchObject({ type: 'text', default: 'HI' })
    expect(cfg.Font.type).toBe('select')
    expect(cfg.Size).toEqual([160, 40, 400, 1])
    expect(cfg['Upload font']).toEqual({ type: 'action' })
    expect(cfg.Radius).toEqual([300, 80, 700, 1])
    expect(cfg.Camera['Rotate X']).toEqual([0.14, -1.6, 1.6, 0.01])
    expect(cfg.Style.Ink).toEqual({ type: 'color', default: '#111111' })
    expect(cfg.Style.Shade).toEqual({ type: 'color', default: '#9a9a9a' })
    expect(cfg.Style['Depth tint']).toEqual([0.55, 0, 1, 0.01])
    expect(cfg.Presets.Simple).toEqual({ type: 'action' })
    expect(cfg.Export.png).toEqual({ type: 'action', label: 'PNG still (3x)' })
    expect(cfg.Caption).toBeUndefined()
  })

  it('adds a caption control only for depth field', () => {
    const s = makeState()
    s.mode = 'depthfield'
    const cfg = buildConfig(depthfield, MODES, s) as Record<string, any>
    expect(cfg.Caption).toMatchObject({ type: 'text' })
  })
})

describe('syncFromDial', () => {
  it('writes dial values back into app state', () => {
    const s = makeState()
    syncFromDial(
      {
        Mode: 'depthfield',
        Text: 'HELLO',
        Font: 'space-mono',
        Radius: 500,
        Spin: -1,
        Camera: { 'Rotate X': 0.5, Zoom: 2 },
        Style: { Ink: '#ff0000', Paper: '#000000', Shade: '#444444', 'Depth tint': 0.8, Render: 'stroke', Weight: 4 },
      },
      cylinder,
      s,
    )
    expect(s.mode).toBe('depthfield')
    expect(s.text).toBe('HELLO')
    expect(s.fontId).toBe('space-mono')
    expect(s.params.cylinder.radius).toBe(500)
    expect(s.camera.rotX).toBe(0.5)
    expect(s.fg).toBe('#ff0000')
    expect(s.shade).toBe('#444444')
    expect(s.depthTint).toBe(0.8)
    expect(s.renderMode).toBe('stroke')
    expect(s.weight).toBe(4)
  })
})

describe('buildUpdates', () => {
  it('round-trips with syncFromDial', () => {
    const s = makeState()
    s.params.cylinder.radius = 444
    s.fg = '#00ff00'
    s.text = 'ROUND|TRIP'
    const u = buildUpdates(cylinder, s) as Record<string, any>
    expect(u.Mode).toBe('cylinder')
    expect(u.Text).toBe('ROUND|TRIP')
    expect(u.Radius).toBe(444)
    expect(u.Style.Ink).toBe('#00ff00')
    const s2 = makeState()
    syncFromDial(u, cylinder, s2)
    expect(s2.params.cylinder.radius).toBe(444)
    expect(s2.fg).toBe('#00ff00')
    expect(s2.text).toBe('ROUND|TRIP')
  })
})
