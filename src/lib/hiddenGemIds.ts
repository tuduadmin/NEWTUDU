export const HIDDEN_GEM_EVENT_PREFIX = 'hidden-gem-'

export function hiddenGemDiscoverId(gemId: string): string {
  return `${HIDDEN_GEM_EVENT_PREFIX}${gemId}`
}

export function parseHiddenGemIdFromEventId(eventId: string): string | null {
  if (eventId.startsWith(HIDDEN_GEM_EVENT_PREFIX)) {
    return eventId.slice(HIDDEN_GEM_EVENT_PREFIX.length)
  }
  return null
}
