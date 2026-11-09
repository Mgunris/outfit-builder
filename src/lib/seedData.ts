import { itemsStore, outfitsStore, posesStore } from '../db'
import type { Category, Pose } from '../types'

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

/** Draws a simple flat-color silhouette icon for a clothing category onto a transparent canvas. */
function drawItemIcon(category: Category, color: string): Promise<Blob> {
  const size = 500
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 4

  const cx = size / 2
  const cy = size / 2

  ctx.beginPath()
  switch (category) {
    case 'Tops':
      ctx.moveTo(cx - 60, cy - 150)
      ctx.lineTo(cx - 130, cy - 90)
      ctx.lineTo(cx - 90, cy - 40)
      ctx.lineTo(cx - 60, cy - 70)
      ctx.lineTo(cx - 60, cy + 150)
      ctx.lineTo(cx + 60, cy + 150)
      ctx.lineTo(cx + 60, cy - 70)
      ctx.lineTo(cx + 90, cy - 40)
      ctx.lineTo(cx + 130, cy - 90)
      ctx.lineTo(cx + 60, cy - 150)
      ctx.quadraticCurveTo(cx, cy - 110, cx - 60, cy - 150)
      break
    case 'Bottoms':
      ctx.moveTo(cx - 80, cy - 150)
      ctx.lineTo(cx + 80, cy - 150)
      ctx.lineTo(cx + 80, cy - 60)
      ctx.lineTo(cx + 30, cy - 60)
      ctx.lineTo(cx + 40, cy + 150)
      ctx.lineTo(cx - 5, cy + 150)
      ctx.lineTo(cx - 10, cy - 30)
      ctx.lineTo(cx - 20, cy + 150)
      ctx.lineTo(cx - 75, cy + 150)
      ctx.lineTo(cx - 80, cy - 60)
      ctx.closePath()
      break
    case 'Dresses':
      ctx.moveTo(cx - 50, cy - 150)
      ctx.lineTo(cx - 100, cy - 100)
      ctx.lineTo(cx - 70, cy - 60)
      ctx.lineTo(cx - 50, cy - 80)
      ctx.lineTo(cx - 90, cy + 150)
      ctx.lineTo(cx + 90, cy + 150)
      ctx.lineTo(cx + 50, cy - 80)
      ctx.lineTo(cx + 70, cy - 60)
      ctx.lineTo(cx + 100, cy - 100)
      ctx.lineTo(cx + 50, cy - 150)
      ctx.quadraticCurveTo(cx, cy - 115, cx - 50, cy - 150)
      break
    case 'Outerwear':
      ctx.moveTo(cx - 65, cy - 155)
      ctx.lineTo(cx - 140, cy - 95)
      ctx.lineTo(cx - 95, cy - 35)
      ctx.lineTo(cx - 65, cy - 65)
      ctx.lineTo(cx - 65, cy + 160)
      ctx.lineTo(cx - 15, cy + 160)
      ctx.lineTo(cx - 15, cy - 40)
      ctx.lineTo(cx + 15, cy - 40)
      ctx.lineTo(cx + 15, cy + 160)
      ctx.lineTo(cx + 65, cy + 160)
      ctx.lineTo(cx + 65, cy - 65)
      ctx.lineTo(cx + 95, cy - 35)
      ctx.lineTo(cx + 140, cy - 95)
      ctx.lineTo(cx + 65, cy - 155)
      ctx.lineTo(cx + 25, cy - 120)
      ctx.lineTo(cx, cy - 145)
      ctx.lineTo(cx - 25, cy - 120)
      ctx.closePath()
      break
    case 'Shoes':
      ctx.moveTo(cx - 120, cy + 40)
      ctx.quadraticCurveTo(cx - 130, cy - 30, cx - 70, cy - 35)
      ctx.quadraticCurveTo(cx - 10, cy - 45, cx + 40, cy - 20)
      ctx.quadraticCurveTo(cx + 100, cy + 5, cx + 130, cy + 40)
      ctx.quadraticCurveTo(cx + 135, cy + 65, cx + 110, cy + 65)
      ctx.lineTo(cx - 110, cy + 65)
      ctx.quadraticCurveTo(cx - 130, cy + 65, cx - 120, cy + 40)
      break
    case 'Bags':
      ctx.moveTo(cx - 90, cy - 20)
      ctx.lineTo(cx + 90, cy - 20)
      ctx.quadraticCurveTo(cx + 100, cy - 20, cx + 100, cy - 5)
      ctx.lineTo(cx + 85, cy + 140)
      ctx.quadraticCurveTo(cx + 82, cy + 155, cx + 65, cy + 155)
      ctx.lineTo(cx - 65, cy + 155)
      ctx.quadraticCurveTo(cx - 82, cy + 155, cx - 85, cy + 140)
      ctx.lineTo(cx - 100, cy - 5)
      ctx.quadraticCurveTo(cx - 100, cy - 20, cx - 90, cy - 20)
      ctx.closePath()
      ctx.moveTo(cx - 45, cy - 20)
      ctx.quadraticCurveTo(cx - 45, cy - 90, cx, cy - 90)
      ctx.quadraticCurveTo(cx + 45, cy - 90, cx + 45, cy - 20)
      ctx.lineWidth = 14
      ctx.strokeStyle = color
      ctx.stroke()
      break
    case 'Hats':
      ctx.ellipse(cx, cy + 50, 140, 30, 0, 0, Math.PI * 2)
      ctx.moveTo(cx + 60, cy + 40)
      ctx.arc(cx, cy + 40, 60, 0, Math.PI, true)
      break
    case 'Accessories':
      ctx.arc(cx - 65, cy, 55, 0, Math.PI * 2)
      ctx.moveTo(cx + 120, cy)
      ctx.arc(cx + 65, cy, 55, 0, Math.PI * 2)
      ctx.moveTo(cx - 10, cy - 10)
      ctx.lineTo(cx + 10, cy - 10)
      ctx.lineWidth = 10
      break
    case 'Jewelry':
      ctx.arc(cx, cy - 20, 110, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.lineWidth = 8
      ctx.strokeStyle = color
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy + 95, 18, 0, Math.PI * 2)
      break
  }
  ctx.fill()
  if (category !== 'Bags' && category !== 'Jewelry') ctx.stroke()

  return canvasToBlob(canvas)
}

