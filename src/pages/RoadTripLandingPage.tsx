import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, MapPin, Plus, Send, Sparkles, Car } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import RoadTripMapHero from '../components/road-trip/RoadTripMapHero'
import RoadTripListCard from '../components/road-trip/RoadTripListCard'
import RoadTripLandingHero from '../components/road-trip/RoadTripLandingHero'
import RoadTripMoodChips from '../components/road-trip/RoadTripMoodChips'
import RoadTripEmptyIllustration, {
  ROAD_TRIP_EMPTY_FADE_TO,
} from '../components/road-trip/RoadTripEmptyIllustration'
import { useRoadTripHero } from '../hooks/useRoadTripHero'
import { getCurrentUser } from '../lib/auth'
import { projectTripRouteToMapPins, getRoadTripMapViewFromPoints } from '../lib/roadTripGeo'
import {
  getTripGoogleMapsDirectionsUrl,
  getTripPlannedCities,
  getTripRoutePoints,
} from '../lib/roadTripRoute'
import {
  deleteRoadTrip,
  filterRoadTripsByTab,
  forkRoadTripForUser,
  getInvitedRoadTripsForUser,
  getRoadTripListTab,
  getRoadTripStops,
  getRoadTripsForUser,
  type RoadTripListTab,
} from '../lib/roadTrips'
import { resolveTaggedFollowers } from '../lib/userFollows'
import { getBucketLists } from '../lib/bucketLists'
import { startRoadTripCreate } from '../lib/roadTrips'

const ROAD_TRIP_PANEL =
  'rounded-[14px] border border-white/10 bg-midnight-elevated shadow-[0_0_24px_rgba(249,115,22,0.08)]'

const TAB_ORDER: RoadTripListTab[] = ['planned', 'drafts', 'past']

