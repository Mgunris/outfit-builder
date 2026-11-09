import { useRef, useState } from 'react'
import ItemCutoutEditor from './ItemCutoutEditor'
import { fetchRemoteImageAsBlob } from '../lib/imageUtils'
import { CATEGORIES, type Category, type ClothingItem } from '../types'
import { useBlobUrl } from '../useBlobUrl'

interface Props {
  onSave: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => Promise<void>
  onClose: () => void
}

type Stage =
  | { kind: 'choose' }
  | { kind: 'link' }
  | { kind: 'cutout'; file: File | Blob; sourceUrl?: string }
  | { kind: 'details'; cutout: Blob; original: Blob; sourceUrl?: string }

export default function AddItemFlow({ onSave, onClose }: Props) {
  const [stage, setStage] = useState<Stage>({ kind: 'choose' })
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function tryFetchLink() {
    setLinkError(null)
    setLinkLoading(true)
    try {
      const blob = await fetchRemoteImageAsBlob(linkUrl.trim())
      setStage({ kind: 'cutout', file: blob, sourceUrl: linkUrl.trim() })
    } catch {
      setLinkError(
        "Couldn't download that image directly — a lot of shopping sites block this. " +
          'Save the picture to your photos instead, then use "Upload photo" below.',
      )
    } finally {
      setLinkLoading(false)
    }
  }

  if (stage.kind === 'cutout') {
    return (
      <ItemCutoutEditor
        file={stage.file}
        onCancel={() => setStage({ kind: 'choose' })}
        onComplete={(cutout, original) =>
          setStage({ kind: 'details', cutout, original, sourceUrl: stage.sourceUrl })
        }
      />
    )
  }

  if (stage.kind === 'details') {
    return <DetailsForm stage={stage} onSave={onSave} onClose={onClose} onBack={() => setStage({ kind: 'choose' })} />
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <div className="bg-white rounded-t-2xl p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add a clothing item</h2>
          <button onClick={onClose} className="text-ink/50 text-sm px-2 py-1">
            Close
          </button>
        </div>

        {stage.kind === 'choose' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="bg-rose text-white rounded-xl py-3 font-medium"
            >
              Take a photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-ink/5 rounded-xl py-3 font-medium"
            >
              Upload photo
            </button>
            <button
              onClick={() => setStage({ kind: 'link' })}
              className="bg-ink/5 rounded-xl py-3 font-medium"
            >
              Paste a link (from a shop online)
            </button>
          </div>
        )}

        {stage.kind === 'link' && (
          <div className="flex flex-col gap-3">
            <label className="text-sm text-ink/70">
              Paste a link to a product photo (or the image URL itself)
            </label>
            <input
              type="url"
              inputMode="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="border border-ink/20 rounded-lg px-3 py-2"
            />
            {linkError && <p className="text-sm text-rose">{linkError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setStage({ kind: 'choose' })}
                className="flex-1 bg-ink/5 rounded-xl py-2.5 font-medium"
              >
                Back
              </button>
              <button
                disabled={!linkUrl.trim() || linkLoading}
                onClick={tryFetchLink}
                className="flex-1 bg-rose text-white rounded-xl py-2.5 font-medium disabled:opacity-50"
              >
                {linkLoading ? 'Fetching…' : 'Fetch image'}
              </button>
            </div>
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setStage({ kind: 'cutout', file: f })
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
            if (f) setStage({ kind: 'cutout', file: f })
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

function DetailsForm({
  stage,
  onSave,
  onClose,
  onBack,
}: {
  stage: Extract<Stage, { kind: 'details' }>
  onSave: Props['onSave']
  onClose: () => void
  onBack: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('Tops')
  const [color, setColor] = useState('')
  const [saving, setSaving] = useState(false)
  const previewUrl = useBlobUrl(stage.cutout)

  async function save() {
    setSaving(true)
    await onSave({
      name: name.trim() || category,
      category,
      color: color.trim() || undefined,
      image: stage.cutout,
      originalImage: stage.original,
      sourceUrl: stage.sourceUrl,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <div className="bg-white rounded-t-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <button onClick={onClose} className="text-ink/50 text-sm px-2 py-1">
            Close
          </button>
        </div>

        <div className="checkerboard rounded-xl w-32 h-32 mx-auto mb-4 flex items-center justify-center overflow-hidden">
          {previewUrl && <img src={previewUrl} alt="preview" className="max-w-full max-h-full" />}
        </div>

        <label className="text-sm text-ink/70">Name (optional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={category}
          className="border border-ink/20 rounded-lg px-3 py-2 w-full mb-3 mt-1"
        />

        <label className="text-sm text-ink/70">Category</label>
        <div className="flex flex-wrap gap-2 mt-1 mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                category === c ? 'bg-rose text-white border-rose' : 'border-ink/20 text-ink/70'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="text-sm text-ink/70">Color (optional)</label>
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="e.g. navy"
          className="border border-ink/20 rounded-lg px-3 py-2 w-full mb-4 mt-1"
        />

        <div className="flex gap-2">
          <button onClick={onBack} className="flex-1 bg-ink/5 rounded-xl py-2.5 font-medium">
            Back
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-rose text-white rounded-xl py-2.5 font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save item'}
          </button>
        </div>
      </div>
    </div>
  )
}
