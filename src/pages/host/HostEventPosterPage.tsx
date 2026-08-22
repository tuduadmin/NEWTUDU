import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ImagePlus, Minus, Move, Plus, Printer, RotateCcw } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import EventPosterPreview from '../../components/host/EventPosterPreview'
import { BackLink } from '../../components/NavActionButtons'
import { getHostEventById } from '../../lib/account'
import {
  canStepPosterScale,
  formatPosterScale,
  getDefaultPosterLayout,
  POSTER_BLOCK_LABELS,
  POSTER_TEXT_BLOCK_IDS,
  stepPosterScale,
  type PosterLayout,
  type PosterTextBlockId,
} from '../../lib/eventPosterLayout'
import {
  EVENT_POSTER_TEMPLATES,
  getEventPosterTemplate,
  type EventPosterTemplateId,
} from '../../lib/eventPosterTemplates'
import { resolvePosterImageSource } from '../../lib/resolvePosterImage'
import { getHostEventShareUrl } from '../../lib/sharePublish'
import { useHostContext } from '../../hooks/useHostContext'

const HOST_PANEL = 'rounded-[14px] border border-app-subtle bg-app-elevated'

export default function HostEventPosterPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const event = eventId ? getHostEventById(eventId) : undefined
  const { personalName } = useHostContext()
  const printRef = useRef<HTMLDivElement>(null)

  const [templateId, setTemplateId] = useState<EventPosterTemplateId>('flyer')
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null)
  const [imageFocusY, setImageFocusY] = useState(50)
  const [layoutsByTemplate, setLayoutsByTemplate] = useState<
    Partial<Record<EventPosterTemplateId, PosterLayout>>
  >({})

  const template = getEventPosterTemplate(templateId)
  const layout = layoutsByTemplate[templateId] ?? getDefaultPosterLayout(templateId)

  const shareUrl = useMemo(
    () => (event ? getHostEventShareUrl(event) : ''),
    [event],
  )

  const imageInfo = useMemo(
    () => (event ? resolvePosterImageSource(event, customImageUrl) : null),
    [event, customImageUrl],
  )

  const hostLabel =
    event?.hostAccountId == null
      ? personalName || event?.displayName
      : event?.displayName

  if (!event) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-10 text-center">
          <h1 className="font-display text-xl font-bold text-brown">Event not found</h1>
          <BackLink to="/host" className="mt-4 text-orange">
            Back to Event Manager
          </BackLink>
        </main>
        <BottomNav />
      </div>
    )
  }

  function handleLayoutChange(next: PosterLayout) {
    setLayoutsByTemplate((prev) => ({ ...prev, [templateId]: next }))
  }

  function updateBlock(id: PosterTextBlockId, patch: Partial<PosterLayout[PosterTextBlockId]>) {
    handleLayoutChange({
      ...layout,
      [id]: { ...layout[id], ...patch },
    })
  }

  function handlePhotoUpload(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setCustomImageUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function handlePrint() {
    window.print()
  }

  function handleResetPhoto() {
    setCustomImageUrl(null)
  }

  function handleResetTextLayout() {
    setLayoutsByTemplate((prev) => ({
      ...prev,
      [templateId]: getDefaultPosterLayout(templateId),
    }))
  }

  return (
    <div className="app-page-shell pb-28 print:pb-0">
      <div className="print:hidden">
        <AppHeaderBar logoLinkTo="/host" />
      </div>

      <main className="px-4 pt-2 print:p-0">
        <div className="print:hidden">
          <BackLink to="/host">Back to Event Manager</BackLink>
          <h1 className="mt-3 font-display text-xl font-extrabold text-brown">Create poster</h1>
          <p className="mt-1 text-sm text-brown-muted">
            Your photo fills the poster. Drag, resize, or hide text blocks below.
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-orange">{event.title}</p>
        </div>

        <section className={`mt-4 print:hidden ${HOST_PANEL} p-3`}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Format</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {EVENT_POSTER_TEMPLATES.map((item) => {
              const selected = templateId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTemplateId(item.id)}
                  aria-pressed={selected}
                  className={`rounded-[14px] border px-3 py-2.5 text-left transition ${
                    selected
                      ? 'border-orange bg-orange/10'
                      : 'border-app-subtle bg-app-elevated hover:border-orange/30'
                  }`}
                >
                  <p className="font-display text-sm font-bold text-brown">{item.label}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-brown-muted">{item.description}</p>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[10px] text-brown-muted">{template.printHint}</p>
        </section>

        <section className={`mt-4 print:hidden ${HOST_PANEL} p-3`}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Photo</p>
          {!imageInfo?.hasRealPhoto && (
            <p className="mt-1 text-xs font-semibold text-orange">
              No event photo yet — upload one below or add a cover in Edit event.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-app-subtle bg-cream px-3 py-2 text-xs font-semibold text-brown transition hover:border-orange/30">
              <ImagePlus size={16} className="text-orange" aria-hidden />
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handlePhotoUpload(e.target.files?.[0] ?? null)}
              />
            </label>
            {customImageUrl && (
              <button
                type="button"
                onClick={handleResetPhoto}
                className="inline-flex items-center gap-2 rounded-[14px] border border-app-subtle px-3 py-2 text-xs font-semibold text-brown-muted transition hover:border-orange/30"
              >
                <RotateCcw size={14} aria-hidden />
                Use event cover
              </button>
            )}
          </div>
          {imageInfo?.hasRealPhoto && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-brown">Photo position</span>
                <span className="text-xs tabular-nums text-brown-muted">{imageFocusY}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={imageFocusY}
                onChange={(e) => setImageFocusY(Number(e.target.value))}
                className="w-full accent-orange"
                aria-label="Adjust photo vertical position"
              />
              <p className="mt-1 text-[10px] text-brown-muted">Slide to show more top or bottom of your photo.</p>
            </div>
          )}
        </section>

        <section className={`mt-4 print:hidden ${HOST_PANEL} p-3`}>
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
              <Move size={12} className="text-orange" aria-hidden />
              Text blocks
            </p>
            <button
              type="button"
              onClick={handleResetTextLayout}
              className="text-[10px] font-semibold text-orange"
            >
              Reset all
            </button>
          </div>
          <p className="mt-1 text-xs text-brown-muted">
            Drag blocks on the preview, hide ones you don&apos;t need, or change their size.
          </p>
          <ul className="mt-3 space-y-2">
            {POSTER_TEXT_BLOCK_IDS.map((id) => {
              const block = layout[id]
              const hidden = !block.visible
              return (
                <li
                  key={id}
                  className={`flex items-center gap-2 rounded-[14px] border px-2.5 py-2 ${
                    hidden ? 'border-app-subtle bg-cream/50 opacity-70' : 'border-app-subtle bg-cream'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => updateBlock(id, { visible: !block.visible })}
                    className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      hidden
                        ? 'bg-brown/10 text-brown-muted'
                        : 'bg-orange/10 text-orange'
                    }`}
                    aria-pressed={block.visible}
                  >
                    {hidden ? 'Show' : 'Hide'}
                  </button>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-brown">
                    {POSTER_BLOCK_LABELS[id]}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(id, { scale: stepPosterScale(block.scale, 'down') })
                      }
                      disabled={!canStepPosterScale(block.scale, 'down') || hidden}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-app-subtle text-brown transition hover:border-orange/30 disabled:opacity-40"
                      aria-label={`Smaller ${POSTER_BLOCK_LABELS[id]}`}
                    >
                      <Minus size={14} aria-hidden />
                    </button>
                    <span className="w-9 text-center text-[10px] font-bold tabular-nums text-brown-muted">
                      {formatPosterScale(block.scale)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(id, { scale: stepPosterScale(block.scale, 'up') })
                      }
                      disabled={!canStepPosterScale(block.scale, 'up') || hidden}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-app-subtle text-brown transition hover:border-orange/30 disabled:opacity-40"
                      aria-label={`Larger ${POSTER_BLOCK_LABELS[id]}`}
                    >
                      <Plus size={14} aria-hidden />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brown-muted print:hidden">
            Preview
          </p>
          <div
            ref={printRef}
            id="event-poster-print"
            className="mx-auto w-full print:max-w-none print:shadow-none"
            style={{ maxWidth: templateId === 'social' ? '20rem' : '24rem' }}
          >
            <EventPosterPreview
              event={event}
              templateId={templateId}
              shareUrl={shareUrl}
              customImageUrl={customImageUrl}
              hostLabel={hostLabel}
              layout={layout}
              onLayoutChange={handleLayoutChange}
              imageFocusY={imageFocusY}
              editable
            />
          </div>
          <p className="mt-2 text-center text-[10px] text-brown-muted print:hidden">
            QR code links to your event RSVP page
          </p>
        </section>

        <div className="mt-6 space-y-2 print:hidden">
          <GradientButton type="button" fullWidth className="py-3.5" onClick={handlePrint}>
            <Printer size={18} className="mr-2" aria-hidden />
            Print poster
          </GradientButton>
          <p className="text-center text-[10px] text-brown-muted">
            Tip: choose &ldquo;Save as PDF&rdquo; in the print dialog to download a file.
          </p>
          <Link
            to={`/host/create-event?edit=${encodeURIComponent(event.id)}`}
            className="block text-center text-xs font-semibold text-orange no-underline"
          >
            Edit event details before printing
          </Link>
        </div>
      </main>

      <div className="print:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
