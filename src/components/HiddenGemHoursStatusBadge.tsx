import {
  getHiddenGemHoursStatus,
  getHiddenGemHoursStatusLabel,
  type HiddenGemHoursStatus,
  type OrgHiddenGem,
  type WeeklyHours,
} from '../lib/hiddenGems'

function badgeClassForStatus(status: HiddenGemHoursStatus, variant: 'dark' | 'light'): string {
  if (variant === 'light') {
    switch (status) {
      case 'open':
        return 'bg-success/15 text-success ring-1 ring-success/25'
      case 'open_soon':
      case 'closing_soon':
        return 'bg-amber-400/20 text-amber-900 ring-1 ring-amber-500/30'
      case 'closed':
        return 'bg-brown/8 text-brown-muted ring-1 ring-brown/15'
    }
  }
  switch (status) {
    case 'open':
      return 'bg-success/90 text-white'
    case 'open_soon':
    case 'closing_soon':
      return 'bg-amber-400/95 text-midnight'
    case 'closed':
      return 'bg-white/15 text-white/70 ring-1 ring-white/20'
  }
}

type HiddenGemHoursStatusBadgeProps = {
  weeklyHours?: WeeklyHours
  /** Compact pill for card overlay; default for detail panel. */
  size?: 'sm' | 'md'
  variant?: 'dark' | 'light'
  className?: string
}

export default function HiddenGemHoursStatusBadge({
  weeklyHours,
  size = 'sm',
  variant = 'dark',
  className = '',
}: HiddenGemHoursStatusBadgeProps) {
  const status = getHiddenGemHoursStatus({ weeklyHours } satisfies Pick<OrgHiddenGem, 'weeklyHours'>)
  const label = getHiddenGemHoursStatusLabel(status)
  const badgeClass = badgeClassForStatus(status, variant)

  const sizeClass =
    size === 'sm'
      ? 'px-2.5 py-1 text-[11px] font-bold'
      : 'px-3 py-1.5 text-xs font-bold'

  return (
    <span
      className={`inline-flex items-center rounded-[14px] backdrop-blur-sm ${sizeClass} ${badgeClass} ${className}`}
    >
      {label}
    </span>
  )
}
