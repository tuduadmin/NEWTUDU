import { useMemo, useState } from 'react'
import type { DiscoverEvent, DiscoverTicketTier } from '../data/discoverEvents'
import { buildTicketCheckoutSearchParams } from '../lib/ticketCheckout'
import AffiliateOutboundLink from './AffiliateOutboundLink'
import EventCoverDisplay from './EventCoverDisplay'
import GradientButton from './GradientButton'

type DiscoverSelectTicketsModalProps = {
  event: DiscoverEvent
  onClose: () => void
}

type TierSelection = Record<string, number>

function tierLeft(tier: DiscoverTicketTier): number | null {
  if (tier.quantity == null) return null
  return Math.max(0, tier.quantity - (tier.sold ?? 0))
}

function tierSoldPercent(tier: DiscoverTicketTier): number | null {
  if (tier.quantity == null || tier.quantity <= 0) return null
  return Math.min(100, Math.round(((tier.sold ?? 0) / tier.quantity) * 100))
}

function ticketCtaLabel(event: DiscoverEvent, totalQty: number, totalCents: number): string {
  if (event.isUnavailable) return 'Sold Out'
  if (totalQty <= 0) return event.ticketingMode === 'free_rsvp' ? 'Select tickets' : 'Select tickets'
  const isFree = totalCents === 0
  if (isFree) return `Claim ${totalQty} Free Ticket${totalQty === 1 ? '' : 's'}`
  const dollars = (totalCents / 100).toFixed(totalCents % 100 === 0 ? 0 : 2)
  return `Buy ${totalQty} Ticket${totalQty === 1 ? '' : 's'} | $${dollars}`
}

export default function DiscoverSelectTicketsModal({
  event,
  onClose,
}: DiscoverSelectTicketsModalProps) {
  const tiers = event.ticketTiers ?? []
  const [quantities, setQuantities] = useState<TierSelection>(() =>
    Object.fromEntries(tiers.map((tier) => [tier.id, 0])),
  )

  const { totalQty, totalCents } = useMemo(() => {
    let qty = 0
    let cents = 0
    for (const tier of tiers) {
      const q = quantities[tier.id] ?? 0
      qty += q
      cents += q * (tier.priceCents ?? 0)
    }
    return { totalQty: qty, totalCents: cents }
  }, [quantities, tiers])

  const checkoutPath = useMemo(() => {
    if (!event.rsvpPath || totalQty <= 0) return event.rsvpPath
    const params = buildTicketCheckoutSearchParams(quantities)
    return params ? `${event.rsvpPath}?${params}` : event.rsvpPath
  }, [event.rsvpPath, quantities, totalQty])

  function adjustTier(tierId: string, delta: number) {
    const tier = tiers.find((row) => row.id === tierId)
    if (!tier || tier.soldOut) return
    const left = tierLeft(tier)
    const current = quantities[tierId] ?? 0
    const next = Math.max(0, current + delta)
    if (left != null && next > left) return
    setQuantities((prev) => ({ ...prev, [tierId]: next }))
  }

  const ctaLabel = ticketCtaLabel(event, totalQty, totalCents)
  const canSubmit = totalQty > 0 && !event.isUnavailable

  return (
    <>
      <button
        type="button"
        className="app-column-fixed fixed top-[calc(var(--app-header-h)+env(safe-area-inset-top))] bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[calc(var(--z-header)+1)] bg-black/60 backdrop-blur-sm"
        aria-label="Close ticket selection"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-tickets-title"
        className="app-column-fixed animate-slide-up-panel fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[calc(var(--z-header)+2)] flex max-h-[85svh] flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-cream shadow-float"
      >
        <div className="shrink-0 border-b border-brown/10 px-5 pb-3 pt-4">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-brown/15" aria-hidden />
          <div className="flex items-start gap-3">
            <EventCoverDisplay
              coverImage={event.image}
              className="h-14 w-14 shrink-0 rounded-[14px]"
              imgClassName="h-14 w-14 shrink-0 rounded-[14px] object-cover"
            />
            <div className="min-w-0 flex-1">
              <h2 id="select-tickets-title" className="font-display text-base font-extrabold text-brown">
                {event.title}
              </h2>
              {event.venueName && (
                <p className="mt-0.5 truncate text-xs text-brown-muted">{event.venueName}</p>
              )}
              {event.dateTime && <p className="mt-0.5 text-xs font-medium text-orange">{event.dateTime}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-dark text-brown-muted"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-brown-muted">Select tickets</p>
          <ul className="mt-3 space-y-3">
            {tiers.map((tier) => {
              const left = tierLeft(tier)
              const soldPct = tierSoldPercent(tier)
              const qty = quantities[tier.id] ?? 0
              return (
                <li
                  key={tier.id}
                  className="rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-brown">{tier.name}</p>
                      {tier.description && (
                        <p className="mt-0.5 text-xs text-brown-muted">{tier.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-extrabold text-orange">{tier.priceLabel}</span>
                        {tier.availableAtDoor && (
                          <span className="rounded-[14px] bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-700">
                            At door
                          </span>
                        )}
                        {left != null && (
                          <span className="text-[11px] text-brown-muted">{left} left</span>
                        )}
                      </div>
                      {soldPct != null && (
                        <div className="mt-2">
                          <div className="h-1.5 overflow-hidden rounded-[14px] bg-cream-dark">
                            <div
                              className="h-full rounded-[14px] bg-gradient-tudu"
                              style={{ width: `${soldPct}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-[10px] text-brown-muted">{soldPct}% sold</p>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        disabled={tier.soldOut || qty <= 0}
                        onClick={() => adjustTier(tier.id, -1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-brown/15 bg-cream text-lg font-bold text-brown disabled:opacity-30"
                        aria-label={`Decrease ${tier.name}`}
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-display text-sm font-bold text-brown">{qty}</span>
                      <button
                        type="button"
                        disabled={tier.soldOut || (left != null && qty >= left)}
                        onClick={() => adjustTier(tier.id, 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-orange/30 bg-orange/10 text-lg font-bold text-orange disabled:opacity-30"
                        aria-label={`Increase ${tier.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="shrink-0 border-t border-brown/10 bg-cream px-5 pb-4 pt-3">
          {checkoutPath && canSubmit ? (
            <GradientButton to={checkoutPath} fullWidth onClick={onClose}>
              {ctaLabel}
            </GradientButton>
          ) : event.externalTicketUrl ? (
            <AffiliateOutboundLink
              href={event.externalTicketUrl}
              kind={
                event.ticketingMode === 'free_donation' ? 'zeffy_donation' : 'external_ticket'
              }
              eventId={event.hostEventId ?? event.id}
              orgId={event.hostAccountId}
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-[14px] bg-gradient-tudu px-6 py-3 font-display text-sm font-bold tracking-wide text-white shadow-md no-underline transition hover:brightness-110 active:scale-[0.98]"
            >
              Get Tickets
            </AffiliateOutboundLink>
          ) : (
            <GradientButton fullWidth disabled={!canSubmit} variant={canSubmit ? 'default' : 'dark'}>
              {ctaLabel}
            </GradientButton>
          )}
          <p className="mt-2 text-center text-[10px] text-brown-muted">
            Refunds subject to host policy | Demo checkout on RSVP page
          </p>
        </div>
      </div>
    </>
  )
}
