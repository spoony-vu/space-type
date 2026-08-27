import { CAM_DIST, type Vec3 } from './types'

export interface Camera {
  rotX: number
  rotY: number
  rotZ: number
  zoom: number
  dist: number
}

export const defaultCamera = (): Camera => ({ rotX: 0, rotY: 0, rotZ: 0, zoom: 1, dist: CAM_DIST })

export function rotate(p: Vec3, cam: Camera): Vec3 {
  let { x, y, z } = p
  let c = Math.cos(cam.rotX)
  let s = Math.sin(cam.rotX)
  ;[y, z] = [y * c - z * s, y * s + z * c]
  c = Math.cos(cam.rotY)
  s = Math.sin(cam.rotY)
  ;[x, z] = [x * c + z * s, -x * s + z * c]
  c = Math.cos(cam.rotZ)
  s = Math.sin(cam.rotZ)
  ;[x, y] = [x * c - y * s, x * s + y * c]
  return { x, y, z }
}

const NEAR = 10

export interface Projected { x: number; y: number; depth: number }

export function project(p: Vec3, cam: Camera, cx: number, cy: number): Projected {
  const r = rotate(p, cam)
  const zc = Math.max(r.z + cam.dist, NEAR)
  const s = (cam.dist / zc) * cam.zoom
  return { x: cx + r.x * s, y: cy + r.y * s, depth: r.z }
}
