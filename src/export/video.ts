const CODECS = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

export function pickMimeType(supported: (t: string) => boolean): string | null {
  for (const c of CODECS) if (supported(c)) return c
  return null
}

export function recordWebM(canvas: HTMLCanvasElement, seconds: number): Promise<Blob> | null {
  if (typeof MediaRecorder === 'undefined') return null
  const mime = pickMimeType(t => MediaRecorder.isTypeSupported(t))
  if (!mime) return null
  return new Promise(res => {
    const rec = new MediaRecorder(canvas.captureStream(60), { mimeType: mime, videoBitsPerSecond: 12_000_000 })
    const chunks: BlobPart[] = []
    rec.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data)
    }
    rec.onstop = () => res(new Blob(chunks, { type: mime }))
    rec.start()
    setTimeout(() => rec.stop(), seconds * 1000)
  })
}
