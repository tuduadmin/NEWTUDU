import { Link } from 'react-router-dom'
import { HOST_HIDDEN_GEMS_HREF, isHiddenGemLimitTight } from '../../lib/hiddenGemSlots'

type HostAddHiddenGemSlotsLinkProps = {
  remaining?: number
  prominent?: boolean
  className?: string
  /** Override link label (default varies by remaining slots). */
  label?: string
}

const baseClass = 'text-orange no-underline transition hover:brightness-110'

export default function HostAddHiddenGemSlotsLink({
  remaining,
  prominent,
  className = '',
  label,
}: HostAddHiddenGemSlotsLinkProps) {
  const isProminent = prominent ?? (remaining !== undefined && isHiddenGemLimitTight(remaining))
  const linkLabel =
    label ??
    (remaining !== undefined && remaining <= 0 ? 'Get a slot ->' : 'Add slots ->')

  return (
    <Link
      to={HOST_HIDDEN_GEMS_HREF}
      className={`${baseClass} ${isProminent ? 'font-bold underline decoration-orange/50 underline-offset-2' : 'font-semibold'} ${className}`}
    >
      {linkLabel}
    </Link>
  )
}
