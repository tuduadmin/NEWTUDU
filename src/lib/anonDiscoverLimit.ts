export const ANON_DISCOVER_SEEN_KEY = 'tudu-anon-discover-seen'
export const ANON_DISCOVER_LIMIT = 3

export function getAnonDiscoverCardsSeen(): number {
  try {
    const raw = sessionStorage.getItem(ANON_DISCOVER_SEEN_KEY)
    const parsed = raw ? parseInt(raw, 10) : 1
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  } catch {
    return 1
  }
}

export function setAnonDiscoverCardsSeen(count: number): void {
  try {
    sessionStorage.setItem(ANON_DISCOVER_SEEN_KEY, String(count))
  } catch {
    // sessionStorage unavailable — ignore
  }
}

export function isAnonDiscoverLimitReached(): boolean {
  return getAnonDiscoverCardsSeen() >= ANON_DISCOVER_LIMIT
}