/** Draws a simple neutral-backdrop silhouette "photo" for a pose placeholder. */
function drawPoseSilhouette(label: string): Promise<Blob> {
  const w = 600
  const h = 800
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#efe6e1')
  gradient.addColorStop(1, '#e2d6ce')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(31,27,36,0.14)'
  ctx.beginPath()
  ctx.ellipse(w / 2, h - 60, 130, 22, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#8a7a72'
  ctx.strokeStyle = '#8a7a72'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const cx = w / 2

  ctx.beginPath()
  ctx.arc(cx, 150, 55, 0, Math.PI * 2)
  ctx.fill()

  ctx.lineWidth = 46
  ctx.beginPath()
  if (label === 'Sitting') {
    ctx.moveTo(cx, 210)
    ctx.lineTo(cx, 430)
    ctx.moveTo(cx - 90, 430)
    ctx.lineTo(cx + 90, 430)
    ctx.moveTo(cx - 90, 430)
    ctx.lineTo(cx - 90, 640)
    ctx.moveTo(cx + 90, 430)
    ctx.lineTo(cx + 90, 640)
    ctx.moveTo(cx, 260)
    ctx.lineTo(cx - 110, 350)
    ctx.moveTo(cx, 260)
    ctx.lineTo(cx + 110, 350)
  } else if (label === 'Walking') {
    ctx.moveTo(cx, 210)
    ctx.lineTo(cx, 470)
    ctx.moveTo(cx, 470)
    ctx.lineTo(cx - 100, 690)
    ctx.moveTo(cx, 470)
    ctx.lineTo(cx + 130, 700)
    ctx.moveTo(cx, 270)
    ctx.lineTo(cx - 130, 400)
    ctx.moveTo(cx, 270)
    ctx.lineTo(cx + 110, 460)
  } else {
    ctx.moveTo(cx, 210)
    ctx.lineTo(cx, 480)
    ctx.moveTo(cx, 480)
    ctx.lineTo(cx - 70, 700)
    ctx.moveTo(cx, 480)
    ctx.lineTo(cx + 70, 700)
    ctx.moveTo(cx, 260)
    ctx.lineTo(cx - 120, 430)
    ctx.moveTo(cx, 260)
    ctx.lineTo(cx + 120, 430)
  }
  ctx.stroke()

  ctx.fillStyle = 'rgba(31,27,36,0.35)'
  ctx.font = '28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`Sample “${label}” photo`, cx, h - 20)

  return canvasToBlob(canvas)
}

const SAMPLE_ITEMS: { name: string; category: Category; color: string }[] = [
  { name: 'White Tee', category: 'Tops', color: '#f5f2ee' },
  { name: 'Sage Blouse', category: 'Tops', color: '#9cb08f' },
  { name: 'Blue Jeans', category: 'Bottoms', color: '#4a6b96' },
  { name: 'Black Trousers', category: 'Bottoms', color: '#2b2b30' },
  { name: 'Red Wrap Dress', category: 'Dresses', color: '#b6485f' },
  { name: 'Denim Jacket', category: 'Outerwear', color: '#5e7ea3' },
  { name: 'White Sneakers', category: 'Shoes', color: '#f7f5f2' },
  { name: 'Black Heels', category: 'Shoes', color: '#232025' },
  { name: 'Straw Hat', category: 'Hats', color: '#d9b877' },
  { name: 'Tan Tote', category: 'Bags', color: '#a9825f' },
  { name: 'Sunglasses', category: 'Accessories', color: '#232025' },
  { name: 'Gold Necklace', category: 'Jewelry', color: '#d4af65' },
]

const SAMPLE_POSES: { label: Pose['label'] }[] = [
  { label: 'Standing' },
  { label: 'Walking' },
  { label: 'Sitting' },
]

export async function seedDemoData(): Promise<void> {
  const savedItems = await Promise.all(
    SAMPLE_ITEMS.map(async (spec) => {
      const image = await drawItemIcon(spec.category, spec.color)
      return itemsStore.add({
        name: spec.name,
        category: spec.category,
        color: spec.color,
        image,
      })
    }),
  )

  const savedPoses = await Promise.all(
    SAMPLE_POSES.map(async (spec) => {
      const image = await drawPoseSilhouette(spec.label)
      return posesStore.add({ label: spec.label, image })
    }),
  )

  const standing = savedPoses.find((p) => p.label === 'Standing') ?? savedPoses[0]
  const tee = savedItems.find((i) => i.name === 'White Tee')
  const jeans = savedItems.find((i) => i.name === 'Blue Jeans')
  const sneakers = savedItems.find((i) => i.name === 'White Sneakers')

  if (standing && tee && jeans && sneakers) {
    const now = Date.now()
    await outfitsStore.save({
      id: crypto.randomUUID(),
      name: 'Casual Everyday',
      poseId: standing.id,
      layers: [
        { itemId: tee.id, x: 0.5, y: 0.36, scale: 1, rotation: 0, z: 1 },
        { itemId: jeans.id, x: 0.5, y: 0.63, scale: 1, rotation: 0, z: 2 },
        { itemId: sneakers.id, x: 0.5, y: 0.88, scale: 0.7, rotation: 0, z: 3 },
      ],
      backdropColor: '#f4e9e6',
      lighting: 'None',
      createdAt: now,
      updatedAt: now,
    })
  }
}
