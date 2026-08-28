import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { DialRoot, useDialKitController, type DialConfig, type DialKitController } from 'dialkit'
import 'dialkit/styles.css'
import type { Mode } from '../modes/mode'
import type { AppState } from '../state'

export function buildConfig(mode: Mode, state: AppState): DialConfig {
  const p = state.params[mode.id]
  const cfg: DialConfig = {}
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
    Render: { type: 'select', options: ['fill', 'stroke'], default: state.renderMode },
    Weight: [state.weight, 0.5, 8, 0.1],
  }
  return cfg
}

export function syncFromDial(v: Record<string, any>, mode: Mode, state: AppState): void {
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
  if (st.Render !== undefined) state.renderMode = st.Render
  if (st.Weight !== undefined) state.weight = st.Weight
}

export function buildUpdates(mode: Mode, state: AppState): Record<string, unknown> {
  const p = state.params[mode.id]
  const u: Record<string, unknown> = {}
  for (const d of mode.params) {
    u[d.label] = d.kind === 'range' ? Number(p[d.key] ?? d.def) : Boolean(p[d.key] ?? d.def)
  }
  u.Camera = {
    'Rotate X': state.camera.rotX,
    'Rotate Y': state.camera.rotY,
    'Rotate Z': state.camera.rotZ,
    Zoom: state.camera.zoom,
  }
  u.Style = { Ink: state.fg, Paper: state.bg, Render: state.renderMode, Weight: state.weight }
  return u
}

interface DialBridge {
  setMode(mode: Mode): void
  apply(): void
}

let currentCtl: DialKitController<DialConfig> | null = null

function ModePanel({ mode, state, onChange }: { mode: Mode; state: AppState; onChange: () => void }) {
  const config = useMemo(() => buildConfig(mode, state), [mode])
  const ctl = useDialKitController(mode.name, config, { id: mode.id })
  currentCtl = ctl as DialKitController<DialConfig>
  syncFromDial(ctl.values as Record<string, any>, mode, state)
  onChange()
  return null
}

export function mountDialPanel(state: AppState, initial: Mode, onChange: () => void): DialBridge {
  let setModeFn: (m: Mode) => void = () => {}
  let activeMode = initial

  function App() {
    const [mode, setMode] = useState(initial)
    setModeFn = setMode
    return (
      <>
        <DialRoot position="top-right" defaultOpen theme="light" productionEnabled />
        <ModePanel key={mode.id} mode={mode} state={state} onChange={onChange} />
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
