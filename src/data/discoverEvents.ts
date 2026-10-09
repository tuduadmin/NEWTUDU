import type { TicketingMode } from '../lib/account'

export type DiscoverBadge = 'TRUSTED HOST' | 'HIDDEN GEM' | 'ATTRACTION'
export type DiscoverCardKind = 'event' | 'attraction'
export type DiscoverAmenity = 'food' | 'parking' | 'wheelchair'
export type DiscoverTicketingMode = TicketingMode | 'explore'

export type DiscoverTicketTier = {
  id: string
  name: string
  priceLabel: string
  description?: string
  soldOut?: boolean
  availableAtDoor?: boolean
  quantity?: number | null
  sold?: number
  priceCents?: number
}

export type DiscoverCategory = {
  label: string
  color: 'teal' | 'yellow' | 'purple'
  icon: 'cart' | 'food' | 'party'
}

export type DiscoverEvent = {
  id: string
  title: string
  city: string
  image: string
  badges: DiscoverBadge[]
  amenities?: DiscoverAmenity[]
  dateTag?: string
  dateTime?: string
  cost?: string
  isRsvp?: boolean
  isWaitlist?: boolean
  isUnavailable?: boolean
  hostEventId?: string
  hostAccountId?: string
  ageRange?: string
  distance?: string
  categories?: DiscoverCategory[]
  partyType?: string
  locationDetail?: string
  borderColor?: EventCardBorderType | 'yellow'
  cardKind?: DiscoverCardKind
  attractionId?: string
  keywords?: string[]
  videoUrl?: string
  mediaType?: 'image' | 'video'
  hostLabel?: string
  hostProfileUrl?: string
  /** Up to 3 hero images for expanded detail view. */
  images?: string[]
  description?: string
  venueName?: string
  departmentName?: string
  hasChecklist?: boolean
  checklistMandatory?: boolean
  /** Normalized signup items for public "who's bringing what". */
  checklistItems?: import('../lib/account').ChecklistItem[]
  actionLabel?: string
  rsvpPath?: string
  externalTicketUrl?: string
  ticketTiers?: DiscoverTicketTier[]
  ticketingMode?: DiscoverTicketingMode
  /** Detail panel header, e.g. "Community Event". */
  panelHeader?: string
  streetAddress?: string
  visitDurationLabel?: string
  repeatsLabel?: string
  amenityLabels?: string[]
  /** When true, card shows "Multiple dates" and detail lists all show dates. */
  multipleDates?: boolean
  /** Explicit show dates for advanced ticket sales detail panel. */
  showDates?: string[]
  /** Full amenity IDs for vertical preview strip (create-event / landing cards). */
  amenityIds?: string[]
  goingCount?: number
  savedCount?: number
  viewCount?: number
  atDoorAvailable?: boolean
  ticketsRemaining?: number
  capacity?: number
  ticketsSoldPercent?: number
  hostAvatarInitial?: string
  /** Org/host profile logo (crest) for card corner avatar. */
  hostAvatarUrl?: string
  hostEventCount?: number
  mapsQuery?: string
  /** Org hidden gem — for organizer avatar + hours status. */
  organizationId?: string
  weeklyHours?: WeeklyHours
  agePolicy?: AgePolicy
  locationLat?: number
  locationLng?: number
  /** Org hidden gem — structured location for detail panel. */
  hiddenGemLocation?: import('../lib/hiddenGems').HiddenGemLocation
  /** Org hidden gem — full street address for detail panel (legacy / computed). */
  fullAddress?: string
  /** Org hidden gem — labeled contact lines. */
  contacts?: import('../lib/hiddenGems').HiddenGemContact[]
  /** Org hidden gem — legacy single phone. */
  phone?: string
  /** Org hidden gem — public website URL. */
  website?: string
  /** Org hidden gem — free-text hours notes. */
  hoursDescription?: string
  /** Org hidden gem — pasted menu text. */
  menu?: string
  /** Org hidden gem — third-party review page links. */
  reviewLinks?: import('../lib/hiddenGems').HiddenGemReviewLink[]
  /** On-site payment — cash, card, or both. */
  doorPayment?: import('../lib/eventDoorPayment').DoorPaymentMode
  /** ATM on site when cash is accepted. */
  atmOnSite?: boolean
  /** Admin attraction — ISO posted date for deck + detail panel. */
  postedAt?: string
  /** Admin attraction — true when posted 3+ months ago (posted date turns yellow). */
  attractionStale?: boolean
}

