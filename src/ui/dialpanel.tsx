import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { DialRoot, useDialKitController, type DialConfig, type DialKitController } from 'dialkit'
import 'dialkit/styles.css'
import type { Mode } from '../modes/mode'
import type { AppState } from '../state'
import { FONTS } from './fonts'

export function buildConfig(mode: Mode, modes: Mode[], state: AppState): DialConfig {
  const p = state.params[mode.id]
  const cfg: DialConfig = {
    Mode: { type: 'select', options: modes.map(m => ({ value: m.id, label: m.name })), default: mode.id },
    Text: { type: 'text', default: state.text, placeholder: 'TYPE-SOMETHING (| = line break)' },
  }
  if (mode.id === 'depthfield') {
    cfg.Caption = { type: 'text', default: state.caption, placeholder: 'small centered caption' }
  }
  cfg.Font = {
    type: 'select',
    options: FONTS.map(f => ({ value: f.id, label: f.name })),
    default: FONTS.some(f => f.id === state.fontId) ? state.fontId : FONTS[0].id,
  }
  cfg.Size = [state.fontSize, 40, 400, 1]
  cfg['Upload font'] = { type: 'action' }
  for (const d of mode.params) {
    cfg[d.label] =
      d.kind === 'range'
        ? [Number(p[d.key] ?? d.def), d.min!, d.max!, d.step]
        : Boolean(p[d.key] ?? d.def)
  }
  cfg.Camera = {
    'Rotate X': [state.camera.rotX, -1.6, 1.6, 0.01],
    'Rotate Y': [state.camera.rotY, -3.14, 3.14, 0.01],
    'Rotate Z': [state.camera.rotZ, -1.6, 1.6, 0.01],
    Zoom: [state.camera.zoom, 0.2, 3, 0.01],
  }
  cfg.Style = {
    Ink: { type: 'color', default: state.fg },
    Paper: { type: 'color', default: state.bg },
    Shade: { type: 'color', default: state.shade },
    'Depth tint': [state.depthTint, 0, 1, 0.01],
    Render: {
      type: 'select',
      options: [
        { value: 'fill', label: 'Fill' },
        { value: 'stroke', label: 'Stroke' },
        { value: 'both', label: 'Fill front / stroke back' },
      ],
      default: state.renderMode,
    },
    Split: [state.split, 0, 1, 0.01],
    Weight: [state.weight, 0.5, 8, 0.1],
    Invert: { type: 'action' },
  }
  const presets: DialConfig = {}
  for (const preset of mode.presets) presets[preset.name] = { type: 'action' }
  cfg.Presets = presets
  cfg.Export = {
    _collapsed: true,
    png: { type: 'action', label: 'PNG still (3x)' },
    webm: { type: 'action', label: 'WebM loop (6s)' },
    frames: { type: 'action', label: 'Frame zip (4s / 30fps)' },
  }
  return cfg
}

export function syncFromDial(v: Record<string, any>, mode: Mode, state: AppState): void {
  if (typeof v.Mode === 'string') state.mode = v.Mode
  if (typeof v.Text === 'string') state.text = v.Text
  if (typeof v.Caption === 'string') state.caption = v.Caption
  if (typeof v.Font === 'string') state.fontId = v.Font
  if (typeof v.Size === 'number') state.fontSize = v.Size
  const p = state.params[mode.id]
  for (const d of mode.params) {
    if (v[d.label] !== undefined) p[d.key] = v[d.label]
  }
  const cam = v.Camera ?? {}
  if (cam['Rotate X'] !== undefined) state.camera.rotX = cam['Rotate X']
  if (cam['Rotate Y'] !== undefined) state.camera.rotY = cam['Rotate Y']
  if (cam['Rotate Z'] !== undefined) state.camera.rotZ = cam['Rotate Z']
  if (cam.Zoom !== undefined) state.camera.zoom = cam.Zoom
  const st = v.Style ?? {}
  if (st.Ink !== undefined) state.fg = st.Ink
  if (st.Paper !== undefined) state.bg = st.Paper
  if (st.Shade !== undefined) state.shade = st.Shade
  if (st['Depth tint'] !== undefined) state.depthTint = st['Depth tint']
  if (st.Render !== undefined) state.renderMode = st.Render
  if (st.Split !== undefined) state.split = st.Split
  if (st.Weight !== undefined) state.weight = st.Weight
}

export function buildUpdates(mode: Mode, state: AppState): Record<string, unknown> {
  const p = state.params[mode.id]
  const u: Record<string, unknown> = {
    Mode: mode.id,
    Text: state.text,
    Font: state.fontId,
    Size: state.fontSize,
  }
  if (mode.id === 'depthfield') u.Caption = state.caption
  for (const d of mode.params) {
    u[d.label] = d.kind === 'range' ? Number(p[d.key] ?? d.def) : Boolean(p[d.key] ?? d.def)
  }
  u.Camera = {
    'Rotate X': state.camera.rotX,
    'Rotate Y': state.camera.rotY,
    'Rotate Z': state.camera.rotZ,
    Zoom: state.camera.zoom,
  }
  u.Style = {
    Ink: state.fg,
    Paper: state.bg,
    Shade: state.shade,
    'Depth tint': state.depthTint,
    Render: state.renderMode,
    Split: state.split,
    Weight: state.weight,
  }
  return u
}

interface DialBridge {
  setMode(mode: Mode): void
  apply(): void
}

let currentCtl: DialKitController<DialConfig> | null = null

function ModePanel({
  mode,
  modes,
  state,
  onChange,
  onAction,
}: {
  mode: Mode
  modes: Mode[]
  state: AppState
  onChange: () => void
  onAction: (path: string) => void
}) {
  const config = useMemo(() => buildConfig(mode, modes, state), [mode])
  const ctl = useDialKitController('SPACE TYPE', config, { id: 'space-type', onAction })
  currentCtl = ctl as DialKitController<DialConfig>
  useEffect(() => {
    // stomp any values the store retained from a previous mount; app state is the truth
    ctl.setValues(buildUpdates(mode, state) as never)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])
  useEffect(() => {
    syncFromDial(ctl.values as Record<string, any>, mode, state)
    onChange()
  })
  return null
}

export function mountDialPanel(
  state: AppState,
  modes: Mode[],
  initial: Mode,
  onChange: () => void,
  onAction: (path: string) => void,
): DialBridge {
  let setModeFn: (m: Mode) => void = () => {}
  let activeMode = initial

  function App() {
    const [mode, setMode] = useState(initial)
    setModeFn = setMode
    return (
      <>
        <DialRoot position="top-right" defaultOpen theme="light" productionEnabled />
        <ModePanel key={mode.id} mode={mode} modes={modes} state={state} onChange={onChange} onAction={onAction} />
      </>
    )
  }

  const host = document.createElement('div')
  host.id = 'dial-host'
  document.body.appendChild(host)
  createRoot(host).render(<App />)

  return {
    setMode(mode: Mode) {
      activeMode = mode
      setModeFn(mode)
    },
    apply() {
      currentCtl?.setValues(buildUpdates(activeMode, state) as never)
    },
  }
}
