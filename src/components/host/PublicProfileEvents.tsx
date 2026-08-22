import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, MapPin } from 'lucide-react'
import type { HostEvent, OrgDepartment } from '../../lib/account'
import { getEventCostLabel } from '../../lib/account'
import { formatHostEventDateTime } from '../../lib/hostEventSchedule'

type PublicProfileEventsProps = {
  events: HostEvent[]
  orgName?: string
  departments?: OrgDepartment[]
  groupByDepartment?: boolean
  /** Full profile page vs compact block inside another card (e.g. Discover detail). */
  variant?: 'page' | 'embedded'
  /** Omit the event currently open in Discover detail. */
  excludeEventId?: string
}

export default function PublicProfileEvents({
  events,
  orgName,
  departments = [],
  groupByDepartment = false,
  variant = 'page',
  excludeEventId,
}: PublicProfileEventsProps) {
  const isEmbedded = variant === 'embedded'
  const visibleEvents = excludeEventId
    ? events.filter((item) => item.id !== excludeEventId)
    : events
  const grouped =
    groupByDepartment && departments.length > 0 && !isEmbedded
      ? buildDepartmentGroups(visibleEvents, departments)
      : null

  return (
    <section className={isEmbedded ? 'mt-4 border-t border-app-subtle pt-4' : 'mt-8 px-4'}>
      {!isEmbedded && departments.length > 0 && (
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold text-brown">Departments</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {departments.map((dept) => (
              <li
                key={dept.id}
                className="rounded-[14px] border border-brown/10 bg-white px-3 py-1 text-xs font-semibold text-brown"
              >
                {dept.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2
        className={
          isEmbedded
            ? 'font-display text-sm font-bold text-brown'
            : 'font-display text-lg font-bold text-brown'
        }
      >
        {isEmbedded ? 'Upcoming events by this host' : 'Upcoming events'}
      </h2>
      {visibleEvents.length === 0 ? (
        <EmptyEvents embedded={isEmbedded} />
      ) : grouped ? (
        <div className="mt-3 space-y-5">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-brown-muted">{label}</h3>
              <EventList events={items} orgName={orgName} embedded={isEmbedded} className="mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <EventList
          events={visibleEvents}
          orgName={orgName}
          embedded={isEmbedded}
          className="mt-3"
        />
      )}
    </section>
  )
}

function buildDepartmentGroups(
  events: HostEvent[],
  departments: OrgDepartment[],
): { label: string; items: HostEvent[] }[] {
  const groups: { label: string; items: HostEvent[] }[] = []
  const general = events.filter((e) => !e.departmentId)
  if (general.length > 0) {
    groups.push({ label: 'General', items: general })
  }
  for (const dept of departments) {
    const items = events.filter((e) => e.departmentId === dept.id)
    if (items.length > 0) {
      groups.push({ label: dept.name, items })
    }
  }
  return groups.length > 0 ? groups : [{ label: 'Upcoming', items: events }]
}

function EmptyEvents({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      className={`mt-3 rounded-[14px] border border-dashed px-4 text-center ${
        embedded
          ? 'border-app-subtle bg-app-elevated/50 py-5'
          : 'border-brown/15 bg-white/60 py-8'
      }`}
    >
      <Calendar
        size={embedded ? 22 : 28}
        className="mx-auto text-brown-muted/60"
      />
      <p className={`font-display font-bold text-brown ${embedded ? 'mt-2 text-xs' : 'mt-3 text-sm'}`}>
        No other upcoming events
      </p>
      {!embedded && (
        <p className="mt-1 text-xs text-brown-muted">Check back soon for new experiences.</p>
      )}
    </div>
  )
}

function EventList({
  events,
  orgName,
  embedded = false,
  className = '',
}: {
  events: HostEvent[]
  orgName?: string
  embedded?: boolean
  className?: string
}) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {events.map((event) => (
        <EventRow key={event.id} event={event} orgName={orgName} embedded={embedded} />
      ))}
    </ul>
  )
}

function EventRow({
  event,
  orgName,
  embedded = false,
}: {
  event: HostEvent
  orgName?: string
  embedded?: boolean
}) {
  return (
    <li>
      <Link
        to={`/event/${event.id}/rsvp`}
        className={`flex items-center gap-3 rounded-[14px] border p-3 no-underline shadow-sm transition hover:border-orange/25 ${
          embedded
            ? 'border-app-subtle bg-app-elevated hover:bg-orange/5'
            : 'border-brown/10 bg-white'
        }`}
      >
        {event.photos?.[0] ? (
          <img
            src={event.photos[0]}
            alt=""
            className="h-14 w-14 shrink-0 rounded-[14px] object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-tudu">
            <Calendar size={20} className="text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-brown">{event.title}</p>
          {event.departmentName && orgName && (
            <p className="mt-0.5 text-xs text-brown-muted">
              Department: {event.departmentName}
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-brown-muted">
            <Calendar size={12} className="shrink-0 theme-accent-icon" />
            {formatHostEventDateTime(event)}
          </p>
          {(event.venueName || event.city) && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-brown-muted">
              <MapPin size={12} className="shrink-0 theme-accent-icon" />
              {[event.venueName, event.city].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-[14px] bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase text-orange">
            {getEventCostLabel(event)}
          </span>
          <ChevronRight size={16} className="text-brown-muted" />
        </div>
      </Link>
    </li>
  )
}
