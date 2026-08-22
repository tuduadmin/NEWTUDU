import {
  MAX_ATTRACTION_PHOTOS,
  normalizeLatLng,
  validateLatLng,
} from './geoCoordinates'

const ATTRACTIONS_KEY = 'tudu-attractions'
const LEGACY_SECRET_LIST_KEY = 'tudu-secret-list'
const LEGACY_SECRET_LIST_MIGRATED_KEY = 'tudu-secret-list-migrated'

export { MAX_ATTRACTION_PHOTOS }

export type AttractionCardType = 'attraction' | 'hidden-gem' | 'place'
export type AttractionPosting = 'deck' | 'secret'
export type AttractionVisibility = 'public' | 'private' | 'hidden'

export interface AttractionLocation {
  city: string
  venue?: string
  lat?: number
  lng?: number
}

export interface Attraction {
  id: string
  title: string
  subtitle?: string
  description: string
  images: string[]
  location: AttractionLocation
  category: string
  tags: string[]
  cardType: AttractionCardType
  /** Deck = partner-pink swipe deck. Secret = secret-border cards (public in deck or hidden behind keywords). */
  posting: AttractionPosting
  visibility: AttractionVisibility
  featured: boolean
  seededByAdmin: true
  createdAt: string
  createdByAdminId?: string
  /** Optional promo code for distant saver outreach. */
  promoCode?: string
  /** Host organization that owns this hidden gem (org-scoped deck cards). */
  organizationId?: string
  /** Typical price shown on Discover cards — e.g. "$35", "From $15", "Free". */
  priceLabel?: string
}

type LegacySecretListItem = {
  id: string
  title: string
  subtitle?: string
  description: string
  images: string[]
  location: AttractionLocation
  category: string
  keywords: string[]
  visibility: 'public' | 'hidden'
  featured: boolean
  createdAt: string
  createdByAdminId?: string
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return { ok: true }
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22)
    return {
      ok: false,
      error: isQuota
        ? 'Storage full — remove a photo or use smaller images / image URLs instead of uploads.'
        : 'Could not save attraction locally. Try again with fewer or smaller photos.',
    }
  }
}