import type { EventCardBorderType } from '../lib/eventCardColors'
import {
  DEFAULT_ATTRACTION_IMAGE,
  formatAttractionPostedLabel,
  getAttractionById,
  getAttractionDiscoverBorderColor,
  attractionMatchesSecretKeyword,
  getHiddenSecretAttractions,
  getPublicDeckAttractions,
  getPublicSecretAttractions,
  isAttractionStale,
  getRotatedAttractionImages,
  type Attraction,
} from '../lib/attractions'
import { EVENT_COVER_STOCK_IMAGES } from '../lib/eventCoverImage'
import { DEFAULT_HIDDEN_GEM_IMAGE } from '../lib/hiddenGemDefaults'
import {
  getAgePolicyLabel,
  getHiddenGemDisplayCategory,
  getPublicOrgHiddenGems,
  formatFullAddress,
  type AgePolicy,
  type OrgHiddenGem,
  type WeeklyHours,
  resolveHiddenGemPriceLabel,
  normalizePriceLabel,
} from '../lib/hiddenGems'
import { getOrgHostProfile } from '../lib/orgHostProfile'
import {
  resolveHostEventDiscoverBadges,
  resolveHostEventDiscoverBorder,
} from '../lib/hostEventDiscoverStyle'

import {
  getHostAccount,
  getHostEventsForOrg,
  getPublicHostEventsForDiscover,
  getAgeRestrictionLabel,
  getEventActionLabel,
  getEventCostLabel,
  resolveTicketingMode,
  type HostEvent,
  type VisitDuration,
} from '../lib/account'
import { isRemovedDemoHostEvent, isRemovedDemoHostEventId } from '../lib/removedDemoEvents'
import { isEventHiddenFromDiscover } from '../lib/adminEventModeration'
import { getEventMetrics } from '../lib/adminAnalytics'
import {
  ADDITIONAL_AMENITIES,
  getCategoryById,
  PRIMARY_AMENITIES,
  REPEAT_OPTIONS,
  type EventCategoryId,
} from './eventCategories'
import { getHostProfileUrlFromEvent, getOrgPublicProfileUrl } from '../lib/publicHostProfile'
import { getHiddenGemAmenityLabels } from '../lib/amenities'
import { getOrganization } from '../lib/account'
import { formatCardDateTime, hasMultipleDisplayDates, inferDayShape, inferRepeats, inferSellTicketsPerDay, resolveTicketDates } from '../lib/eventSchedule'
import { normalizeChecklist } from '../lib/checklist'

export const DISCOVER_EVENTS: DiscoverEvent[] = [
  {
    id: 'farmers-market',
    title: "Saskatoon Farmers' Market",
    city: 'Saskatoon',
    image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80',
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    ],
    badges: ['TRUSTED HOST'],
    amenities: ['food', 'parking', 'wheelchair'],
    dateTag: 'Tomorrow',
    dateTime: 'Dec 17, 9:00 AM',
    cost: 'Free',
    isRsvp: true,
    ageRange: 'All Ages',
    distance: '~5 mins away',
    venueName: 'River Landing',
    description:
      'Fresh produce, baked goods, and local artisans every Saturday morning. Bring a reusable bag and explore Saskatchewan-grown flavours.',
    keywords: ['farmers market', 'local food', 'family-friendly', 'outdoor'],
    categories: [
      { label: 'Shopping & Markets', color: 'teal', icon: 'cart' },
      { label: 'Food & Drink', color: 'yellow', icon: 'food' },
    ],
    borderColor: 'green',
    hostLabel: 'Saskatoon Market Association',
    actionLabel: 'RSVP',
    ticketingMode: 'free_rsvp',
  },
  {
    id: 'one-book-one-province',
    title: 'One Book One Province 2026',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
      'https://images.unsplash.com/photo-1524995998253-2314b87b8139?w=800&q=80',
    ],
    badges: ['HIDDEN GEM'],
    partyType: 'Party',
    ageRange: 'All Ages',
    locationDetail:
      'In Maple Creek, Assiniboia, Saskatoon, Moosomin, Yorkton & Regina',
    description:
      'A province-wide reading celebration with author talks, book clubs, and community gatherings in towns across Saskatchewan.',
    keywords: ['books', 'literature', 'community', 'province-wide'],
    borderColor: 'gold',
    cost: 'Free',
    actionLabel: 'Explore',
    ticketingMode: 'explore',
  },
  {
    id: 'kindersley-summer-market',
    title: 'Kindersley Summer Market',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1567306303716-647a3c3a0a4c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1567306303716-647a3c3a0a4c?w=800&q=80',
      'https://images.unsplash.com/photo-1533900298318-1b6737211a7e7?w=800&q=80',
    ],
    badges: ['TRUSTED HOST'],
    amenities: ['food', 'parking'],
    dateTag: 'This Weekend',
    dateTime: 'Jul 19, 9:00 AM',
    cost: 'Free',
    isRsvp: true,
    ageRange: 'All Ages',
    distance: '~10 mins away',
    venueName: 'Kindersley District Park',
    description:
      'Summer vendors, live music, and kid-friendly activities in the heart of Kindersley. Free admission — RSVP helps hosts plan.',
    keywords: ['market', 'summer', 'local vendors', 'live music'],
    categories: [{ label: 'Shopping & Markets', color: 'teal', icon: 'cart' }],
    borderColor: 'green',
    hostLabel: 'Kindersley Community Events',
    actionLabel: 'RSVP',
    ticketingMode: 'free_rsvp',
  },
  {
    id: 'jazz-emerald',
    title: 'Live Jazz at Emerald Lounge',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1415201361474-7efff816c025?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1415201361474-7efff816c025?w=800&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    ],
    badges: ['HIDDEN GEM'],
    amenities: ['food', 'wheelchair'],
    dateTag: 'Next Week',
    dateTime: 'Jul 20, 8:00 PM',
    cost: '$15',
    ageRange: '19+',
    distance: '~3 mins away',
    venueName: 'Emerald Lounge',
    description:
      'An intimate evening of live jazz with local musicians, craft cocktails, and a curated small-plates menu.',
    keywords: ['jazz', 'live music', 'nightlife', 'cocktails'],
    categories: [{ label: 'Music', color: 'purple', icon: 'party' }],
    borderColor: 'gold',
    hostLabel: 'Emerald Lounge',
    actionLabel: 'Get Tickets',
    ticketingMode: 'sell',
    ticketTiers: [{ id: 'tier_static_ga', name: 'General Admission', priceLabel: '$15', priceCents: 1500 }],
  },
]

