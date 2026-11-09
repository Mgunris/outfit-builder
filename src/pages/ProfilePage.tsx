import { useEffect, useRef, useState } from 'react'
import { posesStore } from '../db'
import { POSE_LABELS, type Pose } from '../types'
import { downscaleToBlob, loadImage } from '../lib/imageUtils'
import { useBlobUrl } from '../useBlobUrl'
import { seedDemoData } from '../lib/seedData'

export default function ProfilePage() {
  const [poses, setPoses] = useState<Pose[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  async function refresh() {
    setPoses(await posesStore.all())
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

  return (
    <div className="px-4 pt-2">
      <p className="text-sm text-ink/60 mb-3">
        Add a few photos of yourself — standing, walking, sitting — so you can see outfits on you
        in different poses.
      </p>

      {!loading && poses.length === 0 && (
        <div className="text-center py-16 text-ink/50">
          <p className="mb-1">No photos yet.</p>
          <p className="text-sm">Add your first pose to get started.</p>
          <button
            onClick={loadSampleData}
            disabled={seeding}
            className="mt-4 text-sm text-rose underline disabled:opacity-50"
          >
            {seeding ? 'Loading sample data…' : 'Or load sample data to try the app'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {poses.map((pose) => (
          <PoseCard
            key={pose.id}
            pose={pose}
            onDeleted={() => setPoses((prev) => prev.filter((p) => p.id !== pose.id))}
          />
        ))}
      </div>

      <button
        onClick={() => setAdding(true)}
        className="fixed right-5 bottom-24 w-14 h-14 rounded-full bg-rose text-white text-2xl shadow-lg flex items-center justify-center"
        aria-label="Add pose"
      >
        +
      </button>

      {adding && (
        <AddPoseFlow
          onSave={async (pose) => {
            await posesStore.add(pose)
            await refresh()
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}

function PoseCard({ pose, onDeleted }: { pose: Pose; onDeleted: () => void }) {
  const url = useBlobUrl(pose.image)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="relative">
      <div className="rounded-xl aspect-[3/4] overflow-hidden bg-ink/5">
        {url && <img src={url} alt={pose.label} className="w-full h-full object-cover" />}
      </div>
      <p className="text-xs mt-1">{pose.label}</p>
      <button
        onClick={() => setConfirmDelete(true)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 shadow text-ink/60 text-sm"
        aria-label="Delete pose"
      >
        ×
      </button>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs">
            <p className="mb-4">Remove this photo?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-ink/5 rounded-xl py-2 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await posesStore.remove(pose.id)
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

function AddPoseFlow({
  onSave,
  onClose,
}: {
  onSave: (pose: Omit<Pose, 'id' | 'createdAt'>) => Promise<void>
  onClose: () => void
}) {
  const [label, setLabel] = useState<string>(POSE_LABELS[0])
  const [customLabel, setCustomLabel] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const previewUrl = useBlobUrl(file ?? undefined)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function save() {
    if (!file) return
    setSaving(true)
    const img = await loadImage(file)
    const blob = await downscaleToBlob(img, 1600)
    await onSave({ label: (label === 'Custom' ? customLabel.trim() : label) || 'Photo', image: blob })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <div className="bg-white rounded-t-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add a photo of yourself</h2>
          <button onClick={onClose} className="text-ink/50 text-sm px-2 py-1">
            Close
          </button>
        </div>

        <div className="rounded-xl aspect-[3/4] bg-ink/5 mb-4 flex items-center justify-center overflow-hidden max-w-[220px] mx-auto">
          {previewUrl ? (
            <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-ink/40 text-sm px-4 text-center">No photo selected</span>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 bg-rose text-white rounded-xl py-2.5 font-medium"
          >
            Take a photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-ink/5 rounded-xl py-2.5 font-medium"
          >
            Upload
          </button>
        </div>

        <label className="text-sm text-ink/70">Pose</label>
        <div className="flex flex-wrap gap-2 mt-1 mb-3">
          {[...POSE_LABELS, 'Custom'].map((l) => (
            <button
              key={l}
              onClick={() => setLabel(l)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                label === l ? 'bg-rose text-white border-rose' : 'border-ink/20 text-ink/70'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {label === 'Custom' && (
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g. Twirling"
            className="border border-ink/20 rounded-lg px-3 py-2 w-full mb-4"
          />
        )}

        <button
          onClick={save}
          disabled={!file || saving}
          className="w-full bg-rose text-white rounded-xl py-2.5 font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save photo'}
        </button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setFile(f)
            e.target.value = ''
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setFile(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
