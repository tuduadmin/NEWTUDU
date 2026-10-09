import { getCurrentUser } from './auth'
import { MOCK_FOLLOWABLE_USERS, type FollowableUser } from '../data/mockUsers'
import { getOrgPublicProfileUrl, getPersonalPublicProfileUrl } from './publicHostProfile'

const STORAGE_KEY = 'tudu_user_follows'

type FollowStore = Record<string, string[]>

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

function seedFollowIds(): string[] {
  return MOCK_FOLLOWABLE_USERS.filter((u) => u.following).map((u) => u.id)
}

export function getFollowedUserIds(viewerEmail?: string): string[] {
  const email = viewerEmail ?? getCurrentUser()?.email
  if (!email) return []
  const key = normalizeEmail(email)
  const store = readStore()
  if (!store[key]) {
    store[key] = seedFollowIds()
    writeStore(store)
  }
  return store[key]
}

export function getFollowedUsers(viewerEmail?: string): FollowableUser[] {
  const ids = new Set(getFollowedUserIds(viewerEmail))
  return MOCK_FOLLOWABLE_USERS.filter((u) => ids.has(u.id))
}

export function isFollowingUser(userId: string, viewerEmail?: string): boolean {
  return getFollowedUserIds(viewerEmail).includes(userId)
}

export function toggleFollowUser(
  userId: string,
  viewerEmail?: string,
): { following: boolean } {
  const email = viewerEmail ?? getCurrentUser()?.email
  if (!email) return { following: false }

  const key = normalizeEmail(email)
  const store = readStore()
  const list = store[key] ?? seedFollowIds()
  const index = list.indexOf(userId)

  if (index >= 0) {
    list.splice(index, 1)
  } else {
    list.push(userId)
  }

  store[key] = list
  writeStore(store)
  return { following: index < 0 }
}

export function getFollowableUserById(userId: string): FollowableUser | undefined {
  return MOCK_FOLLOWABLE_USERS.find((u) => u.id === userId)
}

export function resolveTaggedFollowers(ids: string[]): FollowableUser[] {
  return ids
    .map((id) => getFollowableUserById(id))
    .filter((u): u is FollowableUser => u != null)
}

export function getFollowableUserProfileUrl(user: FollowableUser): string {
  return user.profileKind === 'org'
    ? getOrgPublicProfileUrl(user.profileId)
    : getPersonalPublicProfileUrl(user.profileId)
}
