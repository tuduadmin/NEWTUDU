import { getAllAccounts } from './account'
import { getAllUsers } from './auth'
import { isAdminEmail } from './analyticsGeo'

const SHARE_LISTS_KEY = 'tudu-share-lists'

export type ShareListMember = {
  email: string
  name: string
}

export type ShareList = {
  id: string
  name: string
  memberEmails: string[]
  createdAt: string
  updatedAt: string
}

function readLists(): ShareList[] {
  try {
    const raw = localStorage.getItem(SHARE_LISTS_KEY)
    return raw ? (JSON.parse(raw) as ShareList[]) : []
  } catch {
    return []
  }
}

function writeLists(lists: ShareList[]): void {
  localStorage.setItem(SHARE_LISTS_KEY, JSON.stringify(lists))
}

function generateId(): string {
  return `list_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getShareLists(): ShareList[] {
  return readLists().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function getShareListById(id: string): ShareList | null {
  return readLists().find((l) => l.id === id) ?? null
}

export function createShareList(name: string, memberEmails: string[] = []): ShareList {
  const now = new Date().toISOString()
  const list: ShareList = {
    id: generateId(),
    name: name.trim() || 'Untitled list',
    memberEmails: [...new Set(memberEmails.map((e) => e.toLowerCase()))],
    createdAt: now,
    updatedAt: now,
  }
  const lists = readLists()
  lists.push(list)
  writeLists(lists)
  return list
}

export function updateShareList(
  id: string,
  patch: Partial<Pick<ShareList, 'name' | 'memberEmails'>>,
): ShareList | null {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === id)
  if (idx < 0) return null
  const now = new Date().toISOString()
  lists[idx] = {
    ...lists[idx],
    ...patch,
    memberEmails: patch.memberEmails
      ? [...new Set(patch.memberEmails.map((e) => e.toLowerCase()))]
      : lists[idx].memberEmails,
    name: patch.name?.trim() || lists[idx].name,
    updatedAt: now,
  }
  writeLists(lists)
  return lists[idx]
}

export function deleteShareList(id: string): boolean {
  const lists = readLists()
  const next = lists.filter((l) => l.id !== id)
  if (next.length === lists.length) return false
  writeLists(next)
  return true
}

export function addMemberToShareList(listId: string, email: string): ShareList | null {
  const list = getShareListById(listId)
  if (!list) return null
  const normalized = email.toLowerCase()
  if (list.memberEmails.includes(normalized)) return list
  return updateShareList(listId, { memberEmails: [...list.memberEmails, normalized] })
}

export function removeMemberFromShareList(listId: string, email: string): ShareList | null {
  const list = getShareListById(listId)
  if (!list) return null
  return updateShareList(listId, {
    memberEmails: list.memberEmails.filter((e) => e !== email.toLowerCase()),
  })
}

/** Demo user pool for adding recipients to share lists (Phase 1 localStorage). */
export function getShareListDemoUsers(): ShareListMember[] {
  const nameByEmail = new Map(
    getAllUsers().map((u) => [
      u.email.toLowerCase(),
      `${u.firstName} ${u.lastName}`.trim() || u.email,
    ] as const),
  )

  return getAllAccounts()
    .filter((a) => !isAdminEmail(a.email) && !a.banned)
    .map((a) => ({
      email: a.email,
      name: nameByEmail.get(a.email.toLowerCase()) ?? a.email,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function resolveShareListMembers(list: ShareList): ShareListMember[] {
  const pool = getShareListDemoUsers()
  const byEmail = new Map(pool.map((m) => [m.email.toLowerCase(), m] as const))
  return list.memberEmails.map((email) => byEmail.get(email) ?? { email, name: email })
}

/** Merge direct invite emails with members from selected share lists. */
export function resolvePrivateInviteEmails(
  inviteEmails: string[],
  shareListIds: string[],
): string[] {
  const fromLists = shareListIds.flatMap((id) => getShareListById(id)?.memberEmails ?? [])
  return [...new Set([...inviteEmails, ...fromLists].map((e) => e.toLowerCase()).filter(Boolean))]
}
