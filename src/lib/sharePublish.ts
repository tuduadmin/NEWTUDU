import type { HostEvent } from './account'
import { getPrivateShareUrl } from './account'
import { sendAdminMessage } from './adminMessages'
import { formatHostEventDateTime } from './hostEventSchedule'
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
  buildTwitterShareUrl,
  canUseWebShare,
  tryNativeDiscoverEventShare,
} from './eventDetailActions'
import type { DiscoverEvent } from '../data/discoverEvents'

export function getHostEventShareUrl(event: HostEvent): string {
  if (event.visibility === 'private') {
    return getPrivateShareUrl(event)
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tudu.ca'
  return `${origin}/event/${event.id}/rsvp`
}

export function getHostEventShareText(event: HostEvent): string {
  const venue = [event.venueName, event.city].filter(Boolean).join(', ') || 'TUDU'
  const date = formatHostEventDateTime(event) || 'soon'
  return `🎉 ${event.title} at ${venue} — ${date}`
}

export function buildLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

function hostEventToMinimalDiscoverEvent(event: HostEvent): DiscoverEvent {
  return {
    id: `host-${event.id}`,
    title: event.title,
    city: event.city ?? 'Saskatoon',
    image: event.photos?.[0] ?? '',
    hostEventId: event.id,
    dateTime: formatHostEventDateTime(event),
    badges: [],
    amenities: [],
    amenityLabels: [],
    dateTag: event.status === 'live' ? 'Live Now' : 'Upcoming',
    cost: 'RSVP',
    isRsvp: true,
    isWaitlist: false,
    isUnavailable: false,
    distance: '',
    categories: [],
    keywords: [],
    actionLabel: 'RSVP',
    rsvpPath: `/event/${event.id}/rsvp`,
    ticketingMode: 'free_rsvp',
    goingCount: 0,
    savedCount: 0,
    viewCount: 0,
    atDoorAvailable: false,
  }
}

export async function copyHostEventShareLink(event: HostEvent): Promise<boolean> {
  return copyLinkToClipboard(getHostEventShareUrl(event))
}

export async function tryNativeHostEventShare(
  event: HostEvent,
): Promise<'shared' | 'cancelled' | 'unsupported'> {
  if (!canUseWebShare()) return 'unsupported'
  const discover = hostEventToMinimalDiscoverEvent(event)
  return tryNativeDiscoverEventShare(discover)
}

export function buildHostEventEmailShareUrl(event: HostEvent): string {
  const url = getHostEventShareUrl(event)
  const text = getHostEventShareText(event)
  return buildEmailShareUrl(event.title, text, url)
}

export function buildHostEventFacebookShareUrl(event: HostEvent): string {
  return buildFacebookShareUrl(getHostEventShareUrl(event))
}

export function buildHostEventTwitterShareUrl(event: HostEvent): string {
  const url = getHostEventShareUrl(event)
  const text = getHostEventShareText(event)
  return buildTwitterShareUrl(text, url)
}

export type PrivateShareResult = {
  sent: number
  skipped: number
}

export function sendPrivateEventShare(input: {
  event: HostEvent
  recipientEmails: string[]
  message?: string
  fromEmail?: string
}): PrivateShareResult {
  const url = getHostEventShareUrl(input.event)
  const defaultBody = `${getHostEventShareText(input.event)}\n\n${url}`
  const body = input.message?.trim()
    ? `${input.message.trim()}\n\n${defaultBody}`
    : defaultBody
  const subject = `You're invited: ${input.event.title}`

  const unique = [...new Set(input.recipientEmails.map((e) => e.toLowerCase()))]
  let sent = 0
  let skipped = 0

  for (const toEmail of unique) {
    if (!toEmail) {
      skipped += 1
      continue
    }
    sendAdminMessage({
      toEmail,
      subject,
      body,
      fromEmail: input.fromEmail,
      deliveryChannels: ['in_app', 'email'],
    })
    sent += 1
  }

  return { sent, skipped }
}

async function copyLinkToClipboard(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return true
    }
  } catch {
    /* fall through */
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
