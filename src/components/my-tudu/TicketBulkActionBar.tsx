import { Share2, UserRoundPen } from 'lucide-react'

type TicketBulkActionBarProps = {
  selectedCount: number
  onSend: () => void
  onAssign: () => void
  onClearSelection: () => void
}

export default function TicketBulkActionBar({
  selectedCount,
  onSend,
  onAssign,
  onClearSelection,
}: TicketBulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="sticky bottom-[calc(var(--app-bottom-nav-h)+0.5rem)] z-20 mt-3 rounded-[14px] border border-app-subtle bg-app-elevated p-3 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-brown">
          {selectedCount} ticket{selectedCount === 1 ? '' : 's'} selected
        </p>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-[11px] font-semibold text-brown-muted transition hover:text-brown"
        >
          Clear
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onSend}
          className="flex items-center justify-center gap-2 rounded-[14px] bg-orange px-3 py-2.5 text-xs font-bold text-white transition hover:bg-orange/90"
        >
          <Share2 size={14} aria-hidden />
          Send selected
        </button>
        <button
          type="button"
          onClick={onAssign}
          className="flex items-center justify-center gap-2 rounded-[14px] border border-app-subtle bg-cream/50 px-3 py-2.5 text-xs font-bold text-brown transition hover:border-orange/30"
        >
          <UserRoundPen size={14} className="text-brown-muted" aria-hidden />
          Assign name
        </button>
      </div>
    </div>
  )
}
