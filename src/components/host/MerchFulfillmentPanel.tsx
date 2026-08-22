import { useMemo, useState } from 'react'
import { Download, PackageCheck, Search, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HostEvent } from '../../lib/account'
import {
  exportMerchFulfillmentCsv,
  filterMerchFulfillmentRows,
  getMerchFulfillmentRows,
  redeemMerchOrderById,
  type MerchFulfillmentRow,
  type MerchFulfillmentStatusFilter,
} from '../../lib/eventMerch'
import GradientButton from '../GradientButton'

type MerchFulfillmentPanelProps = {
  event: HostEvent
  refreshKey: number
  onRedeemed: () => void
}

export default function MerchFulfillmentPanel({
  event,
  refreshKey,
  onRedeemed,
}: MerchFulfillmentPanelProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<MerchFulfillmentStatusFilter>('all')
  const [redeemError, setRedeemError] = useState<string | null>(null)

  const rows = useMemo(() => {
    void refreshKey
    return getMerchFulfillmentRows(event.id)
  }, [event.id, refreshKey])

  const filtered = useMemo(
    () => filterMerchFulfillmentRows(rows, query, status),
    [rows, query, status],
  )

  const pendingCount = useMemo(
    () => rows.filter((row) => row.status === 'pending_pickup').length,
    [rows],
  )
  const pickedUpCount = useMemo(
    () => rows.filter((row) => row.status === 'picked_up').length,
    [rows],
  )

  function handleExport() {
    exportMerchFulfillmentCsv(event.title, filtered)
  }

  function handleMarkPickedUp(orderId: string) {
    const result = redeemMerchOrderById(orderId)
    if (!result.ok) {
      setRedeemError(result.error)
      return
    }
    setRedeemError(null)
    onRedeemed()
  }

  const firstRedeemRowKeyByOrder = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of filtered) {
      if (row.status === 'pending_pickup' && !map.has(row.orderId)) {
        map.set(row.orderId, `${row.orderId}-${row.productName}-${row.size}`)
      }
    }
    return map
  }, [filtered])

  return (
    <section className="mt-6 rounded-[14px] border border-app-subtle bg-app-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck size={18} className="text-orange" aria-hidden />
            <h2 className="font-display text-sm font-bold text-brown">Fulfillment list</h2>
          </div>
          <p className="mt-1 text-xs text-brown-muted">
            Search by pickup number, email, or name. Export for shelf prep or lost QR lookup.
          </p>
        </div>
        <Link
          to="/host/scan?manual=1&mode=merch"
          className="inline-flex items-center gap-1.5 rounded-[12px] border border-orange/30 bg-orange/5 px-3 py-2 text-xs font-semibold text-orange no-underline transition hover:bg-orange/10"
        >
          <ScanLine size={14} aria-hidden />
          Open pickup scanner
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatCard label="Waiting pickup" value={pendingCount} tone="orange" />
        <StatCard label="Picked up" value={pickedUpCount} tone="green" />
      </div>

      <div className="relative mt-3">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pickup #, email, name, product…"
          className="app-field w-full py-2.5 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {(
          [
            ['all', 'All'],
            ['pending_pickup', 'Waiting'],
            ['picked_up', 'Picked up'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-[10px] border px-2.5 py-1 text-xs font-semibold transition ${
              status === value
                ? 'border-orange bg-orange/10 text-orange'
                : 'border-brown/15 text-brown-muted hover:border-orange/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {redeemError && (
        <p className="mt-2 text-xs font-semibold text-maroon" role="alert">
          {redeemError}
        </p>
      )}

      <div className="mt-3 max-h-80 overflow-y-auto rounded-[12px] border border-brown/10">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-brown-muted">
            {rows.length === 0 ? 'No merch orders yet.' : 'No orders match your search.'}
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-cream-dark/90 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
              <tr>
                <th className="px-3 py-2 font-bold">Pickup</th>
                <th className="px-3 py-2 font-bold">Buyer</th>
                <th className="px-3 py-2 font-bold">Item</th>
                <th className="px-3 py-2 text-right font-bold">Qty</th>
                <th className="px-3 py-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown/10">
              {filtered.map((row) => (
                <FulfillmentRow
                  key={`${row.orderId}-${row.productName}-${row.size}`}
                  row={row}
                  showRedeemButton={
                    row.status === 'pending_pickup' &&
                    firstRedeemRowKeyByOrder.get(row.orderId) ===
                      `${row.orderId}-${row.productName}-${row.size}`
                  }
                  onMarkPickedUp={handleMarkPickedUp}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <GradientButton
        type="button"
        fullWidth
        className="mt-3 py-2.5 text-sm"
        onClick={handleExport}
        disabled={filtered.length === 0}
      >
        <Download size={16} className="mr-1.5" aria-hidden />
        Export CSV ({filtered.length})
      </GradientButton>
    </section>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'orange' | 'green'
}) {
  const valueClass = tone === 'green' ? 'text-success' : 'text-orange'
  return (
    <div className="rounded-[12px] border border-app-subtle bg-cream-dark/40 px-3 py-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">{label}</p>
      <p className={`mt-0.5 font-display text-xl font-extrabold ${valueClass}`}>{value}</p>
    </div>
  )
}

function FulfillmentRow({
  row,
  showRedeemButton,
  onMarkPickedUp,
}: {
  row: MerchFulfillmentRow
  showRedeemButton: boolean
  onMarkPickedUp: (orderId: string) => void
}) {
  const pending = row.status === 'pending_pickup'
  return (
    <tr className="bg-white">
      <td className="px-3 py-2 align-top">
        <p className="font-mono font-semibold text-brown">{row.pickupNumber}</p>
      </td>
      <td className="px-3 py-2 align-top">
        <p className="font-semibold text-brown">{row.holderName}</p>
        <p className="text-[11px] text-brown-muted">{row.userEmail}</p>
      </td>
      <td className="px-3 py-2 align-top">
        <p className="text-brown">{row.productName}</p>
        <p className="text-[11px] text-brown-muted">{row.size}</p>
      </td>
      <td className="px-3 py-2 text-right align-top font-semibold tabular-nums text-brown">
        ×{row.quantity}
      </td>
      <td className="px-3 py-2 align-top">
        {pending ? (
          showRedeemButton ? (
            <button
              type="button"
              onClick={() => onMarkPickedUp(row.orderId)}
              className="rounded-[10px] bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success transition hover:bg-success/25"
            >
              Mark picked up
            </button>
          ) : (
            <span className="rounded-[10px] bg-orange/10 px-2 py-0.5 text-[10px] font-bold text-orange">
              Waiting
            </span>
          )
        ) : (
          <span className="rounded-[10px] bg-cream-dark px-2 py-0.5 text-[10px] font-bold text-brown-muted">
            Picked up
          </span>
        )}
      </td>
    </tr>
  )
}
