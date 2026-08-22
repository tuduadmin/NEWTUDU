import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../../lib/prefChoiceClasses'

export type PreferenceChoiceOption = {
  id: string
  label: string
}

type PreferenceChoiceGridProps = {
  options: PreferenceChoiceOption[]
  value: string
  onChange: (id: string) => void
}

/** Single-select grid — same styling as CategoryGrid (light variant). */
export default function PreferenceChoiceGrid({
  options,
  value,
  onChange,
}: PreferenceChoiceGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={prefChoiceClasses(active, 'flex items-center px-3 py-2.5 text-left text-sm')}
          >
            <span
              className={`pref-choice-label leading-tight ${
                active ? PREF_CHOICE_ACTIVE_TEXT : 'font-medium text-brown'
              }`}
            >
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
