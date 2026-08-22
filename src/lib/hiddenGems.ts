import { getHostEvents, type HostEvent } from './account'
import { getAttractions, type Attraction } from './attractions'
import { findCityByName, formatCityLabel, getCurrentCity } from './location'
import { canCreateHiddenGem, hiddenGemBlockMessage } from './hiddenGemSlots'
import { getStoredEventMetrics } from './eventMetricsStore'
import { hiddenGemDiscoverId } from './hiddenGemIds'
import { formatRelativeTime } from './adminAnalytics'
import { normalizeAmenityIds } from './amenities'
import type { DoorPaymentMode } from './eventDoorPayment'
import { doorPaymentAcceptsCash } from './eventDoorPayment'
import { normalizeWebsiteUrl } from './websiteUrl'
import { normalizeLatLng, validateLatLng } from './geoCoordinates'

const HIDDEN_GEMS_KEY = 'tudu-hidden-gems'

export type HiddenGemVisibility = 'public' | 'private'

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

export type DayHoursEntry =
  | 'closed'
  | {
      open: string
      close: string
      closed?: boolean
      dayNote?: string
    }

export type WeeklyHours = Record<DayOfWeek, DayHoursEntry>

export const HIDDEN_GEM_CONTACT_PRESETS = [
  'Front desk',
  'Ordering',
  'Take out',
  'Reservations',
  'General',
] as const

export type HiddenGemContactPreset = (typeof HIDDEN_GEM_CONTACT_PRESETS)[number]

export interface HiddenGemContact {
  id: string
  label: string
  phone?: string
  email?: string
  note?: string
}

export const HIDDEN_GEM_REVIEW_LINK_PRESETS = [
  { id: 'google', label: 'Google Reviews' },
  { id: 'yelp', label: 'Yelp' },
  { id: 'tripadvisor', label: 'TripAdvisor' },
  { id: 'restaurant_guru', label: 'Restaurant Guru' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'other', label: 'Other' },
] as const

export type HiddenGemReviewLinkPreset = (typeof HIDDEN_GEM_REVIEW_LINK_PRESETS)[number]['id']

export interface HiddenGemReviewLink {
  id: string
  preset: HiddenGemReviewLinkPreset
  /** Custom label when preset is `other`. */
  label?: string
  url: string
}

export const MAX_HIDDEN_GEM_REVIEW_LINKS = 2

export type HiddenGemHoursStatus = 'open_soon' | 'open' | 'closing_soon' | 'closed'

export type AgePolicy = 'all_ages' | 'family' | '18_plus' | '21_plus'

export const AGE_POLICY_OPTIONS: { value: AgePolicy; label: string }[] = [
  { value: 'all_ages', label: 'All ages' },
  { value: 'family', label: 'Family' },
  { value: '18_plus', label: '18+' },
  { value: '21_plus', label: '21+' },
]

export const HIDDEN_GEM_CATEGORIES = [
  { id: 'food_drink', label: 'Food & Drink' },
  { id: 'entertainment', label: 'Entertainment' },
] as const

export type HiddenGemCategoryId = (typeof HIDDEN_GEM_CATEGORIES)[number]['id']
export type HiddenGemCategoryLabel = (typeof HIDDEN_GEM_CATEGORIES)[number]['label']

export const DEFAULT_HIDDEN_GEM_CATEGORY: HiddenGemCategoryLabel = 'Food & Drink'

const HIDDEN_GEM_CATEGORY_BY_ID = new Map<HiddenGemCategoryId, HiddenGemCategoryLabel>(
  HIDDEN_GEM_CATEGORIES.map((c) => [c.id, c.label]),
)

/** Map legacy or unknown categories to Food & Drink or Entertainment. */
export function normalizeHiddenGemCategory(category: string): HiddenGemCategoryLabel {
  const trimmed = category.trim()
  if (!trimmed) return DEFAULT_HIDDEN_GEM_CATEGORY

  const exact = HIDDEN_GEM_CATEGORIES.find(
    (c) => c.label.toLowerCase() === trimmed.toLowerCase(),
  )
  if (exact) return exact.label

  const normalizedId = trimmed.toLowerCase().replace(/[\s-]+/g, '_')
  const byId = HIDDEN_GEM_CATEGORIES.find((c) => c.id === normalizedId)
  if (byId) return byId.label

  const lower = trimmed.toLowerCase()
  if (
    lower.includes('food') ||
    lower.includes('drink') ||
    lower.includes('nightlife') ||
    lower.includes('restaurant') ||
    lower.includes('dining') ||
    lower.includes('bar') ||
    lower.includes('cafe') ||
    lower.includes('coffee')
  ) {
    return 'Food & Drink'
  }

  return 'Entertainment'
}

export function getHiddenGemCategoryLabelById(id: HiddenGemCategoryId): HiddenGemCategoryLabel {
  return HIDDEN_GEM_CATEGORY_BY_ID.get(id) ?? DEFAULT_HIDDEN_GEM_CATEGORY
}

/** Minutes before open/close to show "open soon" / "closing soon". */
export const HOURS_SOON_THRESHOLD_MINUTES = 45

export const DAY_OF_WEEK_KEYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
}

export interface HiddenGemLocation {
  street1: string
  street2?: string
  city: string
  region: string
  postalCode: string
  country: string
  /** Legacy single-line address — migrated to structured fields. */
  fullAddress?: string
  venue?: string
  lat?: number
  lng?: number
}

export const DEFAULT_HIDDEN_GEM_COUNTRY = 'Canada'

