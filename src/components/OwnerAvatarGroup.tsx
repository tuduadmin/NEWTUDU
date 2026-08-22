import AvatarStoryRing from './AvatarStoryRing'

type OwnerAvatarGroupProps = {
  initials: string
  primaryUrl?: string
  secondaryUrl?: string
  size?: number
  verified?: boolean
  alt?: string
}

export default function OwnerAvatarGroup({
  initials,
  primaryUrl,
  secondaryUrl,
  size = 44,
  verified = false,
  alt = '',
}: OwnerAvatarGroupProps) {
  if (!secondaryUrl) {
    return (
      <AvatarStoryRing
        initials={initials}
        imageUrl={primaryUrl}
        size={size}
        verified={verified}
        alt={alt}
      />
    )
  }

  const secondarySize = Math.round(size * 0.72)

  return (
    <div className="relative inline-flex items-end" style={{ minWidth: size + secondarySize * 0.55 }}>
      <AvatarStoryRing
        initials={initials}
        imageUrl={primaryUrl}
        size={size}
        verified={verified}
        alt={alt}
      />
      <div
        className="absolute bottom-0 ring-2 ring-black"
        style={{ left: size - secondarySize * 0.45 }}
      >
        <AvatarStoryRing
          initials=""
          imageUrl={secondaryUrl}
          size={secondarySize}
          alt="TUDU Black"
        />
      </div>
    </div>
  )
}