const TICKETING_MODES_WITH_CHECKOUT: DiscoverTicketingMode[] = ['free_rsvp', 'free_donation', 'sell']

function parsePriceLabelCents(label: string): number {
  const trimmed = label.trim()
  if (!trimmed || /^free/i.test(trimmed)) return 0
  const match = trimmed.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/)
  if (!match) return 0
  return Math.round(parseFloat(match[1].replace(/,/g, '')) * 100)
}

function defaultDiscoverTicketTiers(
  card: DiscoverEvent,
  mode: DiscoverTicketingMode,
): DiscoverTicketTier[] {
  if (mode === 'free_rsvp' || mode === 'free_donation') {
    return [{ id: 'tier_static_rsvp', name: 'RSVP', priceLabel: 'Free', priceCents: 0 }]
  }
  if (mode === 'sell') {
    const priceCents = card.cost ? parsePriceLabelCents(card.cost) : 0
    const priceLabel = card.cost ?? 'Free'
    return [{ id: 'tier_static_ga', name: 'General Admission', priceLabel, priceCents }]
  }
  return []
}

function enrichDiscoverTicketTier(tier: DiscoverTicketTier): DiscoverTicketTier {
  return {
    ...tier,
    priceCents: tier.priceCents ?? parsePriceLabelCents(tier.priceLabel),
  }
}

/** Ensures static discover cards have ticket tiers and RSVP paths for checkout. */
export function enrichDiscoverEventTickets(card: DiscoverEvent): DiscoverEvent {
  const mode = card.ticketingMode
  if (!mode || !TICKETING_MODES_WITH_CHECKOUT.includes(mode)) return card

  const checkoutId = card.hostEventId ?? card.id
  const tiers =
    (card.ticketTiers?.length ?? 0) > 0
      ? card.ticketTiers!.map(enrichDiscoverTicketTier)
      : defaultDiscoverTicketTiers(card, mode)

  return {
    ...card,
    ticketTiers: tiers,
    rsvpPath: card.rsvpPath ?? `/event/${checkoutId}/rsvp`,
  }
}

const HOST_EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
  'https://images.unsplash.com/photo-1517456793572-1e8a4e4b875a?w=800&q=80',
]

function formatEventDateTime(event: HostEvent): string | undefined {
  return formatCardDateTime(event)
}

function mapAmenities(event: HostEvent): DiscoverAmenity[] {
  const list: DiscoverAmenity[] = []
  if (event.amenities?.includes('food-drink')) list.push('food')
  if (event.amenities?.includes('parking')) list.push('parking')
  if (event.amenities?.includes('wheelchair')) list.push('wheelchair')
  return list
}

