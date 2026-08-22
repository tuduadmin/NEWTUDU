import { getInitialsFromName } from '../../lib/profileInitials'

type HostProfileAvatarProps = {
  name: string
  avatarUrl?: string
  size?: 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  md: 'h-16 w-16 text-2xl ring-4',
  lg: 'h-20 w-20 text-3xl ring-4',
  xl: 'h-24 w-24 text-4xl ring-4',
} as const

export default function HostProfileAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}: HostProfileAvatarProps) {
  const initials = getInitialsFromName(name)
  const sizeClass = sizeClasses[size]

  if (avatarUrl?.trim()) {
    return (
      <div
        className={`shrink-0 overflow-hidden rounded-full bg-cream-dark shadow-md ring-cream-dark ${sizeClass} ${className}`}
      >
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-tudu font-display font-extrabold text-white shadow-md ring-cream-dark ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  )
}
