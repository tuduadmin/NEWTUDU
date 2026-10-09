import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import {
  getBucketListById,
  updateBucketListItemCompletion,
} from '../../lib/bucketLists'
import { getCompletionPhotoUrls, MAX_COMPLETION_PHOTOS } from '../../lib/bucketListProgress'
import {
  compressImageFile,
  ImageCompressError,
  PROFILE_STORAGE_QUOTA_MESSAGE,
} from '../../lib/imageCompress'
import { IMAGE_ACCEPT } from '../../lib/mediaUpload'

type BucketListProofPhotosModalProps = {
  listId: string
  eventId: string | null
  eventTitle?: string
  onClose: () => void
  onSaved: () => void
  onError: (message: string) => void
}

export default function BucketListProofPhotosModal({
  listId,
  eventId,
  eventTitle,
  onClose,
  onSaved,
  onError,
}: BucketListProofPhotosModalProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const open = Boolean(eventId)

  useEffect(() => {
    if (!eventId) return
    const list = getBucketListById(listId)
    setPhotos(getCompletionPhotoUrls(eventId, list))
  }, [listId, eventId])

  if (!open || !eventId) return null

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (photos.length >= MAX_COMPLETION_PHOTOS) {
      onError(`You can add up to ${MAX_COMPLETION_PHOTOS} photos.`)
      return
    }
    setUploading(true)
    try {
      const dataUrl = await compressImageFile(file)
      setPhotos((prev) => [...prev, dataUrl].slice(0, MAX_COMPLETION_PHOTOS))
    } catch (err) {
      onError(err instanceof ImageCompressError ? err.message : 'Could not add photo.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeAt(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    const list = getBucketListById(listId)
    if (!list) return
    setSaving(true)
    const updated = updateBucketListItemCompletion(listId, eventId!, {
      photoUrls: photos,
    })
    setSaving(false)
    if (!updated) {
      onError(PROFILE_STORAGE_QUOTA_MESSAGE)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-[calc(var(--z-modal)+1)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-xl"
        role="dialog"
        aria-labelledby="proof-photos-title"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 id="proof-photos-title" className="font-display text-lg font-bold text-brown">
              Proof photos
            </h2>
            {eventTitle && (
              <p className="mt-0.5 truncate text-sm text-brown-muted">{eventTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-brown-muted hover:bg-cream-dark hover:text-brown"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-2 text-xs text-brown-muted">
          Update photos only — up to {MAX_COMPLETION_PHOTOS}. Notes and tags stay on the item page.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {photos.map((url, index) => (
            <div key={`${index}-${url.slice(0, 20)}`} className="relative">
              <img src={url} alt="" className="h-20 w-20 rounded-[12px] object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute -right-1 -top-1 rounded-full bg-brown p-0.5 text-white"
                aria-label="Remove photo"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {photos.length < MAX_COMPLETION_PHOTOS && (
            <>
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-brown/25 text-[10px] font-semibold text-brown-muted"
              >
                <ImagePlus size={20} />
                {uploading ? '…' : 'Add'}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
            </>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[14px] border border-brown/15 py-2.5 text-sm font-bold text-brown"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={handleSave}
            className="flex-1 rounded-[14px] bg-gradient-tudu py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save photos'}
          </button>
        </div>
      </div>
    </>
  )
}
