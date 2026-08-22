import type { DiscoverEvent } from '../data/discoverEvents'
import { getHostEventById } from './account'
import { computeExpiresAt, getNextDisplayDate, inferRepeats } from './eventSchedule'

function isAlwaysAvailable(event: DiscoverEvent): boolean {
  return (
    event.cardKind === 'attraction' ||
    event.dateTag === 'Always On' ||
    event.dateTag === 'Anytime' ||
    event.dateTag === 'Featured' ||
    Boolean(event.repeatsLabel)
  )
}

function isHostEventPast(hostEventId: string, now = new Date()): boolean {
  const hostEvent = getHostEventById(hostEventId)
  if (!hostEvent) return false

  if (inferRepeats(hostEvent) !== 'none') {
    return !getNextDisplayDate(hostEvent, now)
  }

  const expiresAt = hostEvent.expiresAt
    ? new Date(hostEvent.expiresAt)
    : computeExpiresAt(hostEvent)
      ? new Date(computeExpiresAt(hostEvent)!)
      : null

  if (expiresAt) return expiresAt < now

  const displayDate = getNextDisplayDate(hostEvent, now)
  if (!displayDate) return true
  return displayDate < now.toISOString().slice(0, 10)
}

function isStaticEventPast(event: DiscoverEvent, now = new Date()): boolean {
  if (event.showDates?.length) {
    const lastDate = event.showDates[event.showDates.length - 1]
    const end = new Date(`${lastDate}T23:59:59`)
    return end < now
  }

  const tag = (event.dateTag ?? '').toLowerCase()
  if (tag.includes('live now') || tag.includes('today') || tag.includes('tomorrow')) {
    return false
  }
  if (tag.includes('this weekend') || tag.includes('next week') || tag.includes('upcoming')) {
    return false
  }

  return false
}

/** True when the saved card should appear under Past (event date has passed). */
export function isDiscoverEventPast(event: DiscoverEvent, now = new Date()): boolean {
  if (isAlwaysAvailable(event)) return false
  if (event.hostEventId) return isHostEventPast(event.hostEventId, now)
  return isStaticEventPast(event, now)
}

export function splitEventsByPast<T extends { event: DiscoverEvent }>(
  items: T[],
  now = new Date(),
): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = []
  const past: T[] = []
  for (const item of items) {
    if (isDiscoverEventPast(item.event, now)) past.push(item)
    else upcoming.push(item)
  }
  return { upcoming, past }
}
