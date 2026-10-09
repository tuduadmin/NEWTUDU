import { CameraIcon, PhotoIcon, SwatchIcon, TrashIcon } from '@heroicons/react/24/solid'
import { ImagePlus, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import EventCoverDisplay from '../EventCoverDisplay'
import {
  EVENT_COVER_GRADIENTS,
  EVENT_COVER_STOCK_IMAGES,
  getEventCoverGradientToken,
  getEventCoverLabel,
  isEventCoverFilled,
  isEventCoverGradient,
} from '../../lib/eventCoverImage'
import { compressImageFile, ImageCompressError } from '../../lib/imageCompress'
import { FieldHelper, FieldLabel } from './CreateEventLayout'

import {
  countFilledAdditionalPhotos,
  MAX_EVENT_ADDITIONAL_PHOTOS,
  normalizeAdditionalPhotoSlots,
} from '../../lib/account'

/** ~2× previous cover preview — fills the card deck pick area better */
const COVER_SLOT_SIZE = 'w-[280px] max-w-full sm:w-[300px]'

type EventBasicsPhotosProps = {
  coverImage: string
  additionalPhotos: string[]
  onCoverChange: (coverImage: string) => void
  onAdditionalChange: (additionalPhotos: string[]) => void
}

type ActiveSlot = { type: 'cover' } | { type: 'additional'; index: number }

const slotHintClass = 'mt-1.5 text-[10px] font-medium text-brown-muted'

const secondaryBtnClass =
  'flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2.5 text-xs font-semibold text-brown transition hover:border-orange/35 hover:bg-orange/5'

function PhotoSourceSheet({
  open,
  title,
  onClose,
  onUpload,
  onCamera,
}: {
  open: boolean
  title: string
  onClose: () => void
  onUpload: () => void
  onCamera: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[var(--z-modal,60)] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-source-title"
        className="install-app-sheet relative z-10 w-full max-w-xs rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 id="photo-source-title" className="font-display text-sm font-bold text-brown">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-brown-muted transition hover:bg-orange/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onUpload()
              onClose()
            }}
            className={secondaryBtnClass}
          >
            <Upload size={18} className="text-orange" aria-hidden />
            Upload
          </button>
          <button
            type="button"
            onClick={() => {
              onCamera()
              onClose()
            }}
            className={secondaryBtnClass}
          >
            <CameraIcon className="h-[18px] w-[18px] text-orange" aria-hidden />
            Camera
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EventBasicsPhotos({
  coverImage,
  additionalPhotos,
  onCoverChange,
  onAdditionalChange,
}: EventBasicsPhotosProps) {
  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const additionalUploadRef = useRef<HTMLInputElement>(null)
  const additionalCameraRef = useRef<HTMLInputElement>(null)
  const activeSlotRef = useRef<ActiveSlot>({ type: 'cover' })

  const [error, setError] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [showGradients, setShowGradients] = useState(false)
  const [stockOpen, setStockOpen] = useState(false)
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false)
  const [photoSheetTitle, setPhotoSheetTitle] = useState('Add photo')

  const hasCover = isEventCoverFilled(coverImage)

  function openPhotoSheet(slot: ActiveSlot) {
    activeSlotRef.current = slot
    setPhotoSheetTitle(
      slot.type === 'cover'
        ? hasCover
          ? 'Change cover photo'
          : 'Add cover photo'
        : 'Add photo',
    )
    setPhotoSheetOpen(true)
  }

  function triggerUpload() {
    const slot = activeSlotRef.current
    if (slot.type === 'cover') {
      uploadRef.current?.click()
    } else {
      additionalUploadRef.current?.click()
    }
  }

  function triggerCamera() {
    const slot = activeSlotRef.current
    if (slot.type === 'cover') {
      cameraRef.current?.click()
    } else {
      additionalCameraRef.current?.click()
    }
  }

  const additionalSlots = normalizeAdditionalPhotoSlots(additionalPhotos)

  function setAdditionalSlot(index: number, value: string) {
    const next = [...additionalSlots]
    next[index] = value
    onAdditionalChange(next)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    setCompressing(true)
    try {
      const dataUrl = await compressImageFile(file)
      const slot = activeSlotRef.current
      if (slot.type === 'cover') {
        onCoverChange(dataUrl)
      } else if (slot.type === 'additional') {
        if (!additionalSlots[slot.index] && countFilledAdditionalPhotos(additionalSlots) >= MAX_EVENT_ADDITIONAL_PHOTOS) {
          return
        }
        setAdditionalSlot(slot.index, dataUrl)
      }
    } catch (err) {
      setError(err instanceof ImageCompressError ? err.message : 'Could not process photo.')
    } finally {
      setCompressing(false)
    }
  }

  function selectGradient(id: (typeof EVENT_COVER_GRADIENTS)[number]['id']) {
    onCoverChange(getEventCoverGradientToken(id))
    setShowGradients(false)
  }

  function selectStock(url: string) {
    onCoverChange(url)
    setStockOpen(false)
  }

  function clearCover(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    onCoverChange('')
    setShowGradients(false)
  }

  const coverFrameClass = `relative aspect-[3/4] shrink-0 overflow-hidden rounded-[14px] border border-warm-yellow/45 bg-app-elevated transition hover:border-orange/40 ${COVER_SLOT_SIZE}`

  const coverEmptyInner =
    'flex h-full w-full flex-col items-center justify-center border border-dashed border-warm-yellow/40 bg-app-elevated/80 text-brown-muted/70'

  const extraFilledClass =
    'group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-[14px] border border-brown/15 bg-app-elevated transition hover:border-orange/35'

  const extraEmptyClass =
    'event-photo-slot flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-brown/15 bg-app-elevated text-brown-muted/70 transition hover:border-orange/35 hover:text-brown-muted'

  const coverStatusTitle = hasCover ? (
    <FieldHelper className="line-clamp-2">
      <span className="font-medium text-brown">Cover selected:</span>{' '}
      {getEventCoverLabel(coverImage)}
      {isEventCoverGradient(coverImage) && <span className="text-brown-muted"> · Gradient</span>}
    </FieldHelper>
  ) : (
    <FieldHelper italic>Tap the frame to add a photo</FieldHelper>
  )

  return (
    <div className="mx-auto w-full space-y-6">
      <div className="app-surface-card border border-warm-yellow/30 bg-warm-yellow/5 px-4 py-5">
        <FieldLabel required>Card deck pick</FieldLabel>
        <FieldHelper italic className="mb-4">
          Shows on your Discover card — tap the frame to upload or use your camera
        </FieldHelper>

        <div className="mx-auto flex w-full max-w-sm flex-col items-center">
          <button
            type="button"
            onClick={() => openPhotoSheet({ type: 'cover' })}
            className={coverFrameClass}
            aria-label={hasCover ? 'Change cover photo' : 'Add cover photo'}
          >
            {hasCover ? (
              <>
                <EventCoverDisplay coverImage={coverImage} alt="Event cover preview" />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={clearCover}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      onCoverChange('')
                      setShowGradients(false)
                    }
                  }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                  aria-label="Remove cover"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                </span>
              </>
            ) : (
              <div className={coverEmptyInner}>
                <ImagePlus size={32} className="text-orange/80" />
                <span className={slotHintClass}>Tap to add cover</span>
              </div>
            )}
          </button>

          <div className="mt-3 w-full text-center">{coverStatusTitle}</div>

          <div className="mt-4 flex w-full gap-2">
            <button type="button" onClick={() => setStockOpen(true)} className={secondaryBtnClass}>
              <PhotoIcon className="h-5 w-5 shrink-0 text-orange" aria-hidden />
              Stock images
            </button>
            <button
              type="button"
              onClick={() => setShowGradients((open) => !open)}
              className={`${secondaryBtnClass}${showGradients ? ' border-orange/40 bg-orange/10 text-orange' : ''}`}
              aria-expanded={showGradients}
            >
              <SwatchIcon className="h-5 w-5 shrink-0 text-orange" aria-hidden />
              Gradient
            </button>
          </div>

          {showGradients && (
            <div className="mt-3 grid w-full grid-cols-3 gap-2 rounded-[14px] border border-app-subtle bg-app-elevated p-2">
              {EVENT_COVER_GRADIENTS.map((gradient) => (
                <button
                  key={gradient.id}
                  type="button"
                  onClick={() => selectGradient(gradient.id)}
                  className="group flex flex-col items-stretch gap-1 rounded-[14px] p-1 text-left transition hover:bg-orange/5"
                  aria-label={`Select ${gradient.label} gradient`}
                >
                  <span
                    className="aspect-[3/4] w-full rounded-[14px] border border-app-subtle shadow-sm"
                    style={{ background: gradient.css }}
                  />
                  <span className="truncate text-[10px] font-medium text-brown-muted group-hover:text-brown">
                    {gradient.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <FieldLabel>Additional photos (up to 4)</FieldLabel>
        <FieldHelper className="mb-3">Tap any slot — fill them in any order</FieldHelper>
        <div className="grid w-full grid-cols-2 gap-3">
          {additionalSlots.map((photo, slot) =>
            photo ? (
              <button
                key={slot}
                type="button"
                onClick={() => openPhotoSheet({ type: 'additional', index: slot })}
                className={extraFilledClass}
                aria-label={`Additional photo ${slot + 1}. Tap to replace.`}
              >
                <img src={photo} alt="" className="h-full w-full object-cover" />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setAdditionalSlot(slot, '')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      setAdditionalSlot(slot, '')
                    }
                  }}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                  aria-label="Remove photo"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                </span>
              </button>
            ) : (
              <button
                key={slot}
                type="button"
                onClick={() => openPhotoSheet({ type: 'additional', index: slot })}
                className={extraEmptyClass}
                aria-label={`Add additional photo ${slot + 1}`}
              >
                <ImagePlus size={22} className="text-orange/80" />
                <span className={slotHintClass}>Tap to add</span>
              </button>
            ),
          )}
        </div>
      </div>

      {(compressing || error) && (
        <p className={`text-center text-xs ${error ? 'text-error' : 'text-brown-muted'}`}>
          {compressing ? 'Compressing photo…' : error}
        </p>
      )}

      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={additionalUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={additionalCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      <PhotoSourceSheet
        open={photoSheetOpen}
        title={photoSheetTitle}
        onClose={() => setPhotoSheetOpen(false)}
        onUpload={triggerUpload}
        onCamera={triggerCamera}
      />

      {stockOpen && (
        <div className="fixed inset-0 z-[var(--z-modal,60)] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close stock images"
            onClick={() => setStockOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-cover-title"
            className="install-app-sheet relative z-10 max-h-[85svh] w-full max-w-md overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-app-subtle px-4 py-3">
              <div>
                <h3 id="stock-cover-title" className="font-display text-base font-extrabold text-brown">
                  Stock images
                </h3>
                <FieldHelper>Curated picks for your card deck cover</FieldHelper>
              </div>
              <button
                type="button"
                onClick={() => setStockOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-brown-muted transition hover:bg-orange/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid max-h-[60svh] grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3">
              {EVENT_COVER_STOCK_IMAGES.map((stock) => (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => selectStock(stock.url)}
                  className="group overflow-hidden rounded-[14px] border border-app-subtle text-left transition hover:border-orange/40"
                >
                  <img
                    src={stock.url}
                    alt=""
                    className="aspect-[3/4] w-full bg-cream-dark/30 object-cover transition group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <span className="block truncate px-2 py-1.5 text-[10px] font-medium text-brown-muted group-hover:text-brown">
                    {stock.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
