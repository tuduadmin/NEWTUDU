import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import EventCoverDisplay from '../EventCoverDisplay'
import type { DiscoverEvent } from '../../data/discoverEvents'
import { formatCityLabel } from '../../lib/location'
import type { DateNightSlotKind } from '../../lib/dateNight'
import { dateNightSlotLabel } from '../../lib/dateNight'

type DateNightPickSheetProps = {
  kind: DateNightSlotKind
  cityFull: string
  candidates: DiscoverEvent[]
  onSelect: (event: DiscoverEvent) => void
  onClose: () => void
}

export default function DateNightPickSheet({
  kind,
  cityFull,
  candidates,
  onSelect,
  onClose,
}: DateNightPickSheetProps) {
  const [query, setQuery] = useState('')
  const area = formatCityLabel(cityFull)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter(
      (event) =>
        event.title.toLowerCase().includes(q) ||
        event.city.toLowerCase().includes(q) ||
        event.keywords?.some((k) => k.toLowerCase().includes(q)),
    )
  }, [candidates, query])

  const title = kind === 'eat' ? 'Choose a place' : 'Choose an event'

  return (
    <>
      <button
        type="button"
        className="app-column-fixed fixed top-[calc(var(--app-header-h)+env(safe-area-inset-top))] bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[var(--z-modal)] bg-black/60 backdrop-blur-sm"
        aria-label="Close picker"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-night-pick-title"
        className="app-column-fixed animate-slide-up-panel fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[calc(var(--z-modal)+1)] flex max-h-[85svh] flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-cream shadow-float"
      >
        <div className="shrink-0 border-b border-brown/10 px-5 pb-3 pt-4">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-brown/15" aria-hidden />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="date-night-pick-title" className="font-display text-lg font-extrabold text-brown">
                {title}
              </h2>
              <p className="text-xs text-brown-muted">Near {area} · Date night plan</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-dark text-brown-muted transition hover:text-brown"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or keyword…"
            className="app-field mt-3 w-full py-2 text-sm"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
          {filtered.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-brown/20 bg-cream/50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-brown">Nothing in {area} yet</p>
              <p className="mt-2 text-xs text-brown-muted">
                Try another city, or list something on Tudu so Date night has more to choose from.
              </p>
              <Link
                to="/host/create-event?new=1"
                className="mt-4 inline-flex items-center gap-1.5 rounded-[14px] bg-orange px-4 py-2 text-xs font-bold text-white no-underline"
                onClick={onClose}
              >
                <Plus size={14} aria-hidden />
                Create an event
              </Link>
            </div>
          ) : (
            <ul className="space-y-2 pb-2">
              {filtered.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(event)}
                    className="flex w-full gap-3 rounded-[14px] border border-app-subtle bg-app-elevated p-2.5 text-left transition hover:border-orange/35"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px]">
                      <EventCoverDisplay coverImage={event.image} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-display text-sm font-bold leading-snug text-brown">
                        {event.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-brown-muted">
                        {event.dateTag ?? event.city}
                        {event.locationDetail ? ` · ${event.locationDetail}` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-brown/10 px-5 py-3">
          <p className="text-center text-[10px] text-brown-muted">
            {dateNightSlotLabel(kind, 'add')} from Discover listings in {area}
          </p>
        </div>
      </div>
    </>
  )
}
