import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'
import CategoryGrid from '../../components/CategoryGrid'
import { getPreferences, updateInterests } from '../../lib/preferences'

export default function InterestsPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    const prefs = getPreferences()
    if (prefs.interests.length > 0) {
      setSelected(new Set(prefs.interests))
    }
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)

      if (id === 'all') {
        if (next.has('all')) {
          next.clear()
        } else {
          next.clear()
          next.add('all')
        }
        return next
      }

      if (next.has(id)) next.delete(id)
      else next.add(id)

      next.delete('all')
      return next
    })
  }

  function handleContinue() {
    updateInterests(Array.from(selected))
    navigate('/onboarding/budget')
  }

  return (
    <OnboardingLayout
      step={1}
      title="What are you into?"
      subtitle="Pick a few interests so we can surface events you'll love."
      onContinue={handleContinue}
      continueDisabled={selected.size === 0}
    >
      <CategoryGrid selected={selected} onToggle={toggle} variant="light" />
    </OnboardingLayout>
  )
}
