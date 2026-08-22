import { Link } from 'react-router-dom'
import type { TierBadgeDisplay } from '../../lib/tierDisplay'

type HostTierBadgeProps = {
  badge: TierBadgeDisplay
}

export default function HostTierBadge({ badge }: HostTierBadgeProps) {
  return (
    <div className="mt-2 flex flex-col items-center">
      <span
        className={`inline-flex items-center rounded-[14px] px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.pillClass}`}
      >
        {badge.label}
      </span>
      <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-brown-muted">{badge.summary}</p>
      {badge.action?.type === 'verify' && badge.action.href && (
        <Link
          to={badge.action.href}
          className="mt-1.5 text-xs font-semibold text-orange no-underline transition hover:brightness-110"
        >
          {badge.action.text} â†’
        </Link>
      )}
      {badge.action?.type === 'upgrade' && badge.action.href && (
        <Link
          to={badge.action.href}
          className="mt-1.5 text-xs font-semibold text-orange no-underline transition hover:brightness-110"
        >
          {badge.action.text}
        </Link>
      )}
    </div>
  )
}
