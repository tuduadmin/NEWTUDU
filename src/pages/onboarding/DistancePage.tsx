import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'
import { getPreferences, updateTravelDistance } from '../../lib/preferences'

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
      <div className="text-center">
        <p className="font-display text-3xl font-extrabold text-gradient">{km} km</p>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={km}
          onChange={(e) => setKm(Number(e.target.value))}
          className="mt-4 w-full accent-sunset-orange"
        />
        <div className="mt-2 flex justify-between text-xs text-white/48">
          <span>5 km</span>
          <span>200 km</span>
        </div>
      </div>
    </OnboardingLayout>
  )
}
