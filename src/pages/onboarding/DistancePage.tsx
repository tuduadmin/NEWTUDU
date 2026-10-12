import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'
import type { CSSProperties } from 'react'
import TravelDistanceSlider from '../../components/settings/TravelDistanceSlider'
import { getPreferences, updateTravelDistance } from '../../lib/preferences'
import { travelDistanceUnit } from '../../lib/travelDistanceUi'

export default function DistancePage() {
  const navigate = useNavigate()
  const [km, setKm] = useState(50)

  useEffect(() => {
    setKm(getPreferences().travelDistanceKm)
  }, [])

  function handleContinue() {
    updateTravelDistance(km)
    navigate('/onboarding/timeframe')
  }

  return (
    <OnboardingLayout
      step={3}
      title="How far will you travel?"
      subtitle="Tell us your comfort zone for getting to events."
      onContinue={handleContinue}
    >
      <div
        className="text-center"
        style={{ '--travel-distance-pct': travelDistanceUnit(km) } as CSSProperties}
      >
        <p className="travel-distance-value font-display text-3xl font-extrabold tabular-nums">
          {km} km
        </p>
        <TravelDistanceSlider
          className="mt-4"
          value={km}
          onChange={setKm}
          boundsClassName="text-white/48"
        />
      </div>
    </OnboardingLayout>
  )
}
