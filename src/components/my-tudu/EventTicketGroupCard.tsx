import { Link } from 'react-router-dom'
import { ChevronRightIcon, MapPinIcon, TicketIcon } from '@heroicons/react/24/solid'
import EventCoverDisplay from '../EventCoverDisplay'
import type { EventTicketGroup } from '../../lib/userTickets'

type EventTicketGroupCardProps = {
  group: EventTicketGroup
  to: string
}

export default function EventTicketGroupCard({ group, to }: EventTicketGroupCardProps) {
  const ticketCount = group.tickets.length
  const tierSummary =
    ticketCount === 1
      ? group.tickets[0]?.tierName
      : `${ticketCount} tickets`

  return (
    <Link
      to={to}
      className="group flex w-full items-stretch gap-3 rounded-[14px] border-2 border-orange/30 bg-app-elevated p-3 no-underline shadow-sm transition hover:border-orange/50 hover:shadow-md active:scale-[0.99]"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-midnight-elevated">
        {group.eventImage ? (
          <EventCoverDisplay
            coverImage={group.eventImage}
            className="h-full w-full"
            imgClassName="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-orange/10 text-orange">
            <TicketIcon className="h-6 w-6" aria-hidden />
          </div>
        )}
        <span className="absolute bottom-1 right-1 rounded-full bg-brown px-1.5 py-0.5 text-[9px] font-bold text-white">
          {ticketCount}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <p className="line-clamp-2 font-display text-sm font-extrabold leading-tight text-brown">
          {group.eventTitle}
        </p>
        {group.eventDateTime && (
          <p className="mt-1 text-[11px] font-semibold text-orange">{group.eventDateTime}</p>
        )}
        {(group.venueName || group.city) && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-brown-muted">
            <MapPinIcon className="h-3 w-3 shrink-0" aria-hidden />
            {[group.venueName, group.city].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
          <TicketIcon className="h-3 w-3 shrink-0 text-orange" aria-hidden />
          {tierSummary}
        </p>
      </div>

      <ChevronRightIcon
        className="my-auto h-5 w-5 shrink-0 text-brown-muted transition group-hover:text-orange"
        aria-hidden
      />
    </Link>
  )
}