export function defaultHiddenGemLocation(): HiddenGemLocation {
  return {
    street1: '',
    street2: '',
    city: '',
    region: '',
    postalCode: '',
    country: DEFAULT_HIDDEN_GEM_COUNTRY,
  }
}

export function generateHiddenGemContactId(): string {
  return `hgcontact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function generateHiddenGemReviewLinkId(): string {
  return `hgrl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function getHiddenGemReviewLinkLabel(
  link: Pick<HiddenGemReviewLink, 'preset' | 'label'>,
): string {
  if (link.preset === 'other') return link.label?.trim() || 'Reviews'
  return HIDDEN_GEM_REVIEW_LINK_PRESETS.find((p) => p.id === link.preset)?.label ?? 'Reviews'
}

export function normalizeHiddenGemReviewLinks(links?: HiddenGemReviewLink[]): HiddenGemReviewLink[] {
  if (!links?.length) return []
  return links
    .map((link) => {
      const raw = link.url?.trim() ?? ''
      const url = raw ? normalizeWebsiteUrl(raw) || raw : ''
      return {
        id: link.id || generateHiddenGemReviewLinkId(),
        preset: link.preset ?? 'google',
        label: link.label?.trim() || undefined,
        url,
      }
    })
    .filter((link) => link.url)
    .slice(0, MAX_HIDDEN_GEM_REVIEW_LINKS)
}

export function isDayClosed(entry: DayHoursEntry | undefined): boolean {
  if (!entry) return true
  if (entry === 'closed') return true
  return !!entry.closed
}

export function normalizeDayHoursEntry(entry: DayHoursEntry | undefined): {
  open: string
  close: string
  closed?: boolean
  dayNote?: string
} {
  if (!entry || entry === 'closed') {
    return { open: '09:00', close: '17:00', closed: true }
  }
  return entry
}

/** Best-effort parse of legacy comma-separated fullAddress. */
export function parseLegacyFullAddress(fullAddress: string): Partial<HiddenGemLocation> {
  const trimmed = fullAddress.trim()
  if (!trimmed) return {}

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    const regionPostal = parts[parts.length - 1] ?? ''
    const regionMatch = regionPostal.match(/^([A-Za-z]{2,3})\s*(.*)$/)
    return {
      street1: parts.slice(0, -2).join(', '),
      city: parts[parts.length - 2] ?? '',
      region: regionMatch?.[1] ?? regionPostal,
      postalCode: regionMatch?.[2]?.trim() ?? '',
      country: DEFAULT_HIDDEN_GEM_COUNTRY,
    }
  }
  if (parts.length === 2) {
    return {
      street1: parts[0] ?? '',
      city: parts[1] ?? '',
      country: DEFAULT_HIDDEN_GEM_COUNTRY,
    }
  }
  return { street1: trimmed, country: DEFAULT_HIDDEN_GEM_COUNTRY }
}

export function formatFullAddress(location: Pick<
  HiddenGemLocation,
  'street1' | 'street2' | 'city' | 'region' | 'postalCode' | 'country' | 'fullAddress'
>): string {
  if (location.street1?.trim()) {
    const regionPostal = [location.region?.trim(), location.postalCode?.trim()]
      .filter(Boolean)
      .join(' ')
    const cityLine = [location.city?.trim(), regionPostal].filter(Boolean).join(', ')
    return [
      location.street1.trim(),
      location.street2?.trim(),
      cityLine,
      location.country?.trim(),
    ]
      .filter(Boolean)
      .join(', ')
  }

  return location.fullAddress?.trim() ?? ''
}

export function formatFullAddressMultiline(
  location: Pick<
    HiddenGemLocation,
    'street1' | 'street2' | 'city' | 'region' | 'postalCode' | 'country' | 'fullAddress'
  >,
): string[] {
  if (location.street1?.trim()) {
    const lines: string[] = [location.street1.trim()]
    if (location.street2?.trim()) lines.push(location.street2.trim())
    const regionPostal = [location.region?.trim(), location.postalCode?.trim()]
      .filter(Boolean)
      .join(' ')
    const cityLine = [location.city?.trim(), regionPostal].filter(Boolean).join(', ')
    if (cityLine) lines.push(cityLine)
    if (location.country?.trim()) lines.push(location.country.trim())
    return lines
  }

  const legacy = location.fullAddress?.trim()
  return legacy ? [legacy] : []
}

export interface HiddenGemMetrics {
  views?: number
  saves?: number
  shares?: number
}

export interface OrgHiddenGem {
  id: string
  organizationId: string
  title: string
  description: string
  /** Optional venue details — menus, showtimes, pricing, etc.; spacing preserved on display. */
  menu?: string
  images: string[]
  location: HiddenGemLocation
  category: string
  tags: string[]
  cardType: 'hidden-gem'
  borderType: 'hidden-gem' | 'gold'
  visibility: HiddenGemVisibility
  /** Saved listing active for the org (box). */
  published: boolean
  /** Live on the public Discover card deck. */
  publishedToDeck?: boolean
  featured: boolean
  /** Engagement stats shown on Event Manager cards. */
  metrics?: HiddenGemMetrics
  promoCode?: string
  /** Amenity ids — same set as event creation (food-drink, parking, patio, …). */
  amenities?: string[]
  /** On-site payment options — same as host event creation. */
  doorPayment?: DoorPaymentMode
  /** Typical price shown on Discover cards — e.g. "$35", "From $15", "Free". */
  priceLabel?: string
  /** ATM on site when cash is accepted. */
  atmOnSite?: boolean
  /** Per-day operating hours for open/closed status on Discover cards. */
  weeklyHours?: WeeklyHours
  /** Free-text hours notes (e.g. "Closed Mondays", "Kitchen closes at 9pm"). */
  hoursDescription?: string
  /** Labeled contact lines (front desk, ordering, etc.). */
  contacts?: HiddenGemContact[]
  /** Legacy single phone — migrated to contacts[0] as General. */
  phone?: string
  /** Public website URL. */
  website?: string
  /** Optional third-party review page links (Google, Restaurant Guru, etc.). */
  reviewLinks?: HiddenGemReviewLink[]
  /** Age restriction shown on Discover detail panel. */
  agePolicy?: AgePolicy
  createdAt: string
  /** ISO — set on every Save / Save update. */
  updatedAt?: string
  /** ISO — set on Publish / Publish update to Discover deck. */
  publishedToDeckAt?: string
  createdByAdminId?: string
}

