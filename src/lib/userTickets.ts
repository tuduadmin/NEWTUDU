/**
 * User ticket wallet — Phase 1 localStorage store.
 * Phase 2: sync with Supabase / payment provider.
 */

import { DEMO_USER } from './auth'
import { getHostEvents, type HostEvent } from './account'
import { resolveCheckoutHostEvent } from './resolveCheckoutHostEvent'
import {
  computeExpiresAt,
  formatCardDateTime,
  getNextDisplayDate,
} from './eventSchedule'
import { getTicketTransactions } from './ticketTransactions'
import { resolveTicketHolderName } from './ticketHolderName'

const STORAGE_KEY = 'tudu_user_tickets_v1'
const DEMO_SEED_KEY = 'tudu_user_tickets_demo_seeded'

export const USER_TICKETS_CHANGED_EVENT = 'tudu-user-tickets-changed'

export interface UserTicket {
  id: string
  userEmail: string
  eventId: string
  tierId: string
  tierName: string
  purchasedAt: string
  transactionId?: string
  /** Snapshot at purchase — legal/ticket holder name (private). */
  holderName?: string
}

export interface EnrichedUserTicket extends UserTicket {
  eventTitle: string
  eventDateTime?: string
  eventImage?: string
  venueName?: string
  city?: string
  /** Sort key — ms since epoch at event start (approx). */
  eventStartsAt: number
  isPast: boolean
  ticketNumber: string
  holderName: string
}

export type EventTicketGroup = {
  eventId: string
  eventTitle: string
  eventDateTime?: string
  eventImage?: string
  venueName?: string
  city?: string
  eventStartsAt: number
  isPast: boolean
  tickets: EnrichedUserTicket[]
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readStore(): Record<string, UserTicket[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, UserTicket[]>) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, UserTicket[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(USER_TICKETS_CHANGED_EVENT))
  }
}

