import type { DiscoverEvent } from '../../data/discoverEvents'
import {
  getSavedEventLocation,
  getSavedEventStatusLabel,
} from '../../lib/savedEventDisplay'
import EventCoverDisplay from '../EventCoverDisplay'

type SavedEventListRowProps = {
  event: DiscoverEvent
  isPast?: boolean
  selected?: boolean
  selectable?: boolean
  statusLabel?: string
  onSelectChange?: (selected: boolean) => void
  onOpen: () => void
}

export default function SavedEventListRow({
  event,
  isPast = false,
  selected = false,
  selectable = false,
  statusLabel: statusLabelOverride,
  onSelectChange,
  onOpen,
}: SavedEventListRowProps) {
  const statusLabel = statusLabelOverride ?? getSavedEventStatusLabel(event)
  const location = getSavedEventLocation(event)

  return (
    <div
      className={`flex w-full items-center gap-3 px-3 py-2.5 transition ${
        isPast ? 'opacity-90' : ''
      } ${selected ? 'bg-teal-600/5' : 'hover:bg-cream/60'}`}
    >
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelectChange?.(e.target.checked)}
          aria-label={`Select ${event.title}`}
          className="h-4 w-4 shrink-0 rounded border-brown/25 text-teal-600 focus:ring-teal-600/30"
        />
      )}

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div
          className={`h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border-2 bg-cream-dark ${
            isPast ? 'border-brown/25 grayscale' : 'border-warm-yellow'
          }`}
        >
          <EventCoverDisplay
            coverImage={event.image}
            className="h-full w-full"
            imgClassName={`h-full w-full object-cover ${isPast ? 'opacity-60' : ''}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[9px] font-bold uppercase tracking-[0.08em] ${
              isPast ? 'text-brown-muted' : 'text-teal-600'
            }`}
          >
            {isPast ? 'Past event' : statusLabel}
          </p>
          <p className={`truncate text-sm font-semibold ${isPast ? 'text-brown-muted' : 'text-brown'}`}>
            {event.title}
          </p>
          <p className="truncate text-xs text-brown-muted">
            {[event.dateTag, location || event.city].filter(Boolean).join(' · ')}
          </p>
        </div>
      </button>
    </div>
  )
}
