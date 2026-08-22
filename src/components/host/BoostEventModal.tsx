import { useEffect, useState } from 'react'
import { Flame, Link as LinkIcon, Rocket, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HostEvent } from '../../lib/account'
import { getHostBoostBalance, useHostBoost } from '../../lib/hostEventBoosts'
import { getTierConfig } from '../../lib/tierConfig'
import GradientButton from '../GradientButton'

const KUDOS_PER_BOOST = 500

type BoostEventModalProps = {
  open: boolean
  event: HostEvent | null
  hostEmail: string
  onClose: () => void
  onBoostUsed?: () => void
}

const BOOST_PACKS = [
  { count: 1, priceKey: 'boostSingle' as const, badge: null },
  { count: 3, priceKey: 'boost3Pack' as const, badge: 'Save 40%' },
  { count: 5, price: 14.99, badge: 'Popular' },
  { count: 10, price: 29.99, badge: 'Best value' },
]

export default function BoostEventModal({
  open,
  event,
  hostEmail,
  onClose,
  onBoostUsed,
}: BoostEventModalProps) {
  const [balance, setBalance] = useState(() => getHostBoostBalance(hostEmail))
  const [activeBoost, setActiveBoost] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setActiveBoost(false)
      setError('')
      return
    }
    setBalance(getHostBoostBalance(hostEmail))
  }, [open, hostEmail, event?.id])

  if (!open || !event) return null

  const config = getTierConfig()
  const kudosBalance = 0

  function handleUseBoost() {
    setError('')
    const result = useHostBoost(hostEmail)
    if (!result.ok) {
      setError(result.error ?? 'Could not use boost.')
      return
    }
    setBalance(result.remaining ?? 0)
    setActiveBoost(true)
    onBoostUsed?.()
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/40 backdrop-blur-sm"
        aria-label="Close boost modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="boost-event-title"
        className="fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] left-1/2 z-[calc(var(--z-modal)+1)] max-h-[min(90svh,720px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 overflow-y-auto rounded-[14px] border border-app-subtle bg-app-elevated shadow-float"
      >
        <div className="sticky top-0 z-10 border-b border-app-subtle bg-app-elevated px-4 py-3">
          <div className="flex items-center justify-between">
            <h2
              id="boost-event-title"
              className="flex items-center gap-2 font-display text-lg font-bold text-brown"
            >
              <Rocket size={20} className="text-orange" aria-hidden />
              Boost Event
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-brown-muted transition hover:bg-cream-dark hover:text-brown"
              aria-label="Close"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-[14px] border border-orange/25 bg-orange/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange/15">
                <Flame size={20} className="text-orange" aria-hidden />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-brown">
                  {balance} boost{balance === 1 ? '' : 's'} available
                </p>
                <p className="mt-0.5 text-xs text-brown-muted">Never expire · 1 use / 24h / event</p>
              </div>
            </div>
          </div>

          {activeBoost && (
            <div className="rounded-[14px] border border-success/30 bg-success/5 p-3">
              <p className="font-display text-sm font-bold text-brown">{event.title}</p>
              <p className="mt-0.5 text-xs text-brown-muted">
                Pushes to top of Discover for 24 hours (demo).
              </p>
            </div>
          )}

          {error && <p className="text-xs text-error">{error}</p>}

          <GradientButton
            type="button"
            fullWidth
            className="py-2.5 text-sm"
            onClick={handleUseBoost}
            disabled={balance <= 0 || activeBoost}
          >
            <Flame size={16} className="mr-1.5" aria-hidden />
            {activeBoost ? 'Boost active' : 'Use 1 boost'}
          </GradientButton>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Buy more</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {BOOST_PACKS.map((pack) => {
                const price =
                  'priceKey' in pack && pack.priceKey
                    ? config.microTransactions[pack.priceKey]
                    : pack.price
                return (
                  <Link
                    key={pack.count}
                    to="/host/subscription"
                    className="relative rounded-[14px] border border-app-subtle bg-app-elevated p-3 text-center no-underline transition hover:border-orange/30 hover:bg-orange/5"
                  >
                    {pack.badge && (
                      <span className="absolute -right-1 -top-1 rounded-[14px] bg-purple px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {pack.badge}
                      </span>
                    )}
                    <p className="font-display text-sm font-bold text-brown">
                      {pack.count}x boost{pack.count === 1 ? '' : 's'}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-orange">${price.toFixed(2)}</p>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="rounded-[14px] border border-app-subtle bg-cream-dark/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
              Redeem kudos
            </p>
            <p className="mt-1 text-xs text-brown-muted">
              {KUDOS_PER_BOOST} kudos = 1 free boost · {kudosBalance} your kudos
            </p>
            <button
              type="button"
              disabled
              className="mt-3 w-full rounded-[14px] border border-app-subtle bg-app-elevated py-2 text-xs font-semibold text-brown-muted"
            >
              Need {KUDOS_PER_BOOST - kudosBalance} more kudos
            </button>
          </div>

          <Link
            to="/host/subscription"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-orange no-underline hover:underline"
          >
            <LinkIcon size={12} aria-hidden />
            View all add-ons on Subscription
          </Link>
        </div>
      </div>
    </>
  )
}