export type HiddenGemInput = Omit<OrgHiddenGem, 'id' | 'createdAt' | 'cardType' | 'borderType'> & {
  id?: string
}

export type HiddenGemListItem = OrgHiddenGem & {
  source: 'org-hidden-gem' | 'host-event' | 'attraction'
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function generateId(): string {
  return `hgem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const DEMO_ORG_ID = 'org_demo_kindersley'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getAgePolicyLabel(policy?: AgePolicy): string {
  return AGE_POLICY_OPTIONS.find((o) => o.value === policy)?.label ?? 'All ages'
}

/** Canonical category label for hidden gem cards and detail panels. */
export function getHiddenGemDisplayCategory(category: string): HiddenGemCategoryLabel {
  return normalizeHiddenGemCategory(category)
}

export function getGoogleMapsUrl(query: string, lat?: number, lng?: number): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** Phase 1 distance from user home/travel city or gem lat/lng when available. */
export function getDistanceFromUser(
  gem: Pick<OrgHiddenGem, 'location'>,
  userCity?: string,
): string {
  const user = userCity ?? getCurrentCity()
  const userCoords = findCityByName(formatCityLabel(user))

  const gemLat = gem.location.lat
  const gemLng = gem.location.lng

  if (gemLat != null && gemLng != null && userCoords) {
    const km = haversineKm(userCoords.lat, userCoords.lng, gemLat, gemLng)
    if (km < 1) return `${Math.round(km * 1000)} m away`
    return `${km.toFixed(1)} km away`
  }

  const gemCity = findCityByName(gem.location.city)
  if (userCoords && gemCity) {
    const km = haversineKm(userCoords.lat, userCoords.lng, gemCity.lat, gemCity.lng)
    return `${km.toFixed(1)} km away`
  }

  return '— km'
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function getDayKey(date: Date): DayOfWeek {
  return DAY_OF_WEEK_KEYS[date.getDay()]
}

function defaultWeeklyHours(
  open: string,
  close: string,
  closedDays: DayOfWeek[] = [],
): WeeklyHours {
  return DAY_OF_WEEK_KEYS.reduce((acc, day) => {
    acc[day] = closedDays.includes(day)
      ? { open, close, closed: true }
      : { open, close }
    return acc
  }, {} as WeeklyHours)
}

export function getHiddenGemHoursStatus(
  gem: Pick<OrgHiddenGem, 'weeklyHours'>,
  now: Date = new Date(),
  soonMinutes: number = HOURS_SOON_THRESHOLD_MINUTES,
): HiddenGemHoursStatus {
  const hours = gem.weeklyHours
  if (!hours) return 'closed'

  const dayHours = hours[getDayKey(now)]
  if (!dayHours || isDayClosed(dayHours)) return 'closed'

  const entry = normalizeDayHoursEntry(dayHours)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = parseTimeToMinutes(entry.open)
  let closeMinutes = parseTimeToMinutes(entry.close)

  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60
  }

  let adjustedCurrent = currentMinutes
  if (closeMinutes > 24 * 60 && currentMinutes < openMinutes) {
    adjustedCurrent += 24 * 60
  }

  if (adjustedCurrent >= openMinutes && adjustedCurrent < closeMinutes) {
    if (closeMinutes - adjustedCurrent <= soonMinutes) return 'closing_soon'
    return 'open'
  }

  if (adjustedCurrent < openMinutes) {
    const minsUntilOpen = openMinutes - adjustedCurrent
    if (minsUntilOpen <= soonMinutes) return 'open_soon'
  }

  return 'closed'
}

export function getHiddenGemHoursStatusLabel(status: HiddenGemHoursStatus): string {
  switch (status) {
    case 'open_soon':
      return 'Open soon'
    case 'open':
      return 'Open'
    case 'closing_soon':
      return 'Closing soon'
    case 'closed':
      return 'Closed'
  }
}

export function getHiddenGemHoursStatusBadgeClass(status: HiddenGemHoursStatus): string {
  switch (status) {
    case 'open':
      return 'bg-success/90 text-white'
    case 'open_soon':
    case 'closing_soon':
      return 'bg-amber-400/95 text-midnight'
    case 'closed':
      return 'bg-white/15 text-white/70 ring-1 ring-white/20'
  }
}

export function formatDayHoursEntry(entry: DayHoursEntry, includeNote = false): string {
  if (isDayClosed(entry)) {
    const note = getDayHoursNote(entry)
    if (includeNote && note) return `Closed — ${note}`
    return 'Closed'
  }

  const normalized = normalizeDayHoursEntry(entry)
  const hours = `${formatTime12h(normalized.open)} – ${formatTime12h(normalized.close)}`
  if (includeNote) {
    const note = normalized.dayNote?.trim()
    if (note) return `${hours} — ${note}`
  }
  return hours
}

export function getDayHoursNote(entry: DayHoursEntry | undefined): string | undefined {
  if (!entry || entry === 'closed') return undefined
  const note = entry.dayNote?.trim()
  return note || undefined
}

export function resolveDayHoursDisplay(entry: DayHoursEntry | undefined): {
  timeLabel: string
  note?: string
} {
  if (!entry) return { timeLabel: 'Hours not provided' }
  return {
    timeLabel: formatDayHoursEntry(entry, false),
    note: getDayHoursNote(entry),
  }
}

export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr ?? '0', 10)
  const m = mStr ?? '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

/** Convert host AddHiddenGemPage day toggles into weeklyHours storage. */
export function buildWeeklyHoursFromForm(
  days: Record<
    string,
    { open: boolean; openTime: string; closeTime: string }
  >,
  dayNameToKey: Record<string, DayOfWeek>,
): WeeklyHours {
  return DAY_OF_WEEK_KEYS.reduce((acc, key) => {
    const label = Object.entries(dayNameToKey).find(([, v]) => v === key)?.[0]
    const day = label ? days[label] : undefined
    acc[key] =
      day?.open === false
        ? { open: day?.openTime ?? '09:00', close: day?.closeTime ?? '17:00', closed: true }
        : { open: day?.openTime ?? '09:00', close: day?.closeTime ?? '17:00' }
    return acc
  }, {} as WeeklyHours)
}

export const HIDDEN_GEM_DAY_NAME_TO_KEY: Record<string, DayOfWeek> = {
  Sunday: 'sunday',
  Monday: 'monday',
  Tuesday: 'tuesday',
  Wednesday: 'wednesday',
  Thursday: 'thursday',
  Friday: 'friday',
  Saturday: 'saturday',
}

function migrateHiddenGemLocation(location: HiddenGemLocation): HiddenGemLocation {
  if (location.street1?.trim()) {
    return {
      ...defaultHiddenGemLocation(),
      ...location,
      street1: location.street1.trim(),
      street2: location.street2?.trim() || undefined,
      city: location.city.trim(),
      region: location.region?.trim() ?? '',
      postalCode: location.postalCode?.trim() ?? '',
      country: location.country?.trim() || DEFAULT_HIDDEN_GEM_COUNTRY,
    }
  }

  const legacy =
    location.fullAddress?.trim() ||
    [location.venue, location.city].filter(Boolean).join(', ') ||
    location.city?.trim() ||
    ''

  const parsed = parseLegacyFullAddress(legacy)
  return {
    ...defaultHiddenGemLocation(),
    ...location,
    street1: parsed.street1 ?? legacy,
    street2: parsed.street2,
    city: parsed.city ?? location.city?.trim() ?? '',
    region: parsed.region ?? '',
    postalCode: parsed.postalCode ?? '',
    country: parsed.country ?? DEFAULT_HIDDEN_GEM_COUNTRY,
    fullAddress: legacy || undefined,
  }
}

function migrateHiddenGemContacts(gem: OrgHiddenGem): HiddenGemContact[] | undefined {
  if (gem.contacts?.length) {
    return gem.contacts.map((c) => ({
      ...c,
      id: c.id || generateHiddenGemContactId(),
      label: c.label.trim() || 'General',
      phone: c.phone?.trim() || undefined,
      email: c.email?.trim() || undefined,
      note: c.note?.trim() || undefined,
    }))
  }

  if (gem.phone?.trim()) {
    return [{ id: generateHiddenGemContactId(), label: 'General', phone: gem.phone.trim() }]
  }

  return undefined
}

function migrateWeeklyHours(hours: WeeklyHours | undefined): WeeklyHours {
  const base = hours ?? defaultWeeklyHours('10:00', '18:00', ['sunday'])
  return DAY_OF_WEEK_KEYS.reduce((acc, day) => {
    const entry = base[day]
    if (!entry || entry === 'closed') {
      acc[day] = { open: '10:00', close: '18:00', closed: true }
    } else if (entry.closed) {
      acc[day] = {
        open: entry.open || '10:00',
        close: entry.close || '18:00',
        closed: true,
        dayNote: entry.dayNote?.trim() || undefined,
      }
    } else {
      acc[day] = {
        open: entry.open || '10:00',
        close: entry.close || '18:00',
        dayNote: entry.dayNote?.trim() || undefined,
      }
    }
    return acc
  }, {} as WeeklyHours)
}

const HIDDEN_GEM_DEMO_PRICE_DEFAULTS: Record<string, string> = {
  hgem_demo_clay_studio: 'From $35',
  hgem_demo_emerald_lounge: 'From $12',
}

/** Trim and validate a host-entered price label for Discover cards. */
export function normalizePriceLabel(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim()
  return trimmed || undefined
}

export function resolveHiddenGemPriceLabel(
  gem: Pick<OrgHiddenGem, 'id' | 'priceLabel'>,
): string | undefined {
  return normalizePriceLabel(gem.priceLabel) ?? HIDDEN_GEM_DEMO_PRICE_DEFAULTS[gem.id]
}

function migrateHiddenGemPriceLabel(gem: OrgHiddenGem): string | undefined {
  return resolveHiddenGemPriceLabel(gem)
}

function migrateHiddenGemDoorPayment(gem: OrgHiddenGem): Pick<OrgHiddenGem, 'amenities' | 'doorPayment' | 'atmOnSite'> {
  const rawAmenities = gem.amenities ?? []
  const hadCashAmenity = rawAmenities.includes('cash')
  const hadAtmAmenity = rawAmenities.includes('atm')
  const amenities = normalizeAmenityIds(rawAmenities.filter((id) => id !== 'cash' && id !== 'atm'))

  if (gem.doorPayment) {
    return {
      amenities,
      doorPayment: gem.doorPayment,
      atmOnSite: gem.atmOnSite ?? (hadAtmAmenity || undefined),
    }
  }

  if (!hadCashAmenity && !hadAtmAmenity) {
    return { amenities }
  }

  return {
    amenities,
    doorPayment: 'cash',
    atmOnSite: hadAtmAmenity || gem.atmOnSite || undefined,
  }
}

function migrateOrgHiddenGem(gem: OrgHiddenGem): OrgHiddenGem {
  const location = migrateHiddenGemLocation(gem.location)
  const contacts = migrateHiddenGemContacts(gem)
  const primaryPhone = contacts?.[0]?.phone ?? gem.phone
  const publishedToDeck = gem.publishedToDeck ?? gem.published
  const updatedAt = gem.updatedAt ?? gem.createdAt ?? new Date().toISOString()
  const publishedToDeckAt =
    gem.publishedToDeckAt ?? (publishedToDeck ? updatedAt : undefined)
  const payment = migrateHiddenGemDoorPayment(gem)

  return {
    ...gem,
    category: normalizeHiddenGemCategory(gem.category),
    amenities: payment.amenities,
    doorPayment: payment.doorPayment,
    atmOnSite: payment.atmOnSite,
    reviewLinks: normalizeHiddenGemReviewLinks(gem.reviewLinks),
    weeklyHours: migrateWeeklyHours(gem.weeklyHours),
    hoursDescription: gem.hoursDescription ?? '',
    agePolicy: gem.agePolicy ?? 'all_ages',
    location,
    contacts,
    phone: primaryPhone,
    publishedToDeck,
    published: publishedToDeck,
    updatedAt,
    publishedToDeckAt,
    priceLabel: migrateHiddenGemPriceLabel(gem),
  }
}

/** Saved after last publish — deck listing is stale until host publishes update. */
export function hasPendingDeckUpdate(
  gem: Pick<OrgHiddenGem, 'publishedToDeck' | 'publishedToDeckAt' | 'updatedAt'>,
): boolean {
  if (!gem.publishedToDeck) return false
  if (!gem.publishedToDeckAt) return false
  if (!gem.updatedAt) return false
  return new Date(gem.updatedAt).getTime() > new Date(gem.publishedToDeckAt).getTime()
}

export type HiddenGemDeckStatusTone = 'pending' | 'onDeck' | 'saved'

export type HiddenGemDeckStatus = {
  label: string
  tone: HiddenGemDeckStatusTone
}

export function getHiddenGemUpdatedAt(gem: Pick<OrgHiddenGem, 'updatedAt' | 'createdAt'>): string {
  return gem.updatedAt ?? gem.createdAt
}

/** Friendly "Mon, Jul 19 at 10:45 PM" for older timestamps; relative for recent. */
export function formatHiddenGemTimestamp(iso: string | undefined): string {
  if (!iso) return 'Unknown'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60)
  if (hoursAgo < 48) return formatRelativeTime(iso)

  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' })
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${weekday}, ${monthDay} at ${time}`
}

function seedDemoHiddenGems(): OrgHiddenGem[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'hgem_demo_emerald_lounge',
      organizationId: DEMO_ORG_ID,
      title: 'Emerald Lounge',
      description:
        'A full-time cocktail lounge with live jazz, craft beer on tap, and a patio open spring through fall.',
      images: [
        'https://images.unsplash.com/photo-1415201361474-7efff816c025?w=800&q=80',
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
      ],
      location: {
        street1: '902 5th Street West',
        city: 'Kindersley',
        region: 'SK',
        postalCode: '',
        country: 'Canada',
        venue: 'Emerald Lounge',
        lat: 51.4678,
        lng: -109.1569,
      },
      contacts: [
        { id: 'hgcontact_demo_front', label: 'Front desk', phone: '306-555-0100' },
        { id: 'hgcontact_demo_order', label: 'Ordering', phone: '306-555-0101' },
      ],
      phone: '306-555-0100',
      website: 'https://emeraldlounge.example.com',
      hoursDescription: 'Kitchen closes at 9pm on weekdays.',
      category: 'Food & Drink',
      agePolicy: '21_plus',
      tags: ['jazz', 'cocktails', 'patio', 'nightlife'],
      cardType: 'hidden-gem',
      borderType: 'gold',
      visibility: 'public',
      published: true,
      publishedToDeck: true,
      featured: true,
      amenities: ['bar', 'washroom', 'food', 'patio', 'parking', 'wifi', 'accessible'],
      weeklyHours: defaultWeeklyHours('11:00', '21:45'),
      metrics: { views: 342, saves: 28, shares: 12 },
      priceLabel: 'From $12',
      createdAt: now,
      updatedAt: now,
      publishedToDeckAt: now,
      createdByAdminId: 'demo-seed',
    },
    {
      id: 'hgem_demo_clay_studio',
      organizationId: DEMO_ORG_ID,
      title: 'The Clay Studio',
      description:
        'Drop-in pottery wheel sessions, gallery sales, and evening classes in downtown Kindersley.',
      images: [
        DEFAULT_HIDDEN_GEM_IMAGE,
        'https://images.unsplash.com/photo-1565193566174-7a0ee3d261fa?w=800&q=80',
      ],
      location: {
        street1: '120 Main Street',
        city: 'Kindersley',
        region: 'SK',
        postalCode: '',
        country: 'Canada',
        venue: 'Downtown Clay Studio',
        lat: 51.4685,
        lng: -109.1542,
      },
      category: 'Entertainment',
      agePolicy: 'family',
      tags: ['pottery', 'classes', 'gallery'],
      cardType: 'hidden-gem',
      borderType: 'gold',
      visibility: 'public',
      published: true,
      publishedToDeck: true,
      featured: false,
      amenities: ['food', 'washroom', 'parking', 'accessible'],
      weeklyHours: defaultWeeklyHours('10:00', '18:00', ['sunday']),
      metrics: { views: 156, saves: 11, shares: 4 },
      priceLabel: 'From $35',
      createdAt: now,
      updatedAt: now,
      publishedToDeckAt: now,
      createdByAdminId: 'demo-seed',
    },
  ]
}

