import { BadgeCheck, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { UserAccount } from '../lib/account'

type VerificationBadgeProps = {
  account: UserAccount | null
  variant?: 'light' | 'dark'
  showLink?: boolean
  size?: 'sm' | 'md'
}

export default function VerificationBadge({
  account,
  variant = 'light',
  showLink = false,
  size = 'sm',
}: VerificationBadgeProps) {
  const verified = account?.verificationStatus === 'phone_verified'
  const iconSize = size === 'sm' ? 12 : 14
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  const verifiedClasses =
    variant === 'dark'
      ? 'bg-success/20 text-success'
      : 'bg-emerald-100 text-emerald-700'
  const unverifiedClasses =
    variant === 'dark'
      ? 'bg-sunset-orange/15 text-sunset-orange'
      : 'bg-orange/15 text-orange'

  const content = (
    <span
      className={`inline-flex items-center gap-1 rounded-[14px] px-2 py-0.5 font-bold uppercase ${textSize} ${
        verified ? verifiedClasses : unverifiedClasses
      }`}
    >
      {verified ? <BadgeCheck size={iconSize} /> : <ShieldAlert size={iconSize} />}
      {verified ? 'Verified' : 'Unverified'}
    </span>
  )

  if (!verified && showLink) {
    return (
      <Link to="/verify-phone" className="no-underline">
        {content}
      </Link>
    )
  }

  return content
}
