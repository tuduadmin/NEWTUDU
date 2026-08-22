import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Ticket,
  User,
} from 'lucide-react'
import type { DiscoverEvent } from '../../data/discoverEvents'
import { getEventAmenityLabel } from '../../data/eventCategories'
import DiscoverEventCard from '../DiscoverEventCard'
import GradientButton from '../GradientButton'
import { AmenityIconById } from '../../lib/amenityIcons'

type LandingFeaturedEventProps = {
  event: DiscoverEvent
  /** Extra deck previews (Hidden Gem, Attractions) between the hero card and CTA */
  children?: ReactNode
}

function LandingDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-[11px] font-bold uppercase tracking-wider text-white/55">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function LandingEventDetailPanel({ event }: { event: DiscoverEvent }) {
  const amenityItems = useMemo(() => {
    if (event.amenityIds?.length) {
      return event.amenityIds.map((id) => ({ id, label: getEventAmenityLabel(id) }))
    }
    return (event.amenityLabels ?? []).map((label) => ({ id: null as string | null, label }))
  }, [event.amenityIds, event.amenityLabels])

  return (
    <div className="mt-3 overflow-hidden rounded-[14px] border border-white/10 bg-[#121826]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <LandingDetailSection title="At a glance">
        <ul className="space-y-3 text-sm text-white/90">
          {event.dateTime && (
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/70">
                <Calendar size={14} aria-hidden />
              </span>
              <span>{event.dateTime}</span>
            </li>
          )}
          {(event.venueName || event.city) && (
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/70">
                <MapPin size={14} aria-hidden />
              </span>
              <span>
                {event.venueName}
                {event.city ? ` · ${event.city}` : ''}
              </span>
            </li>
          )}
          {event.ageRange && (
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/70">
                <User size={14} aria-hidden />
              </span>
              <span>{event.ageRange}</span>
            </li>
          )}
          {event.distance && (
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/70">
                <Clock size={14} aria-hidden />
              </span>
              <span>{event.distance}</span>
            </li>
          )}
        </ul>
      </LandingDetailSection>

      {(event.goingCount != null || event.ticketsRemaining != null || event.cost) && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center gap-3">
            {event.cost && (
              <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-orange/15 px-3 py-1 text-sm font-bold text-orange">
                <Ticket size={14} aria-hidden />
                {event.cost}
              </span>
            )}
            {event.goingCount != null && (
              <span className="text-xs font-semibold text-white/65">{event.goingCount} going</span>
            )}
            {event.ticketsRemaining != null && (
              <span className="text-xs font-semibold text-white/65">
                {event.ticketsRemaining} spots left
              </span>
            )}
          </div>
        </div>
      )}

      {event.description && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <LandingDetailSection title="About this event">
            <p className="text-sm leading-relaxed text-white/78">{event.description}</p>
          </LandingDetailSection>
        </div>
      )}

      {event.hostLabel && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <LandingDetailSection title="Hosted by">
            <p className="flex flex-wrap items-center gap-2 text-sm text-white/90">
              <span className="font-semibold text-white">{event.hostLabel}</span>
              {event.badges.includes('TRUSTED HOST') && (
                <span className="inline-flex items-center gap-1 rounded-[14px] bg-blue-600/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  <ShieldCheck size={10} aria-hidden />
                  Trusted host
                </span>
              )}
            </p>
          </LandingDetailSection>
        </div>
      )}

      {amenityItems.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <LandingDetailSection title="Amenities">
            <div className="grid grid-cols-2 gap-2">
              {amenityItems.map(({ id, label }) => (
                <div
                  key={`${id ?? 'label'}-${label}`}
                  className="flex items-center gap-2 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/85"
                >
                  {id ? (
                    <AmenityIconById
                      id={id}
                      size={16}
                      className="shrink-0 text-orange"
                      iconVariant="outline"
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full bg-white/10" aria-hidden />
                  )}
                  <span className="leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </LandingDetailSection>
        </div>
      )}
    </div>
  )
}

export default function LandingFeaturedEvent({ event, children }: LandingFeaturedEventProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mx-auto max-w-md lg:max-w-xl">
      <div className="relative pb-1 pt-2">
        <div
          className="pointer-events-none absolute inset-x-6 top-4 bottom-0 rounded-[14px] border border-white/6 bg-[#0d111c] shadow-lg"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-3 top-2 bottom-0 rounded-[14px] border border-white/8 bg-[#101626]"
          aria-hidden
        />
        <div className="relative">
          <DiscoverEventCard
            event={event}
            expanded={expanded}
            onToggleExpand={() => setExpanded((v) => !v)}
            showHostRow
            iconVariant="solid"
          />
        </div>
      </div>

      {expanded && <LandingEventDetailPanel event={event} />}

      {children}

      <div className="mt-6 text-center">
        <GradientButton to="/discover" className="px-8 py-3.5">
          See events near you
        </GradientButton>
        <p className="mt-3 text-sm text-white/65">
          No account needed to browse.{' '}
          <Link to="/discover" className="font-semibold text-peach no-underline hover:underline">
            Start swiping
          </Link>
        </p>
      </div>
    </div>
  )
}
