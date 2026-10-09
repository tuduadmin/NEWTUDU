import type { VibeTag } from '../types/bucketList'

export const vibeChipClasses: Record<VibeTag, string> = {
  Adventurous: 'bg-orange/20 text-orange ring-orange/40',
  Exploring: 'bg-teal-400/20 text-teal-200 ring-teal-400/40',
  Outdoors: 'bg-emerald-500/20 text-emerald-200 ring-emerald-500/40',
  Chill: 'bg-electric-blue/20 text-electric-blue ring-electric-blue/40',
  Romantic: 'bg-sunset-pink/20 text-sunset-pink ring-sunset-pink/40',
  Family: 'bg-success/20 text-success ring-success/40',
  Foodie: 'bg-warm-yellow/20 text-amber-300 ring-amber-400/40',
  Culture: 'bg-violet-400/20 text-violet-200 ring-violet-400/40',
  Nightlife: 'bg-indigo-500/20 text-indigo-200 ring-indigo-400/40',
  Wild: 'bg-magenta/20 text-magenta ring-magenta/40',
  Local: 'bg-white/10 text-white/80 ring-white/20',
  'Hidden Gems': 'bg-cyan-400/20 text-cyan-200 ring-cyan-400/40',
  Wellness: 'bg-rose-300/20 text-rose-200 ring-rose-300/40',
  Historic: 'bg-amber-700/25 text-amber-200 ring-amber-600/40',
  Luxury: 'bg-purple-400/20 text-purple-300 ring-purple-400/40',
  Budget: 'bg-lime-500/15 text-lime-200 ring-lime-500/35',
  Weekend: 'bg-peach/20 text-peach ring-peach/40',
  'Road Trip': 'bg-electric-blue/20 text-sky-300 ring-sky-400/40',
}

type VibeBadgeProps = {
  vibe: VibeTag
  size?: 'sm' | 'md'
}

export default function VibeBadge({ vibe, size = 'sm' }: VibeBadgeProps) {
  const style = vibeChipClasses[vibe] ?? vibeChipClasses.Adventurous
  return (
    <span
      className={`inline-flex items-center rounded-[14px] font-display font-bold uppercase tracking-wide ring-1 ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]'
      } ${style}`}
    >
      {vibe}
    </span>
  )
}
