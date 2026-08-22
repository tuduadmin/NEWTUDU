import { useEffect, useMemo, useState } from 'react'
import {
  AdminKpi,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
} from '../../components/admin/AdminUI'
import { formatCents } from '../../lib/hostAnalytics'
import {
  getHostAccount,
  getHostEvents,
  getOrganization,
  resolveTicketingMode,
  type HostEvent,
  type TicketingMode,
} from '../../lib/account'
import {
  AFFILIATE_CLICKS_CHANGED_EVENT,
  getAffiliateClicks,
} from '../../lib/affiliatePartners'
import {
  getTicketTransactions,
  TICKET_TRANSACTIONS_CHANGED_EVENT,
} from '../../lib/ticketTransactions'

function eventSoldCount(event: HostEvent): number {
  return (event.ticketTiers ?? []).reduce((sum, tier) => sum + (tier.sold ?? 0), 0)
}

function eventCapacity(event: HostEvent): number | null {
  const mode = resolveTicketingMode(event)
  if (mode === 'free_rsvp' || mode === 'free_donation') {
    return event.capacity ?? null
  }
  const tiers = event.ticketTiers ?? []
  if (tiers.length === 0 || tiers.every((t) => t.quantity == null)) return null
  return tiers.reduce((sum, tier) => sum + (tier.quantity ?? 0), 0)
}

function formatTicketingMode(mode: TicketingMode): string {
  switch (mode) {
    case 'sell':
      return 'Sell (Tudu)'
    case 'external':
      return 'External'
    case 'free_rsvp':
      return 'Free RSVP'
    case 'free_donation':
      return 'Donation / Zeffy'
  }
}

function formatKind(kind: string): string {
  switch (kind) {
    case 'external_ticket':
      return 'External ticket'
    case 'zeffy_donation':
      return 'Zeffy donation'
    case 'hotel':
      return 'Hotel'
    case 'uber':
      return 'Uber'
    default:
      return kind
  }
}

