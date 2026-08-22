import { Link } from 'react-router-dom'
import type { UserAccount } from '../../lib/account'
import type { TierBadgeDisplay } from '../../lib/tierDisplay'
import { getVerifyPhoneUrl } from '../../lib/verifyPhoneNav'

type HostProfileTierBadgeProps = {
  badge: TierBadgeDisplay
  account: UserAccount | null
  returnTo?: string
  /** When false, hide the phone-verify CTA (e.g. org pending approval). */
  showPhoneVerifyLink?: boolean
}

const linkClass =
  'text-[10px] font-semibold uppercase tracking-wide text-orange no-underline transition hover:brightness-110'

const pillClass =
  'inline-flex items-center justify-center rounded-[14px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide'

export default function HostProfileTierBadge({
  badge,
  account,
  returnTo,
  showPhoneVerifyLink = true,
}: HostProfileTierBadgeProps) {
  const isUnverified = showPhoneVerifyLink && account?.verificationStatus !== 'phone_verified'

  return (
    <div className="mt-2 flex w-full flex-col items-center gap-1 text-center">
      <span className={`${pillClass} ${badge.pillClass}`}>{badge.label}</span>
      {isUnverified && (
        <Link to={getVerifyPhoneUrl(returnTo)} className={linkClass}>
          Verify
        </Link>
      )}
      {!isUnverified && badge.action?.type === 'upgrade' && (
        <Link to={badge.action.href} className={linkClass}>
          {badge.action.text}
        </Link>
      )}
      {!isUnverified && badge.action?.type === 'manage' && (
        <Link to={badge.action.href} className={linkClass}>
          {badge.action.text}
        </Link>
      )}
    </div>
  )
}
