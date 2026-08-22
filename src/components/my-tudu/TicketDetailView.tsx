import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer, Share2 } from 'lucide-react'
import { getCurrentUser } from '../../lib/auth'
import { resolveCheckoutHostEvent } from '../../lib/resolveCheckoutHostEvent'
import { getMerchOrdersForUserEvent } from '../../lib/eventMerch'
import { getTicketPaperUrl } from '../../lib/shareTicket'
import {
  ensureUserTickets,
  getEnrichedUserTickets,
  getUserTicketById,
  type EnrichedUserTicket,
} from '../../lib/userTickets'
import {
  eventHasLodgingNearby,
  hasTripAssistOptions,
  tripLinkContextFromEvent,
} from '../../lib/eventTripLinks'
import EventTripActions from '../EventTripActions'
import ShareTicketModal from './ShareTicketModal'
import TicketEntryCard from './TicketEntryCard'
import TicketMerchPickupActions from './TicketMerchPickupActions'
import Toast from '../Toast'

type TicketDetailViewProps = {
  ticketId: string
  returnTo?: string
}

function findEnrichedTicket(ticketId: string): EnrichedUserTicket | undefined {
  const user = getCurrentUser()
  if (!user) return undefined
  ensureUserTickets(user.email)
  return getEnrichedUserTickets(user.email).find((ticket) => ticket.id === ticketId)
}

export default function TicketDetailView({ ticketId, returnTo = '/my-tudu' }: TicketDetailViewProps) {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const rawTicket = user ? getUserTicketById(user.email, ticketId) : undefined
  const ticket = findEnrichedTicket(ticketId)
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (!ticket || !rawTicket) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="font-display text-sm font-bold text-brown">Ticket not found</p>
        <p className="mt-1 text-sm text-brown-muted">
          This ticket may have expired, been removed, or sent to someone else.
        </p>
      </div>
    )
  }

  const event = resolveCheckoutHostEvent(rawTicket.eventId)
  const tripContext = event ? tripLinkContextFromEvent(event) : null
  const merchOrders = user ? getMerchOrdersForUserEvent(user.email, rawTicket.eventId) : []

  function handlePrint() {
    window.open(getTicketPaperUrl(ticket.id), '_blank', 'noopener,noreferrer')
  }

  function handleSent(recipientEmail: string) {
    setToast(`Ticket sent to ${recipientEmail}`)
    window.setTimeout(() => navigate(returnTo, { replace: true }), 1200)
  }

  return (
    <>
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center justify-center gap-2 rounded-[14px] border border-orange/35 bg-orange/10 px-3 py-2.5 text-xs font-bold text-brown transition hover:border-orange/50 hover:bg-orange/15"
          >
            <Share2 size={16} className="text-orange" aria-hidden />
            Send ticket
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2.5 text-xs font-bold text-brown transition hover:border-orange/30"
          >
            <Printer size={16} className="text-brown-muted" aria-hidden />
            Paper ticket
          </button>
        </div>

        <TicketEntryCard
          ticket={ticket}
          rawTicket={rawTicket}
          printRootId="ticket-print"
        />

        <TicketMerchPickupActions orders={merchOrders} className="mx-0 mt-4" />

        {tripContext && hasTripAssistOptions(tripContext) && (
          <EventTripActions
            className="mt-4 px-0 pb-2"
            context={tripContext}
            lodgingNearby={eventHasLodgingNearby(event?.amenities)}
            eventId={rawTicket.eventId}
          />
        )}
      </div>

      <ShareTicketModal
        open={shareOpen}
        ticket={ticket}
        onClose={() => setShareOpen(false)}
        onSent={handleSent}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