export function getOrgHiddenGems(): OrgHiddenGem[] {
  const stored = readJson<OrgHiddenGem[]>(HIDDEN_GEMS_KEY, [])
  if (stored.length === 0) {
    const seeded = seedDemoHiddenGems()
    writeJson(HIDDEN_GEMS_KEY, seeded)
    return seeded
  }
  const migratedList = stored.map(migrateOrgHiddenGem)
  const needsWrite = stored.some((gem, i) => {
    const migrated = migratedList[i]
    return (
      gem.amenities === undefined ||
      gem.weeklyHours === undefined ||
      gem.agePolicy === undefined ||
      gem.priceLabel === undefined ||
      gem.publishedToDeck === undefined ||
      gem.updatedAt === undefined ||
      (isHiddenGemOnDiscoverDeck(gem) && gem.publishedToDeckAt === undefined) ||
      !gem.location.street1 ||
      (gem.contacts === undefined && !!gem.phone) ||
      normalizeHiddenGemCategory(gem.category) !== gem.category ||
      JSON.stringify(gem.weeklyHours) !== JSON.stringify(migrated.weeklyHours) ||
      JSON.stringify(gem.location) !== JSON.stringify(migrated.location)
    )
  })
  if (needsWrite) writeJson(HIDDEN_GEMS_KEY, migratedList)
  return migratedList
}

