import { QRCodeSVG } from 'qrcode.react'
import {
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
  UserIcon,
} from '@heroicons/react/24/solid'
import {
  buildQrPayload,
  type EnrichedUserTicket,
  type UserTicket,
} from '../../lib/userTickets'

type TicketEntryCardProps = {
  ticket: EnrichedUserTicket
  rawTicket: UserTicket
  printRootId?: string
  heading?: string
  className?: string
}

export default function TicketEntryCard({
  ticket,
  rawTicket,
  printRootId,
  heading = 'Your Ticket',
  className = '',
}: TicketEntryCardProps) {
  const qrPayload = buildQrPayload(rawTicket)

  return (
    <div
      id={printRootId}
      className={`ticket-surface ticket-detail-card overflow-hidden rounded-[14px] border shadow-lg ${className}`}
    >
      <div className="ticket-perforation h-3 w-full" aria-hidden />

      <div className="px-6 pt-6 pb-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brown-muted">{heading}</p>
        <h1 className="mt-2 font-display text-lg font-extrabold text-brown">{ticket.eventTitle}</h1>
      </div>

      <div className="ticket-surface-muted mx-6 flex flex-col items-center rounded-[14px] border border-dashed px-6 py-8">
        <QRCodeSVG
          value={qrPayload}
          size={220}
          level="M"
          includeMargin
          className="rounded-[14px] bg-white p-2"
        />
        <p className="mt-4 font-mono text-xs tracking-widest text-brown-muted">#{ticket.ticketNumber}</p>
        <p className="mt-3 text-sm font-semibold text-brown">{ticket.holderName}</p>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
          Ticket holder
        </p>
        <p className="mt-1 text-[10px] text-brown-muted/70">Scan at entry</p>
      </div>

      <div className="mt-4 space-y-3 border-t border-dashed border-white/10 px-6 py-5">
        {ticket.eventDateTime && (
          <div className="flex items-start gap-3">
            <CalendarDaysIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange" aria-hidden />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">When</p>
              <p className="mt-0.5 text-sm font-semibold text-brown">{ticket.eventDateTime}</p>
            </div>
          </div>
        )}
        {(ticket.venueName || ticket.city) && (
          <div className="flex items-start gap-3">
            <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange" aria-hidden />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Where</p>
              <p className="mt-0.5 text-sm font-semibold text-brown">
                {[ticket.venueName, ticket.city].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <UserIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange" aria-hidden />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
              Ticket holder
            </p>
            <p className="mt-0.5 text-sm font-semibold text-brown">{ticket.holderName}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <TicketIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange" aria-hidden />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Tier</p>
            <p className="mt-0.5 text-sm font-semibold text-brown">{ticket.tierName}</p>
          </div>
        </div>
      </div>

      <div className="ticket-perforation h-3 w-full rotate-180" aria-hidden />
    </div>
  )
}
