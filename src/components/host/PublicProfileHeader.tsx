import { BadgeCheck } from 'lucide-react'
import { VERIFIED_HOST_PILL_CLASS } from '../../lib/tierDisplay'
import HostProfileSocialLinks from './HostProfileSocialLinks'
import PublicProfileContact from './PublicProfileContact'
import type { HostContactInfo, PersonalHostSocialLinks } from '../../lib/personalHostProfile'

type PublicProfileHeaderProps = {
  displayName: string
  bio?: string
  social: PersonalHostSocialLinks
  contact?: HostContactInfo
  tierLabel?: string
  tierPillClass?: string
  isVerified?: boolean
}

export default function PublicProfileHeader({
  displayName,
  bio,
  social,
  contact,
  tierLabel,
  tierPillClass = 'bg-brown/10 text-brown-muted',
  isVerified = false,
}: PublicProfileHeaderProps) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <h1 className="font-display text-[2rem] font-extrabold leading-none tracking-tight text-brown sm:text-[2.125rem]">
          {displayName}
        </h1>
        {isVerified && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-[14px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${VERIFIED_HOST_PILL_CLASS}`}
            title="Verified host"
          >
            <BadgeCheck size={10} aria-hidden />
            Verified
          </span>
        )}
      </div>

      {!isVerified && tierLabel && (
        <span
          className={`mt-1.5 inline-flex items-center rounded-[14px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierPillClass}`}
        >
          {tierLabel}
        </span>
      )}

      {isVerified && tierLabel && tierLabel !== 'Verified' && (
        <span
          className={`mt-1.5 inline-flex items-center rounded-[14px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierPillClass}`}
        >
          {tierLabel}
        </span>
      )}

      {bio?.trim() && (
        <p className="mt-4 text-sm leading-snug text-brown-muted">{bio.trim()}</p>
      )}

      <PublicProfileContact contact={contact ?? {}} website={social.website} compact />

      <HostProfileSocialLinks social={social} align="center" size="lg" className="mt-3" />
    </header>
  )
}
