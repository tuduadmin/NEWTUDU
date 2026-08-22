import { getOrganization } from './account'
import { getCurrentUser } from './auth'
import { DEMO_USER } from './demoAccounts'
import {
  getOrgPublicProfileUrl,
  getPersonalPublicProfileUrl,
  loadOrgPublicProfile,
  loadPersonalPublicProfile,
} from './publicHostProfile'

const STORAGE_KEY = 'tudu-follows'

export type FollowedHostRef = {
  kind: 'personal' | 'org'
  id: string
  followedAt: string
}

export type ResolvedFollowedHost = FollowedHostRef & {
  displayName: string
  avatarUrl?: string
  profileUrl: string
}

type FollowStore = Record<string, FollowedHostRef[]>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readStore(): FollowStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FollowStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: FollowStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getHostFollowKey(kind: 'personal' | 'org', id: string): string {
  return `${kind}:${kind === 'personal' ? normalizeEmail(id) : id}`
}

export function parseHostFollowKey(key: string): FollowedHostRef | null {
  const [kind, ...rest] = key.split(':')
  if (kind !== 'personal' && kind !== 'org') return null
  const id = rest.join(':')
  if (!id) return null
  return { kind, id, followedAt: '' }
}

function getViewerKey(viewerEmail: string): string {
  return normalizeEmail(viewerEmail)
}

export function getViewerFollows(viewerEmail?: string): FollowedHostRef[] {
  const email = viewerEmail ?? getCurrentUser()?.email
  if (!email) return []
  return readStore()[getViewerKey(email)] ?? []
}

export function getFollowingCount(viewerEmail?: string): number {
  return getViewerFollows(viewerEmail).length
}

/** Total followers for a host profile (all viewers in local store). */
export function getHostFollowerCount(hostKind: 'personal' | 'org', hostId: string): number {
  const targetKey = getHostFollowKey(hostKind, hostId)
  const store = readStore()
  let count = 0
  for (const follows of Object.values(store)) {
    if (follows.some((ref) => getHostFollowKey(ref.kind, ref.id) === targetKey)) {
      count += 1
    }
  }
  return count
}

/** Followers gained within the last N days. */
export function getRecentHostFollowerCount(
  hostKind: 'personal' | 'org',
  hostId: string,
  withinDays = 30,
): number {
  const targetKey = getHostFollowKey(hostKind, hostId)
  const store = readStore()
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000
  let count = 0
  for (const follows of Object.values(store)) {
    for (const ref of follows) {
      if (getHostFollowKey(ref.kind, ref.id) !== targetKey) continue
      const ts = ref.followedAt ? new Date(ref.followedAt).getTime() : Date.now()
      if (ts >= cutoff) count += 1
    }
  }
  return count
}

export function isFollowingHost(
  hostKind: 'personal' | 'org',
  hostId: string,
  viewerEmail?: string,
): boolean {
  const email = viewerEmail ?? getCurrentUser()?.email
  if (!email) return false
  const key = getHostFollowKey(hostKind, hostId)
  return getViewerFollows(email).some((ref) => getHostFollowKey(ref.kind, ref.id) === key)
}

export function toggleFollowHost(
  hostKind: 'personal' | 'org',
  hostId: string,
  viewerEmail: string,
): { following: boolean; error?: string } {
  const viewerKey = getViewerKey(viewerEmail)
  if (!viewerKey) return { following: false, error: 'Sign in to follow hosts.' }

  const store = readStore()
  const list = store[viewerKey] ?? []
  const targetKey = getHostFollowKey(hostKind, hostId)
  const existingIndex = list.findIndex((ref) => getHostFollowKey(ref.kind, ref.id) === targetKey)

  if (existingIndex >= 0) {
    list.splice(existingIndex, 1)
    store[viewerKey] = list
    writeStore(store)
    return { following: false }
  }

  store[viewerKey] = [
    ...list,
    { kind: hostKind, id: hostKind === 'personal' ? normalizeEmail(hostId) : hostId, followedAt: new Date().toISOString() },
  ]
  writeStore(store)
  return { following: true }
}

export function resolveFollowedHost(ref: FollowedHostRef): ResolvedFollowedHost | null {
  if (ref.kind === 'personal') {
    const profile = loadPersonalPublicProfile(ref.id)
    if (!profile) return null
    return {
      ...ref,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      profileUrl: getPersonalPublicProfileUrl(ref.id),
    }
  }

  const org = getOrganization(ref.id)
  const profile = loadOrgPublicProfile(ref.id)
  if (!org || !profile) return null
  return {
    ...ref,
    displayName: org.name,
    avatarUrl: profile.avatarUrl,
    profileUrl: getOrgPublicProfileUrl(ref.id),
  }
}

export function resolveViewerFollowing(viewerEmail?: string): ResolvedFollowedHost[] {
  return getViewerFollows(viewerEmail)
    .map(resolveFollowedHost)
    .filter((item): item is ResolvedFollowedHost => item !== null)
}

/** Seed a demo org follow so My Tudu feed is not empty for demo@tudu.ca. */
export function seedDemoHostFollowsIfNeeded(viewerEmail: string): void {
  if (normalizeEmail(viewerEmail) !== DEMO_USER.email) return
  if (getViewerFollows(viewerEmail).length > 0) return

  const viewerKey = getViewerKey(viewerEmail)
  const store = readStore()
  store[viewerKey] = [
    {
      kind: 'org',
      id: 'org_demo_kindersley',
      followedAt: new Date().toISOString(),
    },
  ]
  writeStore(store)
}
