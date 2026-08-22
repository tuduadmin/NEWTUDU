import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon, TicketIcon } from '@heroicons/react/24/solid'
import { getCurrentUser } from '../../lib/auth'
import { resolveCheckoutHostEvent } from '../../lib/resolveCheckoutHostEvent'
import {
  ensureUserTickets,
  getEnrichedTicketsForEvent,
  updateUserTicketHolder,
  type EnrichedUserTicket,
} from '../../lib/userTickets'
import EventCoverDisplay from '../EventCoverDisplay'
import EventTripActions from '../EventTripActions'
import Toast from '../Toast'
import {
  eventHasLodgingNearby,
  hasTripAssistOptions,
  tripLinkContextFromEvent,
} from '../../lib/eventTripLinks'
import { getMerchOrdersForUserEvent } from '../../lib/eventMerch'
import AssignTicketHolderModal from './AssignTicketHolderModal'
import SendTicketsModal from './SendTicketsModal'
import TicketBulkActionBar from './TicketBulkActionBar'
import TicketMerchPickupActions from './TicketMerchPickupActions'

type EventTicketsViewProps = {
  eventId: string
}

export default function EventTicketsView({ eventId }: EventTicketsViewProps) {
  const user = getCurrentUser()
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sendOpen, setSendOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const tickets = useMemo(() => {
    if (!user) return []
    ensureUserTickets(user.email)
    return getEnrichedTicketsForEvent(user.email, eventId)
  }, [user, eventId, refreshKey])

  const event = resolveCheckoutHostEvent(eventId)
  const tripContext = event ? tripLinkContextFromEvent(event) : null
  const merchOrders = user ? getMerchOrdersForUserEvent(user.email, eventId) : []

  const selectedTickets = tickets.filter((ticket) => selectedIds.has(ticket.id))
  const allSelected = tickets.length > 0 && selectedIds.size === tickets.length

  function refresh() {
    setRefreshKey((value) => value + 1)
    setSelectedIds(new Set())
  }

  function toggleTicket(ticketId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(ticketId)) next.delete(ticketId)
      else next.add(ticketId)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(tickets.map((ticket) => ticket.id)))
  }

  function handleAssign(holderName: string) {
    if (!user) return
    for (const ticketId of selectedIds) {
      updateUserTicketHolder(user.email, ticketId, holderName)
    }
    setToast(`Updated holder name on ${selectedIds.size} ticket${selectedIds.size === 1 ? '' : 's'}`)
    refresh()
  }

  function handleSent(recipientEmail: string, sentCount: number) {
    setToast(`Sent ${sentCount} ticket${sentCount === 1 ? '' : 's'} to ${recipientEmail}`)
    refresh()
  }

  if (!user) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="font-display text-sm font-bold text-brown">Sign in to view tickets</p>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="font-display text-sm font-bold text-brown">No tickets for this event</p>
        <p className="mt-1 text-sm text-brown-muted">
          These tickets may have been sent to someone else or moved to past events.
        </p>
      </div>
    )
  }

  const header = tickets[0]

  return (
    <>
      <div className="mx-auto w-full max-w-md px-4 py-4">
        <div className="overflow-hidden rounded-[14px] border border-orange/25 bg-app-elevated shadow-sm">
          {header.eventImage && (
            <div className="relative aspect-[2.2/1] bg-midnight-elevated">
              <EventCoverDisplay
                coverImage={header.eventImage}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h1 className="font-display text-lg font-extrabold text-white">{header.eventTitle}</h1>
                {header.eventDateTime && (
                  <p className="mt-0.5 text-xs font-semibold text-orange">{header.eventDateTime}</p>
                )}
              </div>
            </div>
          )}

          <div className="p-4">
            {!header.eventImage && (
              <h1 className="font-display text-lg font-extrabold text-brown">{header.eventTitle}</h1>
            )}
            <p className="mt-1 text-xs text-brown-muted">
              {tickets.length} ticket{tickets.length === 1 ? '' : 's'} in your wallet — select to send
              or assign, tap a row for the QR code.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-brown">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-brown/25 text-orange focus:ring-orange/30"
            />
            Select all
          </label>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brown-muted">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'List view'}
          </p>
        </div>

        <ul className="mt-2 space-y-2">
          {tickets.map((ticket) => (
            <TicketListRow
              key={ticket.id}
              ticket={ticket}
              eventId={eventId}
              selected={selectedIds.has(ticket.id)}
              onToggleSelect={() => toggleTicket(ticket.id)}
            />
          ))}
        </ul>

        <TicketBulkActionBar
          selectedCount={selectedIds.size}
          onSend={() => setSendOpen(true)}
          onAssign={() => setAssignOpen(true)}
          onClearSelection={() => setSelectedIds(new Set())}
        />

        <TicketMerchPickupActions orders={merchOrders} className="mx-0 mt-4" />

        {tripContext && hasTripAssistOptions(tripContext) && (
          <EventTripActions
            className="mt-4 px-0 pb-2"
            context={tripContext}
            lodgingNearby={eventHasLodgingNearby(event?.amenities)}
            eventId={eventId}
          />
        )}
      </div>

      <SendTicketsModal
        open={sendOpen}
        tickets={selectedTickets}
        onClose={() => setSendOpen(false)}
        onSent={handleSent}
      />

      <AssignTicketHolderModal
        open={assignOpen}
        ticketCount={selectedIds.size}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}

function TicketListRow({
  ticket,
  eventId,
  selected,
  onToggleSelect,
}: {
  ticket: EnrichedUserTicket
  eventId: string
  selected: boolean
  onToggleSelect: () => void
}) {
  return (
    <li className="flex items-stretch gap-2">
      <label className="flex shrink-0 cursor-pointer items-center px-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-brown/25 text-orange focus:ring-orange/30"
          aria-label={`Select ticket ${ticket.ticketNumber}`}
        />
      </label>

      <Link
        to={`/my-tudu/tickets/${ticket.id}`}
        state={{ eventId, returnTo: `/my-tudu/events/${eventId}/tickets` }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-3 no-underline shadow-sm transition hover:border-orange/30 active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
          <TicketIcon className="h-4 w-4" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-brown">{ticket.tierName}</p>
          <p className="mt-0.5 truncate text-xs text-brown-muted">{ticket.holderName}</p>
          <p className="mt-0.5 font-mono text-[10px] tracking-wide text-brown-muted/80">
            #{ticket.ticketNumber}
          </p>
        </div>

        <ChevronRightIcon className="h-5 w-5 shrink-0 text-brown-muted" aria-hidden />
      </Link>
    </li>
  )
}
