import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AttendeeChecklistForm from '../components/AttendeeChecklistForm'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import { BackButton, BackLink } from '../components/NavActionButtons'
import { getEventActionLabel, resolveTicketingMode } from '../lib/account'
import { resolveCheckoutHostEvent } from '../lib/resolveCheckoutHostEvent'
import { getCurrentUser } from '../lib/auth'
import { saveChecklistResponse } from '../lib/checklist'
import { resolveTicketHolderName } from '../lib/ticketHolderName'
import {
  completeTicketCheckout,
  defaultTicketCartLines,
  formatCheckoutTotalCents,
  parseTicketCartFromSearch,
  resolveTicketCart,
} from '../lib/ticketCheckout'
import { beginPaidCheckout, isStripeCheckoutConfigured } from '../lib/payments'
import { getMerchProductsForEvent } from '../lib/eventMerch'
import { openAffiliateLink } from '../components/AffiliateOutboundLink'
import EventTripActions from '../components/EventTripActions'
import { PrivateEventChatLink } from '../components/private-event/PrivateEventChatPanel'
import { useFeatureFlags } from '../hooks/useFeatureFlags'
import { tripLinkContextFromEvent, eventHasLodgingNearby, hasTripAssistOptions } from '../lib/eventTripLinks'

type RsvpPhase = 'checklist' | 'confirm' | 'done'

