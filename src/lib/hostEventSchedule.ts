import type { HostEvent } from './account'
import { getHostEvents } from './account'

export type OrgEventTab = 'upcoming' | 'live' | 'past' | 'drafts'

const ORG_EVENT_TABS: OrgEventTab[] = ['upcoming', 'live', 'past', 'drafts']

export const ORG_EVENT_TAB_LABELS: Record<OrgEventTab, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  past: 'Past',
  drafts: 'Drafts',
}

export function orgEventTabs(): OrgEventTab[] {
  return ORG_EVENT_TABS
}

function parse12hTime(
  hour?: string,
  minute?: string,
  period?: 'AM' | 'PM',
): { h: number; m: number } {
  let h = parseInt(hour ?? '12', 10)
  const m = parseInt(minute ?? '0', 10)
  if (period === 'AM') {
    if (h === 12) h = 0
  } else if (h !== 12) {
    h += 12
  }
  return { h, m }
}

export function getEventStartDate(event: HostEvent): Date | null {
  if (!event.eventDate) return null
  const d = new Date(`${event.eventDate}T00:00:00`)
  if (event.allDay) return d
  const { h, m } = parse12hTime(event.startHour, event.startMinute, event.startPeriod)
  d.setHours(h, m, 0, 0)
  return d
}

export function getEventEndDate(event: HostEvent): Date | null {
  const endDateStr = event.recurrenceEndDate || event.eventDate
  if (!endDateStr) return null
  const d = new Date(`${endDateStr}T00:00:00`)
  if (event.allDay) {
    d.setHours(23, 59, 59, 999)
    return d
  }
  const { h, m } = parse12hTime(event.endHour, event.endMinute, event.endPeriod)
  d.setHours(h, m, 59, 999)
  return d
}

export function formatHostEventDateTime(event: HostEvent): string {
  if (!event.eventDate) return '—'
  const date = new Date(`${event.eventDate}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (event.allDay) return `${date} · All day`
  const startMin = (event.startMinute ?? '00').padStart(2, '0')
  const start = `${event.startHour ?? '12'}:${startMin} ${event.startPeriod ?? 'PM'}`
  if (event.endHour) {
    const endMin = (event.endMinute ?? '00').padStart(2, '0')
    const end = `${event.endHour}:${endMin} ${event.endPeriod ?? 'PM'}`
    return `${date} · ${start} – ${end}`
  }
  return `${date} · ${start}`
}

/** Tab bucket for org overview event lists (status + schedule). */
export function getOrgEventListTab(event: HostEvent, now = new Date()): OrgEventTab {
  if (event.status === 'draft') return 'drafts'
  if (event.status === 'past') return 'past'

  const end = getEventEndDate(event)
  if (end && end < now) return 'past'

  const start = getEventStartDate(event)
  if (start && start > now) return 'upcoming'

  if (start && start <= now && (!end || end >= now)) return 'live'

  if (event.status === 'upcoming') return 'upcoming'
  if (event.status === 'live') return 'live'

  return 'past'
}

export function isHostEventPublished(event: HostEvent): boolean {
  return event.status !== 'draft'
}

/** Whether an event is currently live per schedule + status rules. */
export function isHostEventLive(event: HostEvent, now = new Date()): boolean {
  return getOrgEventListTab(event, now) === 'live'
}

/** All host events that are live right now (excludes drafts and past). */
export function getLiveHostEvents(now = new Date()): HostEvent[] {
  return getHostEvents().filter((event) => isHostEventLive(event, now))
}
