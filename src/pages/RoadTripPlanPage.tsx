import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MapPin, Navigation } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import { BackIconButton } from '../components/NavActionButtons'
import { getBucketListById } from '../lib/bucketLists'
import { getRoadTripById, getRoadTripStops, getRoadTrips } from '../lib/roadTrips'

type RoadTripLocationState = {
  tripId?: string
  bucketListId?: string
}

export default function RoadTripPlanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as RoadTripLocationState

  const trip = useMemo(() => {
    if (state.tripId) return getRoadTripById(state.tripId)
    if (state.bucketListId) {
      const list = getBucketListById(state.bucketListId)
      if (list) {
        const trips = getRoadTrips()
        return trips.find((t) => t.bucketListId === list.id) ?? trips[0]
      }
    }
    return getRoadTrips()[0]
  }, [state.tripId, state.bucketListId])

  const stops = trip ? getRoadTripStops(trip) : []

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/road-trip" />

      <div className="flex items-center gap-3 px-4 pb-2 pt-2">
        <BackIconButton variant="plain" onClick={() => navigate('/road-trip')} />
        <div>
          <p className="text-tagline">Road Trip</p>
          <h1 className="font-display text-lg font-bold text-brown">Plan a Destination</h1>
        </div>
      </div>

      <main className="px-4 pt-2">
        {trip ? (
          <div className="space-y-3">
            <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm">
              <p className="font-display text-base font-bold text-brown">{trip.name}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-brown-muted">
                <Navigation size={12} />
                {stops.length} stop{stops.length === 1 ? '' : 's'}
              </p>
            </div>

            {stops.length === 0 ? (
              <div className="rounded-[14px] border border-app-subtle bg-app-elevated px-6 py-10 text-center shadow-sm">
                <p className="text-sm text-brown-muted">No stops on this trip yet.</p>
                <GradientButton
                  to="/road-trip/from-bucket-list"
                  className="mt-3 inline-block rounded-[14px] px-6 py-2.5 text-sm font-bold no-underline"
                >
                  Add from Bucket List
                </GradientButton>
              </div>
            ) : (
              stops.map((stop, i) => (
                <div
                  key={stop.id}
                  className="relative overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm"
                >
                  <div className="flex gap-3 p-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px]">
                      <img src={stop.image} alt="" className="h-full w-full object-cover" />
                      <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-tudu font-display text-xs font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <h3 className="truncate font-display text-sm font-bold text-brown">{stop.title}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-brown-muted">
                        <MapPin size={12} className="shrink-0 text-orange" />
                        {stop.city}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="rounded-[14px] border border-app-subtle bg-app-elevated px-6 py-12 text-center shadow-sm">
            <p className="font-display text-lg font-bold text-brown">Coming soon</p>
            <p className="mt-2 text-sm text-brown-muted">
              Pick a destination and we&apos;ll craft stops along the way. For now, start from a bucket
              list or try Surprise Me.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <GradientButton
                to="/road-trip/from-bucket-list"
                className="rounded-[14px] px-6 py-2.5 text-sm font-bold no-underline"
              >
                From My Bucket List
              </GradientButton>
              <Link
                to="/road-trip/surprise"
                className="rounded-[14px] border border-app-subtle bg-app-elevated px-6 py-2.5 text-sm font-semibold text-brown no-underline transition hover:border-orange/30"
              >
                Surprise Me
              </Link>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
