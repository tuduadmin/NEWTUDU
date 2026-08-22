import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  Bookmark,
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  CircleDollarSign,
  Eye,
  Flag,
  CreditCard,
  Globe,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Star,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ShareIcon } from './NavActionButtons'
import type { DiscoverEvent, DiscoverTicketTier, DiscoverBadge } from '../data/discoverEvents'
import DiscoverSelectTicketsModal from './DiscoverSelectTicketsModal'
import EventCoverDisplay from './EventCoverDisplay'
import ShareEventSheet from './ShareEventSheet'
import GradientButton from './GradientButton'
import HiddenGemOrganizerAvatar from './HiddenGemOrganizerAvatar'
import { LogoPinGradient } from './Logo'
import {
  getDiscoverCardBorderStyle,
  getDiscoverCardDetailFrameStyle,
  normalizeBorderType,
} from '../lib/eventCardColors'
import {
  DISCOVER_DECK_CARD_DETAIL_HERO_FRAME_CLASS,
  DISCOVER_DECK_CARD_DETAIL_HERO_IMG_CLASS,
  DISCOVER_DECK_CARD_RADIUS_CLASS,
} from '../lib/discoverDeckCardFrame'
import {
  addDiscoverEventToCalendar,
  getDiscoverEventShareUrl,
  getEventMapsQuery,
  openDiscoverEventDirections,
  shareDiscoverEvent,
} from '../lib/eventDetailActions'
import AmenityDisplayGrid from './AmenityDisplayGrid'
import { resolveHiddenGemAmenities } from '../lib/amenities'
import { LEGACY_DISCOVER_AMENITY_IDS } from '../data/amenityIconRegistry'
import { formatDoorPayment } from '../lib/eventDoorPayment'
import { formatWebsiteDisplay, getWebsiteHref } from '../lib/websiteUrl'
import {
  DAY_OF_WEEK_KEYS,
  DAY_OF_WEEK_LABELS,
  DEFAULT_HIDDEN_GEM_IMAGE,
  formatFullAddress,
  formatFullAddressMultiline,
  getAgePolicyLabel,
  getDistanceFromUser,
  getHiddenGemReviewLinkLabel,
  getGoogleMapsUrl,
  getHiddenGemDisplayCategory,
  getHiddenGemHoursStatus,
  getHiddenGemHoursStatusLabel,
  resolveDayHoursDisplay,
} from '../lib/hiddenGems'
import type { HiddenGemDeckStatus } from '../lib/hiddenGems'
import HiddenGemHoursStatusBadge from './HiddenGemHoursStatusBadge'
import ToastBanner from './Toast'
import ReportProblemSheet from './ReportProblemSheet'
import { getHostEventById, getOrganization, getAccount, resolveOrgPlanForOrganization } from '../lib/account'
import {
  formatAttractionPostedDate,
} from '../lib/attractions'
import {
  getHostMerchSettingsFromAccount,
  getHostMerchSettingsFromOrg,
  isHostMerchVisible,
  isHostMerchVisibleForOrg,
} from '../lib/hostMerch'
import PublicProfileMerchBar from './host/PublicProfileMerchBar'
import PublicProfileEvents from './host/PublicProfileEvents'
import {
  getUpcomingPublicEventsForOrg,
  getUpcomingPublicEventsForPersonalHost,
} from '../lib/publicHostProfile'
import { getMerchProductsForEvent } from '../lib/eventMerch'
import AffiliateOutboundLink from './AffiliateOutboundLink'
import EventTripActions from './EventTripActions'
import {
  eventHasLodgingNearby,
  hasTripAssistOptions,
  tripLinkContextFromDiscoverEvent,
  tripLinkContextFromEvent,
} from '../lib/eventTripLinks'
import {
  formatClaimantName,
  getWhosBringingWhat,
} from '../lib/checklist'
import { isEventLiked, toggleLikedEvent } from '../lib/likedEvents'

type DiscoverEventDetailPanelProps = {
  event: DiscoverEvent
  onClose: () => void
  onSave: () => void
  /** Discover deck like — separate from save/bookmark. */
  isLiked?: boolean
  onLike?: () => void
  /** Discover bottom sheet, host full-screen preview, or framed phone preview. */
  layout?: 'discover' | 'fullscreen' | 'preview'
  /** Draft preview â€” shows banner and softens interactive actions. */
  previewMode?: boolean
  /** Unsaved form preview â€” amber "not published yet" banner. */
  draftPreviewMode?: boolean
  /** Saved gem view â€” deck status banner (replaces draft preview banner). */
  deckStatus?: HiddenGemDeckStatus
}

const DETAIL_SECTION =
  'rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm'

const DETAIL_ACTION_BTN =
  'flex min-h-[var(--touch-min)] flex-col items-center justify-center gap-1 rounded-[14px] border border-app-subtle bg-app-elevated px-2 py-2.5 text-[10px] font-semibold text-brown transition hover:border-orange/30 hover:bg-orange/5 active:scale-[0.98] disabled:opacity-40'

function resolveDetailTitleBadge(
  event: DiscoverEvent,
  isHiddenGemCard: boolean,
): DiscoverBadge | null {
  if (isHiddenGemCard) return 'HIDDEN GEM'
  return event.badges.find((badge) => badge === 'TRUSTED HOST' || badge === 'ATTRACTION') ?? null
}

function DetailTitleBadge({ badge }: { badge: DiscoverBadge }) {
  if (badge === 'HIDDEN GEM') {
    return (
      <span className="inline-flex rounded-[14px] border border-warm-yellow/40 bg-warm-yellow/15 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-warm-yellow">
        Hidden Gem
      </span>
    )
  }
  if (badge === 'TRUSTED HOST') {
    return (
      <span className="inline-flex items-center rounded-[14px] bg-blue-600 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-white">
        Trusted Host
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-[14px] bg-amber-400 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-black">
      Attraction
    </span>
  )
}

function demoStats(eventId: string): { going: number; saved: number; views: number } {
  let hash = 0
  for (let i = 0; i < eventId.length; i += 1) hash = (hash * 31 + eventId.charCodeAt(i)) | 0
  const n = Math.abs(hash)
  return {
    going: 12 + (n % 48),
    saved: 8 + (n % 32),
    views: 120 + (n % 380),
  }
}

function resolveStats(event: DiscoverEvent) {
  const demo = demoStats(event.id)
  return {
    going: event.goingCount ?? demo.going,
    saved: event.savedCount ?? demo.saved,
    views: event.viewCount ?? demo.views,
  }
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="theme-accent-underline h-3 w-0.5 shrink-0 rounded-full" aria-hidden />
      <h3 className="font-display text-[10px] font-bold uppercase tracking-wider text-brown-muted">
        {children}
      </h3>
    </div>
  )
}