function formatTierPrice(cents: number): string {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

function visitDurationLabel(duration?: VisitDuration): string | undefined {
  if (duration === 'short') return '15–30 mins'
  if (duration === 'medium') return '1–4 hours'
  if (duration === 'long') return '4+ hours'
  return undefined
}

function repeatsLabel(event: HostEvent): string | undefined {
  if (inferSellTicketsPerDay(event)) return 'PER DAY TICKETS'
  const dayShape = inferDayShape(event)
  if (dayShape === 'pick_dates') return 'MULTIPLE DATES'
  const repeat = inferRepeats(event)
  if (repeat === 'none') return undefined
  const match = REPEAT_OPTIONS.find((o) => o.value === repeat)
  if (!match) return undefined
  if (repeat === 'weekly') return 'REPEATS WEEKLY'
  if (repeat === 'biweekly') return 'REPEATS BIWEEKLY'
  return `REPEATS ${match.label.toUpperCase()}`
}

function amenityLabelsFromHostEvent(event: HostEvent): string[] {
  const ids = event.amenities ?? []
  const labels: string[] = []
  for (const id of ids) {
    const primary = PRIMARY_AMENITIES.find((a) => a.id === id)
    if (primary) {
      labels.push(primary.label)
      continue
    }
    for (const group of Object.values(ADDITIONAL_AMENITIES)) {
      const extra = group.find((a) => a.id === id)
      if (extra) {
        labels.push(extra.label)
        break
      }
    }
  }
  return labels
}

function resolvePanelHeader(
  event: HostEvent,
  hostAccount: ReturnType<typeof getHostAccount> | null | undefined,
): string {
  const category = hostAccount?.category
  if (category) return `${category} Event`
  if (event.hostAccountId) return 'Community Event'
  return 'Personal Event'
}

function computeTicketStats(event: HostEvent): {
  goingCount: number
  ticketsRemaining?: number
  capacity?: number
  ticketsSoldPercent?: number
  atDoorAvailable: boolean
} {
  const tiers = event.ticketTiers ?? []
  const goingCount = tiers.reduce((sum, t) => sum + (t.sold ?? 0), 0)
  const atDoorAvailable = tiers.some((t) => t.availableAtDoor)
  const tierCapacity = tiers.reduce((sum, t) => sum + (t.quantity ?? 0), 0)
  const capacity = event.capacity ?? (tierCapacity > 0 ? tierCapacity : undefined)
  let ticketsRemaining: number | undefined
  let ticketsSoldPercent: number | undefined
  if (capacity && capacity > 0) {
    ticketsRemaining = Math.max(0, capacity - goingCount)
    ticketsSoldPercent = Math.min(100, Math.round((goingCount / capacity) * 100))
  }
  return { goingCount, ticketsRemaining, capacity, ticketsSoldPercent, atDoorAvailable }
}

function buildDiscoverTicketTiers(event: HostEvent): DiscoverTicketTier[] | undefined {
  const mode = resolveTicketingMode(event)
  if (mode === 'external') return undefined
  const tiers = event.ticketTiers ?? []
  if (tiers.length === 0) return undefined
  return tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    priceLabel: formatTierPrice(tier.priceCents),
    description: tier.description?.trim() || undefined,
    soldOut: tier.quantity != null && tier.sold >= tier.quantity,
    availableAtDoor: tier.availableAtDoor,
    quantity: tier.quantity,
    sold: tier.sold,
    priceCents: tier.priceCents,
  }))
}

function resolveDiscoverImages(primary: string, extras?: string[]): string[] {
  const photos = (extras ?? []).filter(Boolean).slice(0, 6)
  if (photos.length === 0) return [primary]
  if (!photos.includes(primary)) return [primary, ...photos].slice(0, 6)
  return photos
}

function resolveOrgHostAvatarUrl(orgId?: string): string | undefined {
  if (!orgId) return undefined
  return getOrgHostProfile(orgId).logoUrl?.trim() || undefined
}

