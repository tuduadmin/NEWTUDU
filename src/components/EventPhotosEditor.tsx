import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { compressImageFile, ImageCompressError } from '../lib/imageCompress'

export const MAX_EVENT_PHOTOS = 6

type EventPhotosEditorProps = {
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos?: number
  variant?: 'host' | 'admin'
  /** Show URL input row (default true). */
  showUrlInput?: boolean
}

export default function EventPhotosEditor({
  photos,
  onChange,
  maxPhotos = MAX_EVENT_PHOTOS,
  variant = 'host',
  showUrlInput = true,
}: EventPhotosEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const activeSlotRef = useRef(0)
  const [urlInput, setUrlInput] = useState('')
  const [compressing, setCompressing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const isAdmin = variant === 'admin'

  const visibleSlots = Math.max(1, photos.length + (photos.length < maxPhotos ? 1 : 0))

  function openFilePicker(slotIndex: number) {
    activeSlotRef.current = slotIndex
    fileRef.current?.click()
  }

  function removePhoto(index: number, e: React.MouseEvent) {
    e.stopPropagation()
    onChange(photos.filter((_, i) => i !== index))
  }

  function movePhoto(index: number, direction: -1 | 1, e: React.MouseEvent) {
    e.stopPropagation()
    const target = index + direction
    if (target < 0 || target >= photos.length) return
    const next = [...photos]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const index = activeSlotRef.current
    setUploadError('')
    setCompressing(true)
    try {
      const dataUrl = await compressImageFile(file)
      if (index < photos.length) {
        const next = [...photos]
        next[index] = dataUrl
        onChange(next)
      } else if (photos.length < maxPhotos) {
        onChange([...photos, dataUrl])
      }
    } catch (err) {
      setUploadError(
        err instanceof ImageCompressError ? err.message : 'Could not add photo. Try a smaller image.',
      )
    } finally {
      setCompressing(false)
      e.target.value = ''
    }
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim()
    if (!trimmed || photos.length >= maxPhotos) return
    onChange([...photos, trimmed])
    setUrlInput('')
  }

  const filledSlotClass = isAdmin
    ? 'group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]'
    : 'group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated'

  const emptySlotClass = isAdmin
    ? 'flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-[var(--admin-radius)] border-2 border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-dim)] transition hover:border-[var(--admin-accent)] hover:text-[var(--admin-text-muted)]'
    : 'flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-app-subtle bg-app-elevated text-brown-muted/60 transition hover:border-orange/35 hover:text-brown-muted'

  const urlInputClass = isAdmin
    ? 'admin-input flex-1'
    : 'app-field flex-1 py-2'

  const urlBtnClass = isAdmin
    ? 'admin-btn admin-btn-secondary shrink-0'
    : 'inline-flex shrink-0 items-center gap-1 rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2 text-xs font-semibold text-brown transition hover:border-orange/30 hover:bg-orange/5'

  return (
    <div>
      <p className={`mb-3 text-xs ${isAdmin ? 'text-[var(--admin-text-muted)]' : 'text-brown-muted'}`}>
        Add up to {maxPhotos} photos â€” tap a slot to upload or replace. Swipe through them on the Discover
        detail panel.
        {photos.length === 0 && ' At least one photo is recommended.'}
      </p>

      {(compressing || uploadError) && (
        <p
          className={`mb-3 text-xs ${
            uploadError
              ? isAdmin
                ? 'text-[var(--admin-danger)]'
                : 'text-maroon'
              : isAdmin
                ? 'text-[var(--admin-text-muted)]'
                : 'text-brown-muted'
          }`}
        >
          {compressing ? 'Compressing photo…' : uploadError}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: visibleSlots }, (_, slot) => {
          const photo = photos[slot]
          const isAddSlot = slot === photos.length

          if (photo) {
            return (
              <div
                key={slot}
                role="button"
                tabIndex={0}
                onClick={() => openFilePicker(slot)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openFilePicker(slot)
                  }
                }}
                className={filledSlotClass}
                aria-label={`Photo ${slot + 1}. Tap to replace.`}
              >
                <img src={photo} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => removePhoto(slot, e)}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-100 transition group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
                {photos.length > 1 && (
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => movePhoto(slot, -1, e)}
                      disabled={slot === 0}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white disabled:opacity-30"
                      aria-label="Move photo earlier"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => movePhoto(slot, 1, e)}
                      disabled={slot === photos.length - 1}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white disabled:opacity-30"
                      aria-label="Move photo later"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          }

          if (isAddSlot) {
            return (
              <button
                key={slot}
                type="button"
                onClick={() => openFilePicker(photos.length)}
                className={emptySlotClass}
                aria-label="Add photo"
              >
                <ImagePlus size={22} />
                <span className="mt-1.5 text-[10px] font-medium">Add photo</span>
              </button>
            )
          }

          return null
        })}
      </div>

      {showUrlInput && photos.length < maxPhotos && (
        <details className="mt-3">
          <summary
            className={`cursor-pointer text-xs font-medium ${isAdmin ? 'text-[var(--admin-text-muted)]' : 'text-brown-muted'}`}
          >
            Paste image URL
          </summary>
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddUrl()
                }
              }}
              placeholder="https://images.unsplash.com/..."
              className={urlInputClass}
            />
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={!urlInput.trim()}
              className={urlBtnClass}
            >
              Add
            </button>
          </div>
        </details>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  )
}