export function getHiddenGemsForOrg(organizationId: string): OrgHiddenGem[] {
  return getOrgHiddenGems().filter((g) => g.organizationId === organizationId)
}

export function getHiddenGemCountForOrg(organizationId: string): number {
  return listHiddenGemsForOrg(organizationId).length
}

export function getHiddenGemById(id: string): OrgHiddenGem | undefined {
  return getOrgHiddenGems().find((g) => g.id === id)
}

export function setHiddenGemPromoCode(gemId: string, promoCode: string): OrgHiddenGem | undefined {
  const gems = getOrgHiddenGems()
  const idx = gems.findIndex((g) => g.id === gemId)
  if (idx === -1) return undefined
  gems[idx] = {
    ...gems[idx],
    promoCode: promoCode.trim() || undefined,
    updatedAt: new Date().toISOString(),
  }
  writeJson(HIDDEN_GEMS_KEY, gems)
  return gems[idx]
}

export function getHiddenGemMetrics(gem: Pick<OrgHiddenGem, 'id' | 'metrics'>): {
  views: number
  saves: number
  shares: number
  opens: number
} {
  const live = getStoredEventMetrics(hiddenGemDiscoverId(gem.id))
  return {
    views: Math.max(gem.metrics?.views ?? 0, live.views),
    saves: Math.max(gem.metrics?.saves ?? 0, live.saves),
    shares: gem.metrics?.shares ?? 0,
    opens: live.opens ?? 0,
  }
}

