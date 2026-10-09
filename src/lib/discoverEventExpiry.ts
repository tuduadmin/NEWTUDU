import type { DiscoverEvent } from '../data/discoverEvents'
import { getHostEventById } from './account'
import { getEventEndDate } from './hostEventSchedule'
import { getHostProfileUrlFromEvent, getOrgPublicProfileUrl } from './publicHostProfile'

/** Experiences that stay available without a fixed end date. */
function isOpenEndedDiscoverExperience(event: DiscoverEvent): boolean {
  if (event.cardKind === 'attraction') return true
  if (event.ticketingMode === 'explore') return true
  return false
}

function parseYearsFromDateLabel(label: string): number[] {
  const years: number[] = []
  const re = /\b(20\d{2})\b/g
  let match: RegExpExecArray | null
  while ((match = re.exec(label)) !== null) {
    years.push(Number(match[1]))
  }
  return years
}

function isPastByDateLabels(event: DiscoverEvent, now: Date): boolean {
  const labels = [event.dateTime, event.dateTag, ...(event.showDates ?? [])].filter(Boolean) as string[]
  if (labels.length === 0) return false

  const years = labels.flatMap(parseYearsFromDateLabel)
  if (years.length === 0) return false

  const latestYear = Math.max(...years)
  const currentYear = now.getFullYear()
  if (latestYear < currentYear) return true
  if (latestYear > currentYear) return false

  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ]
  const combined = labels.join(' ').toLowerCase()
  let latestMonth = -1
  for (let i = 0; i < monthNames.length; i += 1) {
    if (combined.includes(monthNames[i])) latestMonth = Math.max(latestMonth, i)
  }
  if (latestMonth >= 0 && latestMonth < now.getMonth()) return true

  return false
}

/** True when the underlying experience is over (host schedule or dated seed cards). */
export function isDiscoverEventExpired(event: DiscoverEvent, now = new Date()): boolean {
  if (isOpenEndedDiscoverExperience(event)) return false

  if (event.hostEventId) {
    const hostEvent = getHostEventById(event.hostEventId)
    if (hostEvent) {
      if (hostEvent.status === 'past') return true
      const end = getEventEndDate(hostEvent)
      if (end && end.getTime() < now.getTime()) return true
      return false
    }
  }

  return isPastByDateLabels(event, now)
}

export function getDiscoverEventOrganizerName(event: DiscoverEvent): string | null {
  return event.hostLabel?.trim() || null
}

export function getDiscoverEventOrganizerProfileUrl(event: DiscoverEvent): string | null {
  if (event.hostProfileUrl?.trim()) return event.hostProfileUrl.trim()
  if (event.hostEventId) {
    const hostEvent = getHostEventById(event.hostEventId)
    if (hostEvent) return getHostProfileUrlFromEvent(hostEvent)
  }
  if (event.hostAccountId) return getOrgPublicProfileUrl(event.hostAccountId)
  if (event.organizationId) return getOrgPublicProfileUrl(event.organizationId)
  return null
}

export function getDiscoverEventMapsUrl(event: DiscoverEvent): string | null {
  if (event.mapsQuery?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.mapsQuery.trim())}`
  }
  const parts = [event.streetAddress, event.venueName, event.city].filter(Boolean)
  if (parts.length === 0) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}
