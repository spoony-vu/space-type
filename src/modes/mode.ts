import type { ShapedLine } from '../engine/font'
import type { Glyph3D } from '../engine/renderer'
import type { Params } from '../engine/types'

export interface ParamDef {
  kind: 'range' | 'checkbox'
  key: string
  label: string
  min?: number
  max?: number
  step?: number
  def: number | boolean
}

export interface Preset {
  name: string
  values: Params
}

export interface Mode {
  id: string
  name: string
  invertDefault: boolean
  params: ParamDef[]
  presets: Preset[]
  build(lines: ShapedLine[], p: Params, t: number): Glyph3D[]
}

export function defaultParams(mode: Mode): Params {
  const out: Params = {}
  for (const d of mode.params) out[d.key] = d.def
  return out
}
