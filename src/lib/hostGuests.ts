import type { HostEvent } from './account'
import { getTicketTransactions } from './ticketTransactions'
import { getEventUserTickets, getTicketHolderName } from './userTickets'

export type EventGuest = {
  id: string
  name: string
  email: string
  tier: string
  checkedIn: boolean
  purchasedAt: string
}

export function getEventGuests(eventId: string): EventGuest[] {
  const walletTickets = getEventUserTickets(eventId)
  const knownTxnIds = new Set(
    walletTickets.map((ticket) => ticket.transactionId).filter(Boolean) as string[],
  )

  const fromWallet = walletTickets.map((ticket) => ({
    id: ticket.id,
    name: getTicketHolderName(ticket),
    email: ticket.userEmail,
    tier: ticket.tierName,
    checkedIn: false,
    purchasedAt: ticket.purchasedAt,
  }))

  const fromTransactions = getTicketTransactions()
    .filter((txn) => txn.eventId === eventId && txn.status === 'paid' && !knownTxnIds.has(txn.id))
    .map((txn, index) => ({
      id: txn.id,
      name: txn.holderName?.trim() || `Guest ${fromWallet.length + index + 1}`,
      email: txn.userEmail ?? '',
      tier: txn.tierName,
      checkedIn: false,
      purchasedAt: txn.timestamp,
    }))

  return [...fromWallet, ...fromTransactions]
}

export function filterGuests(guests: EventGuest[], query: string): EventGuest[] {
  const q = query.trim().toLowerCase()
  if (!q) return guests
  return guests.filter(
    (guest) =>
      guest.name.toLowerCase().includes(q) ||
      guest.email.toLowerCase().includes(q) ||
      guest.tier.toLowerCase().includes(q),
  )
}

export function exportGuestsCsv(event: HostEvent, guests: EventGuest[]): void {
  const headers = ['Name', 'Email', 'Tier', 'Checked In', 'Purchased At']
  const rows = guests.map((g) => [
    g.name,
    g.email,
    g.tier,
    g.checkedIn ? 'Yes' : 'No',
    g.purchasedAt,
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title.replace(/[^\w\s-]/g, '').trim() || 'guests'}-guests.csv`
  link.click()
  URL.revokeObjectURL(url)
}
