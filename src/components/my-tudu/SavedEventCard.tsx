import { useEffect, useRef, useState } from 'react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid'
import type { DiscoverEvent } from '../../data/discoverEvents'
import {
  getSavedEventLocation,
  getSavedEventStatusLabel,
} from '../../lib/savedEventDisplay'
import EventCoverDisplay from '../EventCoverDisplay'

type SavedEventCardProps = {
  event: DiscoverEvent
  onViewEvent: () => void
  onRemove?: () => void
  onMoveToList?: () => void
  statusLabel?: string
  showMenu?: boolean
  isPast?: boolean
}

export default function SavedEventCard({
  event,
  onViewEvent,
  onRemove,
  onMoveToList,
  statusLabel: statusLabelOverride,
  showMenu = true,
  isPast = false,
}: SavedEventCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (menuRef.current?.contains(e.target as Node)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [menuOpen])

  const statusLabel = statusLabelOverride ?? getSavedEventStatusLabel(event)
  const location = getSavedEventLocation(event)

  return (
    <article
      className={`overflow-hidden rounded-[14px] border-2 bg-app-elevated shadow-sm ${
        isPast ? 'border-brown/25' : 'border-warm-yellow'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
        <EventCoverDisplay
          coverImage={event.image}
          className="h-full w-full"
          imgClassName={`h-full w-full object-cover ${isPast ? 'grayscale opacity-60' : ''}`}
        />
      </div>

      <div className="p-2.5">
        <p
          className={`text-[9px] font-bold uppercase tracking-[0.08em] ${
            isPast ? 'text-brown-muted' : 'theme-accent-text'
          }`}
        >
          {statusLabelOverride ?? (isPast ? 'Past event' : statusLabel)}
        </p>
        <h3 className="mt-0.5 truncate font-display text-xs font-extrabold text-brown">
          {event.title}
        </h3>
        {location && (
          <p className="mt-0.5 truncate text-[10px] text-brown-muted">{location}</p>
        )}

        <div className="mt-2 flex items-stretch gap-1.5">
          <button
            type="button"
            onClick={onViewEvent}
            className="theme-accent-hover min-h-8 flex-1 rounded-[14px] border border-brown/25 bg-white px-2 py-1.5 text-[10px] font-bold text-brown transition active:scale-[0.98]"
          >
            View Event
          </button>

          {showMenu && onRemove && onMoveToList && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                aria-label={`Options for ${event.title}`}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brown/15 bg-white text-brown-muted transition hover:border-brown/25 hover:text-brown active:scale-[0.98]"
              >
                <EllipsisVerticalIcon className="h-4 w-4" aria-hidden />
              </button>

              {menuOpen && (
                <div className="absolute bottom-full right-0 z-20 mb-1 min-w-[148px] overflow-hidden rounded-[14px] border border-brown/10 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onMoveToList()
                    }}
                    className="flex w-full px-3 py-2 text-left text-xs font-semibold text-brown transition hover:bg-cream/80"
                  >
                    Move to list
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onRemove()
                    }}
                    className="flex w-full px-3 py-2 text-left text-xs font-semibold text-maroon transition hover:bg-maroon/5"
                  >
                    Remove from saved
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
