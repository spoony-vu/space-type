import './style.css'
import { defaultCamera } from './engine/camera'
import { FontStore, type ShapedLine } from './engine/font'
import { decimate, projectGlyphs, renderFrame, type RenderStyle } from './engine/renderer'
import { FONT_SIZE, type Params } from './engine/types'
import { cylinder } from './modes/cylinder'
import { helix } from './modes/helix'
import { depthfield } from './modes/depthfield'
import { extrusion } from './modes/extrusion'
import { lissajous } from './modes/lissajous'
import { defaultParams, type Mode } from './modes/mode'
import { mountDialPanel } from './ui/dialpanel'
import { fontById } from './ui/fonts'
import { decodeState, encodeState, type AppState } from './state'
import { downloadBlob, renderPNG, type DrawScene } from './export/png'
import { recordWebM } from './export/video'
import { exportFrames } from './export/frames'

const MODES: Mode[] = [cylinder, helix, lissajous, depthfield, extrusion]
const MAX_POINTS = 140000
const PLACEHOLDER = 'TYPE-SOMETHING'

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!
const canvas = $<HTMLCanvasElement>('#stage')
const ctx = canvas.getContext('2d')!

function freshState(): AppState {
  const params: Record<string, Params> = {}
  for (const m of MODES) params[m.id] = defaultParams(m)
  return {
    mode: 'cylinder',
    text: 'TYPE-SOMETHING',
    caption: '',
    fontId: 'archivo-black',
    fg: '#111111',
    bg: '#ffffff',
    shade: '#9a9a9a',
    depthTint: 0.55,
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
  if (m.id === 'depthfield' || m.id === 'extrusion') {
    shaped = text
      .split(/[\n|]/)
      .filter(l => l.trim())
      .map(l => fontStore.shapeLine(l, FONT_SIZE))
  } else {
    shaped = [fontStore.shapeLine(text.replace(/[\n|]+/g, '//'), FONT_SIZE)]
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
  const style: RenderStyle = {
    mode: state.renderMode,
    weight: state.weight,
    fg: state.fg,
    bg: state.bg,
    shade: state.shade,
    depthTint: state.depthTint,
  }
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

let viewW = 1280
let viewH = 800
function resize(): void {
  // hidden/backgrounded windows report 0x0; keep the last real size
  if (window.innerWidth < 2 || window.innerHeight < 2) return
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

// ---------- UI wiring (everything lives in the DialKit panel) ----------

const fileInput = $<HTMLInputElement>('#font-file')
const statusEl = $('#export-status')
const fontError = $('#font-error')

async function loadFont(id: string): Promise<void> {
  fontError.textContent = ''
  try {
    await fontStore.loadUrl(fontById(id).url)
    reshape()
  } catch (e) {
    fontError.textContent = `could not load font (${(e as Error).message})`
  }
}

let shownMode = state.mode
let shownFontId = state.fontId
let shownText = state.text
let shownCaption = state.caption

function onDialChange(): void {
  if (state.mode !== shownMode) {
    shownMode = state.mode
    reshape()
    dial.setMode(mode())
  }
  if (state.fontId !== shownFontId) {
    shownFontId = state.fontId
    loadFont(state.fontId)
  }
  if (state.text !== shownText || state.caption !== shownCaption) {
    shownText = state.text
    shownCaption = state.caption
    reshape()
  }
  scheduleHash()
}

async function onDialAction(path: string): Promise<void> {
  if (path === 'Upload font') {
    fileInput.click()
  } else if (path === 'Style.Invert') {
    ;[state.fg, state.bg] = [state.bg, state.fg]
    dial.apply()
    scheduleHash()
  } else if (path.startsWith('Presets.')) {
    const m = mode()
    const preset = m.presets.find(pr => pr.name === path.slice('Presets.'.length))
    if (!preset) return
    const { fg, bg, ...rest } = preset.values
    state.params[m.id] = { ...defaultParams(m), ...rest }
    if (typeof fg === 'string') state.fg = fg
    if (typeof bg === 'string') state.bg = bg
    dial.apply()
    scheduleHash()
  } else if (path === 'Export.png') {
    statusEl.textContent = 'rendering png...'
    try {
      downloadBlob(await renderPNG(drawScene, viewW, viewH, 3, now()), 'space-type.png')
      statusEl.textContent = ''
    } catch (e) {
      statusEl.textContent = `png failed (${(e as Error).message})`
    }
  } else if (path === 'Export.webm') {
    const p = recordWebM(canvas, 6)
    if (!p) {
      statusEl.textContent = 'webm not supported here, use frames'
      return
    }
    statusEl.textContent = 'recording 6s...'
    downloadBlob(await p, 'space-type.webm')
    statusEl.textContent = ''
  } else if (path === 'Export.frames') {
    try {
      const blob = await exportFrames(drawScene, viewW, viewH, 4, 30, 2, now(), (d, t) => {
        statusEl.textContent = `frame ${d}/${t}`
      })
      downloadBlob(blob, 'space-type-frames.zip')
      statusEl.textContent = ''
    } catch (e) {
      statusEl.textContent = `frames failed (${(e as Error).message})`
    }
  }
}

const dial = mountDialPanel(state, MODES, mode(), onDialChange, onDialAction)

fileInput.addEventListener('change', async e => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  fontError.textContent = ''
  try {
    fontStore.parse(await file.arrayBuffer())
    reshape()
  } catch {
    fontError.textContent = 'could not parse that font file'
  }
})

loadFont(state.fontId)
