import type { DiscoverEvent } from '../data/discoverEvents'
import { EVENT_CATEGORIES } from '../data/eventCategories'
import { LEGACY_DISCOVER_AMENITY_IDS } from '../data/amenityIconRegistry'
import {
  DISCOVER_DECK_CARD_COVER_CLASS,
  DISCOVER_DECK_CARD_COVER_IMG_CLASS,
  DISCOVER_DECK_CARD_MAX_WIDTH_CLASS,
  DISCOVER_DECK_CARD_PREVIEW_FRAME_CLASS,
  DISCOVER_DECK_CARD_RADIUS_CLASS,
} from '../lib/discoverDeckCardFrame'
import { getDiscoverCardBorderStyle, normalizeBorderType } from '../lib/eventCardColors'
import { getHiddenGemDisplayCategory } from '../lib/hiddenGems'
import EventCoverDisplay from './EventCoverDisplay'
import HiddenGemAmenityRow from './HiddenGemAmenityRow'
import HiddenGemHoursStatusBadge from './HiddenGemHoursStatusBadge'
import HiddenGemOrganizerAvatar from './HiddenGemOrganizerAvatar'
import { AmenityPreviewStrip, AmenityCardBadge, AmenityCardIcon, type AmenityIconVariant } from '../lib/amenityIcons'
import {
  ArrowUpOnSquareIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HeartIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UserIcon,
} from '@heroicons/react/24/solid'

type DiscoverEventCardProps = {
  event: DiscoverEvent
  expanded?: boolean
  onToggleExpand?: () => void
  /** Landing featured card: avatar + host + trusted badge between date and title */
  showHostRow?: boolean
  /** Landing sample card uses filled Heroicons; discover-style cards keep outline SVGs */
  iconVariant?: AmenityIconVariant
}