export function isHiddenGemOnDiscoverDeck(
  gem: Pick<OrgHiddenGem, 'publishedToDeck' | 'published'>,
): boolean {
  return gem.publishedToDeck === true || (gem.publishedToDeck === undefined && gem.published)
}

/** Single source of truth for Hidden Gem deck publish status labels. */
export function getHiddenGemDeckStatus(
  gem: Pick<OrgHiddenGem, 'publishedToDeck' | 'published' | 'publishedToDeckAt' | 'updatedAt'>,
): HiddenGemDeckStatus {
  if (hasPendingDeckUpdate(gem)) {
    return { label: 'Update waiting', tone: 'pending' }
  }
  if (isHiddenGemOnDiscoverDeck(gem)) {
    return { label: 'On Discover', tone: 'onDeck' }
  }
  return { label: 'Saved — not on Discover', tone: 'saved' }
}

export function getHiddenGemDeckStatusLabel(
  gem: Pick<OrgHiddenGem, 'publishedToDeck' | 'published' | 'publishedToDeckAt' | 'updatedAt'>,
): string {
  return getHiddenGemDeckStatus(gem).label
}

export function getHiddenGemDeckStatusBadgeClass(tone: HiddenGemDeckStatusTone): string {
  switch (tone) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-900'
    case 'onDeck':
      return 'bg-cyan-500/15 text-cyan-700'
    default:
      return 'bg-amber-500/15 text-amber-800'
  }
}

export function getPublicOrgHiddenGems(): OrgHiddenGem[] {
  return getOrgHiddenGems().filter(
    (g) => g.visibility === 'public' && isHiddenGemOnDiscoverDeck(g),
  )
}

function hostEventIsHiddenGem(event: HostEvent): boolean {
  return (
    event.discoverBorderType === 'gold' ||
    (event as HostEvent & { hiddenGem?: boolean }).hiddenGem === true ||
    (event as HostEvent & { cardType?: string }).cardType === 'hidden-gem'
  )
}

function attractionIsOrgHiddenGem(attraction: Attraction): boolean {
  const orgId = (attraction as Attraction & { organizationId?: string }).organizationId
  return attraction.cardType === 'hidden-gem' && !!orgId
}

