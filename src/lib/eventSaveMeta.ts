import { findDiscoverEventByTargetId } from '../data/discoverEvents'
import { getHiddenGemById } from './hiddenGems'
import { getHostEventById } from './account'
import { getAttractionById } from './attractions'
import { parseHiddenGemIdFromEventId } from './hiddenGemIds'

export { hiddenGemDiscoverId, parseHiddenGemIdFromEventId, HIDDEN_GEM_EVENT_PREFIX } from './hiddenGemIds'

export type ResolvedEventSaveMeta = {
  eventId: string
  eventCity: string
  hostEventId?: string
  attractionId?: string
  hiddenGemId?: string
}

/** Resolve city and linked ids for analytics when saving from bucket list or road trip. */
export function resolveEventSaveMeta(eventId: string): ResolvedEventSaveMeta | null {
  const hiddenGemId = parseHiddenGemIdFromEventId(eventId)
  if (hiddenGemId) {
    const gem = getHiddenGemById(hiddenGemId)
    if (gem) {
      return {
        eventId,
        eventCity: gem.location.city,
        attractionId: gem.id,
        hiddenGemId: gem.id,
      }
    }
  }

  const fromPool = findDiscoverEventByTargetId(eventId)
  if (fromPool) {
    return {
      eventId,
      eventCity: fromPool.city,
      hostEventId: fromPool.hostEventId,
      attractionId: fromPool.attractionId,
      hiddenGemId: fromPool.attractionId
        ? parseHiddenGemIdFromEventId(eventId) ?? undefined
        : undefined,
    }
  }

  const hostEvent = getHostEventById(eventId)
  if (hostEvent) {
    return {
      eventId,
      eventCity: hostEvent.city ?? '',
      hostEventId: hostEvent.id,
    }
  }

  const attraction = getAttractionById(eventId)
  if (attraction) {
    return {
      eventId,
      eventCity: attraction.location.city,
      attractionId: attraction.id,
    }
  }

  return null
}
