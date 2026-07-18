type SaveToBucketFlyAnimationProps = {
  imageUrl: string
  active: boolean
  onComplete?: () => void
}

export default function SaveToBucketFlyAnimation({
  imageUrl,
  active,
  onComplete,
}: SaveToBucketFlyAnimationProps) {
  if (!active) return null

  return (
    <div
      className="pointer-events-none fixed z-[var(--z-save-fly)] animate-fly-to-bucket overflow-hidden rounded-xl ring-2 ring-orange/60"
      style={{
        width: 72,
        height: 72,
        left: 'calc(50% - 36px)',
        bottom: 'calc(140px + env(safe-area-inset-bottom))',
        ['--fly-x' as string]: '140px',
        ['--fly-y' as string]: '-320px',
      }}
      onAnimationEnd={onComplete}
      aria-hidden
    >
      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
    </div>
  )
}
