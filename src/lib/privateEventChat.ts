import type { HostEvent } from './account'
import { getFeatureFlags } from './adminSettings'
import { getLoginNameFromUser } from './auth'
import { computeExpiresAt, getNextDisplayDate } from './eventSchedule'
import { resolvePrivateInviteEmails } from './shareLists'
import { getUserTickets } from './userTickets'

export type PrivateEventChatMessage = {
  id: string
  eventId: string
  authorEmail: string
  authorLabel: string
  body: string
  createdAt: string
  deletedAt?: string
  deletedBy?: string
}

export type PrivateEventChatRoom = {
  eventId: string
  /** When the event ended — chat becomes read-only. */
  lockedAt?: string
  /** Hard delete / purge after retention window. */
  expiresAt?: string
  mutedEmails: string[]
  messages: PrivateEventChatMessage[]
}

export type PrivateEventChatAccess = {
  canView: boolean
  canPost: boolean
  isHost: boolean
  isMuted: boolean
  isLocked: boolean
  opensAt?: string
  reason?: string
}

/** Default days after event end before chat is deleted. Host-configurable later. */
export const PRIVATE_EVENT_CHAT_DEFAULT_RETENTION_DAYS = 30

/** Hours before event start when chat opens (optional). */
export const PRIVATE_EVENT_CHAT_OPENS_HOURS_BEFORE = 24

export const PRIVATE_EVENT_CHAT_CHANGED_EVENT = 'tudu-private-event-chat-changed'

const CHAT_KEY = 'tudu-private-event-chat'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readRooms(): Record<string, PrivateEventChatRoom> {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    return raw ? (JSON.parse(raw) as Record<string, PrivateEventChatRoom>) : {}
  } catch {
    return {}
  }
}

function writeRooms(rooms: Record<string, PrivateEventChatRoom>): void {
  localStorage.setItem(CHAT_KEY, JSON.stringify(rooms))
  window.dispatchEvent(new Event(PRIVATE_EVENT_CHAT_CHANGED_EVENT))
}

export function isPrivateEventChatEnabled(): boolean {
  return getFeatureFlags().privateEventChatEnabled
}

function resolveEventStartMs(event: HostEvent, now = new Date()): number | null {
  const displayDate = getNextDisplayDate(event, now)
  if (!displayDate) return null

  const d = new Date(`${displayDate}T12:00:00`)
  if (!event.allDay && event.startHour) {
    let h = parseInt(event.startHour, 10)
    if (event.startPeriod === 'AM') {
      if (h === 12) h = 0
    } else if (h !== 12) {
      h += 12
    }
    d.setHours(h, parseInt(event.startMinute ?? '0', 10), 0, 0)
  }
  return d.getTime()
}

function isEventEnded(event: HostEvent, now = new Date()): boolean {
  const expiresAt = computeExpiresAt(event)
  if (expiresAt) return new Date(expiresAt) < now
  const displayDate = getNextDisplayDate(event, now)
  if (!displayDate) return false
  return displayDate < now.toISOString().slice(0, 10)
}

function computeRoomExpiry(event: HostEvent, lockedAt: string): string {
  const locked = new Date(lockedAt)
  locked.setDate(locked.getDate() + PRIVATE_EVENT_CHAT_DEFAULT_RETENTION_DAYS)
  return locked.toISOString()
}

export function isPrivateEventHost(event: HostEvent, userEmail: string): boolean {
  return normalizeEmail(event.createdBy) === normalizeEmail(userEmail)
}

export function userHasRsvpForEvent(userEmail: string, eventId: string): boolean {
  return getUserTickets(userEmail).some((ticket) => ticket.eventId === eventId)
}

export function getPrivateEventInvitees(event: HostEvent): string[] {
  return resolvePrivateInviteEmails(
    event.privateInviteEmails ?? [],
    event.privateShareListIds ?? [],
  )
}

export function isUserInvitedToPrivateEvent(event: HostEvent, userEmail: string): boolean {
  const email = normalizeEmail(userEmail)
  return getPrivateEventInvitees(event).includes(email)
}

