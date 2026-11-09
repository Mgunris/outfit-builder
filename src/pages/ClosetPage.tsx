import { useEffect, useState } from 'react'
import { itemsStore } from '../db'
import { CATEGORIES, type Category, type ClothingItem } from '../types'
import AddItemFlow from '../components/AddItemFlow'
import { useBlobUrl } from '../useBlobUrl'
import { seedDemoData } from '../lib/seedData'

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  async function refresh() {
    const all = await itemsStore.all()
    setItems(all)
    setLoading(false)
  }

  async function loadSampleData() {
    setSeeding(true)
    await seedDemoData()
    await refresh()
    setSeeding(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const visible = filter === 'All' ? items : items.filter((i) => i.category === filter)

  return (
    <div className="px-4 pt-2">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              filter === c ? 'bg-rose text-white border-rose' : 'border-ink/20 text-ink/70'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {!loading && visible.length === 0 && (
        <div className="text-center py-16 text-ink/50">
          <p className="mb-1">No items yet.</p>
          <p className="text-sm">Tap the + button to photograph your first piece.</p>
          {items.length === 0 && (
            <button
              onClick={loadSampleData}
              disabled={seeding}
              className="mt-4 text-sm text-rose underline disabled:opacity-50"
            >
              {seeding ? 'Loading sample data…' : 'Or load sample data to try the app'}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mt-3">
        {visible.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onDeleted={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
          />
        ))}
      </div>

      <button
        onClick={() => setAdding(true)}
        className="fixed right-5 bottom-24 w-14 h-14 rounded-full bg-rose text-white text-2xl shadow-lg flex items-center justify-center"
        aria-label="Add item"
      >
        +
      </button>

      {adding && (
        <AddItemFlow
          onSave={async (item) => {
            await itemsStore.add(item)
            await refresh()
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}

function ItemCard({ item, onDeleted }: { item: ClothingItem; onDeleted: () => void }) {
  const url = useBlobUrl(item.image)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="relative">
      <div className="checkerboard rounded-xl aspect-square flex items-center justify-center overflow-hidden">
        {url && <img src={url} alt={item.name} className="max-w-full max-h-full" />}
      </div>
      <p className="text-xs mt-1 truncate">{item.name}</p>
      <button
        onClick={() => setConfirmDelete(true)}
        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow text-ink/60 text-sm"
        aria-label="Delete item"
      >
        ×
      </button>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs">
            <p className="mb-4">Remove “{item.name}” from your closet?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-ink/5 rounded-xl py-2 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await itemsStore.remove(item.id)
                  onDeleted()
                }}
                className="flex-1 bg-rose text-white rounded-xl py-2 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
