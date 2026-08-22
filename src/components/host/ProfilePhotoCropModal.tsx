import { useCallback, useEffect, useRef, useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import {
  cropSquareToDataUrl,
  ImageCompressError,
  loadImageFromDataUrl,
} from '../../lib/imageCompress'

type ProfilePhotoCropModalProps = {
  open: boolean
  imageSrc: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}

type CropTransform = {
  scale: number
  offsetX: number
  offsetY: number
}

const OUTPUT_ERROR = 'Could not save cropped photo. Try a smaller image.'
/** Slight zoom above cover-fit so portrait/landscape images can pan on both axes. */
const INITIAL_SCALE_SLACK = 1.08

function getMinScale(imgW: number, imgH: number, cropSize: number): number {
  return Math.max(cropSize / imgW, cropSize / imgH)
}

function constrainOffset(
  offsetX: number,
  offsetY: number,
  scale: number,
  imgW: number,
  imgH: number,
  cropSize: number,
  viewportW: number,
  viewportH: number,
): { offsetX: number; offsetY: number } {
  const cropLeft = (viewportW - cropSize) / 2
  const cropTop = (viewportH - cropSize) / 2
  const scaledW = imgW * scale
  const scaledH = imgH * scale

  const minX = cropLeft + cropSize - scaledW
  const maxX = cropLeft
  const minY = cropTop + cropSize - scaledH
  const maxY = cropTop

  return {
    offsetX: Math.min(maxX, Math.max(minX, offsetX)),
    offsetY: Math.min(maxY, Math.max(minY, offsetY)),
  }
}

function cropSourceRect(
  transform: CropTransform,
  imgW: number,
  imgH: number,
  cropSize: number,
  viewportW: number,
  viewportH: number,
) {
  const cropLeft = (viewportW - cropSize) / 2
  const cropTop = (viewportH - cropSize) / 2
  const srcX = (cropLeft - transform.offsetX) / transform.scale
  const srcY = (cropTop - transform.offsetY) / transform.scale
  const srcSize = cropSize / transform.scale
  return {
    srcX: Math.max(0, Math.min(srcX, imgW - srcSize)),
    srcY: Math.max(0, Math.min(srcY, imgH - srcSize)),
    srcSize: Math.min(srcSize, imgW, imgH),
  }
}

export default function ProfilePhotoCropModal({
  open,
  imageSrc,
  onConfirm,
  onCancel,
}: ProfilePhotoCropModalProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })
  const [transform, setTransform] = useState<CropTransform>({ scale: 1, offsetX: 0, offsetY: 0 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null)

  const cropSize = Math.min(viewportSize.w, viewportSize.h, 320) * 0.92

  const applyTransform = useCallback(
    (next: CropTransform) => {
      if (!imgSize.w || !imgSize.h || !cropSize) return next
      const constrained = constrainOffset(
        next.offsetX,
        next.offsetY,
        next.scale,
        imgSize.w,
        imgSize.h,
        cropSize,
        viewportSize.w,
        viewportSize.h,
      )
      return { scale: next.scale, ...constrained }
    },
    [imgSize, cropSize, viewportSize],
  )

  useEffect(() => {
    if (!open) return
    setError('')
    setSaving(false)
    dragRef.current = null
    pinchRef.current = null

    void loadImageFromDataUrl(imageSrc).then((img) => {
      imgRef.current = img
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
    })
  }, [open, imageSrc])

  useEffect(() => {
    if (!open) return
    const el = viewportRef.current
    if (!el) return

    function measure() {
      setViewportSize({ w: el!.clientWidth, h: el!.clientHeight })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [open])

  useEffect(() => {
    if (!open || !imgSize.w || !cropSize) return
    const minScale = getMinScale(imgSize.w, imgSize.h, cropSize)
    const scale = minScale * INITIAL_SCALE_SLACK
    const scaledW = imgSize.w * scale
    const scaledH = imgSize.h * scale
    const offsetX = (viewportSize.w - scaledW) / 2
    const offsetY = (viewportSize.h - scaledH) / 2
    setTransform(applyTransform({ scale, offsetX, offsetY }))
  }, [open, imgSize, cropSize, viewportSize.w, viewportSize.h, applyTransform])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  function adjustZoom(delta: number) {
    setTransform((prev) => {
      const nextScale = Math.max(getMinScale(imgSize.w, imgSize.h, cropSize), prev.scale + delta)
      const cropLeft = (viewportSize.w - cropSize) / 2
      const cropTop = (viewportSize.h - cropSize) / 2
      const centerX = cropLeft + cropSize / 2
      const centerY = cropTop + cropSize / 2
      const ratio = nextScale / prev.scale
      const nextX = centerX - (centerX - prev.offsetX) * ratio
      const nextY = centerY - (centerY - prev.offsetY) * ratio
      return applyTransform({ scale: nextScale, offsetX: nextX, offsetY: nextY })
    })
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (saving) return
    viewportRef.current?.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: transform.offsetX,
      baseY: transform.offsetY,
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId || saving) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setTransform((prev) =>
      applyTransform({
        ...prev,
        offsetX: drag.baseX + dx,
        offsetY: drag.baseY + dy,
      }),
    )
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      pinchRef.current = { distance, scale: transform.scale }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length !== 2 || !pinchRef.current || saving) return
    e.preventDefault()
    const [a, b] = [e.touches[0], e.touches[1]]
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    const ratio = distance / pinchRef.current.distance
    const minScale = getMinScale(imgSize.w, imgSize.h, cropSize)
    const nextScale = Math.max(minScale, pinchRef.current.scale * ratio)
    setTransform((prev) => {
      const cropLeft = (viewportSize.w - cropSize) / 2
      const cropTop = (viewportSize.h - cropSize) / 2
      const centerX = cropLeft + cropSize / 2
      const centerY = cropTop + cropSize / 2
      const scaleRatio = nextScale / prev.scale
      return applyTransform({
        scale: nextScale,
        offsetX: centerX - (centerX - prev.offsetX) * scaleRatio,
        offsetY: centerY - (centerY - prev.offsetY) * scaleRatio,
      })
    })
  }

  function handleTouchEnd() {
    pinchRef.current = null
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    adjustZoom(e.deltaY > 0 ? -0.08 : 0.08)
  }

  async function handleConfirm() {
    const img = imgRef.current
    if (!img || !cropSize || saving) return
    setSaving(true)
    setError('')

    try {
      const { srcX, srcY, srcSize } = cropSourceRect(
        transform,
        imgSize.w,
        imgSize.h,
        cropSize,
        viewportSize.w,
        viewportSize.h,
      )
      const dataUrl = cropSquareToDataUrl(img, srcX, srcY, srcSize)
      onConfirm(dataUrl)
    } catch (err) {
      setError(err instanceof ImageCompressError ? err.message : OUTPUT_ERROR)
      setSaving(false)
    }
  }

  if (!open) return null

  const cropLeft = (viewportSize.w - cropSize) / 2
  const cropTop = (viewportSize.h - cropSize) / 2

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal,60)] flex flex-col bg-brown/90"
      role="dialog"
      aria-modal="true"
      aria-label="Crop profile photo"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm font-semibold">Crop profile photo</p>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 disabled:opacity-50"
          aria-label="Cancel crop"
        >
          <X size={18} />
        </button>
      </div>

      <p className="px-4 pb-2 text-center text-xs text-white/80">
        Drag to reposition. Pinch or use zoom to fit your face in the square.
      </p>

      <div
        ref={viewportRef}
        className="relative mx-4 flex-1 touch-none overflow-hidden rounded-[14px] bg-black/40"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {imgSize.w > 0 && (
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: imgSize.w * transform.scale,
              height: imgSize.h * transform.scale,
              transform: `translate(${transform.offsetX}px, ${transform.offsetY}px)`,
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
            style={{
              left: cropLeft,
              top: cropTop,
              width: cropSize,
              height: cropSize,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 py-3">
        <button
          type="button"
          onClick={() => adjustZoom(-0.15)}
          disabled={saving}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-50"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          type="button"
          onClick={() => adjustZoom(0.15)}
          disabled={saving}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-50"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {error && <p className="px-4 pb-2 text-center text-xs font-medium text-red-300">{error}</p>}

      <div className="flex gap-3 border-t border-white/15 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-[14px] border border-white/30 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={saving || !imgSize.w}
          className="flex-1 rounded-[14px] bg-gradient-tudu py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Savingâ€¦' : 'Use photo'}
        </button>
      </div>
    </div>
  )
}
