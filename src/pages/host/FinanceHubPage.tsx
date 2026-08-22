import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Banknote,
  BarChart3,
  ExternalLink,
  Landmark,
  Lock,
  Sparkles,
  Wallet,
} from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import { BackLink } from '../../components/NavActionButtons'
import {
  canWithdraw,
  formatFinanceAmount,
  getFinancePeriodLabel,
  getHostFinance,
  type FinancePeriod,
  type HostFinanceSnapshot,
} from '../../lib/hostFinance'
import { getCurrentAccount } from '../../lib/account'
import { getVerifyPhoneUrl } from '../../lib/verifyPhoneNav'

const PERIODS: FinancePeriod[] = ['24h', '7d', 'all']

const PANEL =
  'rounded-[14px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm'

function StripeStatusBadge({ status }: { status: HostFinanceSnapshot['stripeConnectStatus'] }) {
  if (status === 'connected') {
    return (
      <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
        Stripe connected
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
        Stripe pending
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/55">
      Not connected
    </span>
  )
}

function NetSalesChart({ points }: { points: HostFinanceSnapshot['netSales'] }) {
  const max = Math.max(...points.map((p) => p.amountCents), 1)

  if (points.length === 0) {
    return (
      <div className="flex min-h-[140px] flex-col items-center justify-center rounded-[14px] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center">
        <Sparkles size={22} className="text-white/25" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-white/70">No sales in this period</p>
        <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-white/40">
          Ticket revenue will chart here once events start selling.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-black/20 p-4">
      <div className="flex h-36 items-end gap-2">
        {points.map((point) => {
          const height = Math.max((point.amountCents / max) * 100, 6)
          return (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-orange/80 to-sunset-pink/70"
                style={{ height: `${height}%` }}
                title={formatFinanceAmount(point.amountCents)}
              />
              <span className="truncate text-[10px] font-medium text-white/45">{point.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FinanceHubPage() {
  const account = getCurrentAccount()
  const phoneVerified = account?.verificationStatus === 'phone_verified'
  const [period, setPeriod] = useState<FinancePeriod>('all')
  const snapshot = useMemo(() => getHostFinance(account?.email, period), [account?.email, period])
  const withdrawReady = canWithdraw(snapshot)

  function handleWithdraw() {
    if (!withdrawReady) {
      window.alert(
        snapshot.stripeConnectStatus !== 'connected'
          ? 'Connect Stripe in Payments & Payouts before withdrawing funds.'
          : 'No withdrawable balance right now.',
      )
      return
    }
    window.alert('Stripe payout — coming soon.')
  }

  function handleOpenStripe() {
    if (snapshot.stripeConnectStatus !== 'connected') {
      window.alert('Stripe Connect onboarding — coming soon.')
      return
    }
    window.alert('Stripe Express dashboard — coming soon.')
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <BackLink to="/host" variant="chevron" className="mb-3">
          Event Manager
        </BackLink>

        <section className="overflow-hidden rounded-[18px] border border-[#2a2438] bg-[#14101f] text-white shadow-[0_24px_60px_rgba(10,8,18,0.35)]">
          <div className="border-b border-white/[0.06] px-4 pb-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-orange/15 text-orange">
                  <Banknote size={22} strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h1 className="font-display text-xl font-extrabold tracking-tight text-white">
                    Finance Hub
                  </h1>
                  <p className="mt-0.5 text-sm text-white/55">
                    Manage payouts, revenue, and Stripe settings
                  </p>
                </div>
              </div>
              <StripeStatusBadge status={snapshot.stripeConnectStatus} />
            </div>

            <div className={`mt-4 grid grid-cols-3 gap-1.5 rounded-[14px] ${PANEL} p-1`}>
              {PERIODS.map((value) => {
                const active = period === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={`rounded-[12px] px-2 py-2 text-[10px] font-bold uppercase tracking-wide transition ${
                      active
                        ? 'bg-orange text-white shadow-sm'
                        : 'text-white/50 hover:bg-white/[0.05] hover:text-white/75'
                    }`}
                  >
                    {getFinancePeriodLabel(value)}
                  </button>
                )
              })}
            </div>
          </div>

          {!phoneVerified ? (
            <div className="px-4 py-8 text-center">
              <Lock size={24} className="mx-auto text-white/35" aria-hidden />
              <p className="mt-3 font-display text-sm font-bold text-white">Verify to access Finance Hub</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                Phone verification unlocks ticket revenue, payouts, and Stripe Connect for hosts.
              </p>
              <a
                href={getVerifyPhoneUrl('/host/finance')}
                className="mt-4 inline-flex items-center justify-center rounded-[14px] bg-orange px-5 py-2.5 text-sm font-bold text-white no-underline transition hover:brightness-110"
              >
                Verify phone
              </a>
            </div>
          ) : (
            <div className="space-y-4 px-4 py-4">
              <div className={`${PANEL} p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange/90">
                      Withdrawable
                    </p>
                    <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-orange">
                      {formatFinanceAmount(snapshot.withdrawableCents)}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {withdrawReady ? 'Ready to transfer to your bank' : 'Available after events pay out'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    className="shrink-0 rounded-[14px] bg-orange px-4 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(249,115,22,0.35)] transition hover:brightness-110 active:scale-[0.98]"
                  >
                    Withdraw funds
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`${PANEL} p-3.5`}>
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-white/40" aria-hidden />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">Escrowed</p>
                  </div>
                  <p className="mt-2 font-display text-xl font-bold text-white">
                    {formatFinanceAmount(snapshot.escrowedCents)}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-white/40">Held until event ends</p>
                </div>
                <div className={`${PANEL} p-3.5`}>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-white/40" aria-hidden />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">Withdrawn</p>
                  </div>
                  <p className="mt-2 font-display text-xl font-bold text-white">
                    {formatFinanceAmount(snapshot.withdrawnCents)}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-white/40">Sent to Stripe Express</p>
                </div>
              </div>

              <div className={`${PANEL} p-4`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-bold text-white">Net sales</p>
                    <p className="text-xs text-white/45">Revenue over {getFinancePeriodLabel(period).toLowerCase()}</p>
                  </div>
                  <BarChart3 size={18} className="text-white/30" aria-hidden />
                </div>
                <NetSalesChart points={snapshot.netSales} />
              </div>

              <div className={`${PANEL} p-4`}>
                <div className="mb-3 flex items-center gap-2">
                  <Wallet size={16} className="text-white/45" aria-hidden />
                  <p className="font-display text-sm font-bold text-white">Payout history</p>
                </div>
                {snapshot.payouts.length === 0 ? (
                  <div className="rounded-[14px] border border-dashed border-white/10 bg-black/20 px-4 py-7 text-center">
                    <Landmark size={22} className="mx-auto text-white/25" aria-hidden />
                    <p className="mt-3 text-sm font-semibold text-white/70">No payouts yet</p>
                    <p className="mt-1 text-xs text-white/40">
                      Withdrawals and automatic releases will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.06]">
                    {snapshot.payouts.map((payout) => (
                      <li key={payout.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{payout.label}</p>
                          <p className="text-[11px] text-white/40">{payout.date}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-emerald-300">
                            {formatFinanceAmount(payout.amountCents)}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-white/35">{payout.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenStripe}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.03] py-3 text-sm font-bold text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <ExternalLink size={16} aria-hidden />
                Open Stripe dashboard
              </button>

              <div className="space-y-2 px-1 pb-2 text-[11px] leading-relaxed text-white/35">
                <p>
                  Escrowed ticket sales stay in Tudu until your event ends and the hold period clears. They
                  won&apos;t appear in Stripe until they&apos;re released for payout.
                </p>
                <p>Powered by Stripe. Funds are held securely until your event finishes.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