function generateId(): string {
  return `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function formatTicketNumber(id: string): string {
  return id.replace(/^tkt_/, '').slice(-8).toUpperCase()
}

function resolveEventStartsAt(event: HostEvent, now = new Date()): number {
  const displayDate = getNextDisplayDate(event, now)
  if (displayDate) {
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
  if (event.eventDate) {
    return new Date(`${event.eventDate}T12:00:00`).getTime()
  }
  return 0
}

function isEventPast(event: HostEvent, now = new Date()): boolean {
  const expiresAt = computeExpiresAt(event)
  if (expiresAt) return new Date(expiresAt) < now
  const displayDate = getNextDisplayDate(event, now)
  if (!displayDate) return false
  return displayDate < now.toISOString().slice(0, 10)
}

function enrichTicket(ticket: UserTicket, now = new Date()): EnrichedUserTicket | null {
  const event = resolveCheckoutHostEvent(ticket.eventId)
  if (!event) return null

  return {
    ...ticket,
    eventTitle: event.title,
    eventDateTime: formatCardDateTime(event, now),
    eventImage: event.photos?.[0] || undefined,
    venueName: event.venueName || undefined,
    city: event.city || undefined,
    eventStartsAt: resolveEventStartsAt(event, now),
    isPast: isEventPast(event, now),
    ticketNumber: formatTicketNumber(ticket.id),
    holderName: getTicketHolderName(ticket),
  }
}

export function getTicketHolderName(ticket: UserTicket): string {
  return ticket.holderName?.trim() || resolveTicketHolderName(ticket.userEmail)
}

export function buildQrPayload(ticket: UserTicket): string {
  return JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.eventId,
    attendee: ticket.userEmail,
    holderName: getTicketHolderName(ticket),
  })
}

export function saveUserTicket(
  input: Omit<UserTicket, 'id' | 'purchasedAt'> & { id?: string; purchasedAt?: string },
): UserTicket {
  const email = normalizeEmail(input.userEmail)
  const store = readStore()
  const list = store[email] ?? []

  const holderName = input.holderName?.trim() || resolveTicketHolderName(email)

  const ticket: UserTicket = {
    id: input.id ?? generateId(),
    userEmail: email,
    eventId: input.eventId,
    tierId: input.tierId,
    tierName: input.tierName,
    purchasedAt: input.purchasedAt ?? new Date().toISOString(),
    transactionId: input.transactionId,
    holderName,
  }

  const existingIdx = list.findIndex(
    (t) => t.eventId === ticket.eventId && t.tierId === ticket.tierId && t.id === ticket.id,
  )
  if (existingIdx >= 0) {
    list[existingIdx] = ticket
  } else {
    list.unshift(ticket)
  }

  store[email] = list.slice(0, 500)
  writeStore(store)
  return ticket
}

export function getUserTickets(userEmail: string): UserTicket[] {
  return readStore()[normalizeEmail(userEmail)] ?? []
}

/** All wallet tickets for one event (any attendee). */
export function getEventUserTickets(eventId: string): UserTicket[] {
  const store = readStore()
  const tickets: UserTicket[] = []
  for (const list of Object.values(store)) {
    for (const ticket of list) {
      if (ticket.eventId === eventId) tickets.push(ticket)
    }
  }
  return tickets.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
}

export function getUserTicketById(userEmail: string, ticketId: string): UserTicket | undefined {
  return getUserTickets(userEmail).find((t) => t.id === ticketId)
}

export function getUserTicketsForEvent(userEmail: string, eventId: string): UserTicket[] {
  return getUserTickets(userEmail).filter((ticket) => ticket.eventId === eventId)
}

export function updateUserTicketHolder(
  userEmail: string,
  ticketId: string,
  holderName: string,
): { ok: true; ticket: UserTicket } | { ok: false; error: string } {
  const email = normalizeEmail(userEmail)
  const trimmed = holderName.trim()
  if (!trimmed) {
    return { ok: false, error: 'Enter a holder name.' }
  }

  const store = readStore()
  const list = store[email] ?? []
  const idx = list.findIndex((ticket) => ticket.id === ticketId)
  if (idx < 0) {
    return { ok: false, error: 'Ticket not found in your wallet.' }
  }

  const updated = { ...list[idx], holderName: trimmed }
  list[idx] = updated
  store[email] = list
  writeStore(store)
  return { ok: true, ticket: updated }
}

/** Find a ticket in any wallet (paper ticket / host lookup). */
export function findUserTicketById(ticketId: string): UserTicket | undefined {
  const store = readStore()
  for (const list of Object.values(store)) {
    const found = list.find((ticket) => ticket.id === ticketId)
    if (found) return found
  }
  return undefined
}

export function getEnrichedTicketById(ticketId: string, now = new Date()): EnrichedUserTicket | null {
  const ticket = findUserTicketById(ticketId)
  if (!ticket) return null
  return enrichTicket(ticket, now)
}

export type TransferUserTicketResult =
  | { ok: true; ticket: UserTicket }
  | { ok: false; error: string }

/** Move a ticket from one wallet to another (gift / send to friend). */
export function transferUserTicket(
  fromEmail: string,
  ticketId: string,
  toEmail: string,
  options?: { holderName?: string },
): TransferUserTicketResult {
  const from = normalizeEmail(fromEmail)
  const to = normalizeEmail(toEmail)
  if (!to.includes('@')) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  if (from === to) {
    return { ok: false, error: 'You cannot send a ticket to yourself.' }
  }

  const store = readStore()
  const fromList = store[from] ?? []
  const ticketIdx = fromList.findIndex((ticket) => ticket.id === ticketId)
  if (ticketIdx < 0) {
    return { ok: false, error: 'Ticket not found in your wallet.' }
  }

  const [ticket] = fromList.splice(ticketIdx, 1)
  store[from] = fromList

  const holderName = options?.holderName?.trim() || resolveTicketHolderName(to)
  const transferred: UserTicket = {
    ...ticket,
    userEmail: to,
    holderName,
  }

  const toList = store[to] ?? []
  toList.unshift(transferred)
  store[to] = toList.slice(0, 500)
  writeStore(store)

  return { ok: true, ticket: transferred }
}

export function getEnrichedUserTickets(userEmail: string, now = new Date()): EnrichedUserTicket[] {
  return getUserTickets(userEmail)
    .map((t) => enrichTicket(t, now))
    .filter((t): t is EnrichedUserTicket => t != null)
}

export function getUpcomingTickets(userEmail: string, now = new Date()): EnrichedUserTicket[] {
  return getEnrichedUserTickets(userEmail, now)
    .filter((t) => !t.isPast)
    .sort((a, b) => a.eventStartsAt - b.eventStartsAt)
}

export function getPastTickets(userEmail: string, now = new Date()): EnrichedUserTicket[] {
  return getEnrichedUserTickets(userEmail, now)
    .filter((t) => t.isPast)
    .sort((a, b) => b.eventStartsAt - a.eventStartsAt)
}

export function groupTicketsByEvent(tickets: EnrichedUserTicket[]): EventTicketGroup[] {
  const groups = new Map<string, EventTicketGroup>()

  for (const ticket of tickets) {
    const existing = groups.get(ticket.eventId)
    if (existing) {
      existing.tickets.push(ticket)
      continue
    }

    groups.set(ticket.eventId, {
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      eventDateTime: ticket.eventDateTime,
      eventImage: ticket.eventImage,
      venueName: ticket.venueName,
      city: ticket.city,
      eventStartsAt: ticket.eventStartsAt,
      isPast: ticket.isPast,
      tickets: [ticket],
    })
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      tickets: [...group.tickets].sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt)),
    }))
    .sort((a, b) => a.eventStartsAt - b.eventStartsAt)
}

export function getUpcomingTicketGroups(userEmail: string, now = new Date()): EventTicketGroup[] {
  return groupTicketsByEvent(getUpcomingTickets(userEmail, now))
}

export function getPastTicketGroups(userEmail: string, now = new Date()): EventTicketGroup[] {
  return groupTicketsByEvent(getPastTickets(userEmail, now)).sort(
    (a, b) => b.eventStartsAt - a.eventStartsAt,
  )
}

export function getEnrichedTicketsForEvent(
  userEmail: string,
  eventId: string,
  now = new Date(),
): EnrichedUserTicket[] {
  return getEnrichedUserTickets(userEmail, now)
    .filter((ticket) => ticket.eventId === eventId)
    .sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt))
}

/** Import legacy ticket transactions for the current user (no userEmail on txn). */
function syncTransactionsForUser(userEmail: string): void {
  const email = normalizeEmail(userEmail)
  const existing = getUserTickets(email)
  const knownTxnIds = new Set(existing.map((t) => t.transactionId).filter(Boolean))

  for (const txn of getTicketTransactions()) {
    if (txn.status !== 'paid') continue
    if (knownTxnIds.has(txn.id)) continue
    if (!resolveCheckoutHostEvent(txn.eventId)) continue

    saveUserTicket({
      userEmail: email,
      eventId: txn.eventId,
      tierId: txn.tierId,
      tierName: txn.tierName,
      transactionId: txn.id,
      purchasedAt: txn.timestamp,
      holderName: txn.holderName,
    })
  }
}

function seedDemoUserTickets(userEmail: string): void {
  const email = normalizeEmail(userEmail)
  if (localStorage.getItem(`${DEMO_SEED_KEY}:${email}`)) return

  const upcoming = getHostEvents()
    .filter((e) => e.status === 'upcoming' || e.status === 'live')
    .slice(0, 2)

  if (upcoming.length === 0) {
    localStorage.setItem(`${DEMO_SEED_KEY}:${email}`, '1')
    return
  }

  for (const event of upcoming) {
    const tier = event.ticketTiers?.[0]
    saveUserTicket({
      userEmail: email,
      eventId: event.id,
      tierId: tier?.id ?? 'tier_demo',
      tierName: tier?.name ?? 'General Admission',
      purchasedAt: new Date().toISOString(),
    })
  }

  localStorage.setItem(`${DEMO_SEED_KEY}:${email}`, '1')
}

/**
 * Ensure tickets are loaded for a user — syncs transactions, seeds demo data if empty.
 */
export function ensureUserTickets(userEmail: string): void {
  syncTransactionsForUser(userEmail)
  const tickets = getUserTickets(userEmail)
  if (tickets.length === 0 && normalizeEmail(userEmail) === normalizeEmail(DEMO_USER.email)) {
    seedDemoUserTickets(userEmail)
  }
}

export function countUserTickets(userEmail: string): { upcoming: number; past: number } {
  const enriched = getEnrichedUserTickets(userEmail)
  return {
    upcoming: enriched.filter((t) => !t.isPast).length,
    past: enriched.filter((t) => t.isPast).length,
  }
}
