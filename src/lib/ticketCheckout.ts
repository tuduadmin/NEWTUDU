import { updateHostEvent, type HostEvent, type TicketTier } from './account'
import { resolveCheckoutHostEvent } from './resolveCheckoutHostEvent'
import { logTicketTransaction } from './ticketTransactions'
import { saveUserTicket } from './userTickets'

export type TicketCartLine = {
  tierId: string
  quantity: number
}

export type ResolvedTicketCartLine = {
  tier: TicketTier
  quantity: number
}

const MAX_TICKETS_PER_ORDER = 20

export function buildTicketCheckoutSearchParams(cart: Record<string, number>): string {
  const lines = Object.entries(cart).filter(([, quantity]) => quantity > 0)
  if (lines.length === 0) return ''
  const value = lines.map(([tierId, quantity]) => `${tierId}:${quantity}`).join(',')
  return `cart=${encodeURIComponent(value)}`
}

export function parseTicketCartFromSearch(search: string): TicketCartLine[] {
  const raw = new URLSearchParams(search).get('cart')
  if (!raw) return []

  const lines: TicketCartLine[] = []
  for (const part of raw.split(',')) {
    const colon = part.lastIndexOf(':')
    if (colon <= 0) continue
    const tierId = part.slice(0, colon).trim()
    const quantity = parseInt(part.slice(colon + 1), 10)
    if (!tierId || !Number.isFinite(quantity) || quantity <= 0) continue
    lines.push({ tierId, quantity })
  }
  return lines
}

export function tierTicketsLeft(tier: TicketTier): number | null {
  if (tier.quantity == null) return null
  return Math.max(0, tier.quantity - tier.sold)
}

export function resolveTicketCart(
  event: HostEvent,
  lines: TicketCartLine[],
): { ok: true; lines: ResolvedTicketCartLine[]; totalQty: number; totalCents: number } | { ok: false; error: string } {
  if (lines.length === 0) {
    return { ok: false, error: 'Select at least one ticket.' }
  }

  const tiers = event.ticketTiers ?? []
  const resolved: ResolvedTicketCartLine[] = []
  let totalQty = 0
  let totalCents = 0

  for (const line of lines) {
    const tier = tiers.find((row) => row.id === line.tierId)
    if (!tier) {
      return { ok: false, error: 'One of the selected ticket types is no longer available.' }
    }
    if (line.quantity <= 0) continue

    const left = tierTicketsLeft(tier)
    if (left != null && line.quantity > left) {
      return {
        ok: false,
        error: `Only ${left} ${tier.name} ticket${left === 1 ? '' : 's'} left.`,
      }
    }

    totalQty += line.quantity
    totalCents += line.quantity * tier.priceCents
    resolved.push({ tier, quantity: line.quantity })
  }

  if (totalQty === 0) {
    return { ok: false, error: 'Select at least one ticket.' }
  }
  if (totalQty > MAX_TICKETS_PER_ORDER) {
    return {
      ok: false,
      error: `You can buy up to ${MAX_TICKETS_PER_ORDER} tickets per order.`,
    }
  }

  return { ok: true, lines: resolved, totalQty, totalCents }
}

/** Default single-ticket cart when opening RSVP without a cart param. */
export function defaultTicketCartLines(event: HostEvent): TicketCartLine[] {
  const tier = event.ticketTiers?.[0]
  if (!tier) return []
  return [{ tierId: tier.id, quantity: 1 }]
}

export function formatCheckoutTotalCents(totalCents: number): string {
  if (totalCents === 0) return 'Free'
  return `$${(totalCents / 100).toFixed(totalCents % 100 === 0 ? 0 : 2)}`
}

export type CompleteTicketCheckoutResult =
  | { ok: true; ticketIds: string[]; totalTickets: number; totalCents: number }
  | { ok: false; error: string }

export function completeTicketCheckout(input: {
  eventId: string
  attendeeEmail: string
  attendeeName: string
  lines: ResolvedTicketCartLine[]
}): CompleteTicketCheckoutResult {
  const event = resolveCheckoutHostEvent(input.eventId)
  if (!event) {
    return { ok: false, error: 'Event not found.' }
  }

  const validation = resolveTicketCart(event, input.lines.map((line) => ({
    tierId: line.tier.id,
    quantity: line.quantity,
  })))
  if (!validation.ok) {
    return { ok: false, error: validation.error }
  }

  const ticketIds: string[] = []
  let totalCents = 0
  const soldDelta = new Map<string, number>()

  for (const line of validation.lines) {
    totalCents += line.quantity * line.tier.priceCents
    soldDelta.set(line.tier.id, (soldDelta.get(line.tier.id) ?? 0) + line.quantity)

    for (let index = 0; index < line.quantity; index += 1) {
      const txn = logTicketTransaction({
        eventId: event.id,
        tierId: line.tier.id,
        tierName: line.tier.name,
        amountCents: line.tier.priceCents,
        userEmail: input.attendeeEmail,
        holderName: input.attendeeName,
      })
      const saved = saveUserTicket({
        userEmail: input.attendeeEmail,
        eventId: event.id,
        tierId: line.tier.id,
        tierName: line.tier.name,
        transactionId: txn.id,
        holderName: input.attendeeName,
      })
      ticketIds.push(saved.id)
    }
  }

  const tiers = event.ticketTiers ?? []
  updateHostEvent(event.id, {
    ticketTiers: tiers.map((tier) => {
      const delta = soldDelta.get(tier.id) ?? 0
      if (delta === 0) return tier
      return { ...tier, sold: tier.sold + delta }
    }),
  })

  return {
    ok: true,
    ticketIds,
    totalTickets: ticketIds.length,
    totalCents,
  }
}