function generateId(): string {
  return `attr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeAttraction(raw: Attraction): Attraction {
  const posting: AttractionPosting = raw.posting ?? 'deck'
  let visibility = raw.visibility ?? 'public'
  if (posting === 'deck' && visibility === 'hidden') {
    visibility = 'public'
  }
  if (posting === 'secret' && visibility === 'private') {
    visibility = 'hidden'
  }
  return { ...raw, posting, visibility }
}

function migrateLegacySecretListIfNeeded(): void {
  if (localStorage.getItem(LEGACY_SECRET_LIST_MIGRATED_KEY)) return

  const legacy = readJson<LegacySecretListItem[]>(LEGACY_SECRET_LIST_KEY, [])
  if (legacy.length === 0) {
    localStorage.setItem(LEGACY_SECRET_LIST_MIGRATED_KEY, '1')
    return
  }

  const attractions = readJson<Attraction[]>(ATTRACTIONS_KEY, [])
  const existingIds = new Set(attractions.map((a) => a.id))

  for (const item of legacy) {
    if (existingIds.has(item.id)) continue
    attractions.push(
      normalizeAttraction({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        images: item.images,
        location: item.location,
        category: item.category,
        tags: item.keywords ?? [],
        cardType: 'attraction',
        posting: 'secret',
        visibility: item.visibility === 'hidden' ? 'hidden' : 'public',
        featured: item.featured,
        seededByAdmin: true,
        createdAt: item.createdAt,
        createdByAdminId: item.createdByAdminId,
      }),
    )
  }

  writeJson(ATTRACTIONS_KEY, attractions)
  localStorage.setItem(LEGACY_SECRET_LIST_MIGRATED_KEY, '1')
}

export function getAttractions(): Attraction[] {
  migrateLegacySecretListIfNeeded()
  return readJson<Attraction[]>(ATTRACTIONS_KEY, []).map(normalizeAttraction)
}

export function isDeckPosting(attraction: Pick<Attraction, 'posting'>): boolean {
  return (attraction.posting ?? 'deck') === 'deck'
}

export function isSecretPosting(attraction: Pick<Attraction, 'posting'>): boolean {
  return attraction.posting === 'secret'
}

/** Partner-pink deck cards (public, card-deck posting). */
export function getPublicDeckAttractions(): Attraction[] {
  return getAttractions().filter((a) => isDeckPosting(a) && a.visibility === 'public')
}

/** Secret-border cards visible in the swipe deck without a keyword search. */
export function getPublicSecretAttractions(): Attraction[] {
  return getAttractions().filter((a) => isSecretPosting(a) && a.visibility === 'public')
}

/** Secret-border cards unlocked only when a keyword matches. */
export function getHiddenSecretAttractions(): Attraction[] {
  return getAttractions().filter((a) => isSecretPosting(a) && a.visibility === 'hidden')
}

/** @deprecated Use getPublicDeckAttractions */
export function getPublicAttractions(): Attraction[] {
  return getPublicDeckAttractions()
}

export function getAttractionById(id: string): Attraction | undefined {
  return getAttractions().find((a) => a.id === id)
}

export function attractionMatchesSecretKeyword(
  attraction: Pick<Attraction, 'tags'>,
  query: string | undefined,
): boolean {
  const q = query?.trim().toLowerCase()
  if (!q) return false
  return attraction.tags.some((tag) => tag.toLowerCase().includes(q))
}

export type AttractionInput = Omit<Attraction, 'id' | 'createdAt' | 'seededByAdmin'> & {
  id?: string
}

export function saveAttraction(
  input: AttractionInput,
  adminId: string,
): { ok: boolean; attraction?: Attraction; error?: string } {
  if (!input.title.trim()) {
    return { ok: false, error: 'Title is required.' }
  }
  if (!input.description.trim()) {
    return { ok: false, error: 'Description is required.' }
  }
  if (!input.location.city.trim()) {
    return { ok: false, error: 'City is required.' }
  }

  const posting: AttractionPosting = input.posting ?? 'deck'
  let visibility = input.visibility
  if (posting === 'deck' && visibility === 'hidden') {
    visibility = 'public'
  }
  if (posting === 'secret' && visibility === 'private') {
    visibility = 'hidden'
  }

  const tags = input.tags.filter(Boolean)
  if (posting === 'secret' && visibility === 'hidden' && tags.length === 0) {
    return { ok: false, error: 'Hidden secret-list cards need at least one search keyword.' }
  }

  const coordError = validateLatLng(input.location.lat, input.location.lng)
  if (coordError) {
    return { ok: false, error: coordError }
  }
  const { lat, lng } = normalizeLatLng(input.location.lat, input.location.lng)

  const attractions = getAttractions()
  const existingIdx = input.id ? attractions.findIndex((a) => a.id === input.id) : -1

  const attraction: Attraction = {
    id: input.id ?? generateId(),
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || undefined,
    description: input.description.trim(),
    images: input.images.filter(Boolean).slice(0, MAX_ATTRACTION_PHOTOS),
    location: {
      city: input.location.city.trim(),
      venue: input.location.venue?.trim() || undefined,
      lat,
      lng,
    },
    category: input.category.trim() || 'Experience',
    tags,
    cardType: input.cardType,
    posting,
    visibility,
    featured: input.featured,
    seededByAdmin: true,
    createdAt: existingIdx >= 0 ? attractions[existingIdx].createdAt : new Date().toISOString(),
    createdByAdminId: adminId,
    promoCode: input.promoCode?.trim() || undefined,
    organizationId: input.organizationId?.trim() || undefined,
  }

  if (existingIdx >= 0) {
    attractions[existingIdx] = attraction
  } else {
    attractions.push(attraction)
  }

  const writeResult = writeJson(ATTRACTIONS_KEY, attractions)
  if (!writeResult.ok) {
    return { ok: false, error: writeResult.error }
  }
  return { ok: true, attraction }
}

export function deleteAttraction(id: string): { ok: boolean; error?: string } {
  const attractions = getAttractions()
  const next = attractions.filter((a) => a.id !== id)
  if (next.length === attractions.length) {
    return { ok: false, error: 'Attraction not found.' }
  }
  const writeResult = writeJson(ATTRACTIONS_KEY, next)
  if (!writeResult.ok) {
    return { ok: false, error: writeResult.error }
  }
  return { ok: true }
}

export const ATTRACTION_POSTING_OPTIONS: { id: AttractionPosting; label: string }[] = [
  { id: 'deck', label: 'Card deck' },
  { id: 'secret', label: 'Secret list' },
]

export const ATTRACTION_CARD_TYPES: { id: AttractionCardType; label: string }[] = [
  { id: 'attraction', label: 'Attraction' },
  { id: 'hidden-gem', label: 'Hidden Gem' },
  { id: 'place', label: 'Place' },
]

export const DEFAULT_ATTRACTION_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'

/** After this age, the posted date turns yellow — cue to refresh photos (deck border stays pink). */
export const ATTRACTION_STALE_AFTER_MS = 90 * 24 * 60 * 60 * 1000

/** How often the hero photo rotates through the gallery (weekly). */
export const ATTRACTION_IMAGE_ROTATION_MS = 7 * 24 * 60 * 60 * 1000

export function isAttractionStale(postedAt: string, now = Date.now()): boolean {
  const posted = new Date(postedAt).getTime()
  if (!Number.isFinite(posted)) return false
  return now - posted >= ATTRACTION_STALE_AFTER_MS
}

export function formatAttractionPostedDate(postedAt: string): string {
  const date = new Date(postedAt)
  if (!Number.isFinite(date.getTime())) return 'Date unknown'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatAttractionPostedLabel(
  attraction: Pick<Attraction, 'createdAt' | 'featured'>,
  options?: { includeStaleHint?: boolean; now?: number },
): string {
  const now = options?.now ?? Date.now()
  const date = formatAttractionPostedDate(attraction.createdAt)
  const stale = options?.includeStaleHint && isAttractionStale(attraction.createdAt, now)
  const prefix = attraction.featured ? `Featured · Posted ${date}` : `Posted ${date}`
  return stale ? `${prefix} · Refresh photos` : prefix
}

export function getAttractionPostingLabel(posting: AttractionPosting): string {
  return ATTRACTION_POSTING_OPTIONS.find((option) => option.id === posting)?.label ?? posting
}

export function getAttractionVisibilityLabel(
  attraction: Pick<Attraction, 'posting' | 'visibility'>,
): string {
  if (attraction.posting === 'secret') {
    return attraction.visibility === 'hidden' ? 'Hidden — keyword' : 'Public — deck'
  }
  return attraction.visibility === 'private' ? 'Private' : 'Public — deck'
}

/**
 * Rotate gallery order over time so the deck hero photo changes weekly.
 * Keeps attractions feeling fresh without manual edits.
 */
export function getRotatedAttractionImages(
  images: string[],
  postedAt: string,
  now = Date.now(),
): string[] {
  const filtered = images.filter(Boolean)
  if (filtered.length === 0) return [DEFAULT_ATTRACTION_IMAGE]
  if (filtered.length === 1) return filtered

  const posted = new Date(postedAt).getTime()
  const rotations = Number.isFinite(posted)
    ? Math.max(0, Math.floor((now - posted) / ATTRACTION_IMAGE_ROTATION_MS))
    : 0
  const offset = rotations % filtered.length
  return [...filtered.slice(offset), ...filtered.slice(0, offset)]
}

/** Discover deck border — pink for card deck, secret for secret list, gold for hidden-gem card type. */
export function getAttractionDiscoverBorderColor(
  attraction: Pick<Attraction, 'cardType' | 'posting'>,
): 'gold' | 'pink' | 'secret' {
  if (attraction.posting === 'secret') return 'secret'
  if (attraction.cardType === 'hidden-gem') return 'gold'
  return 'pink'
}
