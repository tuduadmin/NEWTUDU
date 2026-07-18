import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'
import { TIMEFRAME_FILTER_OPTIONS } from '../../data/categories'
import type { TimeframeId } from '../../data/categories'
import { getPreferences, updateTimeframe } from '../../lib/preferences'

export default function TimeframePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<TimeframeId | null>(null)

  useEffect(() => {
    setSelected(getPreferences().timeframe)
  }, [])

  function handleContinue() {
    if (selected) updateTimeframe(selected)
    navigate('/onboarding/friends')
  }

  return (
    <OnboardingLayout
      step={4}
      title="When do you want events?"
      subtitle="Choose your preferred event timeframe."
      onContinue={handleContinue}
      continueDisabled={!selected}
    >
      <ul className="grid grid-cols-2 gap-2">
        {TIMEFRAME_FILTER_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`w-full rounded-[var(--radius-lg)] border-2 px-3 py-4 text-center transition active:scale-[0.98] ${
                selected === opt.id
                  ? 'border-magenta bg-magenta/15'
                  : 'border-white/[0.08] bg-midnight-surface hover:border-magenta/30'
              }`}
            >
              <span className="font-semibold text-white">{opt.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </OnboardingLayout>
  )
}