function hostEventToDiscoverCard(event: HostEvent, index: number): DiscoverEvent {
  const hostAccount = event.hostAccountId ? getHostAccount(event.hostAccountId) : null
  const city = event.city ?? (hostAccount?.category === 'Community' ? 'Kindersley' : 'Saskatoon')
  const costLabel = getEventCostLabel(event)
  const primary = event.primaryCategory
    ? getCategoryById(event.primaryCategory as EventCategoryId)
    : null
  const hasHostAccount = !!hostAccount
  const hostLabel = event.departmentName
    ? `${hostAccount?.name ?? 'Organization'} · ${event.departmentName}`
    : hostAccount?.name ?? event.displayName ?? 'Personal host'
  const hostProfileUrl = getHostProfileUrlFromEvent(event) ?? undefined
  const primaryImage = event.photos?.[0] ?? HOST_EVENT_IMAGES[index % HOST_EVENT_IMAGES.length]
  const ticketingMode = resolveTicketingMode(event)
  const metrics = getEventMetrics(event.id)
  const ticketStats = computeTicketStats(event)
  const secondary = event.secondaryCategory
    ? getCategoryById(event.secondaryCategory as EventCategoryId)
    : null
  const mapsParts = [
    event.venueName,
    event.streetAddress,
    event.streetSuite,
    event.city,
    event.province,
    event.postalCode,
  ].filter(Boolean)
  const hostEventsCount = event.hostAccountId
    ? getHostEventsForOrg(event.hostAccountId).filter((e) => e.status !== 'draft').length
    : undefined

  return {
    id: `host-${event.id}`,
    title: event.title,
    city,
    image: primaryImage,
    images: resolveDiscoverImages(primaryImage, event.photos),
    badges: resolveHostEventDiscoverBadges(event),
    amenities: mapAmenities(event),
    amenityLabels: amenityLabelsFromHostEvent(event),
    dateTag: event.status === 'live' ? 'Live Now' : 'Upcoming',
    dateTime: formatEventDateTime(event),
    cost: costLabel,
    isRsvp: costLabel === 'RSVP',
    isWaitlist: costLabel === 'WAITLIST',
    isUnavailable: costLabel === 'UNAVAILABLE',
    hostEventId: event.id,
    hostAccountId: event.hostAccountId ?? undefined,
    ageRange: getAgeRestrictionLabel(event.ageRestriction),
    distance: '~15 mins away',
    categories: [
      ...(primary
        ? [{ label: primary.label, color: 'teal' as const, icon: 'party' as const }]
        : [
            {
              label: hostAccount?.category ?? 'Community',
              color: 'teal' as const,
              icon: 'party' as const,
            },
          ]),
      ...(secondary
        ? [{ label: secondary.label, color: 'purple' as const, icon: 'party' as const }]
        : []),
    ],
    locationDetail: mapsParts.join(', ') || undefined,
    venueName: event.venueName,
    streetAddress: event.streetAddress,
    visitDurationLabel: visitDurationLabel(event.visitDuration),
    repeatsLabel: repeatsLabel(event),
    multipleDates: hasMultipleDisplayDates(event),
    showDates: (() => {
      const dates = resolveTicketDates(event)
      return dates.length > 0 ? dates : undefined
    })(),
    panelHeader: resolvePanelHeader(event, hostAccount),
    borderColor: resolveHostEventDiscoverBorder(event),
    keywords: [...(event.customTags ?? []), ...(event.subCategories ?? [])],
    description: event.description?.trim() || undefined,
    hostLabel,
    hostProfileUrl,
    hostAvatarInitial: hostAccount?.logoInitial ?? event.displayName?.charAt(0)?.toUpperCase(),
    hostAvatarUrl: resolveOrgHostAvatarUrl(event.hostAccountId ?? undefined),
    hostEventCount: hostEventsCount,
    departmentName: event.departmentName,
    hasChecklist: event.checklist?.enabled,
    checklistMandatory: event.checklist?.mandatory,
    checklistItems: event.checklist?.enabled
      ? normalizeChecklist(event.checklist).items.filter((i) => i.type === 'single_pick')
      : undefined,
    actionLabel: getEventActionLabel(event),
    rsvpPath: `/event/${event.id}/rsvp`,
    externalTicketUrl: event.externalTicketUrl || undefined,
    ticketTiers: buildDiscoverTicketTiers(event),
    ticketingMode,
    goingCount: ticketStats.goingCount,
    savedCount: metrics.saves,
    viewCount: metrics.views,
    atDoorAvailable: ticketStats.atDoorAvailable,
    ticketsRemaining: ticketStats.ticketsRemaining,
    capacity: ticketStats.capacity,
    ticketsSoldPercent: ticketStats.ticketsSoldPercent,
    mapsQuery: mapsParts.join(', ') || undefined,
    amenityIds: event.amenities ?? [],
  }
}

/** Full Discover card for a host event — used when hosts preview their listing from Event Manager. */
export function buildDiscoverCardFromHostEvent(event: HostEvent): DiscoverEvent {
  return hostEventToDiscoverCard(event, 0)
}

function attractionToDiscoverCard(attraction: Attraction): DiscoverEvent {
  const badgeLabel =
    attraction.cardType === 'hidden-gem'
      ? ('HIDDEN GEM' as const)
      : ('ATTRACTION' as const)

  const mapsParts = [attraction.location.venue, attraction.location.city].filter(Boolean)
  const mapsQuery =
    attraction.location.lat != null && attraction.location.lng != null
      ? `${attraction.location.lat},${attraction.location.lng}`
      : mapsParts.join(', ') || undefined

  const sourceImages =
    attraction.images.length > 0 ? attraction.images : [DEFAULT_ATTRACTION_IMAGE]
  const rotatedImages = getRotatedAttractionImages(sourceImages, attraction.createdAt)
  const heroImage = rotatedImages[0] ?? DEFAULT_ATTRACTION_IMAGE
  const stale =
    attraction.cardType !== 'hidden-gem' && isAttractionStale(attraction.createdAt)

  return {
    id: `attraction-${attraction.id}`,
    title: attraction.title,
    city: attraction.location.city,
    image: heroImage,
    images: resolveDiscoverImages(heroImage, rotatedImages),
    badges: badgeLabel === 'HIDDEN GEM' ? ['HIDDEN GEM'] : ['ATTRACTION'],
    dateTag: formatAttractionPostedLabel(attraction, { includeStaleHint: true }),
    cost: normalizePriceLabel(attraction.priceLabel),
    distance: '~nearby',
    locationDetail: mapsParts.join(', ') || undefined,
    venueName: attraction.location.venue,
    mapsQuery,
    locationLat: attraction.location.lat,
    locationLng: attraction.location.lng,
    postedAt: attraction.createdAt,
    attractionStale: stale,
    categories: [
      {
        label:
          attraction.cardType === 'hidden-gem'
            ? getHiddenGemDisplayCategory(attraction.category || 'Entertainment')
            : attraction.category || 'Attraction',
        color: 'teal',
        icon: 'cart',
      },
    ],
    borderColor: getAttractionDiscoverBorderColor(attraction),
    cardKind: 'attraction',
    attractionId: attraction.id,
    keywords: attraction.tags,
    description: attraction.description?.trim() || undefined,
    actionLabel: 'Explore',
    ticketingMode: 'explore',
  }
}