function TrustedHostShieldHeart({ solid }: { solid: boolean }) {
  if (solid) {
    return (
      <span className="relative inline-flex h-3.5 w-3.5 shrink-0" aria-label="Trusted host" role="img">
        <ShieldCheckIcon className="h-3.5 w-3.5 text-blue-500" aria-hidden />
        <HeartIcon className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-[#0a0a0a]" aria-hidden />
      </span>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Trusted host" role="img">
      <path
        d="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3Z"
        fill="#3B82F6"
      />
      <path
        d="M12 8.5c-.9-1.5-2.5-2-3.5-.5s-.5 2.5 1 3.5l2.5 2.5 2.5-2.5c1.5-1 1.5-3 1-3.5s-2.6-1-3.5.5Z"
        fill="#0a0a0a"
      />
    </svg>
  )
}

function CardCalendarIcon({ size, solid }: { size: number; solid: boolean }) {
  if (solid) {
    return <CalendarIcon width={size} height={size} aria-hidden className="shrink-0" />
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CardChevronIcon({ size, solid, className }: { size: number; solid: boolean; className?: string }) {
  if (solid) {
    return <ChevronDownIcon width={size} height={size} aria-hidden className={className} />
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DiscoverCategoryChipIcon({
  label,
  size,
  solid,
}: {
  label: string
  size: number
  solid: boolean
}) {
  const category = EVENT_CATEGORIES.find((c) => c.label === label)
  if (category) {
    const Icon = category.icon
    return <Icon width={size} height={size} aria-hidden className="shrink-0" />
  }
  if (solid) {
    return <SparklesIcon width={size} height={size} aria-hidden className="shrink-0" />
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
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
  showHostRow = false,
  iconVariant = 'outline',
}: DiscoverEventCardProps) {
  const solidIcons = iconVariant === 'solid'
  const borderStyle = getDiscoverCardBorderStyle(normalizeBorderType(event.borderColor))
  const isHiddenGemCard =
    event.badges.includes('HIDDEN GEM') && normalizeBorderType(event.borderColor) === 'gold'
  const categoryLabel = isHiddenGemCard
    ? getHiddenGemDisplayCategory(event.categories?.[0]?.label ?? 'Entertainment')
    : event.categories?.[0]?.label

  return (
    <article
      className={`relative mx-auto w-full ${DISCOVER_DECK_CARD_MAX_WIDTH_CLASS} overflow-hidden ${DISCOVER_DECK_CARD_RADIUS_CLASS} shadow-[0_16px_48px_rgba(0,0,0,0.45)]`}
      style={borderStyle}
    >
      <div className={DISCOVER_DECK_CARD_PREVIEW_FRAME_CLASS}>
        <EventCoverDisplay
          coverImage={event.image}
          className={DISCOVER_DECK_CARD_COVER_CLASS}
          imgClassName={DISCOVER_DECK_CARD_COVER_IMG_CLASS}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

        {event.amenityIds && event.amenityIds.length > 0 && !isHiddenGemCard && (
          <AmenityPreviewStrip amenities={event.amenityIds} />
        )}

        {/* Top row: legacy amenities + badges; hidden gem amenity column */}
        <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-3">
          {isHiddenGemCard && event.amenityIds && event.amenityIds.length > 0 ? (
            <HiddenGemAmenityRow
              amenityIds={event.amenityIds}
              layout="column"
              onOverflowClick={onToggleExpand}
            />
          ) : event.amenities && event.amenities.length > 0 && !event.amenityIds?.length ? (
            <div className="flex gap-1.5">
              {event.amenities.map((amenity) => (
                <AmenityCardBadge key={amenity}>
                  <AmenityCardIcon id={LEGACY_DISCOVER_AMENITY_IDS[amenity]} />
                </AmenityCardBadge>
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="flex flex-col items-end gap-1.5">
            {event.badges.map((badge) => (
              <span
                key={badge}
                className={`flex items-center gap-1 rounded-[14px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  badge === 'TRUSTED HOST'
                    ? 'bg-blue-600 text-white'
                    : 'bg-amber-400 text-black'
                }`}
              >
                {badge === 'TRUSTED HOST' ? (
                  solidIcons ? (
                    <ShieldCheckIcon width={10} height={10} aria-hidden />
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3Z" />
                    </svg>
                  )
                ) : solidIcons ? (
                  <StarIcon width={10} height={10} aria-hidden />
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
          {!isHiddenGemCard && event.dateTag && (
            <span
              className={`mb-2 inline-flex items-center gap-1 rounded-[14px] px-2.5 py-1 text-[11px] font-semibold ${
                event.attractionStale
                  ? 'bg-warm-yellow text-amber-950'
                  : 'bg-orange text-white'
              }`}
            >
              <CardCalendarIcon size={11} solid={solidIcons} />
              {event.dateTag}
            </span>
          )}

          {showHostRow && !isHiddenGemCard && event.hostLabel && (
            <div className="mb-2 flex items-center gap-1.5">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white ring-1 ring-white/30"
                aria-hidden
              >
                {(event.hostAvatarInitial ?? event.hostLabel.charAt(0)).charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-sm font-semibold text-white">{event.hostLabel}</span>
              {event.badges.includes('TRUSTED HOST') && <TrustedHostShieldHeart solid={solidIcons} />}
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {isHiddenGemCard && (
                <div className="mb-1.5">
                  <HiddenGemHoursStatusBadge weeklyHours={event.weeklyHours} />
                </div>
              )}
              <h2
                title={isHiddenGemCard ? event.title : undefined}
                className={`text-2xl font-extrabold leading-tight text-white${
                  isHiddenGemCard ? ' line-clamp-2' : ''
                }`}
              >
                {event.title}
              </h2>
              {isHiddenGemCard && categoryLabel && (
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-white/75">
                  {categoryLabel}
                </p>
              )}
            </div>
            {isHiddenGemCard ? (
              <div className="flex shrink-0 flex-col items-end gap-1">
                <HiddenGemOrganizerAvatar
                  initial={event.hostAvatarInitial}
                  avatarUrl={event.hostAvatarUrl}
                  profileUrl={event.hostProfileUrl}
                  label={event.hostLabel}
                />
                <button
                  type="button"
                  onClick={onToggleExpand}
                  aria-label={expanded ? 'Collapse details' : 'Expand details'}
                  aria-expanded={expanded}
                  className="text-white/80 transition hover:text-white"
                >
                  <CardChevronIcon
                    size={22}
                    solid={solidIcons}
                    className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleExpand}
                aria-label={expanded ? 'Collapse details' : 'Expand details'}
                aria-expanded={expanded}
                className="mt-1 shrink-0 text-white/80 transition hover:text-white"
              >
                <CardChevronIcon
                  size={22}
                  solid={solidIcons}
                  className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>

          {event.dateTime && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/90">
              <span className="inline-flex items-center gap-1">
                <CardCalendarIcon size={12} solid={solidIcons} />
                {event.dateTime}
              </span>
              {event.cost && (
                <span className="inline-flex items-center gap-1">
                  {solidIcons ? (
                    <CurrencyDollarIcon width={12} height={12} aria-hidden className="shrink-0" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
                      <path d="M12 7v10M9 10h4a2 2 0 1 1 0 4H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  )}
                  {event.cost}
                </span>
              )}
              {event.ageRange && (
                <span className="inline-flex items-center gap-1">
                  {solidIcons ? (
                    <UserIcon width={12} height={12} aria-hidden className="shrink-0" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
                      <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  )}
                  {event.ageRange}
                </span>
              )}
            </div>
          )}

          {event.distance && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-white/80">
              {solidIcons ? (
                <ClockIcon width={12} height={12} aria-hidden className="shrink-0" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
                  <path d="M11 8v3l2 2M16 16l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              )}
              {event.distance}
            </p>
          )}

          {(event.partyType || (event.ageRange && !event.dateTime)) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/90">
              {event.partyType && (
                <span className="inline-flex items-center gap-1">
                  {solidIcons ? (
                    <ArrowUpOnSquareIcon width={12} height={12} aria-hidden className="shrink-0" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M20 12v8H4v-8M12 3v9M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {event.partyType}
                </span>
              )}
              {event.ageRange && !event.dateTime && (
                <span className="inline-flex items-center gap-1">
                  {solidIcons ? (
                    <UserIcon width={12} height={12} aria-hidden className="shrink-0" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
                      <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  )}
                  {event.ageRange}
                </span>
              )}
            </div>
          )}

          {event.locationDetail && (
            <p className="mt-1.5 inline-flex items-start gap-1 text-xs text-white/80">
              {solidIcons ? (
                <MapPinIcon width={12} height={12} aria-hidden className="mt-0.5 shrink-0" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
                  <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.75" />
                  <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
                </svg>
              )}
              {event.locationDetail}
            </p>
          )}

          {event.categories && event.categories.length > 0 && !isHiddenGemCard && (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.categories.map((cat) => (
                <span
                  key={cat.label}
                  className={`inline-flex items-center gap-1 rounded-[14px] px-2.5 py-1 text-[11px] font-semibold ${categoryColors[cat.color]}`}
                >
                  <DiscoverCategoryChipIcon label={cat.label} size={12} solid={solidIcons} />
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
