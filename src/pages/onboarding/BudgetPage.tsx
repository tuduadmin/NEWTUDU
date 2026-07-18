import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'

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
        {BUDGET_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`w-full rounded-[var(--radius-lg)] border-2 p-4 text-left transition active:scale-[0.98] ${
                selected === opt.id
                  ? 'border-magenta bg-magenta/15'
                  : 'border-white/[0.08] bg-midnight-surface hover:border-magenta/30'
              }`}
            >
              <span className="block font-semibold text-white">{opt.label}</span>
              <span className="mt-0.5 block text-sm text-white/48">{opt.desc}</span>
            </button>
          </li>
        ))}
      </ul>
    </OnboardingLayout>
  )
}
