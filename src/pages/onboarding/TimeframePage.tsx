import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'
import PreferenceChoiceGrid from '../../components/settings/PreferenceChoiceGrid'
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
      <PreferenceChoiceGrid
        options={TIMEFRAME_FILTER_OPTIONS}
        value={selected ?? ''}
        onChange={(id) => setSelected(id as TimeframeId)}
      />
    </OnboardingLayout>
  )
}
