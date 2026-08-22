import { Link } from 'react-router-dom'
import { HOST_EVENT_SLOTS_HREF, isPublicEventLimitTight } from '../../lib/eventSlots'

type HostAddSlotsLinkProps = {
  remaining?: number
  prominent?: boolean
  className?: string
}

const baseClass = 'text-orange no-underline transition hover:brightness-110'

export default function HostAddSlotsLink({
  remaining,
  prominent,
  className = '',
}: HostAddSlotsLinkProps) {
  const isProminent = prominent ?? (remaining !== undefined && isPublicEventLimitTight(remaining))

  return (
    <Link
      to={HOST_EVENT_SLOTS_HREF}
      className={`${baseClass} ${isProminent ? 'font-bold underline decoration-orange/50 underline-offset-2' : 'font-semibold'} ${className}`}
    >
      Add slots →
    </Link>
  )
}
