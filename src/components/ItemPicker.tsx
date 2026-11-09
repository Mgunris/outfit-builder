import { useEffect, useState } from 'react'
import { itemsStore } from '../db'
import { CATEGORIES, type Category, type ClothingItem } from '../types'
import { useBlobUrl } from '../useBlobUrl'

export default function ItemPicker({
  onPick,
  onClose,
}: {
  onPick: (item: ClothingItem) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [filter, setFilter] = useState<Category | 'All'>('All')

  useEffect(() => {
    itemsStore.all().then(setItems)
  }, [])

  const visible = filter === 'All' ? items : items.filter((i) => i.category === filter)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <div className="bg-white rounded-t-2xl p-5 pb-8 max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h2 className="text-lg font-semibold">Add to outfit</h2>
          <button onClick={onClose} className="text-ink/50 text-sm px-2 py-1">
            Close
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
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

        {visible.length === 0 && (
          <p className="text-center text-ink/50 py-10">No items in this category yet.</p>
        )}

        <div className="grid grid-cols-3 gap-3 overflow-y-auto">
          {visible.map((item) => (
            <PickerCard key={item.id} item={item} onPick={() => onPick(item)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PickerCard({ item, onPick }: { item: ClothingItem; onPick: () => void }) {
  const url = useBlobUrl(item.image)
  return (
    <button onClick={onPick} className="text-left">
      <div className="checkerboard rounded-xl aspect-square flex items-center justify-center overflow-hidden">
        {url && <img src={url} alt={item.name} className="max-w-full max-h-full" />}
      </div>
      <p className="text-xs mt-1 truncate">{item.name}</p>
    </button>
  )
}
