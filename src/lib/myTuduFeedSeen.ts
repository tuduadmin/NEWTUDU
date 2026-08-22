const STORAGE_KEY = 'tudu-my-tudu-feed-seen'

/** How far back we look for merch drops on a first visit (or after a long absence). */
export const NEW_MERCH_FEED_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

type FeedSeenStore = Record<string, string>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readStore(): FeedSeenStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FeedSeenStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: FeedSeenStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getLastMyTuduFeedSeenAt(viewerEmail: string): string | null {
  return readStore()[normalizeEmail(viewerEmail)] ?? null
}

/** Cutoff for “new merch” — since last feed visit, within the rolling window. */
export function getMyTuduMerchFeedCutoff(viewerEmail: string, now = Date.now()): string {
  const windowStart = new Date(now - NEW_MERCH_FEED_WINDOW_MS).toISOString()
  const lastSeen = getLastMyTuduFeedSeenAt(viewerEmail)
  if (!lastSeen) return windowStart
  return lastSeen > windowStart ? lastSeen : windowStart
}

export function markMyTuduFeedSeen(viewerEmail: string, at = new Date()): void {
  const key = normalizeEmail(viewerEmail)
  const store = readStore()
  store[key] = at.toISOString()
  writeStore(store)
}

export function isMerchProductNewForFeed(
  productCreatedAt: string,
  cutoffIso: string,
): boolean {
  return productCreatedAt > cutoffIso
}