function MetaRow({
  icon,
  children,
  badge,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  badge?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-app-subtle bg-app-elevated text-sm theme-accent-icon shadow-sm">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        {badge && (
          <span className="mb-1 inline-block rounded-[14px] border border-orange/25 bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange">
            {badge}
          </span>
        )}
        <div className="text-sm leading-snug text-brown">{children}</div>
      </div>
    </div>
  )
}

function tierSoldPercent(tier: DiscoverTicketTier): number | null {
  if (tier.quantity == null || tier.quantity <= 0) return null
  return Math.min(100, Math.round(((tier.sold ?? 0) / tier.quantity) * 100))
}

function ticketButtonLabel(event: DiscoverEvent): string {
  if (event.isUnavailable) return 'Sold Out'
  if (event.isWaitlist) return 'Join Waitlist'
  if (event.ticketingMode === 'explore') return 'Save to explore later'
  if (event.ticketingMode === 'external') return 'Get Tickets'
  if (event.ticketingMode === 'free_rsvp') return 'Claim Free Tickets'
  if (event.ticketingMode === 'free_donation') return 'Claim Tickets'
  const tiers = event.ticketTiers ?? []
  const hasPaid = tiers.some((t) => (t.priceCents ?? 0) > 0)
  if (hasPaid) return 'Buy Tickets'
  if (tiers.length > 0) return 'Claim Free Tickets'
  return event.actionLabel ?? 'Get Tickets'
}

function shouldOpenTicketModal(event: DiscoverEvent): boolean {
  if (event.isUnavailable || event.isWaitlist) return false
  if (event.ticketingMode === 'explore' || event.ticketingMode === 'external') return false
  return (event.ticketTiers?.length ?? 0) > 0
}

