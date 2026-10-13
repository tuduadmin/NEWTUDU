import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { HostEvent } from '../../lib/account'
import { getEventActionLabel } from '../../lib/account'
import { formatCardDateTime, formatCardLocation } from '../../lib/hostEventCardUtils'
import {
  clampPosterPosition,
  type PosterLayout,
  type PosterTextBlockId,
} from '../../lib/eventPosterLayout'
import { resolvePosterImageSource } from '../../lib/resolvePosterImage'
import type { EventPosterTemplateId } from '../../lib/eventPosterTemplates'
import { getEventPosterTemplate } from '../../lib/eventPosterTemplates'

type EventPosterPreviewProps = {
  event: HostEvent
  templateId: EventPosterTemplateId
  shareUrl: string
  customImageUrl?: string | null
  hostLabel?: string
  layout: PosterLayout
  onLayoutChange?: (layout: PosterLayout) => void
  imageFocusY?: number
  editable?: boolean
  className?: string
}

export default function EventPosterPreview({
  event,
  templateId,
  shareUrl,
  customImageUrl,
  hostLabel,
  layout,
  onLayoutChange,
  imageFocusY = 50,
  editable = false,
  className = '',
}: EventPosterPreviewProps) {
  const template = getEventPosterTemplate(templateId)
  const image = resolvePosterImageSource(event, customImageUrl)
  const dateLine = formatCardDateTime(event)
  const locationLine = formatCardLocation(event)
  const cta = getEventActionLabel(event)
  const byline = hostLabel ?? event.displayName ?? 'Hosted on TUDU'
  const darkText = !image.hasRealPhoto && templateId !== 'social'

  return (
    <article
      className={`relative overflow-hidden rounded-[14px] bg-brown shadow-lg ${className}`}
      aria-label={`${event.title} poster preview`}
      style={{ aspectRatio: template.aspectRatio }}
    >
      <PosterBackground image={image} imageFocusY={imageFocusY} />

      {templateId === 'table-tent' && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 z-[1] border-y border-dashed border-white/50 bg-black/20 py-0.5 text-center"
          aria-hidden
        >
          <span className="text-[8px] font-bold uppercase tracking-wide text-white/90">Fold</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

      <DraggableBlock
        id="brand"
        layout={layout}
        editable={editable}
        onLayoutChange={onLayoutChange}
        className="max-w-[88%]"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-sm">
          TUDU Event
        </p>
      </DraggableBlock>

      <DraggableBlock
        id="title"
        layout={layout}
        editable={editable}
        onLayoutChange={onLayoutChange}
        className="max-w-[88%]"
      >
        <h2 className="font-display text-xl font-extrabold leading-tight text-white drop-shadow-md">
          {event.title}
        </h2>
      </DraggableBlock>

      <DraggableBlock
        id="date"
        layout={layout}
        editable={editable}
        onLayoutChange={onLayoutChange}
        className="max-w-[88%]"
      >
        <p className="text-sm font-semibold text-white drop-shadow-sm">{dateLine}</p>
      </DraggableBlock>

      <DraggableBlock
        id="location"
        layout={layout}
        editable={editable}
        onLayoutChange={onLayoutChange}
        className="max-w-[88%]"
      >
        <p className="text-xs text-white/90 drop-shadow-sm">{locationLine}</p>
      </DraggableBlock>

      <DraggableBlock
        id="cta"
        layout={layout}
        editable={editable}
        onLayoutChange={onLayoutChange}
      >
        <p className="rounded-[14px] bg-gradient-tudu px-3 py-1.5 font-display text-xs font-bold text-white shadow-md">
          {cta}
        </p>
      </DraggableBlock>

      <DraggableBlock
        id="byline"
        layout={layout}
        editable={editable}
        onLayoutChange={onLayoutChange}
        className="max-w-[70%]"
      >
        <p
          className={`text-[10px] drop-shadow-sm ${darkText ? 'text-white/85' : 'text-white/75'}`}
        >
          {byline}
        </p>
      </DraggableBlock>

      <DraggableBlock
        id="qr"
        layout={layout}
        editable={editable}
        onLayoutChange={onLayoutChange}
      >
        <div className="rounded-[14px] bg-white p-1.5 shadow-md">
          <QRCodeSVG value={shareUrl} size={80} level="M" />
        </div>
      </DraggableBlock>
    </article>
  )
}

function PosterBackground({
  image,
  imageFocusY,
}: {
  image: ReturnType<typeof resolvePosterImageSource>
  imageFocusY: number
}) {
  if (image.src) {
    return (
      <img
        src={image.src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: `center ${imageFocusY}%` }}
        draggable={false}
      />
    )
  }

  return (
    <div
      className="absolute inset-0 h-full w-full"
      style={{ background: image.background ?? 'linear-gradient(135deg, #f68e5d, #c02e8d)' }}
    />
  )
}

function DraggableBlock({
  id,
  layout,
  editable,
  onLayoutChange,
  className = '',
  children,
}: {
  id: PosterTextBlockId
  layout: PosterLayout
  editable: boolean
  onLayoutChange?: (layout: PosterLayout) => void
  className?: string
  children: ReactNode
}) {
  const pos = layout[id]
  const containerRef = useRef<HTMLElement | null>(null)

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!editable || !onLayoutChange) return
      event.preventDefault()
      event.stopPropagation()
      const block = event.currentTarget
      const poster = block.offsetParent as HTMLElement | null
      if (!poster) return
      containerRef.current = poster
      block.setPointerCapture(event.pointerId)

      const update = (clientX: number, clientY: number) => {
        const rect = poster.getBoundingClientRect()
        const x = clampPosterPosition(((clientX - rect.left) / rect.width) * 100)
        const y = clampPosterPosition(((clientY - rect.top) / rect.height) * 100)
        onLayoutChange({
          ...layout,
          [id]: { ...layout[id], x, y },
        })
      }

      update(event.clientX, event.clientY)

      const onMove = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== event.pointerId) return
        update(e.clientX, e.clientY)
      }

      const onUp = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== event.pointerId) return
        block.releasePointerCapture(event.pointerId)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [editable, id, layout, onLayoutChange],
  )

  if (!pos.visible) return null

  return (
    <div
      className={`absolute z-[2] ${editable ? 'cursor-grab touch-none active:cursor-grabbing' : ''} ${className}`}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `scale(${pos.scale})`,
        transformOrigin: 'top left',
      }}
      onPointerDown={handlePointerDown}
      role={editable ? 'button' : undefined}
      aria-label={editable ? `Drag ${id} text` : undefined}
    >
      {editable && (
        <span className="mb-0.5 block text-[8px] font-bold uppercase tracking-wide text-white/60 print:hidden">
          {id}
        </span>
      )}
      {children}
    </div>
  )
}
