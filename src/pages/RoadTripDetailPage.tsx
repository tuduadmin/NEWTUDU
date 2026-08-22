import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Car, CheckCircle2, MapPin, Pencil, Plus, Search, Settings, Users } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import AddToBucketListModal from '../components/AddToBucketListModal'
import DiscoverEventDetailPanel from '../components/DiscoverEventDetailPanel'
import GradientButton from '../components/GradientButton'
import Toast from '../components/Toast'
import RoadTripProgressBar from '../components/road-trip/RoadTripProgressBar'
import RoadTripEventsCarousel from '../components/road-trip/RoadTripEventsCarousel'
import RoadTripMapHero from '../components/road-trip/RoadTripMapHero'
import {
  getTripCoverImage,
  getTripLocation,
  getStatusBadge,
} from '../components/road-trip/RoadTripListCard'
import { BackIconButton } from '../components/NavActionButtons'
import type { DiscoverEvent } from '../data/discoverEvents'
import { getCurrentUser } from '../lib/auth'
import { projectTripRouteToMapPins, getRoadTripMapViewFromPoints } from '../lib/roadTripGeo'
import { formatPlannedCitiesDestination, getTripPlannedCities, getTripRoutePoints } from '../lib/roadTripRoute'
import {
  completeRoadTrip,
  getRoadTripById,
  getRoadTripProgress,
  getRoadTripStops,
  removeStopFromRoadTrip,
  startRoadTrip,
  toggleStopVisited,
} from '../lib/roadTrips'
import { resolveTaggedFollowers } from '../lib/userFollows'

