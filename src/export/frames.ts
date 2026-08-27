import { zipSync } from 'fflate'
import type { DrawScene } from './png'

export function frameName(i: number): string {
  return `frame_${String(i).padStart(4, '0')}.png`
}

export async function exportFrames(
  draw: DrawScene,
  w: number,
  h: number,
  seconds: number,
  fps: number,
  scale: number,
  t0: number,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const c = document.createElement('canvas')
  c.width = w * scale
  c.height = h * scale
  const ctx = c.getContext('2d')!
  const files: Record<string, Uint8Array> = {}
  const total = Math.round(seconds * fps)
  for (let i = 0; i < total; i++) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    draw(ctx, w, h, t0 + i / fps)
    const blob = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'))
    files[frameName(i)] = new Uint8Array(await blob.arrayBuffer())
    onProgress?.(i + 1, total)
    await new Promise(r => setTimeout(r))
  }
  return new Blob([zipSync(files, { level: 0 }) as unknown as BlobPart], { type: 'application/zip' })
}
