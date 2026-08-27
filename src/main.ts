import './style.css'
import { defaultCamera } from './engine/camera'
import { FontStore, type ShapedLine } from './engine/font'
import { decimate, projectGlyphs, renderFrame, type RenderStyle } from './engine/renderer'
import { FONT_SIZE, type Params } from './engine/types'
import { cylinder } from './modes/cylinder'
import { helix } from './modes/helix'
import { depthfield } from './modes/depthfield'
import { extrusion } from './modes/extrusion'
import { defaultParams, type Mode } from './modes/mode'
import { buildControls, syncControls } from './ui/controls'
import { FONTS, fontById } from './ui/fonts'
import { decodeState, encodeState, type AppState } from './state'
import { downloadBlob, renderPNG, type DrawScene } from './export/png'
import { recordWebM } from './export/video'
import { exportFrames } from './export/frames'

const MODES: Mode[] = [cylinder, helix, depthfield, extrusion]
const MAX_POINTS = 140000
const PLACEHOLDER = 'TYPE SOMETHING'

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!
const canvas = $<HTMLCanvasElement>('#stage')
const ctx = canvas.getContext('2d')!

function freshState(): AppState {
  const params: Record<string, Params> = {}
  for (const m of MODES) params[m.id] = defaultParams(m)
  return {
    mode: 'cylinder',
    text: 'I-TRY-ALL-THINGS;-I-ACHIEVE-WHAT-I-CAN.//',
    caption: '',
    fontId: 'archivo-black',
    fg: '#111111',
    bg: '#ffffff',
    renderMode: 'fill',
    weight: 2,
    camera: { rotX: 0.14, rotY: 0, rotZ: 0, zoom: 1 },
    params,
  }
}

const saved = decodeState(location.hash.slice(1))
const base = freshState()
const state: AppState = saved
  ? { ...base, ...saved, camera: { ...base.camera, ...saved.camera }, params: { ...base.params, ...saved.params } }
  : base

const fontStore = new FontStore()
let shaped: ShapedLine[] = []
let shapedCaption: ShapedLine | null = null

const mode = (): Mode => MODES.find(m => m.id === state.mode) ?? MODES[0]
const params = (): Params => state.params[state.mode]

function reshape(): void {
  if (!fontStore.ready) return
  const text = state.text.trim() || PLACEHOLDER
  const m = mode()
  if (m.id === 'cylinder' || m.id === 'helix') {
    shaped = [fontStore.shapeLine(text.replace(/\n+/g, '//'), FONT_SIZE)]
  } else {
    shaped = text
      .split('\n')
      .filter(l => l.trim())
      .map(l => fontStore.shapeLine(l, FONT_SIZE))
  }
  shapedCaption = state.caption.trim() ? fontStore.shapeLine(state.caption.trim(), FONT_SIZE * 0.14) : null
}

function pushHash(): void {
  history.replaceState(null, '', '#' + encodeState(state))
}

let hashTimer = 0
function scheduleHash(): void {
  clearTimeout(hashTimer)
  hashTimer = window.setTimeout(pushHash, 300)
}

const drawScene: DrawScene = (c, w, h, time) => {
  // world units are tuned for a ~900px-tall viewport; scale zoom so framing is size-independent
  const cam = { ...defaultCamera(), ...state.camera, zoom: state.camera.zoom * (h / 900) }
  const style: RenderStyle = { mode: state.renderMode, weight: state.weight, fg: state.fg, bg: state.bg }
  const glyphs = decimate(mode().build(shaped, params(), time), MAX_POINTS)
  renderFrame(c, w, h, projectGlyphs(glyphs, cam, w / 2, h / 2), style)
  if (state.mode === 'depthfield' && shapedCaption) {
    const caption = shapedCaption
    const flat = caption.glyphs.map(g => ({
      contours: g.contours.map(ct => ct.map(pt => ({ x: g.x + pt.x - caption.width / 2, y: pt.y + FONT_SIZE * 0.05, z: 0 }))),
    }))
    const screen = projectGlyphs(flat, cam, w / 2, h / 2)
    for (const g of screen) {
      c.beginPath()
      for (const ct of g.contours) {
        if (ct.length < 2) continue
        c.moveTo(ct[0].x, ct[0].y)
        for (let i = 1; i < ct.length; i++) c.lineTo(ct[i].x, ct[i].y)
        c.closePath()
      }
      c.fillStyle = state.fg
      c.fill('evenodd')
    }
  }
}

let viewW = 0
let viewH = 0
function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  viewW = window.innerWidth
  viewH = window.innerHeight
  canvas.width = viewW * dpr
  canvas.height = viewH * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
window.addEventListener('resize', resize)
resize()

const start = performance.now()
const now = () => (performance.now() - start) / 1000
function tick(): void {
  if (fontStore.ready) drawScene(ctx, viewW, viewH, now())
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)

// ---------- UI wiring ----------

const CAMERA_DEFS = [
  { kind: 'range' as const, key: 'rotX', label: 'Rotate X', min: -1.6, max: 1.6, step: 0.01, def: 0.14 },
  { kind: 'range' as const, key: 'rotY', label: 'Rotate Y', min: -3.14, max: 3.14, step: 0.01, def: 0 },
  { kind: 'range' as const, key: 'rotZ', label: 'Rotate Z', min: -1.6, max: 1.6, step: 0.01, def: 0 },
  { kind: 'range' as const, key: 'zoom', label: 'Zoom', min: 0.2, max: 3, step: 0.01, def: 1 },
]

