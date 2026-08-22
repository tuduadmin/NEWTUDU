import { TUDUANS, type TuduanId } from '../data/tuduans'

interface TuduanBadgeProps {
  tuduanId: TuduanId
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Minimal Tuduan placeholder â€” use sparingly for milestones and special moments.
 * Replace with illustrated assets when available.
 */
export default function TuduanBadge({ tuduanId, size = 'md', className = '' }: TuduanBadgeProps) {
  const tuduan = TUDUANS[tuduanId]
  const dim = size === 'sm' ? 'h-10 w-10 text-lg' : 'h-14 w-14 text-2xl'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[14px] ${dim} ${className}`}
      style={{ backgroundColor: `${tuduan.color}22`, color: tuduan.color }}
      title={`${tuduan.name} â€” ${tuduan.title}`}
      aria-label={`${tuduan.name}, ${tuduan.title}`}
    >
      {tuduan.motifEmoji}
    </span>
  )
}
