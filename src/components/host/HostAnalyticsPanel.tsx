import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Compass,
  Eye,
  Globe,
  Layers,
  Lock,
  MapPin,
  Minus,
  Share2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react'
import type { HostEvent, UserAccount } from '../../lib/account'
import {
  getOrganization,
  getOrganizationApprovalStatus,
} from '../../lib/account'
import { getOrgVerificationRequestForOrg } from '../../lib/orgVerificationRequests'
import {
  formatCents,
  formatHostMetricValue,
  formatRate,
  getConversionRates,
  getHostAnalytics,
  getMetricTrend,
  HOST_METRIC_LABELS,
  HOST_METRIC_ORDER,
  resolveHostAnalyticsTier,
  type HostAnalyticsSnapshot,
  type HostEventBreakdown,
  type HostMetricTile,
  type HostTrustedAnalytics,
} from '../../lib/hostAnalytics'
import GradientButton from '../GradientButton'
import { getVerifyPhoneUrl } from '../../lib/verifyPhoneNav'

type HostAnalyticsPanelProps = {
  account: UserAccount
  hostAccountId?: string | null
  events?: HostEvent[]
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 48
      const y = 16 - (v / max) * 14
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 48 18" className="h-4 w-12" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="text-orange/80"
      />
    </svg>
  )
}

function TrendBadge({ tile }: { tile: HostMetricTile }) {
  const trend = getMetricTrend(tile)
  if (trend.direction === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-success-deep">
        <ArrowUpRight size={12} />
        {trend.pct}%
      </span>
    )
  }
  if (trend.direction === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-maroon">
        <ArrowDownRight size={12} />
        {trend.pct}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brown-muted">
      <Minus size={12} />
      0%
    </span>
  )
}

function MetricTile({
  tile,
  locked,
  showTrend,
  showSparkline,
  onClick,
}: {
  tile: HostMetricTile
  locked?: boolean
  showTrend?: boolean
  showSparkline?: boolean
  onClick?: () => void
}) {
  const interactive = !!onClick && !locked

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`rounded-[14px] border px-2 py-3 text-center transition ${
        locked
          ? 'cursor-default border-app-subtle bg-app-elevated/40 opacity-60'
          : interactive
            ? 'border-app-subtle bg-app-elevated hover:border-orange/30 hover:shadow-sm'
            : 'cursor-default border-app-subtle bg-app-elevated'
      }`}
    >
      {locked ? (
        <div className="flex flex-col items-center">
          <Lock size={16} className="text-brown-muted/50" />
          <p className="mt-1 font-display text-lg font-extrabold text-brown/20 blur-[2px] select-none">
            -
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-1">
            <p className="font-display text-lg font-extrabold text-brown">{formatHostMetricValue(tile)}</p>
            {showTrend && <TrendBadge tile={tile} />}
          </div>
          {showSparkline && (
            <div className="mt-1 flex justify-center">
              <Sparkline values={tile.sparkline} />
            </div>
          )}
        </>
      )}
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-brown-muted">{tile.label}</p>
    </button>
  )
}

function PioneerUpsellModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" role="presentation">
        <div
          className="app-surface-card w-full max-w-sm p-5 shadow-xl"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-purple/10">
              <Sparkles size={18} className="text-purple" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] p-1 text-brown-muted transition hover:bg-app-elevated"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <h3 className="mt-3 font-display text-lg font-bold text-brown">Upgrade to Pioneer</h3>
          <p className="mt-2 text-sm leading-relaxed text-brown-muted">
            Per-event breakdowns, trend indicators, conversion insights, and geography snippets unlock with Pioneer.
          </p>
          <GradientButton fullWidth className="mt-4 py-3" to="/host/subscription">
            View Pioneer plans
          </GradientButton>
        </div>
      </div>
    </>
  )
}

