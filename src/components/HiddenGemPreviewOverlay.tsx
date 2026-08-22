import { useMemo } from 'react'
import { Trash2, X } from 'lucide-react'
import DiscoverEventDetailPanel from './DiscoverEventDetailPanel'
import type { OrgHiddenGem } from '../lib/hiddenGems'
import {
  getHiddenGemDeckStatus,
  getHiddenGemDeckStatusBadgeClass,
} from '../lib/hiddenGems'
import {
  buildHiddenGemPreviewFromForm,
  buildHiddenGemPreviewFromGem,
  type HiddenGemFormPreviewState,
} from '../lib/hiddenGemPreview'

type HiddenGemPreviewOverlayProps = {
  open: boolean
  onClose: () => void
  form?: HiddenGemFormPreviewState
  gem?: OrgHiddenGem
  onDelete?: (gem: OrgHiddenGem) => void
}

function DeckStatusCornerBadge({ gem }: { gem: OrgHiddenGem }) {
  const status = getHiddenGemDeckStatus(gem)
  return (
    <span
      className={`pointer-events-none absolute left-3 top-3 z-30 rounded-[14px] px-2.5 py-1 text-[10px] font-bold shadow-sm ${getHiddenGemDeckStatusBadgeClass(status.tone)}`}
    >
      {status.label}
    </span>
  )
}

function DeleteGemButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100"
      aria-label="Delete Hidden Gem"
    >
      <Trash2 size={18} aria-hidden />
    </button>
  )
}

export default function HiddenGemPreviewOverlay({
  open,
  onClose,
  form,
  gem,
  onDelete,
}: HiddenGemPreviewOverlayProps) {
  const previewEvent = useMemo(() => {
    if (gem) return buildHiddenGemPreviewFromGem(gem)
    if (form) return buildHiddenGemPreviewFromForm(form)
    return null
  }, [form, gem])

  const isDraftPreview = !!form && !gem
  const isSavedGemView = !!gem
  const deckStatus = gem ? getHiddenGemDeckStatus(gem) : undefined

  function handleDelete() {
    if (!gem || !onDelete) return
    if (
      !window.confirm(
        'Delete this Hidden Gem? It will be removed from Discover and Permanent Locations.',
      )
    ) {
      return
    }
    onDelete(gem)
  }

  if (!open || !previewEvent) return null

  const panelProps = {
    event: previewEvent,
    onClose,
    onSave: () => {},
    previewMode: isDraftPreview || isSavedGemView,
    draftPreviewMode: isDraftPreview,
    deckStatus,
  }

  return (
    <>
      {/* Mobile: full-screen overlay */}
      <div className="md:hidden">
        <div className="fixed inset-0 z-[var(--z-modal)]">
          {isSavedGemView && <DeckStatusCornerBadge gem={gem!} />}
          {isSavedGemView && onDelete && <DeleteGemButton onClick={handleDelete} />}
          <DiscoverEventDetailPanel {...panelProps} layout="fullscreen" />
        </div>
      </div>

      {/* Desktop: dimmed backdrop + centered phone card frame */}
      <div
        className="fixed inset-0 z-[var(--z-modal)] hidden items-center justify-center p-6 md:flex"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-label="Close preview"
          onClick={onClose}
        />

        <div className="relative flex h-[min(85vh,844px)] w-full max-w-[390px] flex-col overflow-hidden rounded-[2rem] border border-brown/15 bg-cream shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-2"
            aria-hidden
          >
            <div className="h-1 w-14 rounded-full bg-brown/20" />
          </div>

          {isSavedGemView && <DeckStatusCornerBadge gem={gem!} />}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-brown/10 bg-cream/95 text-brown-muted shadow-sm transition hover:bg-cream-dark hover:text-brown"
            aria-label="Close preview"
          >
            <X size={18} aria-hidden />
          </button>

          {isSavedGemView && onDelete && <DeleteGemButton onClick={handleDelete} />}

          <DiscoverEventDetailPanel {...panelProps} layout="preview" />
        </div>
      </div>
    </>
  )
}
