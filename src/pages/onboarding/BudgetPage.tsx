import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../../lib/prefChoiceClasses'

const BUDGET_OPTIONS = [
  { id: 'free', label: 'Free events only', desc: 'No ticket cost' },
  { id: 'under25', label: 'Under $25', desc: 'Budget-friendly outings' },
  { id: '25-50', label: '$25 – $50', desc: 'Moderate spend' },
  { id: '50-100', label: '$50 – $100', desc: 'Special occasions' },
  { id: 'any', label: 'No budget limit', desc: 'Show me everything' },
]

export default function BudgetPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <OnboardingLayout
      step={2}
      title="What's your event budget?"
      subtitle="We'll prioritize events that fit your spending comfort zone."
      onContinue={() => navigate('/onboarding/distance')}
      continueDisabled={!selected}
    >
      <ul className="space-y-3">
        {BUDGET_OPTIONS.map((opt) => {
          const active = selected === opt.id
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => setSelected(opt.id)}
                className={prefChoiceClasses(active, 'w-full p-4 text-left')}
              >
                <span
                  className={`pref-choice-label block ${
                    active ? PREF_CHOICE_ACTIVE_TEXT : 'font-medium text-brown'
                  }`}
                >
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-sm text-brown-muted">{opt.desc}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </OnboardingLayout>
  )
}