export default function RoadTripLandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const [refresh, setRefresh] = useState(0)
  const [tab, setTab] = useState<RoadTripListTab>('planned')
  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { url: heroUrl, revision: heroRevision } = useRoadTripHero()

  const trips = useMemo(() => {
    void refresh
    if (!user) return []
    return getRoadTripsForUser(user.email)
  }, [user, refresh])

  const invitedTrips = useMemo(() => {
    void refresh
    if (!user) return []
    return getInvitedRoadTripsForUser(user.email)
  }, [user, refresh])

  const tabCounts = useMemo(
    () =>
      TAB_ORDER.reduce(
        (acc, id) => {
          acc[id] = filterRoadTripsByTab(trips, id).length
          return acc
        },
        {} as Record<RoadTripListTab, number>,
      ),
    [trips],
  )

  const tabTrips = useMemo(() => filterRoadTripsByTab(trips, tab), [trips, tab])

  const filteredTrips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return tabTrips
    return tabTrips.filter(
      (trip) =>
        trip.name.toLowerCase().includes(q) ||
        trip.destination?.toLowerCase().includes(q),
    )
  }, [tabTrips, searchQuery])

  const previewTrip = filteredTrips[0]

  useEffect(() => {
    const tripIdFromNav = (location.state as { tripId?: string } | null)?.tripId
    if (tripIdFromNav) {
      const trip = trips.find((t) => t.id === tripIdFromNav)
      if (trip) {
        setTab(getRoadTripListTab(trip))
        navigate(`/road-trip/${trip.id}`, { replace: true, state: null })
      }
    }
  }, [location.state, trips, navigate])

  const stops = previewTrip ? getRoadTripStops(previewTrip) : []
  const plannedCities = previewTrip ? getTripPlannedCities(previewTrip) : []
  const routePoints = previewTrip ? getTripRoutePoints(previewTrip, stops) : []
  const mapPins = useMemo(
    () => projectTripRouteToMapPins(plannedCities, stops),
    [plannedCities, stops],
  )
  const mapView = useMemo(
    () => getRoadTripMapViewFromPoints(routePoints),
    [routePoints],
  )
  const directionsUrl = useMemo(
    () => (previewTrip ? getTripGoogleMapsDirectionsUrl(previewTrip, stops) : null),
    [previewTrip, stops],
  )
  const readOnly = tab === 'past'

  function reload() {
    setRefresh((n) => n + 1)
  }

  function handleCreateRoadTrip() {
    if (!user) {
      navigate('/signin')
      return
    }
    startRoadTripCreate((path) => navigate(path), user.email)
  }

  function handleTabChange(next: RoadTripListTab) {
    setTab(next)
    setSearchQuery('')
  }

  function handleDeleteTrip(tripId: string, tripName: string) {
    if (!window.confirm(`Delete "${tripName}"? This cannot be undone.`)) return
    deleteRoadTrip(tripId)
    reload()
  }

  function handleAddInvitedTrip(tripId: string, tripName: string) {
    if (!user) return
    const forked = forkRoadTripForUser(tripId, user.email)
    if (!forked) return
    setToast(`Added "${tripName}" to your road trips`)
    setTab(getRoadTripListTab(forked))
    reload()
    navigate(`/road-trip/${forked.id}`)
    window.setTimeout(() => setToast(null), 2500)
  }

  if (!user) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/discover" />
        <main className="px-4 pt-10 text-center">
          <p className="text-brown-muted">Sign in to plan road trips.</p>
          <GradientButton to="/signin" className="mt-4 inline-block px-6 py-2.5 text-sm">
            Sign in
          </GradientButton>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative app-page-shell bg-midnight pb-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] text-white">
      <AppHeaderBar logoLinkTo="/road-trip" />

      <RoadTripLandingHero
        heroUrl={heroUrl}
        heroRevision={heroRevision}
        onCreate={handleCreateRoadTrip}
      />
      <RoadTripMoodChips />

      <div className="mt-3 space-y-4">
        <section className="px-4">
          <div className="mb-3 flex items-start gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunset-orange/15 text-sunset-orange">
              <Send size={18} />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold text-white">Road Trip</h2>
              <p className="text-xs text-white/65">Pick a trip below or start a new adventure.</p>
            </div>
          </div>

          <div className="flex border-b border-white/10">
            {TAB_ORDER.map((tabId) => (
              <button
                key={tabId}
                type="button"
                onClick={() => handleTabChange(tabId)}
                className={`flex-1 border-b-2 pb-2.5 text-center text-sm font-bold capitalize transition ${
                  tab === tabId
                    ? 'border-sunset-orange text-sunset-orange shadow-[0_6px_12px_-8px_rgba(249,115,22,0.9)]'
                    : 'border-transparent text-white/45'
                }`}
              >
                {tabId} ({tabCounts[tabId]})
              </button>
            ))}
          </div>

          <div className="relative mt-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tab} trips...`}
              className="w-full rounded-[14px] border border-white/12 bg-midnight-surface py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-sunset-orange/50 focus:ring-2 focus:ring-sunset-orange/20"
            />
            <MapPin
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
          </div>

          {filteredTrips.length === 0 ? (
            <div
              className="mt-6 overflow-hidden rounded-[14px] border border-white/10 shadow-[0_0_24px_rgba(249,115,22,0.08)]"
              style={{ backgroundColor: ROAD_TRIP_EMPTY_FADE_TO }}
            >
              <RoadTripEmptyIllustration />
              <div className="px-6 pb-6 pt-3 text-center">
              <p className="font-display text-sm font-bold text-white">
                No {tab} trips found.
              </p>
              <p className="mt-1 text-xs text-white/65">
                {tab === 'drafts'
                  ? 'Start a draft or import stops from a bucket list.'
                  : tab === 'past'
                    ? 'Completed trips will show up here.'
                    : 'Plan a route or turn a bucket list into a trip.'}
              </p>
              {tab !== 'past' && (
                <div className="mt-4 flex flex-col gap-2">
                  <GradientButton
                    type="button"
                    onClick={handleCreateRoadTrip}
                    fullWidth
                    className="road-trip-cta-glow px-4 py-3 text-sm font-extrabold"
                  >
                    <Plus size={16} className="mr-1 inline" />
                    Create road trip
                  </GradientButton>
                  <Link
                    to="/road-trip/from-bucket-list"
                    className="rounded-[14px] border-2 border-sunset-orange/45 bg-midnight-surface py-2.5 text-sm font-bold text-sunset-orange no-underline shadow-[0_0_16px_rgba(249,115,22,0.2)] transition hover:border-sunset-orange/70"
                  >
                    From Bucket List
                  </Link>
                </div>
              )}
              </div>
            </div>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {filteredTrips.map((trip) => (
                  <li key={trip.id}>
                    <RoadTripListCard
                      trip={trip}
                      readOnly={readOnly}
                      onView={() => navigate(`/road-trip/${trip.id}`)}
                      onEdit={() => navigate(`/road-trip/create/${trip.id}/basics`)}
                      onDelete={() => handleDeleteTrip(trip.id, trip.name)}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {previewTrip && (mapPins.length > 0 || stops.length > 0) && (
          <div>
            <p className="mb-2 px-4 text-xs font-bold uppercase tracking-wide text-white/50">
              Route preview
            </p>
            <RoadTripMapHero
              variant="dark"
              tripName={previewTrip.name}
              destination={previewTrip.destination}
              pins={mapPins}
              stopCount={mapPins.length || stops.length}
              mapView={mapView}
              directionsUrl={directionsUrl}
            />
          </div>
        )}

        <div className="mt-6 px-4 pb-2">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">
            Start something new ✨
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <QuickLink
              to="/road-trip/plan"
              icon={<Car size={16} />}
              label="Plan route"
              pillClass="road-trip-pill-orange text-sunset-orange"
            />
            <QuickLink
              to="/road-trip/surprise"
              icon={<Sparkles size={16} />}
              label="Surprise me"
              pillClass="road-trip-pill-pink text-sunset-pink"
            />
            <QuickLink
              to="/road-trip/from-bucket-list"
              icon={<Bookmark size={16} />}
              label="From bucket list"
              pillClass="road-trip-pill-purple text-magenta"
            />
          </div>
          {getBucketLists().length === 0 && (
            <p className="mt-2 text-center text-[11px] text-white/50">
              Create a{' '}
              <Link to="/bucket-list?create=true" className="font-semibold text-peach no-underline">
                bucket list
              </Link>{' '}
              first to pull events into a trip.
            </p>
          )}
        </div>

        {invitedTrips.length > 0 && (
          <section className="mt-6 px-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">
              Shared with you
            </p>
            <ul className="space-y-3">
              {invitedTrips.map((trip) => {
                const tagged = resolveTaggedFollowers(trip.taggedFollowerIds ?? [])
                return (
                  <li
                    key={trip.id}
                    className="overflow-hidden rounded-[14px] border border-orange/35 bg-orange/10 p-3"
                  >
                    <p className="font-display text-sm font-bold text-white">{trip.name}</p>
                    <p className="mt-0.5 text-xs text-white/65">
                      {trip.destination ?? 'Route TBD'}
                      {tagged.length > 0
                        ? ` · tagged: ${tagged.map((p) => p.name).join(', ')}`
                        : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddInvitedTrip(trip.id, trip.name)}
                      className="mt-2 inline-flex items-center gap-1 rounded-[14px] border border-orange/35 bg-orange/10 px-3 py-1.5 text-xs font-bold text-orange transition hover:border-orange/55"
                    >
                      <Plus size={14} />
                      Add to my road trips
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>

      {toast && (
        <div className="app-toast fixed bottom-[calc(var(--app-bottom-nav-h)+1rem)] left-1/2 z-[var(--z-modal)] -translate-x-1/2 rounded-[14px] bg-brown px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function QuickLink({
  to,
  icon,
  label,
  pillClass,
}: {
  to: string
  icon: ReactNode
  label: string
  pillClass: string
}) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-center gap-2 rounded-[14px] border-2 bg-midnight-surface/90 py-2.5 text-xs font-bold text-white no-underline transition active:scale-[0.98] ${pillClass}`}
    >
      {icon}
      {label}
    </Link>
  )
}
