import { getHostEvents, type HostEvent } from './account'
import { isEventHiddenFromDiscover } from './adminEventModeration'
import { buildDiscoverCardFromHostEvent, type DiscoverEvent } from '../data/discoverEvents'
import {
  getMerchProductsForEvent,
  getMerchProductsForHost,
  type EventMerchProduct,
} from './eventMerch'
import {
  getViewerFollows,
  resolveFollowedHost,
  seedDemoHostFollowsIfNeeded,
  type FollowedHostRef,
  type ResolvedFollowedHost,
} from './hostFollows'
import {
  getMyTuduMerchFeedCutoff,
  isMerchProductNewForFeed,
} from './myTuduFeedSeen'

export type MyTuduFeedEventItem = {
  kind: 'event'
  id: string
  postedAt: string
  host: ResolvedFollowedHost
  event: DiscoverEvent
}

export type MyTuduFeedMerchItem = {
  kind: 'merch'
  id: string
  postedAt: string
  host: ResolvedFollowedHost
  eventId: string
  eventTitle: string
  products: EventMerchProduct[]
}

export type MyTuduFeedItem = MyTuduFeedEventItem | MyTuduFeedMerchItem

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function formatFeedTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 'Recently'
  const mins = Math.floor((Date.now() - then) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isFeedablePublicEvent(event: HostEvent, now = new Date()): boolean {
  if (event.visibility !== 'public') return false
  if (event.status !== 'live' && event.status !== 'upcoming') return false
  if (isEventHiddenFromDiscover(event.id)) return false
  if (event.scheduledPublishAt) {
    const publishAt = new Date(event.scheduledPublishAt).getTime()
    if (Number.isFinite(publishAt) && publishAt > now.getTime()) return false
  }
  if (event.eventDate) {
    const end = new Date(`${event.eventDate}T23:59:59`)
    if (Number.isFinite(end.getTime()) && end.getTime() < now.getTime()) return false
  }
  return true
}

function eventBelongsToHost(event: HostEvent, ref: FollowedHostRef): boolean {
  if (ref.kind === 'org') {
    return event.hostAccountId === ref.id
  }
  const email = normalizeEmail(ref.id)
  const poster = normalizeEmail(event.postedAsUserId ?? event.createdBy ?? '')
  return !event.hostAccountId && poster === email
}

export function getMyTuduFeedItems(viewerEmail: string): MyTuduFeedItem[] {
  seedDemoHostFollowsIfNeeded(viewerEmail)

  const items: MyTuduFeedItem[] = []
  const follows = getViewerFollows(viewerEmail)
  const allEvents = getHostEvents()
  const merchCutoff = getMyTuduMerchFeedCutoff(viewerEmail)

  for (const ref of follows) {
    const host = resolveFollowedHost(ref)
    if (!host) continue

    const hostEvents = allEvents.filter(
      (event) => eventBelongsToHost(event, ref) && isFeedablePublicEvent(event),
    )

    for (const event of hostEvents) {
      items.push({
        kind: 'event',
        id: `feed-event-${event.id}`,
        postedAt: event.createdAt,
        host,
        event: buildDiscoverCardFromHostEvent(event),
      })
    }

    const merchProducts = getMerchProductsForHost(ref.kind, ref.id).filter(
      (p) => p.active && isMerchProductNewForFeed(p.createdAt, merchCutoff),
    )
    const productsByEvent = new Map<string, EventMerchProduct[]>()
    for (const product of merchProducts) {
      const list = productsByEvent.get(product.eventId) ?? []
      list.push(product)
      productsByEvent.set(product.eventId, list)
    }

    for (const [eventId, products] of productsByEvent) {
      const event = allEvents.find((e) => e.id === eventId)
      if (!event || !isFeedablePublicEvent(event)) continue
      const newest = products.reduce(
        (latest, product) => (product.createdAt > latest ? product.createdAt : latest),
        products[0]?.createdAt ?? new Date().toISOString(),
      )
      items.push({
        kind: 'merch',
        id: `feed-merch-${eventId}-${newest}`,
        postedAt: newest,
        host,
        eventId,
        eventTitle: event.title,
        products,
      })
    }
  }

  return items.sort((a, b) => b.postedAt.localeCompare(a.postedAt))
}

export function getMyTuduFeedTimeLabel(iso: string): string {
  return formatFeedTime(iso)
}

export function getMerchProductsForFeedEvent(eventId: string): EventMerchProduct[] {
  return getMerchProductsForEvent(eventId).filter((p) => p.active)
}
