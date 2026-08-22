import type { DiscoverEvent } from '../data/discoverEvents'
import { getHostEventById } from './account'
import { getEventEndDate, getEventStartDate } from './hostEventSchedule'

export type EventSchedule = {
  start: Date
  end: Date
  allDay: boolean
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

function parseDateTimeLabel(dateTime: string): EventSchedule | null {
  const trimmed = dateTime.trim()
  const timedMatch = trimmed.match(/^([A-Za-z]{3,9}\s+\d{1,2}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (timedMatch) {
    const [, datePart, hour, minute, period] = timedMatch
    const year = new Date().getFullYear()
    const start = new Date(`${datePart}, ${year}`)
    const { h, m } = parse12hTime(hour, minute, period.toUpperCase() as 'AM' | 'PM')
    start.setHours(h, m, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 2)
    return { start, end, allDay: false }
  }

  const dateOnlyMatch = trimmed.match(/^([A-Za-z]{3,9}\s+\d{1,2})$/i)
  if (dateOnlyMatch) {
    const year = new Date().getFullYear()
    const start = new Date(`${dateOnlyMatch[1]}, ${year}`)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end, allDay: true }
  }

  return null
}

function defaultSchedule(): EventSchedule {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end, allDay: true }
}

export function resolveEventSchedule(event: DiscoverEvent): EventSchedule {
  if (event.hostEventId) {
    const hostEvent = getHostEventById(event.hostEventId)
    if (hostEvent) {
      const start = getEventStartDate(hostEvent)
      const end = getEventEndDate(hostEvent)
      if (start) {
        const resolvedEnd =
          end ??
          (() => {
            const fallback = new Date(start)
            if (hostEvent.allDay) {
              fallback.setDate(fallback.getDate() + 1)
            } else {
              fallback.setHours(fallback.getHours() + 2)
            }
            return fallback
          })()
        return { start, end: resolvedEnd, allDay: !!hostEvent.allDay }
      }
    }
  }

  if (event.dateTime) {
    const parsed = parseDateTimeLabel(event.dateTime)
    if (parsed) return parsed
  }

  return defaultSchedule()
}

export function getEventMapsQuery(event: DiscoverEvent): string {
  return (
    event.mapsQuery ??
    [event.venueName, event.streetAddress, event.city].filter(Boolean).join(', ')
  )
}

export function getDiscoverEventShareUrl(event: DiscoverEvent): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tudu.ca'
  if (event.hostEventId) {
    return `${origin}/event/${event.hostEventId}/rsvp`
  }
  return `${origin}/discover?event=${encodeURIComponent(event.id)}`
}

export function getDiscoverEventShareText(event: DiscoverEvent): string {
  const venue = event.venueName ?? event.locationDetail ?? event.city
  const date = event.dateTime ?? event.dateTag ?? 'soon'
  return `🎉 ${event.title} at ${venue} — ${date}`
}

