import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import { BackIconButton } from '../components/NavActionButtons'
import RoadTripMoodBanner from '../components/road-trip/RoadTripMoodBanner'
import { getRoadTripMood } from '../lib/roadTripMoods'

export default function RoadTripSurprisePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mood = getRoadTripMood(searchParams.get('mood'))

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/road-trip" />

      <div className="flex items-center gap-3 px-4 pb-2 pt-2">
        <BackIconButton variant="plain" onClick={() => navigate('/road-trip')} />
        <div>
          <p className="text-tagline">Road Trip</p>
          <h1 className="font-display text-lg font-bold text-brown">Surprise Me</h1>
        </div>
      </div>

      <main className="px-4 pt-6">
        {mood && (
          <div className="mb-4">
            <RoadTripMoodBanner mood={mood} />
          </div>
        )}
        <div className="rounded-[14px] border border-app-subtle bg-app-elevated px-6 py-12 text-center shadow-sm">
          <p className="font-display text-lg font-bold text-brown">Coming soon</p>
          <p className="mt-2 text-sm text-brown-muted">
            Spontaneous local adventures are on the way. We&apos;ll pick a route based on your vibe,
            distance, and what&apos;s happening nearby.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