export default function RoadTripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [refresh, setRefresh] = useState(0)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [detailEvent, setDetailEvent] = useState<DiscoverEvent | null>(null)
  const [bucketModal, setBucketModal] = useState<{ eventId: string; title: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const trip = useMemo(() => {
    void refresh
    return tripId ? getRoadTripById(tripId) : undefined
  }, [tripId, refresh])

  const isOwner = trip?.ownerEmail?.toLowerCase() === user?.email.toLowerCase()
  const readOnly = trip?.status === 'completed' || !isOwner

  const stops = trip ? getRoadTripStops(trip) : []
  const plannedCities = trip ? getTripPlannedCities(trip) : []
  const routePoints = trip ? getTripRoutePoints(trip, stops) : []
  const mapPins = useMemo(
    () => projectTripRouteToMapPins(plannedCities, stops),
    [plannedCities, stops],
  )
  const mapView = useMemo(
    () => getRoadTripMapViewFromPoints(routePoints),
    [routePoints],
  )

  const cover = trip ? getTripCoverImage(trip) : ''
  const location = trip ? getTripLocation(trip) : ''
  const badge = trip ? getStatusBadge(trip.status) : null
  const tagged = trip ? resolveTaggedFollowers(trip.taggedFollowerIds ?? []) : []
  const progress = trip ? getRoadTripProgress(trip) : null
  const visitedStopIds = trip?.visitedStopIds ?? []

  const reload = useCallback(() => setRefresh((n) => n + 1), [])

  useEffect(() => {
    function onScroll() {
      setStickyVisible(window.scrollY > 220)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleToggleVisited(eventId: string) {
    if (!trip) return
    const updated = toggleStopVisited(trip.id, eventId)
    reload()
    if (updated?.status === 'completed') {
      setToast('Trip complete — nice drive!')
    } else if (updated?.visitedStopIds?.includes(eventId)) {
      setToast('Stop marked visited')
    } else {
      setToast('Stop unmarked')
    }
  }

  function handleStartTrip() {
    if (!trip) return
    startRoadTrip(trip.id)
    reload()
    setToast('Trip started — safe travels!')
  }

  function handleFinishTrip() {
    if (!trip) return
    completeRoadTrip(trip.id)
    reload()
    setToast('Trip marked complete')
  }

  function handleDeleteStop(eventId: string) {
    if (!trip) return
    removeStopFromRoadTrip(trip.id, eventId)
    reload()
    setToast('Stop removed')
  }

  function handleMoveToBucketList(eventId: string, title: string) {
    setBucketModal({ eventId, title })
  }

  function handleBucketSuccess(listName: string) {
    if (!trip || !bucketModal) return
    removeStopFromRoadTrip(trip.id, bucketModal.eventId)
    setBucketModal(null)
    reload()
    setToast(`Moved to "${listName}"`)
  }

  if (!user) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/road-trip" />
        <main className="px-4 pt-10 text-center">
          <p className="text-brown-muted">Sign in to view road trips.</p>
          <GradientButton to="/signin" className="mt-4 inline-block px-6 py-2.5 text-sm">
            Sign in
          </GradientButton>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (!trip || !isOwner) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/road-trip" />
        <main className="px-4 py-16 text-center">
          <h1 className="font-display text-xl font-bold text-brown">Trip not found</h1>
          <p className="mt-2 text-sm text-brown-muted">
            This trip may have been deleted or you don&apos;t have access.
          </p>
          <GradientButton to="/road-trip" className="mt-4 inline-block px-6 py-2.5 text-sm">
            Back to road trips
          </GradientButton>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/road-trip" />

      <header
        className={`fixed inset-x-0 top-0 z-[var(--z-header)] mx-auto max-w-lg border-b border-app-subtle bg-app-elevated/95 backdrop-blur-sm transition duration-[var(--duration-fast)] ${
          stickyVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        <div className="flex h-[52px] items-center gap-3 px-4">
          <BackIconButton to="/road-trip" variant="plain" />
          <h1 className="min-w-0 flex-1 truncate font-display text-lg font-bold text-brown">{trip.name}</h1>
          <Link
            to="/my-tudu/settings/road-trip"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brown-muted no-underline transition hover:bg-cream-dark hover:text-orange"
            aria-label="Road trip settings"
          >
            <Settings size={18} />
          </Link>
        </div>
      </header>

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-dark">
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/25 via-transparent to-midnight/95" />
        <BackIconButton
          to="/road-trip"
          variant="glass"
          className="absolute left-4 top-[calc(12px+env(safe-area-inset-top))]"
        />
        {badge && (
          <span
            className={`absolute right-4 top-[calc(12px+env(safe-area-inset-top))] inline-flex items-center rounded-[14px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="font-display text-2xl font-extrabold leading-tight text-white">{trip.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-white/85">
            <MapPin size={14} className="shrink-0 text-orange" />
            {location}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/60">
            {progress && progress.totalStops > 0
              ? `${progress.visitedCount} of ${progress.totalStops} stops visited`
              : `${stops.length} event stop${stops.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <main className="space-y-5 px-4 pt-4">
        {progress && (
          <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
                  Trip progress
                </p>
                <RoadTripProgressBar
                  visitedCount={progress.visitedCount}
                  totalStops={progress.totalStops}
                  percent={progress.percent}
                />
              </div>
              {trip.status === 'planning' && progress.totalStops > 0 && !readOnly && (
                <button
                  type="button"
                  onClick={handleStartTrip}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[14px] bg-success px-3 py-2 text-xs font-bold text-white transition hover:bg-success/90"
                >
                  <Car size={14} />
                  Start trip
                </button>
              )}
            </div>
            {trip.status === 'active' && progress.isComplete && !readOnly && (
              <button
                type="button"
                onClick={handleFinishTrip}
                className="mt-3 w-full rounded-[14px] border border-success/35 bg-success/10 py-2.5 text-xs font-bold text-success transition hover:bg-success/15"
              >
                Finish trip
              </button>
            )}
            {trip.status === 'completed' && trip.completedAt && (
              <p className="mt-2 text-[11px] text-brown-muted">
                Completed {new Date(trip.completedAt).toLocaleDateString()}
              </p>
            )}
          </section>
        )}

        <RoadTripMapHero
          tripName={trip.name}
          destination={trip.destination}
          pins={mapPins}
          stopCount={mapPins.length || stops.length}
          mapView={mapView}
        />

        {plannedCities.length > 0 && (
          <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Route</p>
            <p className="mt-1 text-sm font-semibold text-brown">
              {formatPlannedCitiesDestination(plannedCities)}
            </p>
          </section>
        )}

        {tagged.length > 0 && (
          <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
              <Users size={12} />
              Tagged
            </p>
            <p className="mt-1 text-sm text-brown">{tagged.map((p) => p.name).join(', ')}</p>
          </section>
        )}

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
            Events on this trip
          </p>
          <RoadTripEventsCarousel
            events={stops}
            visitedStopIds={visitedStopIds}
            readOnly={readOnly}
            renderSlideFooter={
              readOnly
                ? (stop) => (
                    <div className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setDetailEvent(stop)}
                        className="w-full rounded-[14px] border border-brown/20 py-2 text-xs font-bold text-brown transition hover:border-orange/30 hover:bg-orange/5"
                      >
                        View event
                      </button>
                    </div>
                  )
                : (stop) => {
                    const isVisited = visitedStopIds.includes(stop.id)
                    return (
                    <div className="flex flex-col border-t border-app-subtle">
                      <button
                        type="button"
                        onClick={() => handleToggleVisited(stop.id)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition ${
                          isVisited
                            ? 'bg-success/10 text-success'
                            : 'bg-orange/5 text-orange hover:bg-orange/10'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        {isVisited ? 'Visited — tap to undo' : 'Mark stop visited'}
                      </button>
                      <div className="flex border-t border-app-subtle">
                        <button
                          type="button"
                          onClick={() => setDetailEvent(stop)}
                          className="flex flex-1 items-center justify-center py-2.5 text-xs font-semibold text-brown transition hover:bg-orange/5"
                        >
                          View event
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveToBucketList(stop.id, stop.title)}
                          className="flex flex-1 items-center justify-center border-l border-app-subtle py-2.5 text-xs font-semibold text-brown transition hover:bg-orange/5"
                        >
                          Move to list
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStop(stop.id)}
                          className="flex flex-1 items-center justify-center border-l border-app-subtle py-2.5 text-xs font-semibold text-maroon transition hover:bg-maroon/5"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    )
                  }
            }
          />
          {!readOnly && stops.length === 0 && (
            <GradientButton
              type="button"
              fullWidth
              className="mt-3 px-4 py-2.5 text-sm"
              onClick={() => navigate(`/road-trip/create/${trip.id}/stops`)}
            >
              <Plus size={16} className="mr-1 inline" />
              Add stops
            </GradientButton>
          )}
        </section>

        {!readOnly && (
          <div className="grid gap-2 sm:grid-cols-2">
            <GradientButton
              type="button"
              fullWidth
              className="px-4 py-2.5 text-sm"
              onClick={() => navigate(`/road-trip/create/${trip.id}/basics`)}
            >
              <Pencil size={16} className="mr-1 inline" />
              Edit trip
            </GradientButton>
            <button
              type="button"
              onClick={() => navigate(`/road-trip/find-more/${trip.id}`)}
              className="inline-flex items-center justify-center gap-1 rounded-[14px] border border-orange/30 bg-orange/10 px-4 py-2.5 text-sm font-bold text-orange transition hover:border-orange/50"
            >
              <Search size={16} />
              Find more stops
            </button>
            <Link
              to="/my-tudu/settings/road-trip"
              className="inline-flex items-center justify-center gap-1 rounded-[14px] border border-app-subtle bg-app-elevated px-4 py-2.5 text-sm font-semibold text-brown no-underline transition hover:border-orange/30 sm:col-span-2"
            >
              <Settings size={16} className="text-brown-muted" />
              Road trip settings
            </Link>
          </div>
        )}
      </main>

      {bucketModal && (
        <AddToBucketListModal
          eventIds={[bucketModal.eventId]}
          eventTitle={bucketModal.title}
          onClose={() => setBucketModal(null)}
          onSuccess={handleBucketSuccess}
        />
      )}

      {detailEvent && (
        <DiscoverEventDetailPanel
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onSave={() => setDetailEvent(null)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <BottomNav />
    </div>
  )
}
