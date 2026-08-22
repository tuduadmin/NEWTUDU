import type { HostEvent } from './account'
import { resolveTicketingMode } from './account'
import { getEventStartDate } from './hostEventSchedule'

export function getEventDatePill(event: HostEvent, now = new Date()): string | null {
  const start = getEventStartDate(event)
  if (!start) return null

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const eventDay = new Date(start)
  eventDay.setHours(0, 0, 0, 0)

  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'

  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  if (eventDay >= startOfWeek && eventDay <= endOfWeek) return 'This Week'

  if (diffDays > 0 && diffDays <= 14) return 'Coming Soon'
  return null
}

export function formatCardDateTime(event: HostEvent): string {
  if (!event.eventDate) return '—'
  const date = new Date(`${event.eventDate}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  if (event.allDay) return date
  const min = (event.startMinute ?? '00').padStart(2, '0')
  return `${date} ${event.startHour ?? '12'}:${min} ${event.startPeriod ?? 'PM'}`
}

export function formatCardLocation(event: HostEvent): string {
  const venue = event.venueName?.trim()
  const city = event.city?.trim()
  if (venue && city) return `${venue.toUpperCase()}, ${city}`
  if (venue) return venue.toUpperCase()
  if (city) return city
  return 'Location TBD'
}

export function getGoingCount(event: HostEvent): number {
  if (event.status === 'draft') return 0
  return (event.ticketTiers ?? []).reduce((sum, tier) => sum + (tier.sold ?? 0), 0)
}

export function getEventCapacity(event: HostEvent): number | null {
  const mode = resolveTicketingMode(event)
  if (mode === 'free_rsvp' || mode === 'free_donation') {
    return event.capacity ?? null
  }
  if (mode === 'external') return null
  const tiers = event.ticketTiers ?? []
  if (tiers.length === 0 || tiers.every((tier) => tier.quantity == null)) return null
  return tiers.reduce((sum, tier) => sum + (tier.quantity ?? 0), 0)
}

export function getEventSoldPercent(event: HostEvent): number | null {
  const capacity = getEventCapacity(event)
  if (capacity == null || capacity <= 0) return null
  return Math.min(100, Math.round((getGoingCount(event) / capacity) * 100))
}
