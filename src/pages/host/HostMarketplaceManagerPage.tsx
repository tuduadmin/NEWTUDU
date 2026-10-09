import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, Truck } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import { BackLink } from '../../components/NavActionButtons'
import { useHostContext } from '../../hooks/useHostContext'
import {
  formatMerchMoney,
  getHostMarketplaceSummary,
  MERCH_ORDERS_CHANGED_EVENT,
} from '../../lib/eventMerch'

export default function HostMarketplaceManagerPage() {
  const { isPersonal, activeOrg, user } = useHostContext()
  const hostKind = isPersonal ? ('personal' as const) : ('org' as const)
  const hostId = isPersonal ? (user?.email ?? '') : (activeOrg?.id ?? '')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    function reload() {
      setRefresh((r) => r + 1)
    }
    window.addEventListener(MERCH_ORDERS_CHANGED_EVENT, reload)
    return () => window.removeEventListener(MERCH_ORDERS_CHANGED_EVENT, reload)
  }, [])

  const summary = useMemo(() => {
    void refresh
    if (!hostId) return null
    return getHostMarketplaceSummary(hostKind, hostId)
  }, [hostKind, hostId, refresh])

  if (!hostId || !summary) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-10 text-center text-sm text-brown-muted">Sign in to manage marketplace.</main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />
      <main className="mx-auto max-w-lg px-4 pt-2">
        <BackLink to="/host">Event Manager</BackLink>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-brown">Marketplace manager</h1>
        <p className="mt-1 text-sm text-brown-muted">
          Sales totals and inventory across your events. Buyers shop from event pages — you run fulfillment
          here.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Kpi label="Gross merch sales" value={formatMerchMoney(summary.grossSalesCents)} accent />
          <Kpi label="Orders" value={String(summary.totalOrders)} />
          <Kpi label="Items sold" value={String(summary.totalItems)} />
          <Kpi
            label="Platform fees"
            value={formatMerchMoney(summary.platformFeeCents)}
            hint="TUDU per-item fee"
          />
        </div>

        {(summary.pendingPickup > 0 || summary.awaitingShipment > 0) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {summary.pendingPickup > 0 && (
              <span className="rounded-[10px] bg-orange/10 px-2 py-1 font-semibold text-orange">
                {summary.pendingPickup} awaiting event pickup
              </span>
            )}
            {summary.awaitingShipment > 0 && (
              <span className="rounded-[10px] bg-amber-500/15 px-2 py-1 font-semibold text-brown">
                {summary.awaitingShipment} to ship
              </span>
            )}
          </div>
        )}

        <Link
          to="/host/scan?mode=merch"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-orange no-underline hover:underline"
        >
          <Package size={14} aria-hidden />
          Open merch pickup scanner
        </Link>

        <section className="mt-6">
          <h2 className="font-display text-base font-bold text-brown">By event</h2>
          <p className="mt-0.5 text-xs text-brown-muted">
            Manage products, stock, shipping, and pick lists per event.
          </p>

          {summary.events.length === 0 ? (
            <div className="mt-4 rounded-[14px] border border-app-subtle bg-app-elevated p-6 text-center">
              <ShoppingBag size={28} className="mx-auto text-brown-muted/50" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-brown">No live events yet</p>
              <p className="mt-1 text-xs text-brown-muted">
                Publish an event, then add marketplace products from its manager.
              </p>
              <GradientButton fullWidth className="mt-4 py-2 text-sm" to="/host/create-event?new=1">
                Create event
              </GradientButton>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {summary.events.map((row) => (
                <li
                  key={row.eventId}
                  className="rounded-[14px] border border-app-subtle bg-app-elevated p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-brown">{row.eventTitle}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-brown-muted">
                        {row.eventStatus}
                      </p>
                    </div>
                    <p className="shrink-0 font-display text-sm font-extrabold text-orange">
                      {formatMerchMoney(row.grossSalesCents)}
                    </p>
                  </div>

                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-brown-muted">
                    <div>
                      <dt className="inline">Products </dt>
                      <dd className="inline font-semibold text-brown">{row.productCount}</dd>
                    </div>
                    <div>
                      <dt className="inline">Open stock </dt>
                      <dd className="inline font-semibold text-brown">{row.openStockUnits} units</dd>
                    </div>
                    <div>
                      <dt className="inline">Orders </dt>
                      <dd className="inline font-semibold text-brown">{row.ordersCount}</dd>
                    </div>
                    <div>
                      <dt className="inline">Items sold </dt>
                      <dd className="inline font-semibold text-brown">{row.itemsSold}</dd>
                    </div>
                  </dl>

                  {(row.pendingPickup > 0 || row.awaitingShipment > 0) && (
                    <p className="mt-2 text-[10px] font-semibold text-orange">
                      {row.pendingPickup > 0 && `${row.pendingPickup} pickup`}
                      {row.pendingPickup > 0 && row.awaitingShipment > 0 && ' · '}
                      {row.awaitingShipment > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Truck size={10} aria-hidden />
                          {row.awaitingShipment} ship
                        </span>
                      )}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={`/host/event/${row.eventId}/merch`}
                      className="rounded-[12px] border border-orange/30 bg-orange/5 px-3 py-1.5 text-xs font-bold text-orange no-underline"
                    >
                      Products & fulfillment
                    </Link>
                    <Link
                      to={`/host/event/${row.eventId}/operations`}
                      className="rounded-[12px] border border-app-subtle px-3 py-1.5 text-xs font-semibold text-brown no-underline"
                    >
                      Pick list & contacts
                    </Link>
                    <Link
                      to={`/event/${row.eventId}/marketplace`}
                      className="rounded-[12px] px-3 py-1.5 text-xs font-semibold text-brown-muted no-underline hover:text-orange"
                    >
                      Preview buyer shop ↗
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

function Kpi({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: string
  accent?: boolean
  hint?: string
}) {
  return (
    <div className="rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">{label}</p>
      <p
        className={`mt-0.5 font-display text-lg font-extrabold ${accent ? 'text-orange' : 'text-brown'}`}
      >
        {value}
      </p>
      {hint && <p className="text-[10px] text-brown-muted">{hint}</p>}
    </div>
  )
}