function rebuildPanel(): void {
  buildControls($('#mode-controls'), mode().params, params(), scheduleHash)
  buildControls($('#camera-controls'), CAMERA_DEFS, state.camera as unknown as Params, scheduleHash)
}

const fgEl = $<HTMLInputElement>('#fg')
const bgEl = $<HTMLInputElement>('#bg')
function syncColorInputs(): void {
  fgEl.value = state.fg
  bgEl.value = state.bg
}

function rebuildPresets(): void {
  const box = $('#presets')
  box.innerHTML = ''
  for (const preset of mode().presets) {
    const b = document.createElement('button')
    b.textContent = preset.name
    b.addEventListener('click', () => {
      const { fg, bg, ...rest } = preset.values
      Object.assign(params(), rest)
      if (typeof fg === 'string') state.fg = fg
      if (typeof bg === 'string') state.bg = bg
      syncColorInputs()
      syncControls($('#mode-controls'), params())
      scheduleHash()
    })
    box.appendChild(b)
  }
}

function rebuildModeTabs(): void {
  const box = $('#modes')
  box.innerHTML = ''
  for (const m of MODES) {
    const b = document.createElement('button')
    b.textContent = m.name
    if (m.id === state.mode) b.classList.add('active')
    b.addEventListener('click', () => {
      state.mode = m.id
      reshape()
      rebuildPanel()
      rebuildPresets()
      rebuildModeTabs()
      scheduleHash()
    })
    box.appendChild(b)
  }
}

const textEl = $<HTMLTextAreaElement>('#text')
textEl.value = state.text
textEl.addEventListener('input', () => {
  state.text = textEl.value
  reshape()
  scheduleHash()
})

const captionEl = $<HTMLInputElement>('#caption')
captionEl.value = state.caption
captionEl.addEventListener('input', () => {
  state.caption = captionEl.value
  reshape()
  scheduleHash()
})

const fontSelect = $<HTMLSelectElement>('#font-select')
for (const f of FONTS) {
  const o = document.createElement('option')
  o.value = f.id
  o.textContent = f.name
  fontSelect.appendChild(o)
}
const uploadOption = document.createElement('option')
uploadOption.value = '__uploaded'
uploadOption.textContent = '(uploaded)'
uploadOption.hidden = true
fontSelect.appendChild(uploadOption)
fontSelect.value = fontById(state.fontId).id

const fontError = $('#font-error')
async function loadFont(id: string): Promise<void> {
  fontError.textContent = ''
  try {
    await fontStore.loadUrl(fontById(id).url)
    state.fontId = id
    reshape()
    scheduleHash()
  } catch (e) {
    fontError.textContent = `could not load font (${(e as Error).message})`
  }
}
fontSelect.addEventListener('change', () => loadFont(fontSelect.value))

$<HTMLInputElement>('#font-file').addEventListener('change', async e => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  fontError.textContent = ''
  try {
    fontStore.parse(await file.arrayBuffer())
    fontSelect.value = '__uploaded'
    reshape()
  } catch {
    fontError.textContent = 'could not parse that font file'
  }
})

syncColorInputs()
fgEl.addEventListener('input', () => {
  state.fg = fgEl.value
  scheduleHash()
})
bgEl.addEventListener('input', () => {
  state.bg = bgEl.value
  scheduleHash()
})
$('#invert').addEventListener('click', () => {
  ;[state.fg, state.bg] = [state.bg, state.fg]
  syncColorInputs()
  scheduleHash()
})

const renderModeEl = $<HTMLSelectElement>('#render-mode')
renderModeEl.value = state.renderMode
renderModeEl.addEventListener('change', () => {
  state.renderMode = renderModeEl.value as 'fill' | 'stroke'
  scheduleHash()
})
const weightEl = $<HTMLInputElement>('#weight')
weightEl.value = String(state.weight)
weightEl.addEventListener('input', () => {
  state.weight = Number(weightEl.value)
  scheduleHash()
})

const statusEl = $('#export-status')

$('#export-png').addEventListener('click', async () => {
  statusEl.textContent = 'rendering png...'
  try {
    const blob = await renderPNG(drawScene, viewW, viewH, 3, now())
    downloadBlob(blob, 'space-type.png')
    statusEl.textContent = ''
  } catch (e) {
    statusEl.textContent = `png failed (${(e as Error).message})`
  }
})

$('#export-webm').addEventListener('click', async () => {
  const p = recordWebM(canvas, 6)
  if (!p) {
    statusEl.textContent = 'webm not supported here, use frames'
    return
  }
  statusEl.textContent = 'recording 6s...'
  downloadBlob(await p, 'space-type.webm')
  statusEl.textContent = ''
})

$('#export-frames').addEventListener('click', async () => {
  try {
    const blob = await exportFrames(drawScene, viewW, viewH, 4, 30, 2, now(), (d, t) => {
      statusEl.textContent = `frame ${d}/${t}`
    })
    downloadBlob(blob, 'space-type-frames.zip')
    statusEl.textContent = ''
  } catch (e) {
    statusEl.textContent = `frames failed (${(e as Error).message})`
  }
})

rebuildPanel()
rebuildPresets()
rebuildModeTabs()
loadFont(state.fontId)
