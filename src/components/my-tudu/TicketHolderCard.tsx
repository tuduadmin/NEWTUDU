import { MapPinIcon, TicketIcon } from '@heroicons/react/24/solid'
import EventCoverDisplay from '../EventCoverDisplay'
import type { EnrichedUserTicket } from '../../lib/userTickets'

type TicketHolderCardProps = {
  ticket: EnrichedUserTicket
  onClick: () => void
}

export default function TicketHolderCard({ ticket, onClick }: TicketHolderCardProps) {
  const dateParts = ticket.eventDateTime?.split(',') ?? []
  const dateLabel = dateParts[0]?.trim() ?? 'Date TBA'
  const timeLabel = dateParts.slice(1).join(',').trim()
  const monthLabel = dateLabel.split(' ')[0] ?? ''
  const dayLabel = dateLabel.split(' ')[1] ?? '—'

  return (
    <button
      type="button"
      onClick={onClick}
      className="ticket-holder-card group h-full w-full text-left no-underline"
    >
      <div className="ticket-surface ticket-stub-card flex h-full flex-col overflow-visible rounded-[12px] border-2 border-orange/45 shadow-md transition group-hover:border-orange group-hover:shadow-lg group-active:scale-[0.98]">
        <div className="ticket-perforation h-1.5 w-full rounded-t-[10px]" aria-hidden />

        {ticket.eventImage ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-[8px] bg-midnight-elevated">
            <EventCoverDisplay
              coverImage={ticket.eventImage}
              className="h-full w-full transition duration-300 group-hover:scale-[1.04]"
              imgClassName="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2 pb-2 pt-5">
              <p className="line-clamp-2 font-display text-[11px] font-extrabold leading-tight text-white">
                {ticket.eventTitle}
              </p>
            </div>
          </div>
        ) : (
          <div className="ticket-stub-card__title-fallback px-2.5 py-2">
            <p className="line-clamp-2 font-display text-[11px] font-extrabold leading-tight text-brown">
              {ticket.eventTitle}
            </p>
          </div>
        )}

        <div className="ticket-stub-card__tear" aria-hidden />

        <div className="ticket-stub-card__stub-body flex flex-1 flex-col px-2.5 pb-2 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="flex shrink-0 flex-col items-center rounded-[8px] border border-orange/35 bg-orange/15 px-1.5 py-0.5">
              <span className="font-display text-xs font-extrabold leading-none text-brown">
                {dayLabel}
              </span>
              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-orange">
                {monthLabel}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              {timeLabel && (
                <p className="truncate text-[9px] font-semibold text-brown-muted">{timeLabel}</p>
              )}
              {(ticket.venueName || ticket.city) && (
                <p className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] text-brown-muted">
                  <MapPinIcon className="h-3 w-3 shrink-0" aria-hidden />
                  {[ticket.venueName, ticket.city].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          <p className="mt-1.5 flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-brown-muted">
            <TicketIcon className="h-3 w-3 shrink-0 text-orange" aria-hidden />
            <span className="truncate">{ticket.tierName}</span>
          </p>
          <p className="mt-0.5 font-mono text-[8px] tracking-wider text-brown-muted/80">
            #{ticket.ticketNumber}
          </p>
        </div>

        <div className="ticket-perforation h-1.5 w-full rotate-180 rounded-b-[10px]" aria-hidden />
      </div>
    </button>
  )
}
