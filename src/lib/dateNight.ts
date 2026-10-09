import type { UserAccount } from './account'
import {
  filterDiscoverPoolByQuickPick,
  getDiscoverEventsPool,
  type DiscoverEvent,
} from '../data/discoverEvents'
import { CITIES, formatCityLabel, getHomeCity } from './location'

/** Flip when city readiness + pairing logic ship (see dateNight pairing TODO). */
export const DATE_NIGHT_LIVE = false

export const DATE_NIGHT_PATH = '/discover/date-night'

const DATE_NIGHT_CITY_KEY = 'tudu-date-night-city'

export const DATE_NIGHT_CITY_CHANGED_EVENT = 'tudu-date-night-city-changed'

function readDateNightCityStorage(): string | null {
  try {
    return localStorage.getItem(DATE_NIGHT_CITY_KEY)
  } catch {
    return null
  }
}

/** Default before user picks: home city — not Discover Travel Pass / header city. */
export function getDefaultDateNightCity(account: UserAccount | null): string {
  const fromAccount = account?.homeCity?.trim()
  if (fromAccount) return fromAccount
  return getHomeCity()
}

/**
 * Date night browse city — stored separately from Discover (`getCurrentCity` / Travel Pass).
 * Falls back to home city; if unset, `getHomeCity()` may default to the first entry in `CITIES` (Kindersley).
 */
export function getDateNightCity(account: UserAccount | null): string {
  const stored = readDateNightCityStorage()
  if (stored?.trim()) return stored.trim()
  return getDefaultDateNightCity(account)
}

export function setDateNightCity(cityFullLabel: string): void {
  try {
    localStorage.setItem(DATE_NIGHT_CITY_KEY, cityFullLabel.trim())
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DATE_NIGHT_CITY_CHANGED_EVENT))
}

export function clearDateNightCityOverride(): void {
  try {
    localStorage.removeItem(DATE_NIGHT_CITY_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DATE_NIGHT_CITY_CHANGED_EVENT))
}

export { CITIES as DATE_NIGHT_CITY_OPTIONS }

export type DateNightSlotKind = 'eat' | 'do'

export type DateNightPreviewSlot = {
  kind: DateNightSlotKind
  title: string
  subtitle: string
  meta: string
}

/** Illustrative placeholders — replaced by real picks when DATE_NIGHT_LIVE is true. */
export const DATE_NIGHT_PREVIEW: Record<DateNightSlotKind, DateNightPreviewSlot> = {
  eat: {
    kind: 'eat',
    title: 'Dinner spot near you',
    subtitle: 'Food & drink · preview',
    meta: 'Opens after 5 PM · ~15 min away',
  },
  do: {
    kind: 'do',
    title: 'Evening event nearby',
    subtitle: 'Live music · preview',
    meta: 'Tonight · ~10 min from dinner',
  },
}

export function getDateNightAreaLabel(account: UserAccount | null): string {
  return formatCityLabel(getDateNightCity(account))
}

export function dateNightComingSoonMessage(areaLabel: string): string {
  return `Auto-matched pairs for ${areaLabel} are coming soon. You can already add your own dinner spot and event below — we’ll suggest pairs once the map fills in.`
}

export type DateNightPick = {
  discoverId: string
  title: string
  subtitle: string
  meta: string
  image?: string
}

type DateNightPlanByCity = {
  eat: DateNightPick | null
  do: DateNightPick | null
}

const DATE_NIGHT_PLAN_KEY = 'tudu-date-night-plan'

export const DATE_NIGHT_PLAN_CHANGED_EVENT = 'tudu-date-night-plan-changed'

function planStorageKey(cityFull: string): string {
  return cityFull.trim().toLowerCase()
}

function readPlanStore(): Record<string, DateNightPlanByCity> {
  try {
    const raw = localStorage.getItem(DATE_NIGHT_PLAN_KEY)
    return raw ? (JSON.parse(raw) as Record<string, DateNightPlanByCity>) : {}
  } catch {
    return {}
  }
}

function writePlanStore(store: Record<string, DateNightPlanByCity>): void {
  try {
    localStorage.setItem(DATE_NIGHT_PLAN_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DATE_NIGHT_PLAN_CHANGED_EVENT))
}

export function getDateNightPlanForCity(cityFull: string): DateNightPlanByCity {
  const store = readPlanStore()
  return store[planStorageKey(cityFull)] ?? { eat: null, do: null }
}

export function setDateNightPick(
  cityFull: string,
  kind: DateNightSlotKind,
  pick: DateNightPick | null,
): void {
  const store = readPlanStore()
  const key = planStorageKey(cityFull)
  const current = store[key] ?? { eat: null, do: null }
  store[key] = { ...current, [kind]: pick }
  writePlanStore(store)
}

export function eventMatchesDateNightCity(event: DiscoverEvent, cityFull: string): boolean {
  const target = formatCityLabel(cityFull).toLowerCase()
  const eventCity = event.city.toLowerCase()
  if (!target || !eventCity) return false
  if (eventCity.includes(target)) return true
  const eventPrimary = eventCity.split(',')[0]?.trim() ?? eventCity
  return target.includes(eventPrimary) || eventPrimary.includes(target)
}

export function getDateNightCandidates(cityFull: string, kind: DateNightSlotKind): DiscoverEvent[] {
  const inCity = getDiscoverEventsPool().filter((event) => eventMatchesDateNightCity(event, cityFull))
  if (kind === 'eat') {
    return filterDiscoverPoolByQuickPick(inCity, 'food')
  }
  const entertainment = filterDiscoverPoolByQuickPick(inCity, 'entertainment')
  const timed = entertainment.filter(
    (event) => event.cardKind !== 'attraction' || event.dateTag || event.dateTime,
  )
  return timed.length > 0 ? timed : entertainment
}

export function dateNightPickFromDiscoverEvent(
  event: DiscoverEvent,
  kind: DateNightSlotKind,
): DateNightPick {
  const subtitle =
    kind === 'eat'
      ? (event.categories?.[0]?.label ?? 'Food & drink')
      : (event.dateTag ?? event.categories?.[0]?.label ?? 'Event')
  const metaParts = [event.locationDetail, event.city, event.dateTag, event.cost].filter(Boolean)
  return {
    discoverId: event.id,
    title: event.title,
    subtitle,
    meta: metaParts.join(' · '),
    image: event.image,
  }
}

export function dateNightSlotLabel(kind: DateNightSlotKind, action: 'add' | 'change'): string {
  if (kind === 'eat') return action === 'add' ? 'Add place' : 'Change place'
  return action === 'add' ? 'Add event' : 'Change event'
}
