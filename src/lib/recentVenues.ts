import type { HostEventFormData } from './account'
import { getHiddenGemsForOrg, type OrgHiddenGem } from './hiddenGems'

const STORAGE_KEY = 'tudu_recent_venues'
const MAX_RECENT_VENUES = 3

export type RecentVenueContext = {
  postingAs: 'personal' | string
  hostEmail: string
}

export type RecentVenue = {
  venueName: string
  streetAddress: string
  streetSuite: string
  city: string
  province: string
  postalCode: string
  country: string
  usedAt: string
  orgId?: string
  hostEmail: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function venueDedupeKey(venue: Pick<RecentVenue, 'venueName' | 'streetAddress'>): string {
  return `${normalizeText(venue.venueName)}|${normalizeText(venue.streetAddress)}`
}

function contextStorageKey(context: RecentVenueContext): string {
  if (context.postingAs === 'personal') {
    return `personal:${normalizeEmail(context.hostEmail)}`
  }
  return `org:${context.postingAs}`
}

function readStore(): Record<string, RecentVenue[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, RecentVenue[]>) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, RecentVenue[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function venueFromForm(form: HostEventFormData, context: RecentVenueContext): RecentVenue {
  return {
    venueName: form.venueName.trim(),
    streetAddress: form.streetAddress.trim(),
    streetSuite: form.streetSuite.trim(),
    city: form.city.trim(),
    province: form.province.trim(),
    postalCode: form.postalCode.trim(),
    country: form.country.trim() || 'Canada',
    usedAt: new Date().toISOString(),
    orgId: context.postingAs === 'personal' ? undefined : context.postingAs,
    hostEmail: normalizeEmail(context.hostEmail),
  }
}

export function recentVenueToFormFields(
  venue: RecentVenue,
): Pick<
  HostEventFormData,
  'venueName' | 'streetAddress' | 'streetSuite' | 'city' | 'province' | 'postalCode' | 'country'
> {
  return {
    venueName: venue.venueName,
    streetAddress: venue.streetAddress,
    streetSuite: venue.streetSuite,
    city: venue.city,
    province: venue.province,
    postalCode: venue.postalCode,
    country: venue.country,
  }
}

export function getRecentVenues(context: RecentVenueContext): RecentVenue[] {
  const key = contextStorageKey(context)
  return readStore()[key] ?? []
}

export function recordRecentVenue(form: HostEventFormData, context: RecentVenueContext): void {
  if (!form.venueName.trim()) return

  const venue = venueFromForm(form, context)
  const key = contextStorageKey(context)
  const store = readStore()
  const existing = store[key] ?? []
  const dedupeKey = venueDedupeKey(venue)

  const next = [
    venue,
    ...existing.filter((item) => venueDedupeKey(item) !== dedupeKey),
  ].slice(0, MAX_RECENT_VENUES)

  store[key] = next
  writeStore(store)
}

export function formatRecentVenueSubtitle(venue: RecentVenue): string {
  const parts = [venue.streetAddress, venue.city, venue.province].filter(Boolean)
  if (parts.length === 0) return 'No address saved'
  const line = parts.join(', ')
  return line.length > 28 ? `${line.slice(0, 25)}...` : line
}

function hiddenGemHasAddress(gem: OrgHiddenGem): boolean {
  const loc = gem.location
  return !!(loc.street1?.trim() || loc.city?.trim() || loc.venue?.trim())
}

function hiddenGemToRecentVenue(gem: OrgHiddenGem): RecentVenue {
  const loc = gem.location
  return {
    venueName: loc.venue?.trim() || gem.title.trim(),
    streetAddress: loc.street1.trim(),
    streetSuite: loc.street2?.trim() ?? '',
    city: loc.city.trim(),
    province: loc.region.trim(),
    postalCode: loc.postalCode.trim(),
    country: loc.country.trim() || 'Canada',
    usedAt: gem.updatedAt ?? gem.createdAt,
    orgId: gem.organizationId,
    hostEmail: '',
  }
}

/** Org quick-fill from a single or featured Hidden Gem with address. */
export function getOrgHiddenGemVenueQuickFill(orgId: string): {
  label: string
  venue: RecentVenue
} | null {
  const withAddress = getHiddenGemsForOrg(orgId).filter(hiddenGemHasAddress)
  if (withAddress.length === 0) return null

  const gem =
    withAddress.length === 1
      ? withAddress[0]
      : withAddress.find((item) => item.featured)

  if (!gem) return null

  return {
    label: `Use ${gem.title}`,
    venue: hiddenGemToRecentVenue(gem),
  }
}
