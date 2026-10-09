type BucketListProgressRingProps = {
  done: number
  total: number
  size?: number
  /** 'light' for hero overlay; 'default' for cards and panels */
  variant?: 'light' | 'default'
  /** 100% — green ring (Explore complete lists) */
  complete?: boolean
}

export default function BucketListProgressRing({
  done,
  total,
  size = 64,
  variant = 'default',
  complete = false,
}: BucketListProgressRingProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const isComplete = complete || (total > 0 && done >= total)
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(1, total > 0 ? done / total : 0))

  const trackClass = variant === 'light' ? 'stroke-white/20' : 'stroke-cream-dark'
  const progressClass = isComplete
    ? 'stroke-success'
    : variant === 'light'
      ? 'stroke-sunset-orange'
      : 'stroke-orange'
  const labelClass =
    isComplete && variant === 'light'
      ? 'text-success'
      : variant === 'light'
        ? 'text-white'
        : 'text-brown'
  const subClass =
    isComplete && variant === 'light'
      ? 'text-success/80'
      : variant === 'light'
        ? 'text-white/55'
        : 'text-brown-muted'

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${done} of ${total} complete, ${pct} percent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={trackClass}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={progressClass}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`font-display text-sm font-extrabold ${labelClass}`}>
          {done}/{total}
        </span>
        <span className={`mt-0.5 text-[9px] font-semibold uppercase tracking-wide ${subClass}`}>
          {pct}%
        </span>
      </div>
    </div>
  )
}
