import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MapPin, Navigation } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { getBucketListById } from '../lib/bucketLists'
import { getRoadTripById, getRoadTripStops, getRoadTrips } from '../lib/roadTrips'

const POSTER_IMAGE =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop'

type RoadTripLocationState = {
  tripId?: string
  bucketListId?: string
}

export default function RoadTripPage() {
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
    <div className="mx-auto min-h-svh max-w-lg bg-midnight pb-28 text-white">
      <AppHeader />

      <main>
        <div className="relative mx-4 mt-2 h-44 overflow-hidden rounded-[var(--radius-xl)]">
          <img src={POSTER_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="overlay-readability absolute inset-0" />
          <div className="relative flex h-full flex-col justify-end p-5">
            <p className="text-tagline">Now you know</p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Road Trip</h1>
            {trip && (
              <>
                <p className="mt-1 text-sm text-white/72">{trip.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-white/48">
                  <Navigation size={12} />
                  {stops.length} stop{stops.length === 1 ? '' : 's'}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="px-4 pt-4">
          {trip ? (
            <div className="space-y-3">
              {stops.length === 0 ? (
                <div className="rounded-[var(--radius-xl)] glass-surface px-6 py-10 text-center">
                  <p className="text-sm text-white/48">No stops on this trip yet.</p>
                  <Link
                    to="/bucket-list"
                    className="mt-3 inline-block rounded-full bg-gradient-tudu px-6 py-2.5 font-display text-sm font-bold text-white no-underline"
                  >
                    Add from Bucket List
                  </Link>
                </div>
              ) : (
                stops.map((stop, i) => (
                  <div
                    key={stop.id}
                    className="relative overflow-hidden rounded-[var(--radius-lg)] glass-surface"
                  >
                    <div className="flex gap-3 p-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)]">
                        <img src={stop.image} alt="" className="h-full w-full object-cover" />
                        <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-tudu font-display text-xs font-bold text-white">
                          {i + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <h3 className="truncate font-display text-sm font-bold">{stop.title}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/48">
                          <MapPin size={12} className="shrink-0 text-sunset-orange" />
                          {stop.city}
                        </p>
                        {stop.dateTime && (
                          <p className="mt-0.5 text-xs text-white/40">{stop.dateTime}</p>
                        )}
                      </div>
                    </div>
                    {i < stops.length - 1 && (
                      <div className="mx-auto h-4 w-px bg-gradient-to-b from-sunset-orange/50 to-transparent" aria-hidden />
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="rounded-[var(--radius-xl)] glass-surface px-6 py-10 text-center">
              <p className="text-sm text-white/48">
                Send a bucket list here to plan your multi-stop adventure.
              </p>
              <Link
                to="/bucket-list"
                className="mt-4 inline-block rounded-full bg-gradient-tudu px-6 py-2.5 font-display text-sm font-bold text-white no-underline active:scale-[0.98]"
              >
                Go to Bucket Lists
              </Link>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
