export const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Bags',
  'Hats',
  'Accessories',
  'Jewelry',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface ClothingItem {
  id: string
  name: string
  category: Category
  color?: string
  /** Cutout image (background removed/erased where possible), stored with transparency. */
  image: Blob
  /** Original, uncut photo — kept so the cutout can be redone later. */
  originalImage?: Blob
  sourceUrl?: string
  createdAt: number
}

export const POSE_LABELS = ['Standing', 'Walking', 'Sitting'] as const

export interface Pose {
  id: string
  label: string
  image: Blob
  createdAt: number
}

export interface OutfitLayer {
  itemId: string
  x: number // center x, fraction of canvas width (0-1)
  y: number // center y, fraction of canvas height (0-1)
  scale: number // relative to the item's natural size at a baseline fit
  rotation: number // degrees
  z: number // stacking order
}

export const LIGHTING_PRESETS = ['None', 'Warm', 'Cool', 'Soft', 'Studio', 'Mono'] as const
export type Lighting = (typeof LIGHTING_PRESETS)[number]

export const LIGHTING_FILTERS: Record<Lighting, string> = {
  None: 'none',
  Warm: 'sepia(0.25) saturate(1.2) brightness(1.05)',
  Cool: 'hue-rotate(150deg) saturate(1.05) brightness(1.02)',
  Soft: 'brightness(1.08) contrast(0.92) saturate(0.95)',
  Studio: 'contrast(1.12) brightness(1.05) saturate(1.05)',
  Mono: 'grayscale(1) contrast(1.05)',
}

export const BACKDROP_COLORS = ['#f4e9e6', '#e5e0d8', '#dbe4e8', '#eadff0', '#1f1b24', '#ffffff'] as const

export interface Outfit {
  id: string
  name: string
  poseId: string
  layers: OutfitLayer[]
  backdropColor?: string
  lighting?: Lighting
  createdAt: number
  updatedAt: number
}