function QrCodeBlock({ value }: { value: string }) {
  const cells = useMemo(() => {
    let hash = 0
    for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0
    return Array.from({ length: 121 }, (_, i) => {
      const bit = (Math.abs(hash + i * 17) >> (i % 8)) & 1
      return bit === 1
    })
  }, [value])

  return (
    <div className="relative mx-auto w-fit rounded-[14px] border border-app-subtle bg-app-elevated p-3 shadow-sm">
      <div className="grid grid-cols-11 gap-0.5">
        {cells.map((filled, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-[1px] ${filled ? 'bg-brown' : 'bg-cream-dark'}`}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-[14px] bg-app-elevated p-1 shadow-sm">
          <LogoPinGradient className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

function HeroCarousel({ images, title }: { images: string[]; title: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const slides = images.length > 0 ? images : [DEFAULT_HIDDEN_GEM_IMAGE]
  const hasMultipleSlides = slides.length > 1

  const snapToNearestSlide = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasMultipleSlides) return
    const width = el.clientWidth
    if (width <= 0) return
    const index = Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / width)))
    const targetLeft = index * width
    if (Math.abs(el.scrollLeft - targetLeft) > 1) {
      el.scrollTo({ left: targetLeft, behavior: 'auto' })
    }
    setActiveIndex(index)
  }, [hasMultipleSlides, slides.length])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: 0, behavior: 'auto' })
    setActiveIndex(0)
  }, [slides])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !hasMultipleSlides) return

    let scrollEndTimer: ReturnType<typeof setTimeout> | undefined

    const onScroll = () => {
      const width = el.clientWidth
      if (width <= 0) return
      setActiveIndex(Math.round(el.scrollLeft / width))
      if (scrollEndTimer) clearTimeout(scrollEndTimer)
      scrollEndTimer = setTimeout(snapToNearestSlide, 80)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('scrollend', snapToNearestSlide)

    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('scrollend', snapToNearestSlide)
      if (scrollEndTimer) clearTimeout(scrollEndTimer)
    }
  }, [hasMultipleSlides, snapToNearestSlide])

  if (!hasMultipleSlides) {
    return (
      <div className={`discover-detail-hero-frame relative shrink-0 overflow-hidden ${DISCOVER_DECK_CARD_RADIUS_CLASS} border border-app-subtle bg-midnight/5 shadow-sm`}>
        <div className={`${DISCOVER_DECK_CARD_DETAIL_HERO_FRAME_CLASS} bg-midnight/5`}>
          <EventCoverDisplay
            coverImage={slides[0]}
            alt={title}
            className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none"
            imgClassName={`${DISCOVER_DECK_CARD_DETAIL_HERO_IMG_CLASS} pointer-events-none select-none`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`discover-detail-hero-frame relative shrink-0 overflow-hidden ${DISCOVER_DECK_CARD_RADIUS_CLASS} border border-app-subtle bg-midnight/5 shadow-sm`}>
      <div
        ref={scrollRef}
        className="flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ touchAction: 'pan-x pan-y' }}
        aria-label={`${title} photos`}
      >
        {slides.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="min-w-full flex-[0_0_100%] shrink-0 snap-center snap-always"
          >
            <div className={`${DISCOVER_DECK_CARD_DETAIL_HERO_FRAME_CLASS} bg-midnight/5`}>
              <EventCoverDisplay
                coverImage={src}
                alt={index === 0 ? title : `${title} photo ${index + 1}`}
                className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none"
                imgClassName={`${DISCOVER_DECK_CARD_DETAIL_HERO_IMG_CLASS} pointer-events-none select-none`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-[14px] transition-all ${
              index === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
            }`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  )
}

function DetailPanelHero({
  event,
  images,
  onClose,
}: {
  event: DiscoverEvent
  images: string[]
  onClose?: () => void
}) {
  return (
    <div className="discover-detail-hero relative shrink-0 touch-pan-y px-5 pt-5">
      <div className="relative">
        <HeroCarousel images={images} title={event.title} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full glass-surface text-white transition hover:text-white/90 active:scale-95"
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

function DetailPrimaryActions({
  event,
  isHiddenGemCard,
  mapsQuery,
  previewMode,
  isDiscover,
  isLiked,
  onLike,
  onSave,
  onShare,
  onDirections,
  onAddToCalendar,
  onSelectTickets,
}: {
  event: DiscoverEvent
  isHiddenGemCard: boolean
  mapsQuery: string | null
  previewMode: boolean
  isDiscover: boolean
  isLiked: boolean
  onLike: () => void
  onSave: () => void
  onShare: () => void
  onDirections: () => void
  onAddToCalendar: () => void
  onSelectTickets: () => void
}) {
  const websiteHref = getWebsiteHref(event.website)
  const phone =
    event.phone?.trim() ||
    event.contacts?.find((contact) => contact.phone?.trim())?.phone?.trim()
  const ticketLabel = ticketButtonLabel(event)
  const openTicketModal = shouldOpenTicketModal(event)
  const showTicketPrimary =
    !isHiddenGemCard &&
    !event.isUnavailable &&
    !event.isWaitlist &&
    event.ticketingMode !== 'explore' &&
    (openTicketModal || Boolean(event.rsvpPath) || event.ticketingMode === 'external')
  const showTicketPrimaryAtTop = showTicketPrimary && !isDiscover
  const directionsIsPrimary = Boolean(mapsQuery) && !showTicketPrimaryAtTop
  const showEventDirections = Boolean(mapsQuery) && !directionsIsPrimary && !isHiddenGemCard
  const hasPrimaryCta = showTicketPrimaryAtTop || directionsIsPrimary
  const showContactShortcuts = Boolean(phone) || Boolean(websiteHref)
  const showTopDirections = isDiscover && showEventDirections
  const hasSecondaryRow = isDiscover
    ? true
    : showEventDirections || showContactShortcuts || true

  if (!hasPrimaryCta && !hasSecondaryRow) return null

  return (
    <section className={`${DETAIL_SECTION} p-4`}>
      {showTicketPrimaryAtTop ? (
        openTicketModal ? (
          <GradientButton fullWidth onClick={onSelectTickets}>
            {ticketLabel}
          </GradientButton>
        ) : event.rsvpPath ? (
          <GradientButton to={event.rsvpPath} fullWidth>
            {ticketLabel}
          </GradientButton>
        ) : event.externalTicketUrl ? (
          <AffiliateOutboundLink
            href={event.externalTicketUrl}
            kind="external_ticket"
            eventId={event.id}
            orgId={event.hostAccountId ?? undefined}
            className="inline-flex w-full items-center justify-center rounded-[14px] bg-gradient-tudu px-6 py-3 font-display text-sm font-bold text-white no-underline shadow-md transition hover:brightness-110 active:scale-[0.98]"
          >
            {ticketLabel}
          </AffiliateOutboundLink>
        ) : null
      ) : directionsIsPrimary ? (
        <GradientButton fullWidth onClick={onDirections}>
          <Navigation size={16} className="mr-2" aria-hidden />
          Get Directions
        </GradientButton>
      ) : null}

      {hasSecondaryRow && (
        <div className={`flex flex-wrap gap-2${hasPrimaryCta ? ' mt-3' : ''}`}>
          {isDiscover ? (
            <>
              <button
                type="button"
                onClick={onLike}
                className={`${DETAIL_ACTION_BTN} min-w-[4.5rem] flex-1${isLiked ? ' bg-magenta/5' : ''}`}
                aria-pressed={isLiked}
              >
                <Heart
                  size={18}
                  className={isLiked ? 'fill-magenta text-magenta' : 'theme-accent-icon'}
                  aria-hidden
                />
                Like
              </button>
              {showTopDirections && (
                <button type="button" onClick={onDirections} className={`${DETAIL_ACTION_BTN} min-w-[4.5rem] flex-1`}>
                  <Navigation size={18} className="text-cyan-500" aria-hidden />
                  Directions
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" onClick={onSave} className={`${DETAIL_ACTION_BTN} min-w-[4.5rem] flex-1`}>
                <Bookmark size={18} className="theme-accent-icon" aria-hidden />
                Save
              </button>
              <button type="button" onClick={() => void onShare()} className={`${DETAIL_ACTION_BTN} min-w-[4.5rem] flex-1`}>
                <ShareIcon className="h-[18px] w-[18px] theme-accent-icon" aria-hidden />
                Share
              </button>
              {!isHiddenGemCard && (
                <button type="button" onClick={onAddToCalendar} className={`${DETAIL_ACTION_BTN} min-w-[4.5rem] flex-1`}>
                  <CalendarPlus size={18} className="theme-accent-icon" aria-hidden />
                  Calendar
                </button>
              )}
              {showEventDirections && (
                <button type="button" onClick={onDirections} className={`${DETAIL_ACTION_BTN} min-w-[4.5rem] flex-1`}>
                  <Navigation size={18} className="text-cyan-500" aria-hidden />
                  Directions
                </button>
              )}
            </>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              className={`${DETAIL_ACTION_BTN} min-w-[4.5rem] flex-1 no-underline`}
            >
              <Phone size={18} className="theme-accent-icon" aria-hidden />
              Call
            </a>
          )}
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${DETAIL_ACTION_BTN} min-w-[4.5rem] flex-1 no-underline`}
            >
              <Globe size={18} className="theme-accent-icon" aria-hidden />
              Website
            </a>
          )}
        </div>
      )}
      {previewMode && hasSecondaryRow && !isDiscover && (
        <p className="mt-2 text-center text-[10px] text-brown-muted">
          Preview only — publish to enable save and share
        </p>
      )}
    </section>
  )
}

function TicketsSection({
  event,
  onSelectTickets,
  suppressPrimaryCta = false,
}: {
  event: DiscoverEvent
  onSelectTickets: () => void
  /** Discover layout shows ticket CTA above scroll — hide duplicate purchase buttons here. */
  suppressPrimaryCta?: boolean
}) {
  const tiers = event.ticketTiers ?? []
  const cta = ticketButtonLabel(event)
  const openModal = shouldOpenTicketModal(event)
  const marketplaceEventId = event.hostEventId ?? event.id.replace(/^host-/, '')
  const hasEventMarketplace = getMerchProductsForEvent(marketplaceEventId).length > 0

  if (event.isUnavailable) {
    return (
      <section className="rounded-[14px] border border-error/25 bg-error/5 p-4">
        <SectionHeading>Tickets &amp; Pricing</SectionHeading>
        <p className="mt-3 font-display text-sm font-bold text-error">Sold out</p>
        <p className="mt-1 text-xs text-brown-muted">This event is no longer accepting RSVPs or ticket sales.</p>
      </section>
    )
  }

  if (event.isWaitlist) {
    return (
      <section className="rounded-[14px] border border-warm-yellow/30 bg-warm-yellow/10 p-4">
        <SectionHeading>Tickets &amp; Pricing</SectionHeading>
        <p className="mt-3 font-display text-sm font-bold text-amber-800">Waitlist open</p>
        <p className="mt-1 text-xs text-brown-muted">Capacity is full - join the waitlist to be notified.</p>
      </section>
    )
  }

  if (event.ticketingMode === 'explore') {
    return (
      <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm">
        <SectionHeading>Visit Info</SectionHeading>
        {event.cost && (
          <p className="mt-3 font-display text-lg font-extrabold text-brown">{event.cost}</p>
        )}
        <p className={`text-sm text-brown${event.cost ? ' mt-2' : ' mt-3'}`}>
          Always available — explore on your own schedule.
        </p>
      </section>
    )
  }

  if (event.ticketingMode === 'external') {
    return (
      <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm">
        <SectionHeading>Tickets &amp; Pricing</SectionHeading>
        <p className="mt-3 text-sm text-brown-muted">Tickets are sold through the host&apos;s preferred platform.</p>
        {event.externalTicketUrl && !suppressPrimaryCta && (
          <AffiliateOutboundLink
            href={event.externalTicketUrl}
            kind="external_ticket"
            eventId={event.id}
            orgId={event.hostAccountId ?? undefined}
            className="mt-3 inline-flex w-full items-center justify-center rounded-[14px] bg-brown px-6 py-3 font-display text-sm font-bold text-white no-underline shadow-sm"
          >
            Get Tickets
          </AffiliateOutboundLink>
        )}
      </section>
    )
  }

  if (event.ticketingMode === 'free_donation' && event.externalTicketUrl) {
    return (
      <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm">
        <SectionHeading>Tickets &amp; Donation</SectionHeading>
        <p className="mt-3 text-sm text-brown-muted">
          Free to attend — optional donation supports the host&apos;s cause via Zeffy.
        </p>
        {!suppressPrimaryCta && (
          <AffiliateOutboundLink
            href={event.externalTicketUrl}
            kind="zeffy_donation"
            eventId={event.id}
            orgId={event.hostAccountId ?? undefined}
            className="mt-3 inline-flex w-full items-center justify-center rounded-[14px] bg-brown px-6 py-3 font-display text-sm font-bold text-white no-underline shadow-sm"
          >
            RSVP &amp; donate on Zeffy
          </AffiliateOutboundLink>
        )}
      </section>
    )
  }

  const soldPct = event.ticketsSoldPercent

  return (
    <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm">
      <SectionHeading>Tickets &amp; Pricing</SectionHeading>

      <div className="mt-3 flex flex-wrap gap-2">
        {event.atDoorAvailable && (
          <span className="rounded-[14px] bg-cyan-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-800">
            Available at Door
          </span>
        )}
        {(event.ticketingMode === 'free_rsvp' || event.ticketingMode === 'free_donation') && (
          <span className="rounded-[14px] bg-success/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
            Free RSVP
          </span>
        )}
      </div>

      {event.ticketsRemaining != null && event.capacity != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-brown-muted">
            <span>{event.ticketsRemaining} tickets left</span>
            {soldPct != null && <span>{soldPct}% sold</span>}
          </div>
          {soldPct != null && (
            <div className="mt-1.5 h-2 overflow-hidden rounded-[14px] bg-cream-dark">
              <div className="h-full rounded-[14px] bg-brown/30" style={{ width: `${soldPct}%` }} />
            </div>
          )}
        </div>
      )}

      {tiers.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {tiers.map((tier) => {
            const tierPct = tierSoldPercent(tier)
            return (
              <li key={tier.name} className="rounded-[14px] border border-brown/8 bg-cream/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-brown">{tier.name}</p>
                    {tier.description && (
                      <p className="mt-0.5 text-xs text-brown-muted">{tier.description}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 font-display text-sm font-extrabold ${
                      tier.soldOut ? 'text-brown-muted line-through' : 'text-brown'
                    }`}
                  >
                    {tier.soldOut ? 'Sold out' : tier.priceLabel}
                  </span>
                </div>
                {tier.availableAtDoor && (
                  <span className="mt-2 inline-block rounded-[14px] bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
                    Door price available
                  </span>
                )}
                {tierPct != null && (
                  <div className="mt-2 h-1 overflow-hidden rounded-[14px] bg-cream-dark">
                    <div className="h-full rounded-[14px] bg-brown/25" style={{ width: `${tierPct}%` }} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : event.cost ? (
        <p className="mt-3 font-display text-lg font-extrabold text-brown">{event.cost}</p>
      ) : null}

      {!suppressPrimaryCta &&
        (openModal ? (
          <GradientButton fullWidth className="mt-4" onClick={onSelectTickets}>
            {cta}
          </GradientButton>
        ) : event.rsvpPath && !event.isUnavailable ? (
          <GradientButton to={event.rsvpPath} fullWidth className="mt-4">
            {cta}
          </GradientButton>
        ) : (
          <GradientButton fullWidth className="mt-4" disabled={event.isUnavailable}>
            {cta}
          </GradientButton>
        ))}

      <p className="mt-2 text-center text-[10px] text-brown-muted">
        Refunds subject to host policy | All sales final unless noted
      </p>

      {hasEventMarketplace && (
        <Link
          to={`/event/${marketplaceEventId}/marketplace`}
          className="mt-3 flex w-full items-center justify-center rounded-[14px] border border-orange/25 bg-orange/5 px-4 py-2.5 font-display text-sm font-bold text-brown no-underline transition hover:border-orange/40 hover:bg-orange/10"
        >
          Browse event marketplace
        </Link>
      )}
    </section>
  )
}

function AmenitiesSection({
  amenityIds,
  legacyAmenities,
}: {
  amenityIds?: string[]
  legacyAmenities?: DiscoverEvent['amenities']
}) {
  const items = useMemo(() => {
    if (amenityIds?.length) return resolveHiddenGemAmenities(amenityIds)
    if (legacyAmenities?.length) {
      return resolveHiddenGemAmenities(
        legacyAmenities.map((key) => LEGACY_DISCOVER_AMENITY_IDS[key]),
      )
    }
    return []
  }, [amenityIds, legacyAmenities])

  if (items.length === 0) return null

  return (
    <section>
      <SectionHeading>Amenities</SectionHeading>
      <AmenityDisplayGrid items={items} />
    </section>
  )
}

function HiddenGemQuickInfo({ event }: { event: DiscoverEvent }) {
  const [hoursExpanded, setHoursExpanded] = useState(true)
  const infoHeaderClass =
    'text-[10px] font-bold uppercase tracking-wide theme-accent-text'
  const infoIconClass = 'mt-0.5 shrink-0 theme-accent-icon'
  const location = event.hiddenGemLocation
  const addressLines = location
    ? formatFullAddressMultiline(location)
    : event.fullAddress
      ? [event.fullAddress]
      : event.streetAddress && event.city
        ? [`${event.streetAddress}, ${event.city}`]
        : [event.locationDetail ?? event.venueName ?? event.city].filter(Boolean) as string[]
  const mapsQuery =
    event.mapsQuery ??
    (location ? formatFullAddress(location) : addressLines.join(', '))
  const mapsUrl = mapsQuery
    ? getGoogleMapsUrl(mapsQuery, event.locationLat, event.locationLng)
    : null

  const websiteHref = getWebsiteHref(event.website)
  const websiteDisplay = formatWebsiteDisplay(event.website)

  const contacts =
    event.contacts?.filter((c) => c.phone?.trim() || c.email?.trim() || c.label?.trim()) ?? []
  const legacyPhone = event.phone?.trim()

  const weeklyHours = event.weeklyHours
  const todayKey = DAY_OF_WEEK_KEYS[new Date().getDay()]
  const todayEntry = weeklyHours?.[todayKey]
  const todayDisplay = resolveDayHoursDisplay(todayEntry)
  const hoursStatus = getHiddenGemHoursStatus({ weeklyHours })
  const hoursStatusLabel = getHiddenGemHoursStatusLabel(hoursStatus)

  const ageLabel = event.ageRange ?? getAgePolicyLabel(event.agePolicy)
  const paymentLabel = formatDoorPayment(event.doorPayment ?? '')
  const distanceLabel = getDistanceFromUser({
    location: location ?? {
      city: event.city,
      street1: event.streetAddress ?? '',
      region: '',
      postalCode: '',
      country: '',
      venue: event.venueName,
      lat: event.locationLat,
      lng: event.locationLng,
    },
  })
  const displayCategory = getHiddenGemDisplayCategory(
    event.categories?.[0]?.label ?? 'Entertainment',
  )
  const reviewLinks = event.reviewLinks ?? []

  return (
    <section className={`${DETAIL_SECTION} p-4`}>
      <div className="space-y-4">
        {mapsUrl && addressLines.length > 0 && (
          <div className="flex items-start gap-3">
            <MapPin size={16} className={infoIconClass} aria-hidden />
            <div className="min-w-0">
              <p className={infoHeaderClass}>Address</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block rounded-[14px] text-sm font-medium text-brown underline decoration-brown/25 underline-offset-2 transition hover:bg-brown/5 hover:decoration-brown/50"
              >
                {addressLines.map((line, index) => (
                  <span key={`${line}-${index}`} className="block">
                    {line}
                  </span>
                ))}
              </a>
            </div>
          </div>
        )}

        {(contacts.length > 0 || legacyPhone) && (
          <div className="flex items-start gap-3">
            <Phone size={16} className={infoIconClass} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className={infoHeaderClass}>Contact</p>
              <ul className="mt-1 space-y-2">
                {contacts.length > 0
                  ? contacts.map((contact) => (
                      <li key={contact.id}>
                        <p className="text-xs font-semibold text-brown-muted">{contact.label}</p>
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                            className="block text-sm font-medium text-brown underline decoration-brown/25 underline-offset-2"
                          >
                            {contact.phone}
                          </a>
                        )}
                        {contact.note && (
                          <p className="mt-0.5 text-xs text-brown-muted">{contact.note}</p>
                        )}
                      </li>
                    ))
                  : legacyPhone && (
                      <li>
                        <a
                          href={`tel:${legacyPhone.replace(/[^\d+]/g, '')}`}
                          className="block text-sm font-medium text-brown underline decoration-brown/25 underline-offset-2"
                        >
                          {legacyPhone}
                        </a>
                      </li>
                    )}
              </ul>
            </div>
          </div>
        )}

        {websiteHref && (
          <div className="flex items-start gap-3">
            <Globe size={16} className={infoIconClass} aria-hidden />
            <div className="min-w-0">
              <p className={infoHeaderClass}>Website</p>
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block truncate text-sm font-medium text-brown underline decoration-brown/25 underline-offset-2"
              >
                {websiteDisplay}
              </a>
            </div>
          </div>
        )}

        {reviewLinks.length > 0 && (
          <div className="flex items-start gap-3">
            <Star size={16} className={infoIconClass} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className={infoHeaderClass}>Reviews</p>
              <ul className="mt-1 space-y-1.5">
                {reviewLinks.map((link) => {
                  const href = getWebsiteHref(link.url)
                  if (!href) return null
                  return (
                    <li key={link.id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm font-medium text-brown underline decoration-brown/25 underline-offset-2"
                      >
                        {getHiddenGemReviewLinkLabel(link)}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}

        {event.cost && (
          <div className="flex items-start gap-3">
            <CircleDollarSign size={16} className={infoIconClass} aria-hidden />
            <div>
              <p className={infoHeaderClass}>Typical price</p>
              <p className="mt-0.5 text-sm font-medium text-brown">{event.cost}</p>
            </div>
          </div>
        )}

        {paymentLabel && (
          <div className="flex items-start gap-3">
            <CreditCard size={16} className={infoIconClass} aria-hidden />
            <div>
              <p className={infoHeaderClass}>Payment</p>
              <p className="mt-0.5 text-sm font-medium text-brown">
                {paymentLabel}
                {event.atmOnSite ? ' · ATM on site' : ''}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Clock size={16} className={infoIconClass} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={infoHeaderClass}>Hours</p>
              <HiddenGemHoursStatusBadge weeklyHours={weeklyHours} size="sm" variant="light" />
            </div>
            <p className="mt-0.5 text-sm font-medium text-brown">
              Today ({DAY_OF_WEEK_LABELS[todayKey]}): {todayDisplay.timeLabel}
            </p>
            {todayDisplay.note && (
              <p className="mt-0.5 text-xs leading-relaxed text-brown-muted">{todayDisplay.note}</p>
            )}
            {event.hoursDescription && (
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-brown-muted">
                {event.hoursDescription}
              </p>
            )}
            <p className="mt-0.5 text-xs text-brown-muted">{hoursStatusLabel} right now</p>
            {weeklyHours && (
              <button
                type="button"
                onClick={() => setHoursExpanded((v) => !v)}
                className="mt-1.5 text-xs font-semibold text-brown-muted underline decoration-brown/20 underline-offset-2"
              >
                {hoursExpanded ? 'Hide weekly hours' : 'View weekly hours'}
              </button>
            )}
            {hoursExpanded && weeklyHours && (
              <ul className="mt-3 space-y-2 border-t border-brown/8 pt-3">
                {DAY_OF_WEEK_KEYS.map((day) => {
                  const dayDisplay = resolveDayHoursDisplay(weeklyHours[day])
                  return (
                    <li key={day} className="flex items-start justify-between gap-3 text-xs">
                      <span className="shrink-0 font-semibold text-brown">{DAY_OF_WEEK_LABELS[day]}</span>
                      <div className="min-w-0 text-right text-brown-muted">
                        <p className="font-medium text-brown">{dayDisplay.timeLabel}</p>
                        {dayDisplay.note && (
                          <p className="mt-0.5 leading-relaxed">{dayDisplay.note}</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users size={16} className={infoIconClass} aria-hidden />
          <div>
            <p className={infoHeaderClass}>Ages</p>
            <p className="mt-0.5 text-sm font-medium text-brown">{ageLabel}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Navigation size={16} className={infoIconClass} aria-hidden />
          <div>
            <p className={infoHeaderClass}>Distance</p>
            <p className="mt-0.5 text-sm font-medium text-brown">{distanceLabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-app-subtle pt-4">
        <span className="inline-flex rounded-[14px] border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange">
          {displayCategory}
        </span>
      </div>
    </section>
  )
}

function WhosBringingWhatSection({
  eventId,
  checklistItems,
  rsvpPath,
}: {
  eventId: string
  checklistItems: import('../lib/account').ChecklistItem[]
  rsvpPath?: string
}) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    function bumpRefresh() {
      setRefreshKey((n) => n + 1)
    }
    window.addEventListener('storage', bumpRefresh)
    window.addEventListener('focus', bumpRefresh)
    return () => {
      window.removeEventListener('storage', bumpRefresh)
      window.removeEventListener('focus', bumpRefresh)
    }
  }, [])

  const entries = useMemo(
    () => getWhosBringingWhat(eventId, checklistItems),
    [eventId, checklistItems, refreshKey],
  )
  const hasClaims = entries.some((e) => e.claims.length > 0)

  return (
    <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm">
      <SectionHeading>Who&apos;s bringing what</SectionHeading>
      {hasClaims ? (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => {
            if (entry.claims.length === 0) return null
            return (
              <li key={entry.itemId} className="text-sm text-brown">
                <span className="font-display font-bold">
                  {entry.label} ({entry.claims.length}/{entry.maxClaims}):
                </span>{' '}
                <span className="text-brown/85">
                  {entry.claims.map(formatClaimantName).join(', ')}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-brown-muted">
          {rsvpPath ? (
            <>
              No sign-ups yet -{' '}
              <Link to={rsvpPath} className="font-semibold text-orange underline decoration-orange/30">
                RSVP to claim an item
              </Link>
            </>
          ) : (
            'Sign up when you RSVP'
          )}
        </p>
      )}
    </section>
  )
}


export default function DiscoverEventDetailPanel({
  event,
  onClose,
  onSave,
  isLiked: isLikedProp,
  onLike,
  layout = 'discover',
  previewMode = false,
  draftPreviewMode = false,
  deckStatus,
}: DiscoverEventDetailPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showTickets, setShowTickets] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [showReportSheet, setShowReportSheet] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [localLiked, setLocalLiked] = useState(() => isEventLiked(event.id))
  const isDiscover = layout === 'discover'
  const borderType = normalizeBorderType(event.borderColor)
  const borderStyle = getDiscoverCardBorderStyle(borderType, isDiscover ? { widthPx: 2 } : undefined)
  const detailFrameStyle = isDiscover ? getDiscoverCardDetailFrameStyle(borderType, 2) : null
  const images = event.images?.length ? event.images : [event.image]
  const stats = resolveStats(event)
  const mapsQuery = getEventMapsQuery(event)
  const shareUrl = getDiscoverEventShareUrl(event)
  const hostEvent = event.hostEventId ? getHostEventById(event.hostEventId) : undefined
  const tripContext = hostEvent ? tripLinkContextFromEvent(hostEvent) : tripLinkContextFromDiscoverEvent(event)
  const lodgingNearby = eventHasLodgingNearby(event.amenityIds)
  const isHiddenGemCard =
    event.badges.includes('HIDDEN GEM') && normalizeBorderType(event.borderColor) === 'gold'

  const hasDetailAmenities =
    (event.amenityIds?.length ?? 0) > 0 || (event.amenities?.length ?? 0) > 0

  const hostMerch = useMemo(() => {
    if (event.organizationId) {
      const org = getOrganization(event.organizationId)
      const settings = getHostMerchSettingsFromOrg(org)
      if (!org || !isHostMerchVisibleForOrg(settings, resolveOrgPlanForOrganization(org))) return null
      return {
        hostKind: 'org' as const,
        hostId: event.organizationId,
        merchShopUrl: settings.merchShopUrl,
      }
    }

    const posterEmail = hostEvent?.postedAsUserId ?? hostEvent?.createdBy
    if (!posterEmail || hostEvent?.hostAccountId) return null
    const settings = getHostMerchSettingsFromAccount(getAccount(posterEmail))
    if (!isHostMerchVisible(settings)) return null
    return {
      hostKind: 'personal' as const,
      hostId: posterEmail.trim().toLowerCase(),
      merchShopUrl: settings.merchShopUrl,
    }
  }, [event.organizationId, hostEvent?.postedAsUserId, hostEvent?.createdBy, hostEvent?.hostAccountId])

  const hostUpcomingEvents = useMemo(() => {
    if (event.hostAccountId) {
      return getUpcomingPublicEventsForOrg(event.hostAccountId)
    }
    if (event.organizationId) {
      return getUpcomingPublicEventsForOrg(event.organizationId)
    }
    if (hostEvent) {
      const email = hostEvent.postedAsUserId ?? hostEvent.createdBy
      if (email) return getUpcomingPublicEventsForPersonalHost(email)
    }
    return []
  }, [event.hostAccountId, event.organizationId, hostEvent])

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [event.id])

  useEffect(() => {
    setLocalLiked(isEventLiked(event.id))
  }, [event.id])

  const isLiked = isLikedProp ?? localLiked

  const addToCalendar = useCallback(() => {
    addDiscoverEventToCalendar(event)
  }, [event])

  const openDirections = useCallback(() => {
    openDiscoverEventDirections(event)
  }, [event])

  const handleShare = useCallback(async () => {
    if (previewMode) {
      setToast('Preview only - publish to share')
      return
    }
    const result = await shareDiscoverEvent(event)
    if (result === 'sheet') {
      setShowShareSheet(true)
    }
  }, [event, previewMode])

  const handleSave = useCallback(() => {
    if (previewMode) {
      setToast('Preview only - publish to save')
      return
    }
    onSave()
  }, [onSave, previewMode])

  const handleLike = useCallback(() => {
    if (previewMode) {
      setToast('Preview only - publish to like')
      return
    }
    if (onLike) {
      onLike()
      return
    }
    setLocalLiked(toggleLikedEvent(event.id))
  }, [event.id, onLike, previewMode])

  const isFullscreen = layout === 'fullscreen' || isDiscover
  const isPreview = layout === 'preview'
  const backdropClass = isFullscreen
    ? 'fixed inset-0 z-[var(--z-modal)] bg-black/70 backdrop-blur-sm'
    : 'app-column-fixed fixed top-[calc(var(--app-header-h)+env(safe-area-inset-top))] bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[calc(var(--z-header)-2)] bg-black/70 backdrop-blur-sm'
  const panelClass = isPreview
    ? 'relative flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden bg-cream'
    : isDiscover
      ? 'discover-detail-panel relative flex h-full w-full max-w-lg min-h-0 flex-col overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated box-border shadow-float'
      : isFullscreen
        ? 'discover-detail-panel fixed inset-0 z-[calc(var(--z-modal)+1)] flex max-h-[100svh] flex-col overflow-hidden border border-app-subtle bg-app-elevated shadow-float'
        : 'discover-detail-panel app-column-fixed animate-slide-up-panel fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[calc(var(--z-header)-1)] flex max-h-[calc(100svh-var(--app-header-h)-env(safe-area-inset-top)-var(--app-bottom-nav-h)-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-t-[var(--radius-2xl)] border border-app-subtle bg-app-elevated shadow-float'

  const panelStyle = isDiscover
    ? detailFrameStyle ?? undefined
    : {
        ...borderStyle,
        borderBottom: 'none',
        borderLeft: isFullscreen || isPreview ? undefined : 'none',
        borderRight: isFullscreen || isPreview ? undefined : 'none',
        boxShadow: isFullscreen || isPreview ? undefined : '0 -4px 40px rgba(0,0,0,0.35)',
      }

  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discover-detail-title"
      className={panelClass}
      style={panelStyle}
    >
        {draftPreviewMode && (
          <div
            className={`shrink-0 border-b border-amber-400/35 bg-amber-400/15 px-4 text-center ${
              isPreview ? 'pb-2 pt-8' : 'py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
              Preview - not published yet
            </p>
          </div>
        )}

        {!draftPreviewMode && deckStatus && (
          <div
            className={`shrink-0 border-b px-4 text-center ${
              deckStatus.tone === 'pending'
                ? 'border-amber-400/35 bg-amber-400/15'
                : deckStatus.tone === 'onDeck'
                  ? 'border-cyan-500/25 bg-cyan-500/10'
                  : 'border-amber-400/25 bg-amber-400/10'
            } ${isPreview ? 'pb-2 pt-8' : 'py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]'}`}
          >
            <p
              className={`text-xs font-bold uppercase tracking-wide ${
                deckStatus.tone === 'pending'
                  ? 'text-amber-900'
                  : deckStatus.tone === 'onDeck'
                    ? 'text-cyan-800'
                    : 'text-amber-900'
              }`}
            >
              {deckStatus.label}
            </p>
          </div>
        )}

        {!isPreview && !isDiscover && (
          <div className="relative shrink-0 border-b border-brown/8 px-4 pb-2 pt-3">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-brown/15" aria-hidden />
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark text-brown-muted transition hover:text-brown"
                aria-label="Close"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
          </div>
        )}

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-y"
        >
          <DetailPanelHero
            event={event}
            images={images}
            onClose={isDiscover ? onClose : undefined}
          />

          <div className="space-y-5 px-5 pt-5">
            <div>
              {(() => {
                const titleBadge = resolveDetailTitleBadge(event, isHiddenGemCard)
                return (
                  <div className="text-center">
                    {titleBadge && <DetailTitleBadge badge={titleBadge} />}
                    <h2
                      id="discover-detail-title"
                      className={`font-display text-[26px] font-extrabold leading-[1.1] tracking-tight text-brown${
                        titleBadge ? ' mt-3' : ''
                      }`}
                    >
                      {event.title}
                    </h2>
                  </div>
                )
              })()}
            </div>

            <DetailPrimaryActions
              event={event}
              isHiddenGemCard={isHiddenGemCard}
              mapsQuery={mapsQuery}
              previewMode={previewMode}
              isDiscover={isDiscover}
              isLiked={isLiked}
              onLike={handleLike}
              onSave={handleSave}
              onShare={handleShare}
              onDirections={openDirections}
              onAddToCalendar={addToCalendar}
              onSelectTickets={() => setShowTickets(true)}
            />

            {isHiddenGemCard ? (
              <>
                <HiddenGemQuickInfo event={event} />

                {event.description && (
                  <section>
                    <SectionHeading>About us</SectionHeading>
                    <p className="mt-3 text-[15px] leading-relaxed text-brown/85">{event.description}</p>
                  </section>
                )}

                {event.menu && (
                  <section>
                    <SectionHeading>Venue details</SectionHeading>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-brown/85">
                      {event.menu}
                    </pre>
                  </section>
                )}

                {hasDetailAmenities && (
                  <AmenitiesSection amenityIds={event.amenityIds} legacyAmenities={event.amenities} />
                )}
              </>
            ) : (
              <>
                <section className={`${DETAIL_SECTION} p-4`}>
                  <SectionHeading>At a Glance</SectionHeading>
                  <div className="mt-4 space-y-3.5">
                    {event.postedAt && event.cardKind === 'attraction' && (
                      <MetaRow icon={<Calendar size={14} className="text-brown-muted" />}>
                        <span className="font-medium">
                          Posted {formatAttractionPostedDate(event.postedAt)}
                        </span>
                        {event.attractionStale && (
                          <span className="mt-1 inline-flex rounded-[10px] bg-warm-yellow/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                            3+ months — refresh photos
                          </span>
                        )}
                      </MetaRow>
                    )}
                    {event.dateTime && (
                      <MetaRow icon={<Calendar size={14} className="text-brown-muted" />} badge={event.repeatsLabel}>
                        <span className="font-medium">{event.dateTime}</span>
                      </MetaRow>
                    )}
                    {(event.venueName || event.streetAddress || event.city) && (
                      <MetaRow icon={<MapPin size={14} className="text-brown-muted" />}>
                        {event.venueName && <p className="font-semibold">{event.venueName}</p>}
                        {mapsQuery && (
                          <button
                            type="button"
                            onClick={openDirections}
                            className="mt-0.5 text-left text-sm text-brown underline decoration-brown/25 underline-offset-2"
                          >
                            {event.streetAddress
                              ? `${event.streetAddress}, ${event.city}`
                              : event.locationDetail ?? event.city}
                          </button>
                        )}
                      </MetaRow>
                    )}
                    {event.visitDurationLabel && (
                      <MetaRow icon={<Clock size={14} className="text-brown-muted" />}>
                        <span>
                          Average stay: <span className="font-semibold">{event.visitDurationLabel}</span>
                        </span>
                      </MetaRow>
                    )}
                    {event.ageRange && (
                      <MetaRow icon={<Users size={14} className="text-brown-muted" />}>
                        <span>
                          Ages: <span className="font-semibold">{event.ageRange}</span>
                        </span>
                      </MetaRow>
                    )}
                    {event.distance && (
                      <MetaRow icon={<Navigation size={14} className="text-brown-muted" />}>
                        <span>
                          {event.distance}
                          {event.distance.includes('mins') ? '' : ' | walkable'}
                        </span>
                      </MetaRow>
                    )}
                  </div>
                </section>

                <section>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`${DETAIL_SECTION} px-2 py-3 text-center`}>
                      <Check size={18} className="mx-auto text-success" aria-hidden />
                      <p className="mt-1 font-display text-lg font-extrabold text-brown">{stats.going}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Going</p>
                    </div>
                    <div className={`${DETAIL_SECTION} px-2 py-3 text-center`}>
                      <Bookmark size={18} className="mx-auto theme-accent-icon" aria-hidden />
                      <p className="mt-1 font-display text-lg font-extrabold text-brown">{stats.saved}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Saved</p>
                    </div>
                    <div className={`${DETAIL_SECTION} px-2 py-3 text-center`}>
                      <Eye size={18} className="mx-auto text-brown-muted" aria-hidden />
                      <p className="mt-1 font-display text-lg font-extrabold text-brown">{stats.views}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Views</p>
                    </div>
                  </div>
                </section>

                <TicketsSection
                  event={event}
                  onSelectTickets={() => setShowTickets(true)}
                />

                {hasTripAssistOptions(tripContext) && (
                  <section className="rounded-[14px] border border-electric-blue/20 bg-electric-blue/5 p-4">
                    <EventTripActions
                      context={tripContext}
                      lodgingNearby={lodgingNearby}
                      eventId={event.id}
                      orgId={event.hostAccountId ?? undefined}
                    />
                  </section>
                )}

                {event.description && (
                  <section>
                    <SectionHeading>About this Event</SectionHeading>
                    <p className="mt-3 text-[15px] leading-relaxed text-brown/85">{event.description}</p>
                  </section>
                )}

                {event.hasChecklist && (
                  <div className="flex items-start gap-3 rounded-[14px] border border-brown/12 bg-cream/60 px-4 py-3">
                    <Check size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />
                    <div>
                      <p className="font-display text-sm font-bold text-brown">
                        {event.checklistMandatory ? 'Mandatory checklist' : 'Attendee checklist'}
                      </p>
                      <p className="mt-0.5 text-xs text-brown-muted">
                        {event.checklistMandatory
                          ? 'Complete the host checklist when you RSVP.'
                          : 'Optional checklist available when you RSVP.'}
                      </p>
                    </div>
                  </div>
                )}

                {hasDetailAmenities && (
                  <AmenitiesSection amenityIds={event.amenityIds} legacyAmenities={event.amenities} />
                )}
              </>
            )}

            {(event.hostLabel || event.hostProfileUrl) && (
              <section className={`${DETAIL_SECTION} p-4`}>
                <SectionHeading>Hosted By</SectionHeading>
                <div className="mt-4 flex items-start gap-3">
                  <HiddenGemOrganizerAvatar
                    initial={event.hostAvatarInitial ?? event.hostLabel?.charAt(0)}
                    avatarUrl={event.hostAvatarUrl}
                    profileUrl={event.hostProfileUrl}
                    label={event.hostLabel}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-extrabold text-brown">{event.hostLabel ?? 'TUDU host'}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-brown-muted">
                      {event.hostEventCount != null && <span>{event.hostEventCount} events</span>}
                      <span>4.8 rating</span>
                      <span>128 followers</span>
                    </div>
                  </div>
                </div>
                {event.hostProfileUrl && (
                  <Link
                    to={event.hostProfileUrl}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-[14px] border border-orange/35 bg-app-elevated px-4 py-2.5 font-display text-sm font-semibold text-orange no-underline transition hover:border-orange/50 hover:bg-orange/5"
                  >
                    View Organizer Profile
                  </Link>
                )}
                <PublicProfileEvents
                  events={hostUpcomingEvents}
                  orgName={event.hostLabel ?? undefined}
                  variant="embedded"
                  excludeEventId={event.hostEventId}
                />
                {hostMerch && (
                  <PublicProfileMerchBar
                    shopUrl={hostMerch.merchShopUrl ?? undefined}
                    hostKind={hostMerch.hostKind}
                    hostId={hostMerch.hostId}
                    showMerchShop
                  />
                )}
              </section>
            )}

            {event.hasChecklist && event.checklistItems && event.checklistItems.length > 0 && (
              <WhosBringingWhatSection
                eventId={event.hostEventId ?? event.id.replace(/^host-/, '')}
                checklistItems={event.checklistItems}
                rsvpPath={event.rsvpPath}
              />
            )}

            {!isDiscover && (
              <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4 text-center shadow-sm">
                <SectionHeading>Scan &amp; Share</SectionHeading>
                <p className="mt-2 text-xs text-brown-muted">Scan to open this event on TUDU</p>
                <div className="mt-4">
                  <QrCodeBlock value={shareUrl} />
                </div>
              </section>
            )}

            <button
              type="button"
              className="mx-auto flex items-center gap-1.5 pb-2 text-xs font-semibold text-brown-muted transition hover:text-maroon"
              onClick={() => setShowReportSheet(true)}
            >
              <Flag size={14} aria-hidden />
              Report Event
            </button>
          </div>
        </div>

        {isDiscover && (
          <div className="discover-detail-footer shrink-0 border-t border-app-subtle bg-app-elevated px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            <div className="grid grid-cols-4 gap-0.5">
              <button
                type="button"
                onClick={handleSave}
                className="flex min-h-[var(--touch-min)] flex-col items-center justify-center gap-0.5 rounded-[14px] border border-transparent px-0.5 text-[10px] font-semibold text-brown transition hover:border-orange/25 hover:bg-orange/5 active:scale-[0.98]"
              >
                <Bookmark size={18} className="text-success" aria-hidden />
                Save
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                className="flex min-h-[var(--touch-min)] flex-col items-center justify-center gap-0.5 rounded-[14px] border border-transparent px-0.5 text-[10px] font-semibold text-brown transition hover:border-orange/25 hover:bg-orange/5 active:scale-[0.98]"
              >
                <ShareIcon className="h-[18px] w-[18px] theme-accent-icon" aria-hidden />
                Share
              </button>
              <button
                type="button"
                onClick={addToCalendar}
                className="flex min-h-[var(--touch-min)] flex-col items-center justify-center gap-0.5 rounded-[14px] border border-transparent px-0.5 text-[10px] font-semibold text-brown transition hover:border-orange/25 hover:bg-orange/5 active:scale-[0.98]"
              >
                <CalendarPlus size={18} className="theme-accent-icon" aria-hidden />
                Calendar
              </button>
              <button
                type="button"
                onClick={scrollToTop}
                className="flex min-h-[var(--touch-min)] flex-col items-center justify-center gap-0.5 rounded-[14px] border border-transparent px-0.5 text-[10px] font-semibold text-brown transition hover:border-orange/25 hover:bg-orange/5 active:scale-[0.98]"
              >
                <ArrowUp size={18} className="text-brown-muted" aria-hidden />
                Top
              </button>
            </div>
          </div>
        )}
      </div>
  )

  return (
    <>
      {!isPreview && !isDiscover && (
        <button
          type="button"
          className={backdropClass}
          aria-label="Close event details"
          onClick={onClose}
        />
      )}

      {isDiscover ? (
        <div className="fixed inset-0 z-[calc(var(--z-modal)+1)] flex justify-center bg-black/70 backdrop-blur-sm p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {panel}
        </div>
      ) : (
        panel
      )}

      {showTickets && (
        <DiscoverSelectTicketsModal event={event} onClose={() => setShowTickets(false)} />
      )}
      {showShareSheet && (
        <ShareEventSheet event={event} onClose={() => setShowShareSheet(false)} />
      )}
      <ReportProblemSheet
        open={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        kind="report"
        title="Report event"
        subtitle="Flag something unsafe, misleading, or against our community guidelines."
        eventContext={{
          targetEventId: event.hostEventId ?? event.id.replace(/^host-/, ''),
          eventTitle: event.title,
          hostEmail: hostEvent?.createdBy,
          hostAccountId: hostEvent?.hostAccountId,
        }}
        onSubmitted={() => setToast('Report submitted — thanks for helping keep TUDU safe.')}
      />
      {toast && <ToastBanner message={toast} onDismiss={() => setToast(null)} dark />}
    </>
  )
}
