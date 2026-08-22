import { INTEREST_CATEGORIES } from '../data/categories'
import CategoryIcon from './CategoryIcon'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../lib/prefChoiceClasses'

type CategoryGridProps = {
  selected: Set<string>
  onToggle: (id: string) => void
  variant?: 'light' | 'dark'
}

export default function CategoryGrid({ selected, onToggle, variant = 'dark' }: CategoryGridProps) {
  const isDark = variant === 'dark'

  return (
    <div className="grid grid-cols-2 gap-2">
      {INTEREST_CATEGORIES.map((cat) => {
        const active = selected.has(cat.id)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onToggle(cat.id)}
            className={prefChoiceClasses(
              active,
              'flex items-center gap-2.5 px-3 py-2.5 text-left text-sm',
            )}
          >
            <span
              className={`pref-choice-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
                active ? '' : isDark ? 'bg-white/10 text-white/70' : 'bg-brown/5 text-brown-muted'
              }`}
            >
              <CategoryIcon category={cat} size={16} />
            </span>
            <span
              className={`pref-choice-label leading-tight ${
                active ? PREF_CHOICE_ACTIVE_TEXT : `font-medium ${isDark ? 'text-white' : 'text-brown'}`
              }`}
            >
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
