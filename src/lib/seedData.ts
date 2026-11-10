import { itemsStore, outfitsStore, posesStore } from '../db'
import type { Category, Pose } from '../types'

import modelStanding from '../assets/sample-data/model-standing.jpg'
import modelWalking from '../assets/sample-data/model-walking.jpg'
import jacket from '../assets/sample-data/jacket.jpg'
import dress from '../assets/sample-data/dress.jpg'
import sneakers from '../assets/sample-data/sneakers.jpg'
import handbag from '../assets/sample-data/handbag.jpg'
import sweater from '../assets/sample-data/sweater.jpg'

async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url)
  return res.blob()
}

const SAMPLE_ITEMS: { name: string; category: Category; color: string; src: string }[] = [
  { name: 'Cream Sweater', category: 'Tops', color: 'cream', src: sweater },
  { name: 'Red Midi Dress', category: 'Dresses', color: 'red', src: dress },
  { name: 'Denim Jacket', category: 'Outerwear', color: 'denim blue', src: jacket },
  { name: 'White Sneakers', category: 'Shoes', color: 'white', src: sneakers },
  { name: 'Black Handbag', category: 'Bags', color: 'black', src: handbag },
]

const SAMPLE_POSES: { label: Pose['label']; src: string }[] = [
  { label: 'Standing', src: modelStanding },
  { label: 'Walking', src: modelWalking },
]

export async function seedDemoData(): Promise<void> {
  const savedItems = await Promise.all(
    SAMPLE_ITEMS.map(async (spec) => {
      const image = await urlToBlob(spec.src)
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
      const image = await urlToBlob(spec.src)
      return posesStore.add({ label: spec.label, image })
    }),
  )

  const standing = savedPoses.find((p) => p.label === 'Standing') ?? savedPoses[0]
  const dressItem = savedItems.find((i) => i.name === 'Red Midi Dress')
  const jacketItem = savedItems.find((i) => i.name === 'Denim Jacket')
  const sneakersItem = savedItems.find((i) => i.name === 'White Sneakers')
  const handbagItem = savedItems.find((i) => i.name === 'Black Handbag')

  if (standing && dressItem && jacketItem && sneakersItem && handbagItem) {
    const now = Date.now()
    await outfitsStore.save({
      id: crypto.randomUUID(),
      name: 'Weekend Look',
      poseId: standing.id,
      layers: [
        { itemId: dressItem.id, x: 0.5, y: 0.58, scale: 1, rotation: 0, z: 1 },
        { itemId: jacketItem.id, x: 0.3, y: 0.32, scale: 0.9, rotation: 0, z: 2 },
        { itemId: sneakersItem.id, x: 0.5, y: 0.9, scale: 0.45, rotation: 0, z: 3 },
        { itemId: handbagItem.id, x: 0.78, y: 0.5, scale: 0.55, rotation: 0, z: 4 },
      ],
      backdropColor: '#f4e9e6',
      lighting: 'None',
      createdAt: now,
      updatedAt: now,
    })
  }
}