export function hiddenGemToDiscoverEvent(gem: OrgHiddenGem): DiscoverEvent {
  const amenityIds = gem.amenities ?? []
  const org = getOrganization(gem.organizationId)
  const fullAddress = formatFullAddress(gem.location)
  const mapsQuery = fullAddress || gem.location.city
  return {
    id: `hidden-gem-${gem.id}`,
    title: gem.title,
    city: gem.location.city,
    image: gem.images[0] ?? DEFAULT_HIDDEN_GEM_IMAGE,
    images: resolveDiscoverImages(gem.images[0] ?? DEFAULT_HIDDEN_GEM_IMAGE, gem.images),
    badges: ['HIDDEN GEM'],
    amenityIds,
    amenityLabels: getHiddenGemAmenityLabels(amenityIds),
    cost: resolveHiddenGemPriceLabel(gem),
    distance: '~nearby',
    locationDetail: fullAddress || undefined,
    fullAddress: fullAddress || undefined,
    hiddenGemLocation: gem.location,
    streetAddress: gem.location.street1 || fullAddress || undefined,
    venueName: gem.location.venue,
    contacts: gem.contacts,
    phone: gem.phone ?? gem.contacts?.find((c) => c.phone)?.phone,
    website: gem.website,
    hoursDescription: gem.hoursDescription,
    menu: gem.menu,
    reviewLinks: gem.reviewLinks?.length ? gem.reviewLinks : undefined,
    mapsQuery,
    categories: [
      {
        label: getHiddenGemDisplayCategory(gem.category),
        color: 'teal',
        icon: 'cart',
      },
    ],
    borderColor: 'gold',
    cardKind: 'attraction',
    attractionId: gem.id,
    keywords: gem.tags,
    description: gem.description?.trim() || undefined,
    actionLabel: 'Explore',
    ticketingMode: 'explore',
    organizationId: gem.organizationId,
    weeklyHours: gem.weeklyHours,
    agePolicy: gem.agePolicy,
    ageRange: getAgePolicyLabel(gem.agePolicy),
    doorPayment: gem.doorPayment,
    atmOnSite: gem.atmOnSite,
    locationLat: gem.location.lat,
    locationLng: gem.location.lng,
    hostLabel: org?.name,
    hostProfileUrl: org ? getOrgPublicProfileUrl(gem.organizationId) : undefined,
    hostAvatarInitial: org?.logoInitial?.trim() || org?.name?.trim()?.charAt(0),
    hostAvatarUrl: resolveOrgHostAvatarUrl(gem.organizationId),
  }
}

/** Static sample card for landing Hidden Gems preview (`/discover?preview=hidden-gem`). */
export const PREVIEW_HIDDEN_GEM_CARD: DiscoverEvent = {
  id: 'preview-hidden-gem',
  title: 'Emerald Lounge Kindersley Fine Dining & Entertainment Co.',
  city: 'Kindersley',
  image: DEFAULT_HIDDEN_GEM_IMAGE,
  images: [DEFAULT_HIDDEN_GEM_IMAGE],
  badges: ['HIDDEN GEM'],
  amenityIds: ['bar', 'washroom', 'food', 'patio', 'parking', 'wifi', 'kid_friendly'],
  amenityLabels: getHiddenGemAmenityLabels([
    'bar',
    'washroom',
    'food',
    'patio',
    'parking',
    'wifi',
    'kid_friendly',
  ]),
  cost: 'From $35',
  distance: '~2 blocks away',
  venueName: 'Downtown Clay Studio',
  locationDetail: 'Downtown Clay Studio, Kindersley',
  categories: [{ label: 'Food & Drink', color: 'teal', icon: 'cart' }],
  borderColor: 'gold',
  cardKind: 'attraction',
  description:
    'A full-time pottery studio with drop-in wheel sessions, gallery sales, and evening classes. The kind of place locals love but never shows up in a generic search.',
  actionLabel: 'Explore',
  ticketingMode: 'explore',
  organizationId: 'org_demo_kindersley',
  hostLabel: 'Kindersley Events Co.',
  hostProfileUrl: '/host/view/org_demo_kindersley',
  hostAvatarInitial: 'K',
  agePolicy: '21_plus',
  ageRange: '21+',
  locationLat: 51.4678,
  locationLng: -109.1569,
  weeklyHours: {
    sunday: 'closed',
    monday: { open: '10:00', close: '18:00' },
    tuesday: { open: '10:00', close: '18:00' },
    wednesday: { open: '10:00', close: '18:00' },
    thursday: { open: '10:00', close: '18:00' },
    friday: { open: '10:00', close: '18:00' },
    saturday: { open: '10:00', close: '16:00' },
  },
}

const LANDING_TRUSTED_HOST_IMAGE =
  EVENT_COVER_STOCK_IMAGES.find((img) => img.id === 'festival-lights')?.url ??
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'

const LANDING_HIDDEN_GEM_RESTAURANT_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'

