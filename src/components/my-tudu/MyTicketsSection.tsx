import { TicketIcon } from '@heroicons/react/24/solid'
import { useMemo } from 'react'
import GradientButton from '../GradientButton'
import EventTicketGroupCard from './EventTicketGroupCard'
import type { EnrichedUserTicket, EventTicketGroup } from '../../lib/userTickets'
import { groupTicketsByEvent } from '../../lib/userTickets'

type MyTicketsSectionProps = {
  tickets: EnrichedUserTicket[]
}

export default function MyTicketsSection({ tickets }: MyTicketsSectionProps) {
  const groups = useMemo(() => groupTicketsByEvent(tickets), [tickets])
  const totalTickets = tickets.length

  return (
    <section className="my-tickets-wallet mt-5" aria-labelledby="my-tickets-heading">
      <div className="my-tickets-wallet__perforation" aria-hidden />

      <header className="my-tickets-wallet__header">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-orange shadow-sm ring-2 ring-orange/25">
            <TicketIcon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 id="my-tickets-heading" className="my-tickets-wallet__title">
              <span className="my-tickets-wallet__title-tickets">Tickets</span>
            </h2>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brown-muted/90">
              One card per event — tap to manage
            </p>
          </div>
        </div>
        {groups.length > 0 && (
          <span className="my-tickets-wallet__count">{groups.length}</span>
        )}
      </header>

      {groups.length === 0 ? (
        <div className="my-tickets-wallet__empty">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-brown-muted ring-2 ring-dashed ring-orange/30">
            <TicketIcon className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="font-display text-sm font-bold text-brown">Wallet&apos;s empty</h3>
          <p className="mt-1 text-xs text-brown-muted">
            RSVP or buy on Discover — tickets group here by event.
          </p>
          <GradientButton to="/discover" fullWidth className="mt-4 py-2.5 text-xs">
            Browse Events
          </GradientButton>
        </div>
      ) : (
        <>
          {totalTickets > groups.length && (
            <p className="mt-2 text-[10px] font-semibold text-brown-muted">
              {totalTickets} tickets across {groups.length} event{groups.length === 1 ? '' : 's'}
            </p>
          )}
          <ul className="mt-3 space-y-2.5">
            {groups.map((group: EventTicketGroup) => (
              <li key={group.eventId}>
                <EventTicketGroupCard
                  group={group}
                  to={`/my-tudu/events/${group.eventId}/tickets`}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="my-tickets-wallet__perforation my-tickets-wallet__perforation--bottom" aria-hidden />
    </section>
  )
}
