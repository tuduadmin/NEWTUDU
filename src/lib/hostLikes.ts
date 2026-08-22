import { getCurrentUser } from './auth'
import { getHostFollowKey } from './hostFollows'

const STORAGE_KEY = 'tudu-host-likes'

/** hostKey → set of viewer emails who liked this host */
type HostLikeStore = Record<string, string[]>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readStore(): HostLikeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as HostLikeStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: HostLikeStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getHostLikeCount(hostKind: 'personal' | 'org', hostId: string): number {
  const key = getHostFollowKey(hostKind, hostId)
  return readStore()[key]?.length ?? 0
}

export function isHostLiked(
  hostKind: 'personal' | 'org',
  hostId: string,
  viewerEmail?: string,
): boolean {
  const email = viewerEmail ?? getCurrentUser()?.email
  if (!email) return false
  const key = getHostFollowKey(hostKind, hostId)
  const likers = readStore()[key] ?? []
  return likers.includes(normalizeEmail(email))
}

export function toggleHostLike(
  hostKind: 'personal' | 'org',
  hostId: string,
  viewerEmail: string,
): { liked: boolean; likeCount: number; error?: string } {
  const viewerKey = normalizeEmail(viewerEmail)
  if (!viewerKey) {
    return { liked: false, likeCount: getHostLikeCount(hostKind, hostId), error: 'Sign in to like hosts.' }
  }

  const hostKey = getHostFollowKey(hostKind, hostId)
  const store = readStore()
  const likers = store[hostKey] ?? []
  const existingIndex = likers.indexOf(viewerKey)

  if (existingIndex >= 0) {
    likers.splice(existingIndex, 1)
    store[hostKey] = likers
    writeStore(store)
    return { liked: false, likeCount: likers.length }
  }

  store[hostKey] = [...likers, viewerKey]
  writeStore(store)
  return { liked: true, likeCount: store[hostKey].length }
}
