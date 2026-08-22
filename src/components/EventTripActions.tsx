import type { ReactNode } from 'react'
import { BedDouble, Car } from 'lucide-react'
import {
  buildLodgingUrl,
  buildUberUrl,
  type TripLinkContext,
} from '../lib/eventTripLinks'
import { getAffiliateConfig, logAffiliateClick, wrapAffiliateUrl } from '../lib/affiliatePartners'

type EventTripActionsProps = {
  context: TripLinkContext
  /** Host checked "Lodging Nearby" — adds a helpful hint above hotel button. */
  lodgingNearby?: boolean
  eventId?: string
  orgId?: string
  className?: string
}

export default function EventTripActions({
  context,
  lodgingNearby = false,
  eventId,
  orgId,
  className = '',
}: EventTripActionsProps) {
  const lodgingRaw = buildLodgingUrl(context)
  const lodgingUrl = lodgingRaw
    ? wrapAffiliateUrl(lodgingRaw, 'hotel').url
    : null
  const uberUrl = buildUberUrl(context)

  const actions: { href: string; label: string; icon: ReactNode }[] = []
  if (lodgingUrl) {
    actions.push({
      href: lodgingUrl,
      label: 'Book a hotel',
      icon: <BedDouble size={16} aria-hidden />,
    })
  }
  if (uberUrl) {
    actions.push({
      href: uberUrl,
      label: 'Get an Uber',
      icon: <Car size={16} aria-hidden />,
    })
  }

  if (actions.length === 0) return null

  return (
    <div className={className}>
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-brown-muted">
        Getting there &amp; staying
      </p>
      {lodgingNearby && lodgingUrl && (
        <p className="mb-2 text-center text-xs text-brown-muted">
          Host noted lodging nearby — book a stay for event night.
        </p>
      )}
      <div className={`grid gap-2 ${actions.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-electric-blue/30 bg-electric-blue/10 px-3 py-2.5 text-xs font-bold text-brown no-underline transition hover:bg-electric-blue/15"
            onClick={() => {
              if (action.label === 'Book a hotel' && lodgingRaw) {
                const { partnerId, url } = wrapAffiliateUrl(lodgingRaw, 'hotel')
                logAffiliateClick({
                  partnerId,
                  kind: 'hotel',
                  url: lodgingRaw,
                  wrappedUrl: url,
                  eventId,
                  orgId,
                })
              }
            }}
          >
            <span className="text-electric-blue">{action.icon}</span>
            {action.label}
          </a>
        ))}
      </div>
      {lodgingUrl && (
        <p className="mt-2 text-center text-[10px] leading-snug text-brown-muted/80">
          {getAffiliateConfig().disclosureText}
        </p>
      )}
    </div>
  )
}