function hostEventToListItem(event: HostEvent): HiddenGemListItem | null {
  if (!hostEventIsHiddenGem(event)) return null
  const orgId = event.hostAccountId ?? event.orgId
  if (!orgId) return null

  return {
    id: event.id,
    organizationId: orgId,
    title: event.title,
    description: event.description ?? '',
    images: event.photos ?? [],
    location: migrateHiddenGemLocation({
      ...defaultHiddenGemLocation(),
      city: event.city ?? 'Unknown',
      venue: event.venueName,
      street1: event.venueName ?? '',
    }),
    category: normalizeHiddenGemCategory(event.primaryCategory ?? DEFAULT_HIDDEN_GEM_CATEGORY),
    tags: [...(event.customTags ?? []), ...(event.subCategories ?? [])],
    cardType: 'hidden-gem',
    borderType: 'gold',
    visibility: event.visibility,
    published: event.status === 'live' || event.status === 'upcoming',
    featured: false,
    promoCode: event.promoCode,
    amenities: (event as HostEvent & { hiddenGemAmenities?: string[] }).hiddenGemAmenities ?? [],
    createdAt: event.createdAt,
    source: 'host-event',
  }
}

function attractionToListItem(attraction: Attraction): HiddenGemListItem | null {
  if (!attractionIsOrgHiddenGem(attraction)) return null
  const orgId = (attraction as Attraction & { organizationId?: string }).organizationId!

  return {
    id: attraction.id,
    organizationId: orgId,
    title: attraction.title,
    description: attraction.description,
    images: attraction.images,
    location: migrateHiddenGemLocation({
      ...defaultHiddenGemLocation(),
      ...attraction.location,
    }),
    category: normalizeHiddenGemCategory(attraction.category),
    tags: attraction.tags,
    cardType: 'hidden-gem',
    borderType: 'gold',
    visibility: attraction.visibility,
    published: attraction.visibility === 'public',
    featured: attraction.featured,
    promoCode: attraction.promoCode,
    amenities: (attraction as Attraction & { amenities?: string[] }).amenities ?? [],
    createdAt: attraction.createdAt,
    source: 'attraction',
  }
}