const LANDING_ATTRACTION_TRAIL_IMAGE =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80'

/** Landing organizer section — Trusted Host event as it appears in the swipe deck. */
export const LANDING_DECK_TRUSTED_HOST_CARD: DiscoverEvent = {
  id: 'landing-deck-trusted-host',
  title: 'Sunday Brunch',
  city: 'Kindersley',
  image: LANDING_TRUSTED_HOST_IMAGE,
  badges: ['TRUSTED HOST'],
  amenityIds: [
    'food-drink',
    'alcohol',
    'bathrooms',
    'parking',
    'wheelchair',
    'wifi',
    'outdoor-seating',
  ],
  dateTag: 'This Thursday',
  dateTime: 'Jul 23, 4:00 PM',
  cost: 'From $15',
  ageRange: 'All Ages',
  distance: '~2 mins away',
  venueName: 'Norman Ritchie Centre',
  description:
    'Kick off summer in downtown Kindersley with live music, local vendors, food trucks, and family activities.',
  categories: [
    { label: 'Music Festivals', color: 'purple', icon: 'party' },
    { label: 'Arts & Culture', color: 'teal', icon: 'party' },
  ],
  borderColor: 'blue',
  hostLabel: 'Wellness Studio',
  hostAvatarInitial: 'W',
  actionLabel: 'Get Tickets',
  ticketingMode: 'sell',
  goingCount: 70,
  ticketsRemaining: 380,
}

/** Landing organizer section — Hidden Gem restaurant sample (gold deck border). */
export const LANDING_DECK_HIDDEN_GEM_CARD: DiscoverEvent = {
  id: 'landing-deck-hidden-gem',
  title: 'The Harvest Table',
  city: 'Kindersley',
  image: LANDING_HIDDEN_GEM_RESTAURANT_IMAGE,
  images: [LANDING_HIDDEN_GEM_RESTAURANT_IMAGE],
  badges: ['HIDDEN GEM'],
  amenityIds: ['food', 'bar', 'patio', 'parking', 'wifi'],
  amenityLabels: getHiddenGemAmenityLabels(['food', 'bar', 'patio', 'parking', 'wifi']),
  cost: 'From $18',
  distance: '~3 blocks away',
  venueName: 'The Harvest Table',
  locationDetail: 'The Harvest Table, Kindersley',
  categories: [{ label: 'Food & Drink', color: 'teal', icon: 'cart' }],
  borderColor: 'gold',
  cardKind: 'attraction',
  description:
    'Farm-to-table dining with a seasonal menu, local wine list, and a patio that stays open late on summer weekends.',
  actionLabel: 'Explore',
  ticketingMode: 'explore',
  hostLabel: 'Harvest Table Co.',
  hostAvatarInitial: 'H',
  weeklyHours: {
    sunday: 'closed',
    monday: { open: '11:00', close: '21:00' },
    tuesday: { open: '11:00', close: '21:00' },
    wednesday: { open: '11:00', close: '21:00' },
    thursday: { open: '11:00', close: '22:00' },
    friday: { open: '11:00', close: '22:00' },
    saturday: { open: '10:00', close: '22:00' },
  },
}

/** Landing organizer section — Attraction trail sample (partner-pink deck border). */
export const LANDING_DECK_ATTRACTION_CARD: DiscoverEvent = {
  id: 'landing-deck-attraction',
  title: 'Kindersley Riverbank Trail',
  city: 'Kindersley',
  image: LANDING_ATTRACTION_TRAIL_IMAGE,
  images: [LANDING_ATTRACTION_TRAIL_IMAGE],
  badges: ['ATTRACTION'],
  dateTag: 'Always On',
  cost: 'Free',
  distance: '~12 mins away',
  venueName: 'Riverbank Trailhead',
  locationDetail: 'Riverbank Trailhead, Kindersley',
  categories: [{ label: 'Outdoors', color: 'teal', icon: 'cart' }],
  borderColor: 'pink',
  cardKind: 'attraction',
  description:
    'A scenic riverside path with lookout points, easy grades for families, and wildflower meadows in early summer.',
  actionLabel: 'Explore',
  ticketingMode: 'explore',
}

/** Resolve a report target id to a discover deck card (static seed, host-backed, gem, or attraction). */
export function findDiscoverEventByTargetId(
  targetId: string | undefined | null,
): DiscoverEvent | undefined {
  if (!targetId?.trim()) return undefined
  const id = targetId.trim()
  const hostStripped = id.startsWith('host-') ? id.slice(5) : id

  const secretStripped = id.startsWith('secret-') ? id.slice(7) : id
  const attractionStripped = id.startsWith('attraction-') ? id.slice(11) : id
  const attraction =
    getAttractionById(attractionStripped) ??
    getAttractionById(secretStripped) ??
    getAttractionById(id)
  if (attraction) {
    return attractionToDiscoverCard(attraction)
  }

  return getDiscoverEventsPool().find(
    (event) =>
      event.id === id ||
      event.id === hostStripped ||
      event.hostEventId === id ||
      event.hostEventId === hostStripped ||
      event.attractionId === id ||
      event.attractionId === secretStripped ||
      event.attractionId === attractionStripped,
  )
}

