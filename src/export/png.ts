export type DrawScene = (c: CanvasRenderingContext2D, w: number, h: number, time: number) => void

export function downloadBlob(blob: Blob, name: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

export async function renderPNG(draw: DrawScene, w: number, h: number, scale: number, time: number): Promise<Blob> {
  const c = document.createElement('canvas')
  c.width = w * scale
  c.height = h * scale
  const ctx = c.getContext('2d')!
  ctx.scale(scale, scale)
  draw(ctx, w, h, time)
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'))
}