/** All hidden gems for an org — admin store plus legacy host events / attractions. */
export function listHiddenGemsForOrg(organizationId: string): HiddenGemListItem[] {
  const primary = getHiddenGemsForOrg(organizationId).map(
    (g): HiddenGemListItem => ({ ...g, source: 'org-hidden-gem' }),
  )

  const fromEvents = getHostEvents()
    .map(hostEventToListItem)
    .filter((g): g is HiddenGemListItem => g !== null && g.organizationId === organizationId)

  const fromAttractions = getAttractions()
    .map(attractionToListItem)
    .filter((g): g is HiddenGemListItem => g !== null && g.organizationId === organizationId)

  const seen = new Set<string>()
  const merged: HiddenGemListItem[] = []

  for (const item of [...primary, ...fromEvents, ...fromAttractions]) {
    const key = `${item.source}:${item.id}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }

  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function saveOrgHiddenGem(
  input: HiddenGemInput,
  adminId: string,
  options?: { adminBypass?: boolean; deckAction?: 'save' | 'publish' },
): { ok: boolean; gem?: OrgHiddenGem; error?: string } {
  if (!input.organizationId.trim()) {
    return { ok: false, error: 'Organization is required.' }
  }
  if (!input.title.trim()) {
    return { ok: false, error: 'Title is required.' }
  }
  if (!input.description.trim()) {
    return { ok: false, error: 'About us is required.' }
  }
  const location = migrateHiddenGemLocation({
    ...defaultHiddenGemLocation(),
    ...input.location,
    street1: input.location.street1?.trim() ?? '',
    street2: input.location.street2?.trim() || undefined,
    city: input.location.city?.trim() ?? '',
    region: input.location.region?.trim() ?? '',
    postalCode: input.location.postalCode?.trim() ?? '',
    country: input.location.country?.trim() || DEFAULT_HIDDEN_GEM_COUNTRY,
    venue: input.location.venue?.trim() || undefined,
    lat: input.location.lat,
    lng: input.location.lng,
  })

  if (!location.street1.trim()) {
    return { ok: false, error: 'Street address is required.' }
  }
  if (!location.city.trim()) {
    return { ok: false, error: 'City is required.' }
  }

  const { lat, lng } = normalizeLatLng(location.lat, location.lng)
  const coordError = validateLatLng(lat, lng)
  if (coordError) {
    return { ok: false, error: coordError }
  }
  location.lat = lat
  location.lng = lng

  const contacts = (input.contacts ?? [])
    .map((c) => ({
      id: c.id || generateHiddenGemContactId(),
      label: c.label.trim() || 'General',
      phone: c.phone?.trim() || undefined,
      email: c.email?.trim() || undefined,
      note: c.note?.trim() || undefined,
    }))
    .filter((c) => c.label || c.phone || c.email)
    .slice(0, 4)

  const legacyPhone = input.phone?.trim()
  if (contacts.length === 0 && legacyPhone) {
    contacts.push({
      id: generateHiddenGemContactId(),
      label: 'General',
      phone: legacyPhone,
      email: undefined,
      note: undefined,
    })
  }

  const primaryPhone = contacts.find((c) => c.phone)?.phone ?? legacyPhone

  const gems = getOrgHiddenGems()
  const existingIdx = input.id ? gems.findIndex((g) => g.id === input.id) : -1
  const isNew = existingIdx < 0
  const existing = existingIdx >= 0 ? gems[existingIdx] : undefined
  const publishToDeck = input.publishedToDeck ?? input.published
  const wasOnDeck = existing ? isHiddenGemOnDiscoverDeck(existing) : false
  const isPublishAction =
    options?.deckAction === 'publish' ||
    (options?.deckAction !== 'save' && publishToDeck && (isNew || !wasOnDeck))
  const now = new Date().toISOString()

  if (isNew) {
    const slotCheck = canCreateHiddenGem(input.organizationId, options)
    if (publishToDeck && !slotCheck.allowed) {
      return {
        ok: false,
        error: slotCheck.reason ? hiddenGemBlockMessage(slotCheck.reason) : 'Hidden Gem slot limit reached.',
      }
    }
    if (!publishToDeck && !slotCheck.allowed && slotCheck.limit === 0) {
      return {
        ok: false,
        error: slotCheck.reason ? hiddenGemBlockMessage(slotCheck.reason) : 'Hidden Gem slot limit reached.',
      }
    }
  } else {
    const existingGem = gems[existingIdx]
    const wasOnDeckBefore = isHiddenGemOnDiscoverDeck(existingGem)
    if (publishToDeck && !wasOnDeckBefore) {
      const slotCheck = canCreateHiddenGem(input.organizationId, options)
      if (!slotCheck.allowed) {
        return {
          ok: false,
          error: slotCheck.reason ? hiddenGemBlockMessage(slotCheck.reason) : 'Hidden Gem slot limit reached.',
        }
      }
    }
  }

  const gem: OrgHiddenGem = {
    id: input.id ?? generateId(),
    organizationId: input.organizationId,
    title: input.title.trim(),
    description: input.description.trim(),
    menu: input.menu?.trim() ? input.menu : undefined,
    images: input.images.filter(Boolean).slice(0, 6),
    location,
    contacts: contacts.length > 0 ? contacts : undefined,
    phone: primaryPhone || undefined,
    website: (() => {
      const raw = input.website?.trim()
      if (!raw) return undefined
      return normalizeWebsiteUrl(raw) || raw
    })(),
    reviewLinks: (() => {
      const links = normalizeHiddenGemReviewLinks(input.reviewLinks)
      return links.length > 0 ? links : undefined
    })(),
    hoursDescription: input.hoursDescription?.trim() || undefined,
    category: normalizeHiddenGemCategory(input.category),
    tags: input.tags.filter(Boolean),
    cardType: 'hidden-gem',
    borderType: 'gold',
    visibility: input.visibility,
    published: publishToDeck,
    publishedToDeck: publishToDeck,
    featured: input.featured,
    promoCode: input.promoCode?.trim() || undefined,
    amenities: (input.amenities ?? []).filter(Boolean).filter((id) => id !== 'cash' && id !== 'atm'),
    doorPayment: input.doorPayment || undefined,
    priceLabel: normalizePriceLabel(input.priceLabel),
    atmOnSite:
      input.doorPayment && doorPaymentAcceptsCash(input.doorPayment) && input.atmOnSite
        ? true
        : undefined,
    weeklyHours: input.weeklyHours ? migrateWeeklyHours(input.weeklyHours) : undefined,
    agePolicy: input.agePolicy ?? 'all_ages',
    metrics: existing?.metrics,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedToDeckAt:
      isPublishAction && publishToDeck
        ? now
        : existing?.publishedToDeckAt,
    createdByAdminId: adminId,
  }

  if (existingIdx >= 0) {
    gems[existingIdx] = gem
  } else {
    gems.push(gem)
  }

  writeJson(HIDDEN_GEMS_KEY, gems)
  return { ok: true, gem }
}

/** Migrate legacy hidden gem fields to current structured shape. */
export function migrateHiddenGem(gem: OrgHiddenGem): OrgHiddenGem {
  return migrateOrgHiddenGem(gem)
}

export function deleteOrgHiddenGem(id: string): { ok: boolean; error?: string } {
  const gems = getOrgHiddenGems()
  const next = gems.filter((g) => g.id !== id)
  if (next.length === gems.length) {
    return { ok: false, error: 'Hidden gem not found.' }
  }
  writeJson(HIDDEN_GEMS_KEY, next)
  return { ok: true }
}

export function setOrgHiddenGemPublished(
  id: string,
  published: boolean,
  options?: { adminBypass?: boolean },
): { ok: boolean; gem?: OrgHiddenGem; error?: string } {
  const gems = getOrgHiddenGems()
  const idx = gems.findIndex((g) => g.id === id)
  if (idx < 0) return { ok: false, error: 'Hidden gem not found.' }

  if (published && !isHiddenGemOnDiscoverDeck(gems[idx])) {
    const slotCheck = canCreateHiddenGem(gems[idx].organizationId, options)
    if (!slotCheck.allowed) {
      return {
        ok: false,
        error: slotCheck.reason
          ? hiddenGemBlockMessage(slotCheck.reason)
          : 'Hidden Gem slot limit reached — unpublish another listing or purchase a slot.',
      }
    }
  }

  gems[idx] = {
    ...gems[idx],
    published,
    publishedToDeck: published,
    ...(published
      ? { publishedToDeckAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      : {}),
  }
  writeJson(HIDDEN_GEMS_KEY, gems)
  return { ok: true, gem: gems[idx] }
}

export function setOrgHiddenGemFeatured(
  id: string,
  featured: boolean,
): { ok: boolean; gem?: OrgHiddenGem; error?: string } {
  const gems = getOrgHiddenGems()
  const idx = gems.findIndex((g) => g.id === id)
  if (idx < 0) return { ok: false, error: 'Hidden gem not found.' }
  gems[idx] = { ...gems[idx], featured }
  writeJson(HIDDEN_GEMS_KEY, gems)
  return { ok: true, gem: gems[idx] }
}

export const DEFAULT_HIDDEN_GEM_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
