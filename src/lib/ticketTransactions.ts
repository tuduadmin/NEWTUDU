/**
 * Phase 1 ticket transaction log (localStorage).
 * Phase 2: Supabase replaces this store; analytics helpers stay the same.
 */

const TICKET_TRANSACTIONS_KEY = 'tudu-ticket-transactions'

export const TICKET_TRANSACTIONS_CHANGED_EVENT = 'tudu-ticket-transactions-changed'

export type TicketTransactionStatus = 'paid' | 'cancelled'

export interface TicketTransaction {
  id: string
  eventId: string
  tierId: string
  tierName: string
  amountCents: number
  status: TicketTransactionStatus
  timestamp: string
  /** Attendee account email when known (RSVP / checkout). */
  userEmail?: string
  /** Legal or display name at time of purchase. */
  holderName?: string
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getTicketTransactions(): TicketTransaction[] {
  return readJson<TicketTransaction[]>(TICKET_TRANSACTIONS_KEY, [])
}

export function logTicketTransaction(input: {
  eventId: string
  tierId: string
  tierName: string
  amountCents: number
  status?: TicketTransactionStatus
  timestamp?: string
  userEmail?: string
  holderName?: string
}): TicketTransaction {
  const transactions = getTicketTransactions()
  const txn: TicketTransaction = {
    id: generateId(),
    eventId: input.eventId,
    tierId: input.tierId,
    tierName: input.tierName,
    amountCents: input.amountCents,
    status: input.status ?? 'paid',
    timestamp: input.timestamp ?? new Date().toISOString(),
    userEmail: input.userEmail?.trim().toLowerCase() || undefined,
    holderName: input.holderName?.trim() || undefined,
  }
  transactions.unshift(txn)
  writeJson(TICKET_TRANSACTIONS_KEY, transactions.slice(0, 2000))
  window.dispatchEvent(new Event(TICKET_TRANSACTIONS_CHANGED_EVENT))
  return txn
}

export function logCancelledTicket(input: {
  eventId: string
  tierId: string
  tierName: string
  amountCents: number
}): TicketTransaction {
  return logTicketTransaction({ ...input, status: 'cancelled' })
}