export function getDiscoverEventDeepLink(
  event: DiscoverEvent,
  options?: { adminReturnTo?: string },
): string {
  const params = new URLSearchParams({ event: event.id })
  const returnTo = parseAdminDiscoverReturnTo(options?.adminReturnTo ?? null)
  if (returnTo) {
    params.set('from', 'admin')
    params.set('returnTo', returnTo)
  }
  return `/discover?${params.toString()}`
}

/** Safe admin-only return path for Discover preview banners. */
export function parseAdminDiscoverReturnTo(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const path = raw.trim()
  if (!path.startsWith('/admin') || path.includes('://')) return null
  return path
}

/** Static seed cards plus live public host events, attractions, and secret list for the card deck. */
export function getDiscoverEventsPool(keyword?: string): DiscoverEvent[] {
  const hostEvents = getPublicHostEventsForDiscover().map(hostEventToDiscoverCard)
  const deckAttractions = getPublicDeckAttractions()
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .map(attractionToDiscoverCard)
  const secretPublic = getPublicSecretAttractions()
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .map(attractionToDiscoverCard)
  const secretHidden =
    keyword?.trim() ?
      getHiddenSecretAttractions()
        .filter((item) => attractionMatchesSecretKeyword(item, keyword))
        .map(attractionToDiscoverCard)
    : []
  const orgHiddenGems = getPublicOrgHiddenGems()
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .map(hiddenGemToDiscoverEvent)
  const hostBackedCheckoutIds = new Set(
    hostEvents.map((card) => card.hostEventId).filter(Boolean) as string[],
  )
  const staticEvents = DISCOVER_EVENTS.map(enrichDiscoverEventTickets).filter((card) => {
    const checkoutId = card.hostEventId ?? card.id
    return !hostBackedCheckoutIds.has(checkoutId)
  })

  const pool = [
    ...secretHidden,
    ...secretPublic,
    ...orgHiddenGems,
    ...deckAttractions,
    ...hostEvents,
    ...staticEvents,
  ].filter(
    (event) =>
      !isRemovedDemoHostEvent(event) &&
      !isRemovedDemoHostEventId(event.hostEventId) &&
      !isEventHiddenFromDiscover(event.id) &&
      !isEventHiddenFromDiscover(event.hostEventId),
  )
  return filterDiscoverPoolByKeyword(pool, keyword)
}

export function filterDiscoverPoolByKeyword(pool: DiscoverEvent[], keyword?: string): DiscoverEvent[] {
  const q = keyword?.trim().toLowerCase()
  if (!q) return pool
  return pool.filter((event) => {
    if (event.title.toLowerCase().includes(q)) return true
    if (event.city.toLowerCase().includes(q)) return true
    if (event.keywords?.some((tag) => tag.toLowerCase().includes(q))) return true
    if (event.categories?.some((c) => c.label.toLowerCase().includes(q))) return true
    return false
  })
}

export type DiscoverQuickPick = 'food' | 'entertainment' | 'poi'

/** Map My Tudu / search URL category params to quick-pick filters. */
export function resolveQuickPickFromCategoryParam(category: string | null): DiscoverQuickPick | null {
  if (!category) return null
  const normalized = category.trim().toLowerCase()
  if (normalized === 'food' || normalized === 'food-drink') return 'food'
  if (normalized === 'entertainment') return 'entertainment'
  if (normalized === 'poi' || normalized === 'points-of-interest') return 'poi'
  return null
}

export function filterDiscoverPoolByQuickPick(
  pool: DiscoverEvent[],
  pick: DiscoverQuickPick,
): DiscoverEvent[] {
  switch (pick) {
    case 'food':
      return pool.filter(
        (event) =>
          event.amenities?.includes('food') ||
          event.amenityIds?.includes('food-drink') ||
          event.categories?.some((c) => /food|drink|dining|restaurant/i.test(c.label)) ||
          event.keywords?.some((k) => /food|drink|dining|restaurant|tasting/i.test(k)),
      )
    case 'entertainment':
      return pool.filter(
        (event) =>
          event.categories?.some((c) =>
            /music|entertainment|gaming|nightlife|theatre|show|concert|party/i.test(c.label),
          ) ||
          event.keywords?.some((k) =>
            /entertainment|concert|show|gaming|music|comedy|dance/i.test(k),
          ) ||
          (event.badges?.includes('HIDDEN GEM') &&
            !event.amenities?.includes('food') &&
            !event.amenityIds?.includes('food-drink')),
      )
    case 'poi':
      return pool.filter(
        (event) =>
          event.cardKind === 'attraction' ||
          event.badges?.includes('ATTRACTION') ||
          event.categories?.some((c) =>
            /outdoor|adventure|attraction|landmark|museum|nature|heritage/i.test(c.label),
          ),
      )
  }
}
