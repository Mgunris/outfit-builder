import { useEffect, useMemo, useState } from 'react'
import { itemsStore, makeOutfitId, outfitsStore, posesStore } from '../db'
import {
  BACKDROP_COLORS,
  LIGHTING_FILTERS,
  LIGHTING_PRESETS,
  type ClothingItem,
  type Lighting,
  type Outfit,
  type OutfitLayer,
  type Pose,
} from '../types'
import { useBlobUrl } from '../useBlobUrl'
import DraggableLayer from '../components/DraggableLayer'
import ItemPicker from '../components/ItemPicker'

export default function OutfitBuilderPage() {
  const [poses, setPoses] = useState<Pose[]>([])
  const [items, setItems] = useState<Record<string, ClothingItem>>({})
  const [outfits, setOutfits] = useState<Outfit[]>([])

  const [poseId, setPoseId] = useState<string | null>(null)
  const [layers, setLayers] = useState<OutfitLayer[]>([])
  const [selectedLayerIdx, setSelectedLayerIdx] = useState<number | null>(null)
  const [backdropColor, setBackdropColor] = useState<string>(BACKDROP_COLORS[0])
  const [lighting, setLighting] = useState<Lighting>('None')
  const [outfitName, setOutfitName] = useState('')
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  useEffect(() => {
    posesStore.all().then((all) => {
      setPoses(all)
      if (all.length > 0) setPoseId((prev) => prev ?? all[0].id)
    })
    itemsStore.all().then((all) => {
      const map: Record<string, ClothingItem> = {}
      for (const it of all) map[it.id] = it
      setItems(map)
    })
    outfitsStore.all().then(setOutfits)
  }, [])

  const pose = useMemo(() => poses.find((p) => p.id === poseId) ?? null, [poses, poseId])
  const poseUrl = useBlobUrl(pose?.image)

  function addLayer(item: ClothingItem) {
    setItems((prev) => ({ ...prev, [item.id]: item }))
    const maxZ = layers.reduce((m, l) => Math.max(m, l.z), 0)
    const newLayer: OutfitLayer = { itemId: item.id, x: 0.5, y: 0.5, scale: 1, rotation: 0, z: maxZ + 1 }
    setLayers((prev) => [...prev, newLayer])
    setSelectedLayerIdx(layers.length)
    setPickerOpen(false)
  }

  function updateLayer(idx: number, patch: Partial<OutfitLayer>) {
    setLayers((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  function removeSelectedLayer() {
    if (selectedLayerIdx === null) return
    setLayers((prev) => prev.filter((_, i) => i !== selectedLayerIdx))
    setSelectedLayerIdx(null)
  }

  function bringToFront() {
    if (selectedLayerIdx === null) return
    const maxZ = layers.reduce((m, l) => Math.max(m, l.z), 0)
    updateLayer(selectedLayerIdx, { z: maxZ + 1 })
  }

  function newOutfit() {
    setEditingOutfitId(null)
    setOutfitName('')
    setLayers([])
    setSelectedLayerIdx(null)
    setBackdropColor(BACKDROP_COLORS[0])
    setLighting('None')
  }

  function loadOutfit(outfit: Outfit) {
    setEditingOutfitId(outfit.id)
    setOutfitName(outfit.name)
    setPoseId(outfit.poseId)
    setLayers(outfit.layers)
    setSelectedLayerIdx(null)
    setBackdropColor(outfit.backdropColor ?? BACKDROP_COLORS[0])
    setLighting(outfit.lighting ?? 'None')
  }

  async function saveOutfit() {
    if (!poseId) return
    const now = Date.now()
    const outfit: Outfit = {
      id: editingOutfitId ?? makeOutfitId(),
      name: outfitName.trim() || 'Untitled outfit',
      poseId,
      layers,
      backdropColor,
      lighting,
      createdAt: editingOutfitId ? (outfits.find((o) => o.id === editingOutfitId)?.createdAt ?? now) : now,
      updatedAt: now,
    }
    await outfitsStore.save(outfit)
    setEditingOutfitId(outfit.id)
    setOutfits(await outfitsStore.all())
    setSaveMsg('Saved!')
    setTimeout(() => setSaveMsg(null), 1500)
  }

  async function deleteOutfit(id: string) {
    await outfitsStore.remove(id)
    setOutfits(await outfitsStore.all())
    if (editingOutfitId === id) newOutfit()
  }

  if (poses.length === 0) {
    return (
      <div className="px-4 pt-10 text-center text-ink/60">
        <p className="mb-1">Add a photo of yourself first.</p>
        <p className="text-sm">Go to the “Me” tab to add a standing, walking or sitting photo.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {poses.map((p) => (
          <PoseThumb key={p.id} pose={p} selected={p.id === poseId} onClick={() => setPoseId(p.id)} />
        ))}
      </div>

      <div
        data-outfit-canvas
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mt-2"
        style={{ backgroundColor: backdropColor }}
        onPointerDown={() => setSelectedLayerIdx(null)}
      >
        {poseUrl && (
          <img
            src={poseUrl}
            alt={pose?.label}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ filter: LIGHTING_FILTERS[lighting] }}
          />
        )}
        {layers.map((layer, idx) => {
          const item = items[layer.itemId]
          if (!item) return null
          return (
            <DraggableLayer
              key={idx}
              layer={layer}
              image={item.image}
              selected={selectedLayerIdx === idx}
              onSelect={() => setSelectedLayerIdx(idx)}
              onChange={(patch) => updateLayer(idx, patch)}
            />
          )
        })}
      </div>

      {selectedLayerIdx !== null && (
        <div className="flex gap-2 mt-3 justify-center">
          <button onClick={bringToFront} className="bg-ink/5 rounded-full px-4 py-1.5 text-sm">
            Bring to front
          </button>
          <button onClick={removeSelectedLayer} className="bg-ink/5 rounded-full px-4 py-1.5 text-sm">
            Remove piece
          </button>
        </div>
      )}

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full mt-3 bg-rose text-white rounded-xl py-2.5 font-medium"
      >
        + Add clothing
      </button>

      <button
        onClick={() => setShowAdvanced((s) => !s)}
        className="w-full mt-3 text-sm text-ink/60 underline"
      >
        {showAdvanced ? 'Hide' : 'Show'} lighting & backdrop (experimental)
      </button>

      {showAdvanced && (
        <div className="mt-3 bg-white/60 rounded-xl p-3">
          <p className="text-xs text-ink/60 mb-1">Backdrop</p>
          <div className="flex gap-2 mb-3">
            {BACKDROP_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBackdropColor(c)}
                className={`w-7 h-7 rounded-full border-2 ${backdropColor === c ? 'border-rose' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <p className="text-xs text-ink/60 mb-1">Lighting</p>
          <div className="flex gap-2 flex-wrap">
            {LIGHTING_PRESETS.map((l) => (
              <button
                key={l}
                onClick={() => setLighting(l)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  lighting === l ? 'bg-rose text-white border-rose' : 'border-ink/20 text-ink/70'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <input
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
          placeholder="Name this outfit"
          className="flex-1 border border-ink/20 rounded-lg px-3 py-2"
        />
        <button onClick={saveOutfit} className="bg-rose text-white rounded-xl px-5 font-medium">
          {saveMsg ?? (editingOutfitId ? 'Update' : 'Save')}
        </button>
      </div>
      {editingOutfitId && (
        <button onClick={newOutfit} className="text-sm text-ink/60 underline mt-2">
          Start a new outfit
        </button>
      )}

      {outfits.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Saved outfits</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {outfits.map((o) => (
              <SavedOutfitCard
                key={o.id}
                outfit={o}
                pose={poses.find((p) => p.id === o.poseId)}
                onLoad={() => loadOutfit(o)}
                onDelete={() => deleteOutfit(o.id)}
              />
            ))}
          </div>
        </div>
      )}

      {pickerOpen && <ItemPicker onPick={addLayer} onClose={() => setPickerOpen(false)} />}
    </div>
  )
}

function PoseThumb({ pose, selected, onClick }: { pose: Pose; selected: boolean; onClick: () => void }) {
  const url = useBlobUrl(pose.image)
  return (
    <button
      onClick={onClick}
      className={`shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 ${
        selected ? 'border-rose' : 'border-transparent'
      }`}
    >
      {url && <img src={url} alt={pose.label} className="w-full h-full object-cover" />}
    </button>
  )
}

function SavedOutfitCard({
  outfit,
  pose,
  onLoad,
  onDelete,
}: {
  outfit: Outfit
  pose?: Pose
  onLoad: () => void
  onDelete: () => void
}) {
  const url = useBlobUrl(pose?.image)
  return (
    <div className="shrink-0 w-24">
      <button onClick={onLoad} className="block w-24 h-32 rounded-lg overflow-hidden bg-ink/5 relative">
        {url && <img src={url} alt={outfit.name} className="w-full h-full object-cover" />}
      </button>
      <p className="text-xs mt-1 truncate">{outfit.name}</p>
      <button onClick={onDelete} className="text-xs text-ink/50 underline">
        Delete
      </button>
    </div>
  )
}