export default function AdminTicketsPage() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    function refresh() {
      setTick((v) => v + 1)
    }
    window.addEventListener(AFFILIATE_CLICKS_CHANGED_EVENT, refresh)
    window.addEventListener(TICKET_TRANSACTIONS_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(AFFILIATE_CLICKS_CHANGED_EVENT, refresh)
      window.removeEventListener(TICKET_TRANSACTIONS_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  void tick

  const transactions = useMemo(() => getTicketTransactions(), [tick])
  const affiliateClicks = useMemo(() => getAffiliateClicks().slice(0, 50), [tick])
  const events = useMemo(() => getHostEvents(), [tick])

  const paid = transactions.filter((t) => t.status === 'paid')
  const cancelled = transactions.filter((t) => t.status === 'cancelled')
  const grossCents = paid.reduce((s, t) => s + t.amountCents, 0)

  const modeCounts = useMemo(() => {
    const counts = { sell: 0, external: 0, free_rsvp: 0, free_donation: 0 }
    for (const e of events) {
      const mode = resolveTicketingMode(e)
      if (mode in counts) counts[mode as keyof typeof counts] += 1
    }
    return counts
  }, [events])

  const eventSalesRows = useMemo(() => {
    const revenueByEvent = new Map<string, number>()
    for (const txn of paid) {
      revenueByEvent.set(txn.eventId, (revenueByEvent.get(txn.eventId) ?? 0) + txn.amountCents)
    }

    const affiliateClicksByEvent = new Map<string, number>()
    for (const click of getAffiliateClicks()) {
      if (!click.eventId || click.kind !== 'external_ticket') continue
      affiliateClicksByEvent.set(
        click.eventId,
        (affiliateClicksByEvent.get(click.eventId) ?? 0) + 1,
      )
    }

    return events
      .map((event) => {
        const mode = resolveTicketingMode(event)
        const sold = eventSoldCount(event)
        const capacity = eventCapacity(event)
        const hostName = event.hostAccountId
          ? getHostAccount(event.hostAccountId)?.name
          : event.displayName ?? event.createdBy

        return {
          event,
          mode,
          hostName: hostName ?? '—',
          sold,
          capacity,
          revenueCents: revenueByEvent.get(event.id) ?? 0,
          affiliateClicks: affiliateClicksByEvent.get(event.id) ?? 0,
        }
      })
      .sort(
        (a, b) =>
          b.sold - a.sold ||
          b.revenueCents - a.revenueCents ||
          b.affiliateClicks - a.affiliateClicks ||
          a.event.title.localeCompare(b.event.title),
      )
  }, [events, paid])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tickets & RSVPs"
        subtitle="In-app transactions, outbound affiliate clicks, and ticketing mode breakdown."
      />

      <AdminKpiGrid>
        <AdminKpi label="Paid transactions" value={paid.length} accent="cyan" />
        <AdminKpi label="Gross (in-app)" value={formatCents(grossCents)} accent="emerald" />
        <AdminKpi label="Cancelled / refunds" value={cancelled.length} accent="rose" />
        <AdminKpi label="Affiliate clicks (logged)" value={affiliateClicks.length} accent="amber" />
      </AdminKpiGrid>

      <AdminPanel>
        <p className="admin-label mb-2">Events by ticketing mode</p>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-[var(--admin-text-dim)]">Sell (Tudu)</p>
            <p className="font-semibold text-[var(--admin-text)]">{modeCounts.sell}</p>
          </div>
          <div>
            <p className="text-[var(--admin-text-dim)]">External link</p>
            <p className="font-semibold text-[var(--admin-text)]">{modeCounts.external}</p>
          </div>
          <div>
            <p className="text-[var(--admin-text-dim)]">Free RSVP</p>
            <p className="font-semibold text-[var(--admin-text)]">{modeCounts.free_rsvp}</p>
          </div>
          <div>
            <p className="text-[var(--admin-text-dim)]">Donation / Zeffy</p>
            <p className="font-semibold text-[var(--admin-text)]">{modeCounts.free_donation}</p>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel>
        <p className="admin-label mb-1">Sales by event</p>
        <p className="mb-3 text-xs text-[var(--admin-text-dim)]">
          In-app RSVPs and ticket counts from each event&apos;s tiers. External ticket sales happen
          off-platform — those show outbound clicks only.
        </p>
        {eventSalesRows.length === 0 ? (
          <p className="text-xs text-[var(--admin-text-dim)]">No events yet.</p>
        ) : (
          <AdminTable
            columns={['Event', 'Host', 'Mode', 'Sold', 'Capacity', 'Revenue', 'Ext. clicks']}
          >
            {eventSalesRows.map((row) => (
              <tr key={row.event.id} className="border-b border-[var(--admin-border)]/50">
                <td className="max-w-[180px] truncate py-2 pr-3 text-sm text-[var(--admin-text)]">
                  {row.event.title}
                </td>
                <td className="max-w-[120px] truncate py-2 pr-3 text-xs text-[var(--admin-text-muted)]">
                  {row.hostName}
                </td>
                <td className="py-2 pr-3 text-xs text-[var(--admin-text-muted)]">
                  {formatTicketingMode(row.mode)}
                </td>
                <td className="py-2 pr-3 text-sm font-semibold tabular-nums text-[var(--admin-text)]">
                  {row.mode === 'external' ? '—' : row.sold.toLocaleString()}
                </td>
                <td className="py-2 pr-3 text-xs tabular-nums text-[var(--admin-text-muted)]">
                  {row.mode === 'external'
                    ? '—'
                    : row.capacity != null
                      ? row.capacity.toLocaleString()
                      : 'Open'}
                </td>
                <td className="py-2 pr-3 text-xs tabular-nums text-[var(--admin-accent)]">
                  {row.revenueCents > 0 ? formatCents(row.revenueCents) : '—'}
                </td>
                <td className="py-2 text-xs tabular-nums text-[var(--admin-text-muted)]">
                  {row.mode === 'external' && row.affiliateClicks > 0
                    ? row.affiliateClicks.toLocaleString()
                    : row.mode === 'external'
                      ? '0'
                      : '—'}
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminPanel>

      <AdminPanel>
        <p className="admin-label mb-3">Recent in-app transactions</p>
        {transactions.length === 0 ? (
          <p className="text-xs text-[var(--admin-text-dim)]">
            No transactions yet — RSVP or purchase on an event, or import partner calendars.
          </p>
        ) : (
          <AdminTable columns={['Event', 'Tier', 'Amount', 'Status', 'When']}>
            {transactions.slice(0, 20).map((txn) => {
              const event = events.find((e) => e.id === txn.eventId)
              return (
                <tr key={txn.id} className="border-b border-[var(--admin-border)]/50">
                  <td className="max-w-[160px] truncate py-2 pr-3 text-sm text-[var(--admin-text)]">
                    {event?.title ?? txn.eventId}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[var(--admin-text-muted)]">{txn.tierName}</td>
                  <td className="py-2 pr-3 text-xs text-[var(--admin-accent)]">
                    {formatCents(txn.amountCents)}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[var(--admin-text-muted)]">{txn.status}</td>
                  <td className="py-2 text-xs text-[var(--admin-text-dim)]">
                    {new Date(txn.timestamp).toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </AdminTable>
        )}
      </AdminPanel>

      <AdminPanel>
        <p className="admin-label mb-3">Recent affiliate outbound clicks</p>
        {affiliateClicks.length === 0 ? (
          <p className="text-xs text-[var(--admin-text-dim)]">
            No clicks logged — open external tickets, Zeffy, or hotel links from Discover.
          </p>
        ) : (
          <AdminTable columns={['Partner', 'Type', 'Event / org', 'When']}>
            {affiliateClicks.map((click) => {
              const event = click.eventId ? events.find((e) => e.id === click.eventId) : undefined
              const org = click.orgId ? getOrganization(click.orgId) : undefined
              return (
                <tr key={click.id} className="border-b border-[var(--admin-border)]/50">
                  <td className="py-2 pr-3 text-sm text-[var(--admin-text)]">{click.partnerId}</td>
                  <td className="py-2 pr-3 text-xs text-[var(--admin-text-muted)]">
                    {formatKind(click.kind)}
                  </td>
                  <td className="max-w-[200px] truncate py-2 pr-3 text-xs text-[var(--admin-text-muted)]">
                    {event?.title ?? org?.name ?? '—'}
                  </td>
                  <td className="py-2 text-xs text-[var(--admin-text-dim)]">
                    {new Date(click.timestamp).toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </AdminTable>
        )}
      </AdminPanel>
    </div>
  )
}
