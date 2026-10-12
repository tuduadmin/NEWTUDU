import { useEffect, useMemo, useState, type ReactNode } from 'react'
import TuduBetaFeedbackBox from '../components/TuduBetaFeedbackBox'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, MapPin, Plus, Send, Sparkles, Car } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import DiscoverEventDetailPanel from '../components/DiscoverEventDetailPanel'
import RoadTripMap from '../components/road-trip/RoadTripMap'
import type { DiscoverEvent } from '../data/discoverEvents'
import RoadTripListCard from '../components/road-trip/RoadTripListCard'
import RoadTripLandingHero from '../components/road-trip/RoadTripLandingHero'
import RoadTripMoodChips from '../components/road-trip/RoadTripMoodChips'
import RoadTripEmptyIllustration, {
  ROAD_TRIP_EMPTY_FADE_TO,
} from '../components/road-trip/RoadTripEmptyIllustration'
import { useRoadTripHero } from '../hooks/useRoadTripHero'
import { getCurrentUser } from '../lib/auth'
import { buildRoadTripMapStops } from '../lib/roadTripMapModel'
import { getTripGoogleMapsDirectionsUrl } from '../lib/roadTripRoute'
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
import { isDarkConsumerTheme } from '../lib/appThemes'

const TAB_ORDER: RoadTripListTab[] = ['planned', 'drafts', 'past']
const LUMI_EMPTY_FADE = '#fff8f0'

export default function RoadTripLandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const [refresh, setRefresh] = useState(0)
  const [tab, setTab] = useState<RoadTripListTab>('planned')
  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [detailEvent, setDetailEvent] = useState<DiscoverEvent | null>(null)
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
  const mapStops = useMemo(
    () => (previewTrip ? buildRoadTripMapStops(previewTrip, stops) : []),
    [previewTrip, stops],
  )
  const directionsUrl = useMemo(
    () => (previewTrip ? getTripGoogleMapsDirectionsUrl(previewTrip, stops) : null),
    [previewTrip, stops],
  )
  const readOnly = tab === 'past'
  const darkHub = isDarkConsumerTheme()
  const emptyFade = darkHub ? ROAD_TRIP_EMPTY_FADE_TO : LUMI_EMPTY_FADE

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
    <div className="relative app-page-shell pb-[calc(var(--app-bottom-nav-h)+max(0.5rem,env(safe-area-inset-bottom,0px))+3.5rem)]">
      <AppHeaderBar logoLinkTo="/road-trip" />

      <RoadTripLandingHero
        heroUrl={heroUrl}
        heroRevision={heroRevision}
        onCreate={handleCreateRoadTrip}
      />
      <RoadTripMoodChips />

      <div className="mt-3 space-y-4">
        <div>
          <p className="mb-2 px-4 text-xs font-bold uppercase tracking-wide text-brown-muted">
            {previewTrip ? `Route · ${previewTrip.name}` : 'Map'}
          </p>
          <RoadTripMap
            variant={darkHub ? 'dark' : 'light'}
            className="mx-4"
            stops={mapStops}
            directionsUrl={directionsUrl}
            onEventSelect={(event) => setDetailEvent(event)}
          />
          {previewTrip && filteredTrips.length > 1 && (
            <p className="mt-2 px-4 text-center text-[11px] text-brown-muted">
              Showing first trip in this tab — open a trip for its full map and stops.
            </p>
          )}
        </div>

        <section className="px-4">
          <div className="mb-3 flex items-start gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunset-orange/15 text-sunset-orange">
              <Send size={18} />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold text-brown">Road Trip</h2>
              <p className="text-xs text-brown-muted">Pick a trip below or start a new adventure.</p>
            </div>
          </div>

          <div className="flex border-b border-app-subtle">
            {TAB_ORDER.map((tabId) => (
              <button
                key={tabId}
                type="button"
                onClick={() => handleTabChange(tabId)}
                className={`flex-1 border-b-2 pb-2.5 text-center text-sm font-bold capitalize transition ${
                  tab === tabId
                    ? 'border-sunset-orange text-sunset-orange shadow-[0_6px_12px_-8px_rgba(249,115,22,0.9)]'
                    : 'border-transparent text-brown-muted'
                }`}
              >
                {tabId} ({tabCounts[tabId]})
              </button>
            ))}
          </div>

          <div className="mode-hub-search-wrap relative mt-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tab} trips...`}
              className="app-field w-full py-3 pl-10 pr-4 text-sm"
            />
            <MapPin
              size={16}
              className="mode-hub-search-icon pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            />
          </div>

          {filteredTrips.length === 0 ? (
            <div
              className="mode-hub-panel mt-6 overflow-hidden"
              style={{ backgroundColor: emptyFade }}
            >
              <RoadTripEmptyIllustration />
              <div className="px-6 pb-6 pt-3 text-center">
              <p className="font-display text-sm font-bold text-brown">
                No {tab} trips found.
              </p>
              <p className="mt-1 text-xs text-brown-muted">
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
                    className="rounded-[14px] border-2 border-sunset-orange/45 bg-app-surface py-2.5 text-sm font-bold text-sunset-orange no-underline shadow-sm transition hover:border-sunset-orange/70"
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

        <div className="mt-6 px-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brown-muted">
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
            <p className="mt-2 text-center text-[11px] text-brown-muted">
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
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brown-muted">
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
                    <p className="font-display text-sm font-bold text-brown">{trip.name}</p>
                    <p className="mt-0.5 text-xs text-brown-muted">
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

        <TuduBetaFeedbackBox variant={darkHub ? 'dark' : 'light'} className="mx-4 mt-6" />
      </div>

      {toast && (
        <div className="app-toast fixed bottom-[calc(var(--app-bottom-nav-h)+1rem)] left-1/2 z-[var(--z-modal)] -translate-x-1/2 rounded-[14px] bg-brown px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {detailEvent && (
        <DiscoverEventDetailPanel
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onSave={() => setDetailEvent(null)}
        />
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
      className={`mode-hub-quick-link flex items-center justify-center gap-2 py-2.5 text-xs no-underline ${pillClass}`}
    >
      {icon}
      {label}
    </Link>
  )
}
