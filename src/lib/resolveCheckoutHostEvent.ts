import {
  getHostEventById,
  getHostEvents,
  type HostEvent,
  type TicketTier,
  type TicketingMode,
} from './account'
import {
  DISCOVER_EVENTS,
  enrichDiscoverEventTickets,
  type DiscoverEvent,
} from '../data/discoverEvents'

const EVENTS_KEY = 'tudu_host_events'

function parsePriceLabelCents(label: string): number {
  const trimmed = label.trim()
  if (!trimmed || /^free/i.test(trimmed)) return 0
  const match = trimmed.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/)
  if (!match) return 0
  return Math.round(parseFloat(match[1].replace(/,/g, '')) * 100)
}

function discoverTiersToHostTiers(card: DiscoverEvent): TicketTier[] {
  return (card.ticketTiers ?? []).map((tier) => ({
    id: tier.id,
    name: tier.name,
    priceCents: tier.priceCents ?? parsePriceLabelCents(tier.priceLabel),
    quantity: tier.quantity ?? null,
    sold: tier.sold ?? 0,
    description: tier.description?.trim() ?? '',
    availableAtDoor: tier.availableAtDoor ?? false,
  }))
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

/** Map discover card dateTime (e.g. "Jul 19, 9:00 AM") to host event schedule fields. */
function inferScheduleFromDiscoverCard(
  card: DiscoverEvent,
  now = new Date(),
): Pick<HostEvent, 'eventDate' | 'startHour' | 'startMinute' | 'startPeriod'> {
  const fallbackDate = new Date(now)
  fallbackDate.setDate(fallbackDate.getDate() + 14)

  const fallback = {
    eventDate: fallbackDate.toISOString().slice(0, 10),
    startHour: '9',
    startMinute: '00',
    startPeriod: 'AM' as const,
  }

  const dt = card.dateTime?.trim()
  if (!dt) return fallback

  const match = dt.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return fallback

  const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()]
  if (month == null) return fallback

  const day = parseInt(match[2], 10)
  let year = now.getFullYear()
  const candidate = new Date(year, month, day)
  if (candidate < now) {
    year += 1
    candidate.setFullYear(year)
  }

  return {
    eventDate: candidate.toISOString().slice(0, 10),
    startHour: match[3],
    startMinute: match[4],
    startPeriod: match[5].toUpperCase() as 'AM' | 'PM',
  }
}

function persistHostEvent(event: HostEvent): void {
  const events = getHostEvents()
  const idx = events.findIndex((row) => row.id === event.id)
  if (idx >= 0) {
    events[idx] = event
  } else {
    events.push(event)
  }
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  } catch (err) {
    console.warn(`[TUDU] Failed to persist checkout host event "${event.id}":`, err)
  }
}

function ensureDiscoverSchedule(event: HostEvent, card: DiscoverEvent): HostEvent {
  if (event.eventDate) return event
  const updated = { ...event, ...inferScheduleFromDiscoverCard(card) }
  persistHostEvent(updated)
  return updated
}

function seedHostEventFromDiscoverCard(card: DiscoverEvent): HostEvent {
  const eventId = card.hostEventId ?? card.id
  const ticketingMode = card.ticketingMode as TicketingMode

  const event: HostEvent = {
    id: eventId,
    title: card.title,
    visibility: 'public',
    createdBy: 'demo@tudu.ca',
    createdAt: new Date().toISOString(),
    status: 'live',
    city: card.city,
    venueName: card.venueName,
    streetAddress: card.streetAddress,
    description: card.description,
    photos: card.images?.length ? card.images : [card.image],
    ticketTiers: discoverTiersToHostTiers(card),
    ticketingMode,
    ...inferScheduleFromDiscoverCard(card),
  }

  persistHostEvent(event)
  return event
}

function findStaticDiscoverCard(id: string): DiscoverEvent | undefined {
  const raw = DISCOVER_EVENTS.find((card) => card.id === id || card.hostEventId === id)
  return raw ? enrichDiscoverEventTickets(raw) : undefined
}

/** Resolve a host event for RSVP/ticket checkout, seeding static discover cards on demand. */
export function resolveCheckoutHostEvent(id: string): HostEvent | undefined {
  const staticCard = findStaticDiscoverCard(id)

  const existing = getHostEventById(id)
  if (existing) {
    return staticCard ? ensureDiscoverSchedule(existing, staticCard) : existing
  }

  if (!staticCard) return undefined

  const checkoutId = staticCard.hostEventId ?? staticCard.id
  const seeded = getHostEventById(checkoutId)
  if (seeded) return ensureDiscoverSchedule(seeded, staticCard)

  return seedHostEventFromDiscoverCard(staticCard)
}
