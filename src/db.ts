import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ClothingItem, Pose, Outfit } from './types'

interface OutfitBuilderDB extends DBSchema {
  items: {
    key: string
    value: ClothingItem
    indexes: { category: string }
  }
  poses: {
    key: string
    value: Pose
  }
  outfits: {
    key: string
    value: Outfit
  }
}

let dbPromise: Promise<IDBPDatabase<OutfitBuilderDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OutfitBuilderDB>('outfit-builder', 1, {
      upgrade(db) {
        const items = db.createObjectStore('items', { keyPath: 'id' })
        items.createIndex('category', 'category')
        db.createObjectStore('poses', { keyPath: 'id' })
        db.createObjectStore('outfits', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

function newId() {
  return crypto.randomUUID()
}

export const itemsStore = {
  async all(): Promise<ClothingItem[]> {
    const db = await getDb()
    const all = await db.getAll('items')
    return all.sort((a, b) => b.createdAt - a.createdAt)
  },
  async add(item: Omit<ClothingItem, 'id' | 'createdAt'>): Promise<ClothingItem> {
    const db = await getDb()
    const full: ClothingItem = { ...item, id: newId(), createdAt: Date.now() }
    await db.put('items', full)
    return full
  },
  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('items', id)
  },
  async get(id: string): Promise<ClothingItem | undefined> {
    const db = await getDb()
    return db.get('items', id)
  },
}

export const posesStore = {
  async all(): Promise<Pose[]> {
    const db = await getDb()
    const all = await db.getAll('poses')
    return all.sort((a, b) => b.createdAt - a.createdAt)
  },
  async add(pose: Omit<Pose, 'id' | 'createdAt'>): Promise<Pose> {
    const db = await getDb()
    const full: Pose = { ...pose, id: newId(), createdAt: Date.now() }
    await db.put('poses', full)
    return full
  },
  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('poses', id)
  },
  async get(id: string): Promise<Pose | undefined> {
    const db = await getDb()
    return db.get('poses', id)
  },
}

export const outfitsStore = {
  async all(): Promise<Outfit[]> {
    const db = await getDb()
    const all = await db.getAll('outfits')
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  },
  async save(outfit: Outfit): Promise<void> {
    const db = await getDb()
    await db.put('outfits', outfit)
  },
  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('outfits', id)
  },
  async get(id: string): Promise<Outfit | undefined> {
    const db = await getDb()
    return db.get('outfits', id)
  },
}

export function makeOutfitId() {
  return newId()
}
