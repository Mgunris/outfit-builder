import { useRef } from 'react'
import type { OutfitLayer } from '../types'
import { useBlobUrl } from '../useBlobUrl'

interface Props {
  layer: OutfitLayer
  image: Blob
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<OutfitLayer>) => void
}

const BASE_WIDTH_FRACTION = 0.42

export default function DraggableLayer({ layer, image, selected, onSelect, onChange }: Props) {
  const url = useBlobUrl(image)
  const dragRef = useRef<{
    pointerId: number
    startClientX: number
    startClientY: number
    startX: number
    startY: number
    containerW: number
    containerH: number
  } | null>(null)
  const gestureRef = useRef<{
    pointerId: number
    centerClientX: number
    centerClientY: number
    startAngle: number
    startDist: number
    startScale: number
    startRotation: number
  } | null>(null)

  function findContainer(el: HTMLElement): HTMLElement {
    return el.closest('[data-outfit-canvas]') as HTMLElement
  }

  function onBodyPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    onSelect()
    const container = findContainer(e.currentTarget as HTMLElement)
    const rect = container.getBoundingClientRect()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: layer.x,
      startY: layer.y,
      containerW: rect.width,
      containerH: rect.height,
    }
  }

  function onBodyPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    const dx = (e.clientX - d.startClientX) / d.containerW
    const dy = (e.clientY - d.startClientY) / d.containerH
    onChange({
      x: Math.min(1, Math.max(0, d.startX + dx)),
      y: Math.min(1, Math.max(0, d.startY + dy)),
    })
  }

  function onBodyPointerUp() {
    dragRef.current = null
  }

  function onHandlePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    const container = findContainer(e.currentTarget as HTMLElement)
    const rect = container.getBoundingClientRect()
    const centerClientX = rect.left + layer.x * rect.width
    const centerClientY = rect.top + layer.y * rect.height
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    gestureRef.current = {
      pointerId: e.pointerId,
      centerClientX,
      centerClientY,
      startAngle: Math.atan2(e.clientY - centerClientY, e.clientX - centerClientX),
      startDist: Math.hypot(e.clientX - centerClientX, e.clientY - centerClientY),
      startScale: layer.scale,
      startRotation: layer.rotation,
    }
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    const g = gestureRef.current
    if (!g || g.pointerId !== e.pointerId) return
    const angle = Math.atan2(e.clientY - g.centerClientY, e.clientX - g.centerClientX)
    const dist = Math.hypot(e.clientX - g.centerClientX, e.clientY - g.centerClientY)
    const rotation = g.startRotation + ((angle - g.startAngle) * 180) / Math.PI
    const scale = Math.max(0.2, Math.min(4, g.startScale * (dist / Math.max(1, g.startDist))))
    onChange({ rotation, scale })
  }

  function onHandlePointerUp() {
    gestureRef.current = null
  }

  if (!url) return null

  return (
    <div
      className="absolute touch-none"
      style={{
        left: `${layer.x * 100}%`,
        top: `${layer.y * 100}%`,
        width: `${BASE_WIDTH_FRACTION * 100}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
        zIndex: layer.z,
      }}
      onPointerDown={onBodyPointerDown}
      onPointerMove={onBodyPointerMove}
      onPointerUp={onBodyPointerUp}
      onPointerCancel={onBodyPointerUp}
    >
      <img src={url} alt="" draggable={false} className="w-full h-auto pointer-events-none select-none" />
      {selected && (
        <>
          <div className="absolute inset-0 border-2 border-rose rounded-md pointer-events-none" />
          <div
            className="absolute -right-3 -bottom-3 w-7 h-7 rounded-full bg-rose border-2 border-white shadow flex items-center justify-center text-white text-xs touch-none"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
          >
            ⤡
          </div>
        </>
      )}
    </div>
  )
}
