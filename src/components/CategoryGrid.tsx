import { INTEREST_CATEGORIES } from '../data/categories'

type CategoryGridProps = {
  selected: Set<string>
  onToggle: (id: string) => void
  variant?: 'light' | 'dark'
}

export default function CategoryGrid({ selected, onToggle, variant = 'dark' }: CategoryGridProps) {
  const isDark = variant === 'dark'

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {INTEREST_CATEGORIES.map((cat) => {
        const active = selected.has(cat.id)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onToggle(cat.id)}
            className={`flex items-center gap-2 rounded-[var(--radius-lg)] border-2 px-3 py-2.5 text-left text-sm transition duration-[var(--duration-fast)] active:scale-[0.98] ${
              active
                ? isDark
                  ? 'border-magenta bg-magenta/15 shadow-[var(--shadow-glow-magenta)]'
                  : 'border-orange bg-orange/5 shadow-sm'
                : isDark
                  ? 'border-white/[0.08] bg-midnight-surface hover:border-magenta/40'
                  : 'border-brown/10 bg-white hover:border-orange/30'
            }`}
          >
            <span className="text-lg">{cat.emoji}</span>
            <span
              className={`font-medium leading-tight ${isDark ? 'text-white' : 'text-brown'}`}
            >
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
