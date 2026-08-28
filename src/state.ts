import type { Params } from './engine/types'

export interface AppState {
  mode: string
  text: string
  caption: string
  fontId: string
  fontSize: number
  fg: string
  bg: string
  shade: string
  depthTint: number
  renderMode: 'fill' | 'stroke' | 'both'
  split: number
  weight: number
  camera: { rotX: number; rotY: number; rotZ: number; zoom: number }
  params: Record<string, Params>
}

export function encodeState(s: AppState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))))
}

export function decodeState(h: string): AppState | null {
  if (!h) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(h))))
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.mode !== 'string') return null
    return parsed as AppState
  } catch {
    return null
  }
}