export function canAccessPrivateEventChat(event: HostEvent, userEmail: string | null | undefined): boolean {
  if (event.visibility !== 'private') return false
  if (!userEmail?.trim()) return false
  const email = normalizeEmail(userEmail)
  return (
    isPrivateEventHost(event, email) ||
    isUserInvitedToPrivateEvent(event, email) ||
    userHasRsvpForEvent(email, event.id)
  )
}

export function getPrivateEventChatOpensAt(event: HostEvent, now = new Date()): Date | null {
  const startMs = resolveEventStartMs(event, now)
  if (startMs == null) return null
  return new Date(startMs - PRIVATE_EVENT_CHAT_OPENS_HOURS_BEFORE * 60 * 60 * 1000)
}

export function isPrivateEventChatOpen(event: HostEvent, now = new Date()): boolean {
  const opensAt = getPrivateEventChatOpensAt(event, now)
  if (!opensAt) return true
  return now >= opensAt
}

function ensureRoomLocked(event: HostEvent, room: PrivateEventChatRoom, now = new Date()): PrivateEventChatRoom {
  if (room.lockedAt || !isEventEnded(event, now)) return room
  const lockedAt = now.toISOString()
  return {
    ...room,
    lockedAt,
    expiresAt: computeRoomExpiry(event, lockedAt),
  }
}

export function getPrivateEventChatRoom(eventId: string): PrivateEventChatRoom | null {
  purgeExpiredPrivateEventChatRooms()
  return readRooms()[eventId] ?? null
}

export function getOrCreatePrivateEventChatRoom(eventId: string): PrivateEventChatRoom {
  const rooms = readRooms()
  const existing = rooms[eventId]
  if (existing) return existing
  const room: PrivateEventChatRoom = {
    eventId,
    mutedEmails: [],
    messages: [],
  }
  rooms[eventId] = room
  writeRooms(rooms)
  return room
}