function formatGoogleCalendarDate(date: Date, allDay: boolean, isEnd = false): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  if (allDay) {
    if (isEnd) {
      const next = new Date(date)
      next.setDate(next.getDate() + 1)
      return `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`
    }
    return `${y}${m}${d}`
  }
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}${ss}`
}

function formatIcsDate(date: Date, allDay: boolean): string {
  if (allDay) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}${m}${d}`
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildGoogleCalendarUrl(event: DiscoverEvent, schedule: EventSchedule): string {
  const location = getEventMapsQuery(event)
  const start = formatGoogleCalendarDate(schedule.start, schedule.allDay)
  const end = formatGoogleCalendarDate(schedule.end, schedule.allDay, true)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
  })
  if (event.description) params.set('details', event.description)
  if (location) params.set('location', location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function downloadEventIcs(event: DiscoverEvent, schedule: EventSchedule): void {
  const location = getEventMapsQuery(event)
  const uid = `${event.id}@tudu.ca`
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const dtStart = formatIcsDate(schedule.start, schedule.allDay)
  const icsEnd = schedule.allDay
    ? (() => {
        const next = new Date(schedule.end)
        next.setDate(next.getDate() + 1)
        next.setHours(0, 0, 0, 0)
        return next
      })()
    : schedule.end
  const dtEnd = formatIcsDate(icsEnd, schedule.allDay)

  const startLine = schedule.allDay
    ? `DTSTART;VALUE=DATE:${dtStart}`
    : `DTSTART:${dtStart}`
  const endLine = schedule.allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TUDU//Discover Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    startLine,
    endLine,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ]
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${event.title.replace(/[^\w\s-]/g, '').trim() || 'event'}.ics`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function addDiscoverEventToCalendar(event: DiscoverEvent): void {
  const schedule = resolveEventSchedule(event)
  const gcalUrl = buildGoogleCalendarUrl(event, schedule)
  const opened = window.open(gcalUrl, '_blank', 'noopener,noreferrer')
  if (!opened) {
    downloadEventIcs(event, schedule)
  }
}

export function openDiscoverEventDirections(event: DiscoverEvent): void {
  const destination = getEventMapsQuery(event)
  if (!destination) return
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export type ShareDiscoverEventResult = 'shared' | 'cancelled' | 'sheet'

/** Touch-first phones/tablets where the OS native share sheet is expected. */
export function isMobileShareDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function isSecureShareContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext
}

export function canUseWebShare(data?: ShareData): boolean {
  if (!isSecureShareContext()) return false
  if (typeof navigator.share !== 'function') return false
  if (!data) return true
  if (typeof navigator.canShare !== 'function') return !!data.url
  try {
    return navigator.canShare(data)
  } catch {
    return false
  }
}

function buildSharePayloads(event: DiscoverEvent): ShareData[] {
  const url = getDiscoverEventShareUrl(event)
  const text = getDiscoverEventShareText(event)
  return [{ title: event.title, text, url }, { text: `${text}\n${url}` }, { url }]
}

export function buildWhatsAppShareUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
}

export function buildFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}

export function buildTwitterShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url })
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

export function buildSmsShareUrl(text: string, url: string): string {
  return `sms:?body=${encodeURIComponent(`${text} ${url}`)}`
}

export function buildEmailShareUrl(title: string, text: string, url: string): string {
  const params = new URLSearchParams({
    subject: title,
    body: `${text} ${url}`,
  })
  return `mailto:?${params.toString()}`
}

async function tryWebShare(data: ShareData): Promise<'shared' | 'cancelled' | 'unsupported'> {
  try {
    await navigator.share(data)
    return 'shared'
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    return 'unsupported'
  }
}

async function copyLinkToClipboard(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return true
    }
  } catch {
    /* fall through to execCommand for non-secure contexts (e.g. http:// LAN IP) */
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

export async function copyDiscoverEventShareLink(event: DiscoverEvent): Promise<boolean> {
  return copyLinkToClipboard(getDiscoverEventShareUrl(event))
}

export async function tryNativeDiscoverEventShare(
  event: DiscoverEvent,
): Promise<'shared' | 'cancelled' | 'unsupported'> {
  if (!canUseWebShare()) return 'unsupported'

  for (const payload of buildSharePayloads(event)) {
    if (!canUseWebShare(payload)) continue
    const result = await tryWebShare(payload)
    if (result === 'shared' || result === 'cancelled') return result
  }

  return 'unsupported'
}

/** Native OS share sheet on secure mobile; custom sheet fallback on HTTP or unsupported. */
export async function shareDiscoverEvent(
  event: DiscoverEvent,
): Promise<ShareDiscoverEventResult> {
  if (isSecureShareContext() && isMobileShareDevice()) {
    const result = await tryNativeDiscoverEventShare(event)
    if (result === 'shared' || result === 'cancelled') return result
    return 'sheet'
  }

  if (canUseWebShare()) {
    const result = await tryNativeDiscoverEventShare(event)
    if (result === 'shared' || result === 'cancelled') return result
  }

  return 'sheet'
}
