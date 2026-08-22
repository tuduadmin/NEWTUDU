import { Link } from 'react-router-dom'

type HiddenGemOrganizerAvatarProps = {
  initial?: string
  avatarUrl?: string
  profileUrl?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function HiddenGemOrganizerAvatar({
  initial = 'O',
  avatarUrl,
  profileUrl,
  label,
  size = 'sm',
}: HiddenGemOrganizerAvatarProps) {
  const dim =
    size === 'lg'
      ? 'h-12 w-12 text-lg'
      : size === 'md'
        ? 'h-11 w-11 text-base'
        : 'h-10 w-10 text-sm'
  const ringClass = 'shadow-md ring-2 ring-white/80'
  const imageUrl = avatarUrl?.trim()

  const inner = imageUrl ? (
    <span
      className={`flex shrink-0 overflow-hidden rounded-full bg-cream-dark ${ringClass} ${dim}`}
      title={label}
      aria-hidden={!!label}
    >
      <img src={imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
    </span>
  ) : (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brown font-display font-extrabold text-white ${ringClass} ${dim}`}
      title={label}
      aria-hidden={!!label}
    >
      {(initial?.trim() || 'O').charAt(0).toUpperCase()}
    </span>
  )

  if (profileUrl) {
    return (
      <Link
        to={profileUrl}
        className="shrink-0 no-underline transition hover:scale-105"
        aria-label={label ? `View ${label} profile` : 'View organizer profile'}
        onClick={(e) => e.stopPropagation()}
      >
        {inner}
      </Link>
    )
  }

  return inner
}