export function getVisibleChatMessages(eventId: string): PrivateEventChatMessage[] {
  const room = getPrivateEventChatRoom(eventId)
  if (!room) return []
  return room.messages
    .filter((message) => !message.deletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function getPrivateEventChatAccess(
  event: HostEvent,
  userEmail: string | null | undefined,
  now = new Date(),
): PrivateEventChatAccess {
  if (event.visibility !== 'private') {
    return {
      canView: false,
      canPost: false,
      isHost: false,
      isMuted: false,
      isLocked: false,
      reason: 'Chat is only available on private events.',
    }
  }

  if (!userEmail?.trim()) {
    return {
      canView: false,
      canPost: false,
      isHost: false,
      isMuted: false,
      isLocked: false,
      reason: 'Sign in to view the event chat.',
    }
  }

  const email = normalizeEmail(userEmail)
  const isHost = isPrivateEventHost(event, email)
  const invited = isUserInvitedToPrivateEvent(event, email)
  const rsvpd = userHasRsvpForEvent(email, event.id)

  if (!isHost && !invited && !rsvpd) {
    return {
      canView: false,
      canPost: false,
      isHost,
      isMuted: false,
      isLocked: false,
      reason: 'Only invited guests and RSVPs can access this chat.',
    }
  }

  const room = getOrCreatePrivateEventChatRoom(event.id)
  const syncedRoom = ensureRoomLocked(event, room, now)
  if (syncedRoom !== room) {
    const rooms = readRooms()
    rooms[event.id] = syncedRoom
    writeRooms(rooms)
  }

  const isMuted = syncedRoom.mutedEmails.includes(email)
  const isLocked = Boolean(syncedRoom.lockedAt)
  const opensAt = getPrivateEventChatOpensAt(event, now)
  const chatOpen = isPrivateEventChatOpen(event, now)

  if (!chatOpen && opensAt) {
    return {
      canView: true,
      canPost: false,
      isHost,
      isMuted,
      isLocked,
      opensAt: opensAt.toISOString(),
      reason: `Chat opens ${opensAt.toLocaleString()}.`,
    }
  }

  if (isLocked) {
    return {
      canView: true,
      canPost: false,
      isHost,
      isMuted,
      isLocked,
      reason: 'This event has ended — chat is read-only.',
    }
  }

  if (isMuted) {
    return {
      canView: true,
      canPost: false,
      isHost,
      isMuted,
      isLocked,
      reason: 'You have been muted in this chat.',
    }
  }

  return {
    canView: true,
    canPost: true,
    isHost,
    isMuted,
    isLocked,
  }
}

export function postPrivateEventChatMessage(
  event: HostEvent,
  authorEmail: string,
  body: string,
): { ok: boolean; error?: string; message?: PrivateEventChatMessage } {
  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'Enter a message.' }

  const access = getPrivateEventChatAccess(event, authorEmail)
  if (!access.canPost) {
    return { ok: false, error: access.reason ?? 'You cannot post in this chat.' }
  }

  const rooms = readRooms()
  let room = ensureRoomLocked(event, getOrCreatePrivateEventChatRoom(event.id))
  const message: PrivateEventChatMessage = {
    id: generateId('pec_msg'),
    eventId: event.id,
    authorEmail: normalizeEmail(authorEmail),
    authorLabel: getLoginNameFromUser(authorEmail) || authorEmail,
    body: trimmed,
    createdAt: new Date().toISOString(),
  }

  room = {
    ...room,
    messages: [...room.messages, message],
  }
  rooms[event.id] = room
  writeRooms(rooms)
  return { ok: true, message }
}

export function deletePrivateEventChatMessage(
  event: HostEvent,
  messageId: string,
  actorEmail: string,
): { ok: boolean; error?: string } {
  if (!isPrivateEventHost(event, actorEmail)) {
    return { ok: false, error: 'Only the host can delete messages.' }
  }

  const rooms = readRooms()
  const room = rooms[event.id]
  if (!room) return { ok: false, error: 'Chat not found.' }

  const idx = room.messages.findIndex((message) => message.id === messageId)
  if (idx < 0) return { ok: false, error: 'Message not found.' }

  const nextMessages = [...room.messages]
  nextMessages[idx] = {
    ...nextMessages[idx],
    deletedAt: new Date().toISOString(),
    deletedBy: normalizeEmail(actorEmail),
  }
  rooms[event.id] = { ...room, messages: nextMessages }
  writeRooms(rooms)
  return { ok: true }
}

export function mutePrivateEventChatParticipant(
  event: HostEvent,
  targetEmail: string,
  actorEmail: string,
): { ok: boolean; error?: string } {
  if (!isPrivateEventHost(event, actorEmail)) {
    return { ok: false, error: 'Only the host can mute guests.' }
  }

  const email = normalizeEmail(targetEmail)
  if (isPrivateEventHost(event, email)) {
    return { ok: false, error: 'The host cannot be muted.' }
  }

  const rooms = readRooms()
  const room = getOrCreatePrivateEventChatRoom(event.id)
  if (room.mutedEmails.includes(email)) return { ok: true }

  rooms[event.id] = {
    ...room,
    mutedEmails: [...room.mutedEmails, email],
  }
  writeRooms(rooms)
  return { ok: true }
}

export function unmutePrivateEventChatParticipant(
  event: HostEvent,
  targetEmail: string,
  actorEmail: string,
): { ok: boolean; error?: string } {
  if (!isPrivateEventHost(event, actorEmail)) {
    return { ok: false, error: 'Only the host can unmute guests.' }
  }

  const email = normalizeEmail(targetEmail)
  const rooms = readRooms()
  const room = getOrCreatePrivateEventChatRoom(event.id)
  rooms[event.id] = {
    ...room,
    mutedEmails: room.mutedEmails.filter((entry) => entry !== email),
  }
  writeRooms(rooms)
  return { ok: true }
}

export function purgeExpiredPrivateEventChatRooms(now = new Date()): number {
  const rooms = readRooms()
  let purged = 0
  const next: Record<string, PrivateEventChatRoom> = {}

  for (const [eventId, room] of Object.entries(rooms)) {
    if (room.expiresAt && new Date(room.expiresAt) <= now) {
      purged += 1
      continue
    }
    next[eventId] = room
  }

  if (purged > 0) {
    writeRooms(next)
  }

  return purged
}
