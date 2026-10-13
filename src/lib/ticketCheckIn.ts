import {
  getHostAccountsForUser,
  getHostEventById,
  type HostEvent,
} from './account'
import type { HostContextValue } from './hostContext'
import { parseTicketScanInput } from './qrParse'
import {
  findUserTicketById,
  getTicketHolderName,
  type UserTicket,
} from './userTickets'

const STORAGE_KEY = 'tudu_ticket_checkins_v1'

export const TICKET_CHECKINS_CHANGED_EVENT = 'tudu-ticket-checkins-changed'

export type TicketCheckIn = {
  ticketId: string
  eventId: string
  scannedAt: string
  scannedByEmail: string
}

export type VerifyTicketScanResult =
  | {
      outcome: 'valid'
      ticket: UserTicket
      holderName: string
      tierName: string
      eventTitle: string
    }
  | {
      outcome: 'already'
      holderName: string
      tierName: string
      scannedAt: string
    }
  | { outcome: 'invalid'; message: string }
  | { outcome: 'event_link'; message: string }
  | { outcome: 'forbidden'; message: string }

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readCheckIns(): Record<string, TicketCheckIn> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, TicketCheckIn>) : {}
  } catch {
    return {}
  }
}

function writeCheckIns(map: Record<string, TicketCheckIn>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TICKET_CHECKINS_CHANGED_EVENT))
  }
}

export function getTicketCheckIn(ticketId: string): TicketCheckIn | undefined {
  return readCheckIns()[ticketId]
}

export function isTicketCheckedIn(ticketId: string): boolean {
  return Boolean(getTicketCheckIn(ticketId))
}

function resolveTicketByReference(ref: string): UserTicket | undefined {
  const direct = findUserTicketById(ref)
  if (direct) return direct

  const upper = ref.trim().toUpperCase()
  const store = readAllTicketsFlat()
  return store.find((t) => t.id.replace(/^tkt_/, '').slice(-8).toUpperCase() === upper)
}

function readAllTicketsFlat(): UserTicket[] {
  try {
    const raw = localStorage.getItem('tudu_user_tickets_v1')
    const store = raw ? (JSON.parse(raw) as Record<string, UserTicket[]>) : {}
    return Object.values(store).flat()
  } catch {
    return []
  }
}

export function hostCanScanEvent(
  hostEmail: string,
  event: HostEvent,
  hostContext: HostContextValue,
): boolean {
  const email = normalizeEmail(hostEmail)
  if (hostContext !== 'personal' && event.hostAccountId === hostContext) {
    return true
  }
  if (!event.hostAccountId && normalizeEmail(event.createdBy) === email) {
    return true
  }
  if (event.hostAccountId) {
    const orgs = getHostAccountsForUser(hostEmail)
    if (orgs.some((org) => org.id === event.hostAccountId)) {
      return true
    }
  }
  return normalizeEmail(event.createdBy) === email
}

function recordCheckIn(ticket: UserTicket, hostEmail: string): TicketCheckIn {
  const record: TicketCheckIn = {
    ticketId: ticket.id,
    eventId: ticket.eventId,
    scannedAt: new Date().toISOString(),
    scannedByEmail: normalizeEmail(hostEmail),
  }
  const map = readCheckIns()
  map[ticket.id] = record
  writeCheckIns(map)
  return record
}

export function verifyTicketScanForHost(
  hostEmail: string,
  rawQr: string,
  hostContext: HostContextValue,
): VerifyTicketScanResult {
  if (!hostEmail.trim()) {
    return { outcome: 'forbidden', message: 'Sign in as a host to scan tickets.' }
  }

  const parsed = parseTicketScanInput(rawQr)
  if (!parsed) {
    return { outcome: 'invalid', message: 'Empty or unreadable code.' }
  }
  if (parsed.kind === 'event_link') {
    return {
      outcome: 'event_link',
      message: 'This QR is the event poster link — ask for their entry ticket QR.',
    }
  }

  const ticket = resolveTicketByReference(parsed.ticketId)
  if (!ticket) {
    return { outcome: 'invalid', message: 'Ticket not found. Check the code or use manual lookup.' }
  }

  const event = getHostEventById(ticket.eventId)
  if (!event) {
    return { outcome: 'invalid', message: 'Event for this ticket no longer exists.' }
  }

  if (!hostCanScanEvent(hostEmail, event, hostContext)) {
    return { outcome: 'forbidden', message: 'This ticket is for an event you do not manage.' }
  }

  const existing = getTicketCheckIn(ticket.id)
  if (existing) {
    return {
      outcome: 'already',
      holderName: getTicketHolderName(ticket),
      tierName: ticket.tierName,
      scannedAt: existing.scannedAt,
    }
  }

  recordCheckIn(ticket, hostEmail)

  return {
    outcome: 'valid',
    ticket,
    holderName: getTicketHolderName(ticket),
    tierName: ticket.tierName,
    eventTitle: event.title,
  }
}
