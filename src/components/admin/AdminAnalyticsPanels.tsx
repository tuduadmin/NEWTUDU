import { type ReactNode, useMemo } from 'react'
import {
  AdminBreakdownTable,
  AdminPieChart,
  type PieSlice,
} from './AdminPieChart'
import {
  AdminKpi,
  AdminKpiGrid,
  AdminPanel,
} from './AdminUI'
import {
  formatCents,
  getCardOpensKPIs,
  getEngagementPieAnalytics,
  getEventsPieAnalytics,
  getGeographyPieAnalytics,
  getTicketSalesKPIs,
  getTicketSalesPieAnalytics,
  getTopEventsByTicketSales,
  getUsersPieAnalytics,
  getUsersTierBreakdown,
  type AnalyticsFilters,
} from '../../lib/adminAnalytics'

function PieGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{children}</div>
}

function renderCharts(charts: { title: string; slices: PieSlice[] }[]) {
  return charts.map((chart) => (
    <AdminPieChart key={chart.title} title={chart.title} slices={chart.slices} />
  ))
}

type PanelProps = {
  filters: AnalyticsFilters
  refreshKey?: number
}

export function AdminUsersAnalyticsPanel({ filters, refreshKey = 0 }: PanelProps) {
  const data = useMemo(() => getUsersPieAnalytics(filters), [filters, refreshKey])
  const breakdown = useMemo(() => getUsersTierBreakdown(filters), [filters, refreshKey])

  return (
    <div className="space-y-4">
      <PieGrid>{renderCharts(data.charts)}</PieGrid>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminBreakdownTable title="Users" rows={breakdown.personal} />
        <AdminBreakdownTable title="Host accounts (orgs)" rows={breakdown.org} />
      </div>
    </div>
  )
}

export function AdminEventsAnalyticsPanel({ filters, refreshKey = 0 }: PanelProps) {
  const data = useMemo(() => getEventsPieAnalytics(filters), [filters, refreshKey])

  return (
    <div className="space-y-4">
      <PieGrid>{renderCharts(data.charts)}</PieGrid>
      <AdminBreakdownTable title="Event drill-down" rows={data.drillDown ?? []} />
    </div>
  )
}

export function AdminGeographyAnalyticsPanel({ filters, refreshKey = 0 }: PanelProps) {
  const data = useMemo(() => getGeographyPieAnalytics(filters), [filters, refreshKey])

  return (
    <div className="space-y-4">
      <PieGrid>{renderCharts(data.charts)}</PieGrid>
      <AdminBreakdownTable title="Top cities" rows={data.topCities ?? []} />
    </div>
  )
}

export function AdminEngagementAnalyticsPanel({ filters, refreshKey = 0 }: PanelProps) {
  const data = useMemo(() => getEngagementPieAnalytics(filters), [filters, refreshKey])
  const cardOpens = useMemo(() => getCardOpensKPIs(filters), [filters, refreshKey])

  return (
    <div className="space-y-4">
      <AdminPanel>
        <p className="admin-label mb-1">Card opens (Trusted Host signal)</p>
        <p className="mb-3 text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Detail panel views when users tap the magnifying glass or swipe up on Discover.
          High open rates indicate strong event appeal — a key metric for Trusted Host tier
          eligibility.
        </p>
        <AdminKpiGrid>
          <AdminKpi label="Total card opens" value={cardOpens.totalOpens} accent="amber" />
          <AdminKpi label="Open rate" value={cardOpens.openRate} accent="cyan" />
          <AdminKpi label="Save rate" value={cardOpens.saveRate} accent="emerald" />
          <AdminKpi label="Pass rate" value={cardOpens.passRate} accent="neutral" />
        </AdminKpiGrid>
      </AdminPanel>

      <PieGrid>{renderCharts(data.charts)}</PieGrid>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminBreakdownTable title="Top search keywords" rows={data.topKeywords ?? []} />
        <AdminBreakdownTable title="Recent activity types" rows={data.activityTypes ?? []} />
      </div>
    </div>
  )
}

export function AdminTicketSalesAnalyticsPanel({ filters, refreshKey = 0 }: PanelProps) {
  const kpis = useMemo(() => getTicketSalesKPIs(filters), [filters, refreshKey])
  const data = useMemo(() => getTicketSalesPieAnalytics(filters), [filters, refreshKey])
  const topEvents = useMemo(() => getTopEventsByTicketSales(filters), [filters, refreshKey])

  return (
    <div className="space-y-4">
      <AdminPanel>
        <p className="mb-3 text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong className="text-[var(--admin-text)]">RSVPs / tickets</strong> come from each
          event&apos;s tier sold counts. <strong className="text-[var(--admin-text)]">Revenue</strong>{' '}
          comes from paid in-app transactions only (matches Summary → Total RSVPs).
        </p>
        <AdminKpiGrid>
          <AdminKpi label="Total RSVPs / tickets" value={kpis.totalRsvps} accent="cyan" />
          <AdminKpi label="Paid transactions" value={kpis.paidTransactions} accent="emerald" />
          <AdminKpi label="Free checkouts" value={kpis.freeCheckouts} accent="neutral" />
          <AdminKpi label="Total revenue" value={formatCents(kpis.totalRevenueCents)} accent="emerald" />
          <AdminKpi label="Cancelled" value={kpis.cancelledCount} accent="rose" />
          <AdminKpi
            label="Avg paid ticket"
            value={formatCents(kpis.avgTicketPriceCents)}
            accent="neutral"
          />
        </AdminKpiGrid>
      </AdminPanel>

      <PieGrid>{renderCharts(data.charts)}</PieGrid>

      <AdminPanel>
        <p className="admin-label mb-2">Top events by RSVPs / tickets</p>
        {topEvents.length === 0 ? (
          <p className="text-xs text-[var(--admin-text-dim)]">
            No RSVPs yet — register on an event or load demo analytics to populate this table.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-left text-[var(--admin-text-dim)]">
                  <th className="pb-2 pr-3 font-semibold">Event</th>
                  <th className="pb-2 pr-3 font-semibold">Category</th>
                  <th className="pb-2 pr-3 font-semibold text-right">Sold</th>
                  <th className="pb-2 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topEvents.map((row) => (
                  <tr key={row.eventId} className="border-b border-[var(--admin-border)]/50">
                    <td className="py-2 pr-3 text-[var(--admin-text)]">{row.title}</td>
                    <td className="py-2 pr-3 text-[var(--admin-text-muted)]">{row.category}</td>
                    <td className="admin-tabular py-2 pr-3 text-right text-[var(--admin-text-muted)]">
                      {row.sold}
                    </td>
                    <td className="admin-tabular py-2 text-right text-[var(--admin-accent)]">
                      {row.revenueCents > 0 ? formatCents(row.revenueCents) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminBreakdownTable title="RSVPs by category & mode" rows={data.drillDown ?? []} />
    </div>
  )
}
