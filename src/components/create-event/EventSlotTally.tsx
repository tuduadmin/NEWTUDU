import { Link } from 'react-router-dom'
import type { EventSlotBudget } from '../../lib/eventSlotBudget'
import HostAddSlotsLink from '../host/HostAddSlotsLink'
import { getVerifyPhoneUrl } from '../../lib/verifyPhoneNav'

type EventSlotTallyProps = {
  budget: EventSlotBudget | null
  compact?: boolean
}

const verifyLinkClass =
  'text-[10px] font-semibold uppercase tracking-wide text-orange no-underline transition hover:brightness-110'

export default function EventSlotTally({ budget, compact = false }: EventSlotTallyProps) {
  if (!budget) return null

  const kindLabel = budget.kind === 'private' ? 'private' : 'public'
  const tallyClass = budget.isOver
    ? 'text-[11px] font-semibold text-maroon'
    : 'text-[11px] text-brown-muted'

  return (
    <div className={compact ? '' : 'space-y-1'}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={`inline-flex items-center rounded-[14px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${budget.tierPillClass}`}
        >
          {budget.tierLabel}
        </span>
        <span className={tallyClass}>
          {budget.projected}/{budget.limit} {kindLabel}
        </span>
        {budget.showVerify && (
          <Link to={getVerifyPhoneUrl('/host/create-event')} className={verifyLinkClass}>
            Verify →
          </Link>
        )}
        {!budget.showVerify && budget.canBuyMore && budget.isOver && (
          <HostAddSlotsLink className="text-[10px]" />
        )}
      </div>
      {!compact && (
        <p className="text-[10px] leading-snug text-brown-muted">
          Plan freely — we&apos;ll check slots before publish.
        </p>
      )}
    </div>
  )
}
