import type { DiscoverEvent } from '../data/discoverEvents'

type DiscoverEventCardProps = {
  event: DiscoverEvent
  expanded?: boolean
  onToggleExpand?: () => void
}

function AmenityIcon({ type }: { type: 'food' | 'parking' | 'wheelchair' }) {
  if (type === 'food') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 3v8M5 3v5a3 3 0 0 0 6 0V3M14 3v18M17 3v8l3-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (type === 'parking') {
    return (
      <span className="text-[11px] font-bold leading-none" aria-hidden>
        P
      </span>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7 10h10v2a5 5 0 0 1-5 5 5 5 0 0 1-5-5v-2Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9 21h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function CategoryIcon({ icon }: { icon: 'cart' | 'food' | 'party' }) {
  if (icon === 'cart') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 6h15l-1.5 9H7.5L6 6ZM6 6 5 3H2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="19" r="1.5" fill="currentColor" />
        <circle cx="17" cy="19" r="1.5" fill="currentColor" />
      </svg>
    )
  }
  if (icon === 'food') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 3v8M5 3v5a3 3 0 0 0 6 0V3M14 3v18M17 3v8l3-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v18M8 7h8M7 12h10M8 17h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

const categoryColors = {
  teal: 'bg-cyan-500/90 text-white',
  yellow: 'bg-amber-400/90 text-black',
  purple: 'bg-purple-500/90 text-white',
}

export default function DiscoverEventCard({
  event,
  expanded = false,
  onToggleExpand,
}: DiscoverEventCardProps) {
  const borderClass =
    event.borderColor === 'yellow'
      ? 'border-amber-400/60 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]'
      : 'border-blue-500/50 shadow-event-blue'

  return (
    <article
      className={`relative mx-auto w-full max-w-md overflow-hidden rounded-[var(--radius-tudu-xl)] border-2 ${borderClass}`}
    >
      <div className="relative aspect-[3/4] max-h-[58vh] min-h-[420px] w-full">
        <img
          src={event.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

        {/* Top row: amenities + badges */}
        <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-3">
          {event.amenities && event.amenities.length > 0 ? (
            <div className="flex gap-1.5">
              {event.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                >
                  <AmenityIcon type={amenity} />
                </span>
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="flex flex-col items-end gap-1.5">
            {event.badges.map((badge) => (
              <span
                key={badge}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  badge === 'TRUSTED HOST'
                    ? 'bg-blue-600 text-white'
                    : 'bg-amber-400 text-black'
                }`}
              >
                {badge === 'TRUSTED HOST' ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3Z" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2 15 9l7 1-5 5 1 7-8-4-8 4 1-7-5-5 7-1 3-7Z" />
                  </svg>
                )}
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {event.dateTag && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-orange px-2.5 py-1 text-[11px] font-semibold text-white">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {event.dateTag}
            </span>
          )}

          <div className="flex items-start justify-between gap-2">
            <h2 className="text-2xl font-extrabold leading-tight text-white">{event.title}</h2>
            <button
              type="button"
              onClick={onToggleExpand}
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
              aria-expanded={expanded}
              className="mt-1 shrink-0 text-white/80 transition hover:text-white"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {event.dateTime && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/90">
              <span className="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
                {event.dateTime}
              </span>
              {event.cost && (
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
                    <path d="M12 7v10M9 10h4a2 2 0 1 1 0 4H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                  {event.cost}
                </span>
              )}
              {event.ageRange && (
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
                    <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                  {event.ageRange}
                </span>
              )}
            </div>
          )}

          {event.distance && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-white/80">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
                <path d="M11 8v3l2 2M16 16l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              {event.distance}
            </p>
          )}

          {(event.partyType || (event.ageRange && !event.dateTime)) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/90">
              {event.partyType && (
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M20 12v8H4v-8M12 3v9M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {event.partyType}
                </span>
              )}
              {event.ageRange && !event.dateTime && (
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
                    <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                  {event.ageRange}
                </span>
              )}
            </div>
          )}

          {event.locationDetail && (
            <p className="mt-1.5 inline-flex items-start gap-1 text-xs text-white/80">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
                <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.75" />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
              </svg>
              {event.locationDetail}
            </p>
          )}

          {event.categories && event.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.categories.map((cat) => (
                <span
                  key={cat.label}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryColors[cat.color]}`}
                >
                  <CategoryIcon icon={cat.icon} />
                  {cat.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