export default function EventRsvpPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const flags = useFeatureFlags()
  const event = id ? resolveCheckoutHostEvent(id) : undefined

  const [phase, setPhase] = useState<RsvpPhase>(() => {
    if (event?.checklist?.enabled) return 'checklist'
    return 'confirm'
  })
  const [checklistData, setChecklistData] = useState<{
    selectedItemIds: string[]
    dietaryNote: string
    skipped: boolean
  } | null>(null)
  const [error, setError] = useState('')
  const [lastTicketId, setLastTicketId] = useState<string | undefined>()
  const [purchasedCount, setPurchasedCount] = useState(0)

  const cartResolution = useMemo(() => {
    if (!event) return null
    const parsed = parseTicketCartFromSearch(searchParams.toString())
    const lines = parsed.length > 0 ? parsed : defaultTicketCartLines(event)
    return resolveTicketCart(event, lines)
  }, [event, searchParams])

  if (!event) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar />
        <main className="px-4 pt-10 text-center">
          <h1 className="font-display text-xl font-bold text-brown">Event not found</h1>
          <BackLink to="/discover" className="mt-4 text-orange">
            Browse events →
          </BackLink>
        </main>
        <BottomNav />
      </div>
    )
  }

  const hostEvent = event
  const mode = resolveTicketingMode(hostEvent)
  const actionLabel = getEventActionLabel(hostEvent)
  const chatEnabled = flags.privateEventChatEnabled && hostEvent.visibility === 'private'
  const isTicketed = mode === 'sell' || mode === 'external'
  const attendeeEmail = user?.email ?? 'guest@demo.tudu.ca'
  const attendeeName = user ? resolveTicketHolderName(user.email) : 'Guest'
  const cartInvalid = cartResolution && !cartResolution.ok
  const cartSummary = cartResolution?.ok ? cartResolution : null

  function handleChecklistComplete(data: {
    selectedItemIds: string[]
    dietaryNote: string
    skipped: boolean
  }) {
    setChecklistData(data)
    setPhase('confirm')
  }

  async function handleConfirm() {
    setError('')

    if (mode === 'external' && hostEvent.externalTicketUrl) {
      openAffiliateLink({
        url: hostEvent.externalTicketUrl,
        kind: 'external_ticket',
        eventId: hostEvent.id,
        orgId: hostEvent.hostAccountId ?? undefined,
      })
      setPhase('done')
      return
    }

    if (checklistData && hostEvent.checklist?.enabled) {
      saveChecklistResponse({
        eventId: hostEvent.id,
        attendeeEmail,
        attendeeName,
        selectedItemIds: checklistData.selectedItemIds,
        dietaryNote: checklistData.dietaryNote,
        skipped: checklistData.skipped,
        completedAt: new Date().toISOString(),
      })
    }

    if (!cartSummary) {
      setError(cartResolution && !cartResolution.ok ? cartResolution.error : 'Select tickets to continue.')
      return
    }

    const needsPaidCheckout = mode === 'sell' && cartSummary.totalCents > 0

    if (needsPaidCheckout) {
      const paid = await beginPaidCheckout({
        kind: 'ticket_order',
        eventId: hostEvent.id,
        attendeeEmail,
        attendeeName,
        lines: cartSummary.lines,
      })
      if (paid.outcome === 'redirect') return
      if (paid.outcome === 'error') {
        setError(paid.error)
        return
      }
      setPurchasedCount(cartSummary.totalQty)
      setPhase('done')
      return
    }

    const result = completeTicketCheckout({
      eventId: hostEvent.id,
      attendeeEmail,
      attendeeName,
      lines: cartSummary.lines,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setLastTicketId(result.ticketIds[0])
    setPurchasedCount(result.totalTickets)
    setPhase('done')
  }

  const confirmLabel =
    cartSummary && cartSummary.totalQty > 1
      ? `Confirm ${cartSummary.totalQty} tickets · ${formatCheckoutTotalCents(cartSummary.totalCents)}`
      : actionLabel

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar />

      <main className="px-4 pt-4">
        <BackLink
          to={hostEvent.visibility === 'private' ? `/event/private/${hostEvent.id}` : '/discover'}
        >
          Back to event
        </BackLink>

        <div className="mt-4 rounded-[14px] border border-brown/10 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-orange">
            {isTicketed ? 'Ticket checkout' : 'RSVP'}
          </p>
          <h1 className="mt-1 font-display text-xl font-extrabold text-brown">{hostEvent.title}</h1>

          {phase === 'checklist' && hostEvent.checklist?.enabled && (
            <div className="mt-5">
              <AttendeeChecklistForm
                event={hostEvent}
                attendeeEmail={attendeeEmail}
                attendeeName={attendeeName}
                onComplete={handleChecklistComplete}
                onCancel={() => navigate(-1)}
              />
            </div>
          )}

          {phase === 'confirm' && (
            <div className="mt-5 space-y-4">
              {checklistData && hostEvent.checklist?.enabled && (
                <div className="rounded-[14px] border border-brown/10 bg-cream-dark/50 p-3 text-sm text-brown-muted">
                  <p className="font-bold text-brown">Checklist complete</p>
                  {checklistData.skipped ? (
                    <p className="mt-1">Skipped item signup</p>
                  ) : checklistData.selectedItemIds.length > 0 ? (
                    <ul className="mt-1 list-inside list-disc">
                      {checklistData.selectedItemIds.map((itemId) => {
                        const item = hostEvent.checklist?.items.find((row) => row.id === itemId)
                        return <li key={itemId}>{item?.label ?? 'Selected item'}</li>
                      })}
                    </ul>
                  ) : null}
                  {checklistData.dietaryNote && (
                    <p className="mt-1">Dietary: {checklistData.dietaryNote}</p>
                  )}
                </div>
              )}

              {cartSummary && mode !== 'external' && (
                <div className="rounded-[14px] border border-app-subtle bg-cream/40 p-4">
                  <p className="font-display text-xs font-bold uppercase tracking-wide text-brown-muted">
                    Order summary
                  </p>
                  <ul className="mt-3 space-y-2">
                    {cartSummary.lines.map((line) => (
                      <li
                        key={line.tier.id}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="text-brown">
                          {line.tier.name}{' '}
                          <span className="text-brown-muted">× {line.quantity}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-brown">
                          {formatCheckoutTotalCents(line.quantity * line.tier.priceCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-brown/10 pt-3 text-sm font-bold text-brown">
                    <span>
                      {cartSummary.totalQty} ticket{cartSummary.totalQty === 1 ? '' : 's'}
                    </span>
                    <span>{formatCheckoutTotalCents(cartSummary.totalCents)}</span>
                  </div>
                  <p className="mt-2 text-xs text-brown-muted">
                    Each ticket gets its own QR in My TUDU — send them individually after checkout.
                  </p>
                </div>
              )}

              <p className="text-sm text-brown-muted">
                {mode === 'external'
                  ? 'You will be redirected to the external ticket vendor.'
                  : mode === 'sell'
                    ? isStripeCheckoutConfigured()
                      ? 'Pay securely with Stripe to complete your order.'
                      : 'Demo checkout — no payment collected until Stripe is connected.'
                    : 'Confirm your spot for this free event.'}
              </p>

              {(error || cartInvalid) && (
                <p className="text-sm font-semibold text-maroon">
                  {error || (cartResolution && !cartResolution.ok ? cartResolution.error : '')}
                </p>
              )}

              <GradientButton
                type="button"
                fullWidth
                className="rounded-[14px] py-3.5"
                onClick={handleConfirm}
                disabled={Boolean(cartInvalid) && mode !== 'external'}
              >
                {confirmLabel}
              </GradientButton>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-5 text-center">
              <p className="font-display text-lg font-bold text-success-deep">
                {mode === 'external'
                  ? 'Opening ticket link...'
                  : purchasedCount > 1
                    ? `${purchasedCount} tickets added!`
                    : "You're on the list!"}
              </p>
              <p className="mt-2 text-sm text-brown-muted">
                {mode === 'sell'
                  ? 'Demo purchase complete — each ticket is in My TUDU with its own QR.'
                  : mode === 'external'
                    ? 'Complete purchase on the external site.'
                    : purchasedCount > 1
                      ? `${purchasedCount} tickets saved to your wallet (localStorage demo).`
                      : 'Your RSVP has been recorded (localStorage demo).'}
              </p>
              {getMerchProductsForEvent(hostEvent.id).length > 0 && mode !== 'external' && (
                <div className="mt-4 rounded-[14px] border border-orange/25 bg-orange/5 px-4 py-3 text-left">
                  <p className="text-sm font-semibold text-brown">Add event merch</p>
                  <p className="mt-1 text-xs text-brown-muted">
                    Pre-order tees, hoodies, and more — pick up from the shelf with a separate pickup QR.
                  </p>
                  <GradientButton
                    type="button"
                    fullWidth
                    className="mt-3 rounded-[14px] py-3"
                    onClick={() =>
                      navigate(
                        `/event/${hostEvent.id}/marketplace${lastTicketId ? `?ticket=${lastTicketId}` : ''}`,
                      )
                    }
                  >
                    Browse marketplace
                  </GradientButton>
                </div>
              )}
              {hasTripAssistOptions(tripLinkContextFromEvent(hostEvent)) && (
                <EventTripActions
                  className="mt-5 rounded-[14px] border border-electric-blue/20 bg-electric-blue/5 p-4"
                  context={tripLinkContextFromEvent(hostEvent)}
                  lodgingNearby={eventHasLodgingNearby(hostEvent.amenities)}
                  eventId={hostEvent.id}
                  orgId={hostEvent.hostAccountId ?? undefined}
                />
              )}
              {chatEnabled && (
                <PrivateEventChatLink event={hostEvent} className="mt-5 w-full" />
              )}
              <GradientButton
                to="/my-tudu"
                fullWidth
                className="mt-5 rounded-[14px] py-3.5"
              >
                {purchasedCount > 1 ? `View ${purchasedCount} tickets` : 'View Tickets'}
              </GradientButton>
              <BackButton
                variant="link"
                onClick={() => navigate('/discover')}
                className="mt-3 w-full justify-center"
              >
                Back to Discover
              </BackButton>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
