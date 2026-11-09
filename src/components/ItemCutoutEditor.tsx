import { useEffect, useMemo, useRef, useState } from 'react'
import { loadImage } from '../lib/imageUtils'

interface Props {
  file: File | Blob
  onComplete: (cutout: Blob, original: Blob) => void
  onCancel: () => void
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se'

const DISPLAY_MAX = 360
const WORKING_MAX = 900

export default function ItemCutoutEditor({ file, onComplete, onCancel }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [step, setStep] = useState<'crop' | 'erase'>('crop')
  const [crop, setCrop] = useState<Rect | null>(null)
  const [brushSize, setBrushSize] = useState(28)
  const [erasing, setErasing] = useState(false)

  const cropBoxRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ handle: Handle; startX: number; startY: number; startRect: Rect } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pristineRef = useRef<HTMLCanvasElement | null>(null)
  const originalBlobRef = useRef<Blob | null>(null)

  useEffect(() => {
    let cancelled = false
    loadImage(file).then((image) => {
      if (cancelled) return
      setImg(image)
      const w = image.naturalWidth
      const h = image.naturalHeight
      const inset = 0.1
      setCrop({ x: w * inset, y: h * inset, w: w * (1 - inset * 2), h: h * (1 - inset * 2) })
    })
    return () => {
      cancelled = true
    }
  }, [file])

  useEffect(() => {
    return () => {
      if (img && img.src.startsWith('blob:')) URL.revokeObjectURL(img.src)
    }
  }, [img])

  const displaySize = useMemo(() => {
    if (!img) return { w: DISPLAY_MAX, h: DISPLAY_MAX, scale: 1 }
    const scale = Math.min(1, DISPLAY_MAX / Math.max(img.naturalWidth, img.naturalHeight))
    return { w: img.naturalWidth * scale, h: img.naturalHeight * scale, scale }
  }, [img])

  function clampRect(r: Rect, w: number, h: number): Rect {
    const minSize = 20
    const x = Math.max(0, Math.min(r.x, w - minSize))
    const y = Math.max(0, Math.min(r.y, h - minSize))
    const rw = Math.max(minSize, Math.min(r.w, w - x))
    const rh = Math.max(minSize, Math.min(r.h, h - y))
    return { x, y, w: rw, h: rh }
  }

  function startDrag(handle: Handle, e: React.PointerEvent) {
    if (!crop) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = { handle, startX: e.clientX, startY: e.clientY, startRect: crop }
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragState.current || !img) return
    const { handle, startX, startY, startRect } = dragState.current
    const dx = (e.clientX - startX) / displaySize.scale
    const dy = (e.clientY - startY) / displaySize.scale
    const next: Rect = { ...startRect }
    if (handle === 'move') {
      next.x = startRect.x + dx
      next.y = startRect.y + dy
    } else {
      if (handle.includes('w')) {
        next.x = startRect.x + dx
        next.w = startRect.w - dx
      }
      if (handle.includes('e')) {
        next.w = startRect.w + dx
      }
      if (handle.includes('n')) {
        next.y = startRect.y + dy
        next.h = startRect.h - dy
      }
      if (handle.includes('s')) {
        next.h = startRect.h + dy
      }
    }
    setCrop(clampRect(next, img.naturalWidth, img.naturalHeight))
  }

  function endDrag() {
    dragState.current = null
  }

  function applyCrop() {
    if (!img || !crop) return
    const scale = Math.min(1, WORKING_MAX / Math.max(crop.w, crop.h))
    const w = Math.max(1, Math.round(crop.w * scale))
    const h = Math.max(1, Math.round(crop.h * scale))

    const canvas = canvasRef.current!
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h)

    const pristine = document.createElement('canvas')
    pristine.width = w
    pristine.height = h
    pristine.getContext('2d')!.drawImage(canvas, 0, 0)
    pristineRef.current = pristine

    canvas.toBlob((blob) => {
      if (blob) originalBlobRef.current = blob
    }, 'image/png')

    setStep('erase')
  }

  function resetErase() {
    const canvas = canvasRef.current
    const pristine = pristineRef.current
    if (!canvas || !pristine) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(pristine, 0, 0)
  }

  function eraseAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    const ctx = canvas.getContext('2d')!
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, (brushSize / 2) * scaleX, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function finish(skipErase: boolean) {
    const canvas = canvasRef.current
    if (!canvas || !originalBlobRef.current) return
    if (skipErase) resetErase()
    canvas.toBlob((blob) => {
      if (blob) onComplete(blob, originalBlobRef.current!)
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-white p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          {step === 'crop' ? 'Crop the item' : 'Erase the background'}
        </h2>
        <button onClick={onCancel} className="text-white/70 text-sm px-3 py-1">
          Cancel
        </button>
      </div>

      {step === 'crop' && img && crop && (
        <>
          <p className="text-sm text-white/70 mb-3">
            Drag the corners so the box tightly frames the item.
          </p>
          <div
            className="relative select-none touch-none mx-auto"
            style={{ width: displaySize.w, height: displaySize.h }}
          >
            <img
              src={img.src}
              alt="to crop"
              draggable={false}
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            <div
              ref={cropBoxRef}
              onPointerDown={(e) => startDrag('move', e)}
              onPointerMove={onDragMove}
              onPointerUp={endDrag}
              className="absolute border-2 border-rose bg-rose/10"
              style={{
                left: crop.x * displaySize.scale,
                top: crop.y * displaySize.scale,
                width: crop.w * displaySize.scale,
                height: crop.h * displaySize.scale,
              }}
            >
              {(['nw', 'ne', 'sw', 'se'] as Handle[]).map((h) => (
                <div
                  key={h}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    startDrag(h, e)
                  }}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  className="absolute w-6 h-6 -m-3 rounded-full bg-rose border-2 border-white touch-none"
                  style={{
                    left: h.includes('w') ? 0 : '100%',
                    top: h.includes('n') ? 0 : '100%',
                  }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={applyCrop}
            className="mt-4 mx-auto bg-rose text-white rounded-full px-6 py-2 font-medium"
          >
            Apply crop
          </button>
        </>
      )}

      <div
        className={step === 'erase' ? 'contents' : 'hidden'}
      >
        <p className="text-sm text-white/70 mb-3">
          Drag your finger/mouse over any background to erase it. Optional — you can skip this.
        </p>
        <div
          className="mx-auto touch-none rounded-lg overflow-hidden checkerboard"
          style={{
            width: canvasRef.current?.width
              ? Math.min(DISPLAY_MAX, canvasRef.current.width)
              : DISPLAY_MAX,
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-auto block"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              setErasing(true)
              eraseAt(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => {
              if (erasing) eraseAt(e.clientX, e.clientY)
            }}
            onPointerUp={() => setErasing(false)}
            onPointerCancel={() => setErasing(false)}
          />
        </div>

        <div className="flex items-center gap-3 mt-4 mx-auto w-full max-w-sm">
          <span className="text-sm text-white/70">Brush</span>
          <input
            type="range"
            min={8}
            max={80}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="flex-1"
          />
        </div>

        <div className="flex gap-3 mt-4 mx-auto flex-wrap justify-center">
          <button onClick={resetErase} className="bg-white/10 rounded-full px-5 py-2 text-sm">
            Reset
          </button>
          <button onClick={() => finish(true)} className="bg-white/10 rounded-full px-5 py-2 text-sm">
            Skip erasing
          </button>
          <button
            onClick={() => finish(false)}
            className="bg-rose rounded-full px-6 py-2 font-medium"
          >
            Save item
          </button>
        </div>
      </div>
    </div>
  )
}