function formatTicketingModeLabel(mode: HostEventBreakdown['ticketingMode']): string {
  switch (mode) {
    case 'sell':
      return 'Paid'
    case 'external':
      return 'External'
    case 'free_rsvp':
      return 'RSVP'
    case 'free_donation':
      return 'Donation'
  }
}

function EventSalesComparison({
  rows,
  onViewAll,
}: {
  rows: HostEventBreakdown[]
  onViewAll: () => void
}) {
  const salesRows = [...rows]
    .filter((row) => row.ticketingMode !== 'external')
    .sort((a, b) => b.tickets - a.tickets || b.revenueCents - a.revenueCents)

  if (salesRows.length === 0) {
    return (
      <div className="mt-4 rounded-[14px] border border-app-subtle bg-app-elevated p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Event sales</p>
        <p className="mt-2 text-xs text-brown-muted">
          RSVPs and ticket counts appear here once people register on your events.
        </p>
      </div>
    )
  }

  const maxTickets = Math.max(...salesRows.map((row) => row.tickets), 1)

  return (
    <div className="mt-4 rounded-[14px] border border-app-subtle bg-app-elevated p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Event sales</p>
          <p className="mt-0.5 text-xs text-brown-muted">Compare RSVPs and tickets across your events.</p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="shrink-0 text-xs font-semibold text-orange transition hover:text-orange/80"
        >
          View all
        </button>
      </div>

      <ul className="mt-3 space-y-3">
        {salesRows.slice(0, 5).map((row) => {
          const barWidth = Math.max(6, Math.round((row.tickets / maxTickets) * 100))
          return (
            <li key={row.eventId}>
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-brown">{row.title}</p>
                <p className="shrink-0 text-sm font-bold tabular-nums text-brown">
                  {row.tickets.toLocaleString()}
                  {row.capacity != null ? (
                    <span className="font-medium text-brown-muted"> / {row.capacity.toLocaleString()}</span>
                  ) : null}
                </p>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-dark">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange to-sunset-pink"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-brown-muted">
                <span>{formatTicketingModeLabel(row.ticketingMode)}</span>
                {row.soldPercent != null && <span>{row.soldPercent}% full</span>}
                {row.revenueCents > 0 && (
                  <span className="font-semibold text-brown">{formatCents(row.revenueCents)} revenue</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function EventBreakdownModal({
  snapshot,
  onClose,
  expanded = false,
}: {
  snapshot: HostAnalyticsSnapshot
  onClose: () => void
  expanded?: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" role="presentation">
        <div
          className={`app-surface-card max-h-[80vh] w-full overflow-y-auto p-5 shadow-xl ${
            expanded ? 'max-w-lg' : 'max-w-sm'
          }`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-brown">Per-event breakdown</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] p-1 text-brown-muted transition hover:bg-app-elevated"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-1 text-xs text-brown-muted">{snapshot.periodLabel}</p>
          {snapshot.perEventBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-brown-muted">No event activity in this period yet.</p>
          ) : expanded ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead>
                  <tr className="border-b border-app-subtle text-[10px] font-bold uppercase tracking-wide text-brown-muted">
                    <th className="pb-2 pr-2">Event</th>
                    <th className="pb-2 pr-2 text-right">Impr.</th>
                    <th className="pb-2 pr-2 text-right">Opens</th>
                    <th className="pb-2 pr-2 text-right">Open %</th>
                    <th className="pb-2 pr-2 text-right">Saves</th>
                    <th className="pb-2 pr-2 text-right">Sold</th>
                    <th className="pb-2 pr-2 text-right">Capacity</th>
                    <th className="pb-2 pr-2 text-right">Full %</th>
                    <th className="pb-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-subtle">
                  {snapshot.perEventBreakdown.map((row) => (
                    <tr key={row.eventId}>
                      <td className="max-w-[120px] truncate py-2.5 pr-2 font-semibold text-brown">
                        {row.title}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-brown">{row.views.toLocaleString()}</td>
                      <td className="py-2.5 pr-2 text-right text-brown">{row.visits.toLocaleString()}</td>
                      <td className="py-2.5 pr-2 text-right text-brown-muted">
                        {formatRate(row.openRate)}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-brown">{row.saves.toLocaleString()}</td>
                      <td className="py-2.5 pr-2 text-right font-semibold text-brown">
                        {row.ticketingMode === 'external' ? '—' : row.tickets.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-brown-muted">
                        {row.capacity != null ? row.capacity.toLocaleString() : 'Open'}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-brown-muted">
                        {row.soldPercent != null ? `${row.soldPercent}%` : '—'}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-brown">
                        {row.revenueCents > 0 ? formatCents(row.revenueCents) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-app-subtle">
              {snapshot.perEventBreakdown.map((row) => (
                <li key={row.eventId} className="py-3">
                  <p className="font-display text-sm font-bold text-brown">{row.title}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-brown-muted">Views</dt>
                      <dd className="font-semibold text-brown">{row.views.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-brown-muted">Visits</dt>
                      <dd className="font-semibold text-brown">{row.visits.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-brown-muted">Sold</dt>
                      <dd className="font-semibold text-brown">
                        {row.ticketingMode === 'external' ? 'External' : row.tickets.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-brown-muted">Capacity</dt>
                      <dd className="font-semibold text-brown">
                        {row.capacity != null ? row.capacity.toLocaleString() : 'Open'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-brown-muted">Revenue</dt>
                      <dd className="font-semibold text-brown">
                        {row.revenueCents > 0 ? formatCents(row.revenueCents) : '—'}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

function PioneerInsights({ snapshot }: { snapshot: HostAnalyticsSnapshot }) {
  const { visitRate, ticketRate } = getConversionRates(snapshot.conversion)

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Conversion</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-brown">
          <span>{snapshot.conversion.views.toLocaleString()} views</span>
          <span className="text-brown-muted" aria-hidden>
            →
          </span>
          <span>
            {snapshot.conversion.visits.toLocaleString()} visits ({visitRate.toFixed(1)}%)
          </span>
          <span className="text-brown-muted" aria-hidden>
            →
          </span>
          <span>
            {snapshot.conversion.tickets.toLocaleString()} tickets ({ticketRate.toFixed(1)}%)
          </span>
        </div>
      </div>

      {snapshot.topEvent && (
        <div className="rounded-[14px] border border-orange/20 bg-gradient-to-br from-orange/10 via-sunset-pink/5 to-purple/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Top event this period</p>
          <p className="mt-1 font-display text-sm font-bold text-brown">{snapshot.topEvent.title}</p>
          <p className="mt-0.5 text-xs text-brown-muted">
            {snapshot.topEvent.tickets.toLocaleString()} tickets sold
          </p>
        </div>
      )}

      {snapshot.geography.length > 0 && (
        <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-orange" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Audience cities</p>
          </div>
          <ul className="mt-2 space-y-1">
            {snapshot.geography.slice(0, 3).map((row) => (
              <li key={row.city} className="flex items-center justify-between text-xs">
                <span className="font-medium text-brown">{row.city}</span>
                <span className="text-brown-muted">{row.count} events</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FunnelRow({
  label,
  value,
  rate,
  highlight,
}: {
  label: string
  value: number
  rate?: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
      <span className="text-brown-muted">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-orange' : 'text-brown'}`}>
        {value.toLocaleString()}
        {rate ? <span className="ml-1 font-medium text-brown-muted">({rate})</span> : null}
      </span>
    </div>
  )
}

function SurfaceIcon({ surface }: { surface: HostTrustedAnalytics['surfaces'][0]['surface'] }) {
  const className = 'text-orange'
  switch (surface) {
    case 'discover':
      return <Layers size={12} className={className} />
    case 'search':
      return <Globe size={12} className={className} />
    case 'profile':
      return <Eye size={12} className={className} />
    case 'share':
      return <Share2 size={12} className={className} />
    case 'roadTrip':
      return <Compass size={12} className={className} />
    case 'hiddenGem':
      return <Sparkles size={12} className={className} />
    default:
      return <Layers size={12} className={className} />
  }
}

function TrustedInsightsSection({
  trusted,
  onViewEvents,
}: {
  trusted: HostTrustedAnalytics
  onViewEvents: () => void
}) {
  const { discovery, audience, surfaces, viewerGeography, commerce } = trusted

  return (
    <div className="mt-4 space-y-3 border-t border-app-subtle pt-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="theme-accent-icon" />
        <p className="font-display text-sm font-bold text-brown">Trusted Host insights</p>
      </div>

      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
          Discovery performance
        </p>
        <div className="mt-2 divide-y divide-app-subtle">
          <FunnelRow
            label="Discover impressions"
            value={discovery.impressions}
          />
          <FunnelRow
            label="Detail opens"
            value={discovery.opens}
            rate={formatRate(discovery.openRate)}
          />
          <FunnelRow
            label="Saved to My Tudu"
            value={discovery.saves}
            rate={formatRate(discovery.saveRate)}
          />
          <FunnelRow
            label="Passed"
            value={discovery.passes}
            rate={formatRate(discovery.passRate)}
          />
          <FunnelRow
            label="Tickets sold"
            value={discovery.tickets}
            rate={formatRate(discovery.ticketRate)}
            highlight
          />
        </div>
      </div>

      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
        <div className="flex items-center gap-1.5">
          <UserPlus size={14} className="text-orange" />
          <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
            Audience &amp; follows
          </p>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-brown-muted">Profile views</dt>
            <dd className="font-semibold text-brown">{audience.profileViews.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">New follows</dt>
            <dd className="font-semibold text-brown">{audience.newFollows.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">Total followers</dt>
            <dd className="font-semibold text-brown">{audience.totalFollows.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">Follow rate</dt>
            <dd className="font-semibold text-orange">{formatRate(audience.followRate)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Where you were seen</p>
        <ul className="mt-2 space-y-2">
          {surfaces.slice(0, 5).map((row) => (
            <li key={row.surface}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-brown">
                  <SurfaceIcon surface={row.surface} />
                  {row.label}
                </span>
                <span className="text-brown-muted">
                  {row.count.toLocaleString()} ({formatRate(row.pct, 0)})
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brown/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange to-purple"
                  style={{ width: `${Math.min(100, row.pct)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {viewerGeography.length > 0 && (
        <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-orange" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
              Viewer cities
            </p>
          </div>
          <ul className="mt-2 space-y-1">
            {viewerGeography.slice(0, 4).map((row) => (
              <li key={row.city} className="flex items-center justify-between text-xs">
                <span className="font-medium text-brown">{row.city}</span>
                <span className="text-brown-muted">
                  {row.views.toLocaleString()} views
                  {row.distantSaves > 0 ? ` · ${row.distantSaves} distant saves` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
          Commerce efficiency
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-brown-muted">Refund rate</dt>
            <dd className="font-semibold text-brown">{formatRate(commerce.refundRate)}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">Repeat buyers</dt>
            <dd className="font-semibold text-brown">{formatRate(commerce.repeatBuyerRate)}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">Avg ticket</dt>
            <dd className="font-semibold text-brown">{formatCents(commerce.avgTicketPriceCents)}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">Rev / impression</dt>
            <dd className="font-semibold text-success-deep">
              {formatCents(commerce.revenuePerImpressionCents)}
            </dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={onViewEvents}
        className="flex w-full items-center justify-between rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2.5 text-left text-sm font-semibold text-brown transition hover:border-orange/30 hover:bg-orange/5"
      >
        <span>View full event performance table</span>
        <ChevronRight size={16} className="text-brown-muted" />
      </button>
    </div>
  )
}

function TrustedFinanceSection({ snapshot }: { snapshot: HostAnalyticsSnapshot }) {
  const { finance, recentTransactions } = snapshot

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-orange" />
          <p className="font-display text-sm font-bold text-brown">Finance summary</p>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-brown-muted">Gross</dt>
            <dd className="font-semibold text-brown">{formatCents(finance.grossCents)}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">Platform fees</dt>
            <dd className="font-semibold text-brown">{formatCents(finance.platformFeesCents)}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">Net</dt>
            <dd className="font-semibold text-success-deep">{formatCents(finance.netCents)}</dd>
          </div>
          <div>
            <dt className="text-brown-muted">Refunds</dt>
            <dd className="font-semibold text-maroon">{formatCents(finance.refundsCents)}</dd>
          </div>
        </dl>
      </div>

      {recentTransactions.length > 0 && (
        <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Recent transactions</p>
          <ul className="mt-2 divide-y divide-app-subtle">
            {recentTransactions.slice(0, 3).map((txn) => (
              <li key={txn.id} className="flex items-center justify-between py-2 text-xs">
                <div>
                  <p className="font-medium text-brown">{txn.label}</p>
                  <p className="text-brown-muted">{new Date(txn.timestamp).toLocaleDateString()}</p>
                </div>
                <span
                  className={`font-semibold ${txn.status === 'cancelled' ? 'text-maroon' : 'text-success-deep'}`}
                >
                  {txn.status === 'cancelled' ? '-' : ''}
                  {formatCents(txn.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FinanceHubButton() {
  return (
    <Link
      to="/host/finance"
      className="mt-4 flex w-full items-center justify-between rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-3 text-sm font-semibold text-brown no-underline transition hover:border-orange/30 hover:bg-orange/5 active:scale-[0.98]"
    >
      <span className="inline-flex items-center gap-2">
        <Wallet size={16} className="text-orange" />
        Finance Hub
      </span>
      <ChevronRight size={16} className="text-brown-muted" />
    </Link>
  )
}

export default function HostAnalyticsPanel({
  account,
  hostAccountId,
  events,
}: HostAnalyticsPanelProps) {
  const org = hostAccountId ? getOrganization(hostAccountId) : null
  const orgApprovalStatus = org ? getOrganizationApprovalStatus(org) : null
  const orgVerificationRequest = hostAccountId
    ? getOrgVerificationRequestForOrg(hostAccountId)
    : undefined
  const orgLocked = !!hostAccountId && orgApprovalStatus !== 'approved'

  const analyticsTier = resolveHostAnalyticsTier(account.tier, account.verificationStatus)
  const personalLocked = analyticsTier === 'unverified'
  const locked = personalLocked || orgLocked
  const snapshot = useMemo(
    () =>
      getHostAnalytics({
        email: account.email,
        tier: account.tier,
        verificationStatus: account.verificationStatus,
        hostAccountId,
        events,
      }),
    [account.email, account.tier, account.verificationStatus, hostAccountId, events],
  )

  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [upsellOpen, setUpsellOpen] = useState(false)

  const placeholderTiles: HostMetricTile[] = HOST_METRIC_ORDER.map((key) => ({
    key,
    label: HOST_METRIC_LABELS[key],
    value: 0,
    priorValue: 0,
    sparkline: [0, 0, 0, 0, 0, 0, 0],
    format: key === 'revenue' ? 'currency' : 'number',
  }))

  const tiles = snapshot?.metrics ?? placeholderTiles

  function handleTileClick(tile: HostMetricTile) {
    if (analyticsTier === 'verified') {
      setUpsellOpen(true)
      return
    }
    if (analyticsTier === 'pioneer' || analyticsTier === 'trusted') {
      void tile
      setBreakdownOpen(true)
    }
  }

  const showTrend = !locked && (analyticsTier === 'pioneer' || analyticsTier === 'trusted')
  const showSparkline = !locked && (analyticsTier === 'pioneer' || analyticsTier === 'trusted')

  return (
    <section className="mt-6">
      <div className="host-analytics-panel overflow-hidden rounded-[14px] border border-app-subtle bg-gradient-to-br from-orange/12 via-sunset-pink/8 to-purple/8 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-orange" />
            <div>
              <h2 className="font-display text-base font-bold text-brown">Analytics &amp; Finance</h2>
              {!locked && snapshot && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brown-muted">
                  {snapshot.periodLabel}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {tiles.map((tile) => (
            <MetricTile
              key={tile.key}
              tile={tile}
              locked={locked}
              showTrend={showTrend}
              showSparkline={showSparkline}
              onClick={locked ? undefined : () => handleTileClick(tile)}
            />
          ))}
        </div>

        {locked && !orgLocked && (
          <p className="mt-2 text-center text-[11px] text-brown-muted">
            All 6 metrics unlock after phone verification.
          </p>
        )}

        {locked && (
          <div className="mt-4 rounded-[14px] border border-app-subtle bg-app-elevated p-4 text-center shadow-sm">
            <Lock size={20} className="mx-auto text-brown-muted" />
            {orgLocked ? (
              <>
                <p className="mt-2 font-display text-sm font-bold text-brown">
                  {orgApprovalStatus === 'rejected'
                    ? 'Organization not approved'
                    : 'Organization pending verification'}
                </p>
                <p className="mt-1 text-xs text-brown-muted">
                  {orgApprovalStatus === 'rejected'
                    ? 'Contact support for details. Analytics unlock after approval.'
                    : orgVerificationRequest
                      ? `Verification request #${orgVerificationRequest.requestNumber} is in the Control Room queue. Analytics unlock after approval.`
                      : 'Your Host Account is in the Control Room review queue. Analytics unlock after approval.'}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-display text-sm font-bold text-brown">
                  Verify your host account to unlock analytics
                </p>
                <p className="mt-1 text-xs text-brown-muted">
                  Followers, views, tickets, and revenue appear here after phone verification.
                </p>
                <Link
                  to={getVerifyPhoneUrl('/host')}
                  className="mt-3 flex w-full items-center justify-center rounded-[14px] border border-orange/35 bg-app-elevated py-2.5 text-sm font-semibold text-orange no-underline transition hover:border-orange/50 hover:bg-orange/5 active:scale-[0.98]"
                >
                  Verify phone
                </Link>
              </>
            )}
          </div>
        )}

        {!locked && snapshot && (
          <EventSalesComparison
            rows={snapshot.perEventBreakdown}
            onViewAll={() => setBreakdownOpen(true)}
          />
        )}

        {!locked && analyticsTier === 'verified' && (
          <p className="mt-3 text-center text-xs text-brown-muted">
            Tap a metric for a preview — upgrade for trends and the full per-event table.
          </p>
        )}

        {!locked && snapshot && (analyticsTier === 'pioneer' || analyticsTier === 'trusted') && (
          <PioneerInsights snapshot={snapshot} />
        )}

        {!locked && snapshot?.trusted && analyticsTier === 'trusted' && (
          <TrustedInsightsSection
            trusted={snapshot.trusted}
            onViewEvents={() => setBreakdownOpen(true)}
          />
        )}

        {!locked && snapshot && analyticsTier === 'trusted' && (
          <TrustedFinanceSection snapshot={snapshot} />
        )}

        <FinanceHubButton />
      </div>

      {upsellOpen && <PioneerUpsellModal onClose={() => setUpsellOpen(false)} />}
      {breakdownOpen && snapshot && (
        <EventBreakdownModal
          snapshot={snapshot}
          onClose={() => setBreakdownOpen(false)}
          expanded={analyticsTier === 'pioneer' || analyticsTier === 'trusted'}
        />
      )}
    </section>
  )
}
