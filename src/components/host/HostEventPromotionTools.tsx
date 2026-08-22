import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Flame,
  ImageUp,
  Megaphone,
  Users,
  Wrench,
} from 'lucide-react'

export type PromotionToolAction = 'guests' | 'posters' | 'blast' | 'boost'

type HostEventPromotionToolsProps = {
  onAction: (action: PromotionToolAction) => void
  defaultExpanded?: boolean
}

const TOOLS: {
  id: PromotionToolAction
  label: string
  icon: typeof Users
  className: string
}[] = [
  {
    id: 'guests',
    label: 'Guests',
    icon: Users,
    className: 'bg-purple/10 text-purple hover:bg-purple/15',
  },
  {
    id: 'posters',
    label: 'Posters',
    icon: ImageUp,
    className: 'bg-sunset-pink/10 text-sunset-pink hover:bg-sunset-pink/15',
  },
  {
    id: 'blast',
    label: 'Blast',
    icon: Megaphone,
    className: 'bg-purple/10 text-purple hover:bg-purple/15',
  },
  {
    id: 'boost',
    label: 'Boost',
    icon: Flame,
    className: 'bg-orange/10 text-orange hover:bg-orange/15',
  },
]

export default function HostEventPromotionTools({
  onAction,
  defaultExpanded = false,
}: HostEventPromotionToolsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="mt-3 border-t border-app-subtle pt-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
          <Wrench size={12} className="theme-accent-icon" aria-hidden />
          Promotion tools
        </span>
        {expanded ? (
          <ChevronUp size={14} className="text-brown-muted" aria-hidden />
        ) : (
          <ChevronDown size={14} className="text-brown-muted" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onAction(tool.id)}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-[14px] px-2 py-3 text-[10px] font-bold uppercase tracking-wide transition ${tool.className}`}
              >
                <Icon size={18} aria-hidden />
                {tool.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
