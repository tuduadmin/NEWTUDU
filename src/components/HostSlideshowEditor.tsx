import { useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Video, X } from 'lucide-react'
import {
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
  isVideoFile,
  mediaUploadErrorMessage,
  readMediaFileAsDataUrl,
} from '../lib/mediaUpload'
import {
  emptySlide,
  reorderSlides,
  saveHostSlideshow,
  SlideshowStorageError,
  type SlideshowSlide,
} from '../lib/hostSlideshows'
import MediaTile from './MediaTile'

type HostSlideshowEditorProps = {
  orgId: string
  orgName: string
  initialSlides: SlideshowSlide[]
  onSaved?: (slides: SlideshowSlide[]) => void
  variant?: 'host' | 'admin'
}

export default function HostSlideshowEditor({
  orgId,
  orgName,
  initialSlides,
  onSaved,
  variant = 'host',
}: HostSlideshowEditorProps) {
  const [slides, setSlides] = useState<SlideshowSlide[]>(
    initialSlides.length > 0 ? initialSlides : [emptySlide()],
  )
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const isAdmin = variant === 'admin'

  function updateSlide(index: number, partial: Partial<SlideshowSlide>) {
    setSlides((current) => current.map((slide, i) => (i === index ? { ...slide, ...partial } : slide)))
  }

  function addSlide() {
    setSlides((current) => [...current, emptySlide(current.length)])
  }

  function removeSlide(index: number) {
    setSlides((current) => {
      const next = current.filter((_, i) => i !== index)
      return next.length > 0 ? next : [emptySlide()]
    })
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= slides.length) return
    setSlides((current) => reorderSlides(current, index, target))
  }

  async function handleMediaUpload(index: number, file: File | undefined) {
    if (!file) return
    setError('')

    const result = await readMediaFileAsDataUrl(file)
    if ('error' in result) {
      setError(mediaUploadErrorMessage(result.error))
      return
    }

    updateSlide(index, {
      mediaUrl: result.dataUrl,
      mediaType: isVideoFile(file) ? 'video' : 'image',
    })
  }

  function handleSave() {
    setError('')
    setSavedMessage('')

    const hasMedia = slides.some((slide) => slide.mediaUrl.trim())
    if (!hasMedia) {
      setError('Add at least one image or video before saving.')
      return
    }

    try {
      const saved = saveHostSlideshow(orgId, slides)
      if (saved.slides.length === 0) {
        setError('Add at least one image or video before saving.')
        return
      }
      setSavedMessage(`Saved! ${saved.slides.length} slide${saved.slides.length === 1 ? '' : 's'} for ${orgName}`)
      onSaved?.(saved.slides)
      window.setTimeout(() => setSavedMessage(''), 3000)
    } catch (err) {
      setError(err instanceof SlideshowStorageError ? err.message : 'Could not save slideshow. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className={isAdmin ? 'admin-label' : 'text-xs font-semibold uppercase tracking-wide text-brown-muted'}>
          Slideshow for {orgName}
        </p>
        <p className={`mt-1 text-sm ${isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted'}`}>
          Add image or video slides with captions. Videos: upload MP4 from CapCut (max 8 MB).
        </p>
      </div>

      {error && (
        <p className={`text-xs ${isAdmin ? 'text-[var(--admin-danger)]' : 'text-error'}`}>{error}</p>
      )}
      {savedMessage && (
        <p className={`text-xs ${isAdmin ? 'text-[var(--admin-success)]' : 'text-success'}`}>{savedMessage}</p>
      )}

      <div className="space-y-3">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={
              isAdmin
                ? 'rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3'
                : 'rounded-[14px] border border-brown/10 bg-white p-3 shadow-sm'
            }
          >
            <div className="mb-2 flex items-center justify-between">
              <span className={`text-xs font-semibold ${isAdmin ? 'text-[var(--admin-text-muted)]' : 'text-brown-muted'}`}>
                Slide {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveSlide(index, -1)}
                  disabled={index === 0}
                  className="disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveSlide(index, 1)}
                  disabled={index === slides.length - 1}
                  className="disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                {slides.length > 1 && (
                  <button type="button" onClick={() => removeSlide(index)} aria-label="Remove slide">
                    <Trash2 size={14} className="text-[var(--admin-danger)]" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <div>
                {slide.mediaUrl ? (
                  <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--admin-radius)]">
                    <MediaTile
                      src={slide.mediaUrl}
                      videoUrl={slide.mediaType === 'video' ? slide.mediaUrl : undefined}
                      mediaType={slide.mediaType}
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-[14px] bg-black/60 p-0.5 text-white"
                      onClick={() => updateSlide(index, { mediaUrl: '', mediaType: 'image' })}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex aspect-[9/16] flex-col items-center justify-center gap-2 rounded-[var(--admin-radius)] border border-dashed border-brown/20 text-[10px] text-brown-muted">
                    <label className="flex cursor-pointer flex-col items-center gap-1">
                      <ImagePlus size={16} />
                      Image
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        className="hidden"
                        onChange={(e) => void handleMediaUpload(index, e.target.files?.[0])}
                      />
                    </label>
                    <label className="flex cursor-pointer flex-col items-center gap-1">
                      <Video size={16} />
                      Video
                      <input
                        type="file"
                        accept={VIDEO_ACCEPT}
                        className="hidden"
                        onChange={(e) => void handleMediaUpload(index, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                )}
                <p className="mt-1 text-[10px] text-brown-muted">Upload MP4 from CapCut</p>
              </div>

              <div className="space-y-2">
                <textarea
                  className={isAdmin ? 'admin-input min-h-[72px] w-full resize-y text-xs' : 'w-full resize-y rounded-[14px] border border-brown/15 px-3 py-2 text-sm outline-none focus:border-purple focus:ring-2 focus:ring-purple/20'}
                  placeholder="Caption"
                  value={slide.caption ?? ''}
                  onChange={(e) => updateSlide(index, { caption: e.target.value })}
                />
                <input
                  className={isAdmin ? 'admin-input w-full text-xs' : 'w-full rounded-[14px] border border-brown/15 px-3 py-2 text-sm outline-none focus:border-purple focus:ring-2 focus:ring-purple/20'}
                  placeholder="Optional link"
                  value={slide.link ?? ''}
                  onChange={(e) => updateSlide(index, { link: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addSlide}
          className={
            isAdmin
              ? 'admin-btn admin-btn-secondary'
              : 'inline-flex items-center gap-1 rounded-[14px] border border-brown/15 px-3 py-2 text-sm font-semibold text-brown'
          }
        >
          <Plus size={14} />
          Add slide
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={
            isAdmin
              ? 'admin-btn admin-btn-primary'
              : 'inline-flex items-center gap-1 rounded-[14px] bg-gradient-tudu px-4 py-2 text-sm font-bold text-white'
          }
        >
          Save slideshow
        </button>
      </div>
    </div>
  )
}
