/** Loads a File/Blob into an HTMLImageElement. */
export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    if (typeof source === 'string') {
      img.crossOrigin = 'anonymous'
      img.src = source
    } else {
      img.src = URL.createObjectURL(source)
    }
  })
}

/** Downscales an image onto a canvas so its longest side is at most maxDim, returns a PNG blob. */
export function downscaleToBlob(img: HTMLImageElement, maxDim = 1600): Promise<Blob> {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

/**
 * Tries to fetch a remote image (e.g. pasted from a shopping link) as a Blob so it can be
 * stored locally like any other item. Many sites block cross-origin fetches of their images,
 * in which case this throws and the caller should fall back to keeping just the URL.
 */
export async function fetchRemoteImageAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const blob = await res.blob()
  if (!blob.type.startsWith('image/')) throw new Error('Not an image')
  return blob
}
