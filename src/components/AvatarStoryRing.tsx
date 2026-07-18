type AvatarStoryRingProps = {
  initials: string
  imageUrl?: string
  size?: number
  verified?: boolean
  alt?: string
}

export default function AvatarStoryRing({
  initials,
  imageUrl,
  size = 36,
  verified = false,
  alt = '',
}: AvatarStoryRingProps) {
  const inner = size - 4

  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <div className="story-ring flex h-full w-full items-center justify-center">
        <div
          className="overflow-hidden rounded-full bg-midnight-elevated ring-2 ring-midnight"
          style={{ width: inner, height: inner }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center bg-gradient-tudu font-display text-[11px] font-bold text-white"
              aria-hidden={!alt}
            >
              {initials}
            </span>
          )}
        </div>
      </div>
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-electric-blue text-[8px] text-white ring-2 ring-midnight"
          aria-label="Verified"
        >
          ✓
        </span>
      )}
    </div>
  )
}
