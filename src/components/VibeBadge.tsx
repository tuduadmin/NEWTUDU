import type { VibeTag } from '../types/bucketList'

const vibeStyles: Record<VibeTag, string> = {
  Adventurous: 'bg-orange/20 text-orange ring-orange/40',
  Chill: 'bg-electric-blue/20 text-electric-blue ring-electric-blue/40',
  Romantic: 'bg-sunset-pink/20 text-sunset-pink ring-sunset-pink/40',
  Family: 'bg-success/20 text-success ring-success/40',
  Foodie: 'bg-warm-yellow/20 text-amber-300 ring-amber-400/40',
  Wild: 'bg-magenta/20 text-magenta ring-magenta/40',
  Local: 'bg-white/10 text-white/80 ring-white/20',
  Luxury: 'bg-purple-400/20 text-purple-300 ring-purple-400/40',
  Weekend: 'bg-peach/20 text-peach ring-peach/40',
  'Road Trip': 'bg-electric-blue/20 text-sky-300 ring-sky-400/40',
}

type VibeBadgeProps = {
  vibe: VibeTag
  size?: 'sm' | 'md'
}

export default function VibeBadge({ vibe, size = 'sm' }: VibeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[14px] font-display font-bold uppercase tracking-wide ring-1 ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]'
      } ${vibeStyles[vibe]}`}
    >
      {vibe}
    </span>
  )
}
