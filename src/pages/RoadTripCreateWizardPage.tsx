import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CreateRoadTripLayout from '../components/road-trip/CreateRoadTripLayout'
import RoadTripBasicsStep from '../components/road-trip/RoadTripBasicsStep'
import RoadTripStopsStep from '../components/road-trip/RoadTripStopsStep'
import GradientButton from '../components/GradientButton'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import { getCurrentUser } from '../lib/auth'
import {
  deleteRoadTrip,
  getRoadTripById,
  startRoadTripCreate,
  updateRoadTrip,
} from '../lib/roadTrips'
import {
  isRoadTripBasicsComplete,
  roadTripStepIdFromNumber,
  roadTripStepNumberFromId,
  type RoadTripWizardStep,
} from '../lib/roadTripWizard'
import { resolveTaggedFollowers } from '../lib/userFollows'

export default function RoadTripCreateWizardPage() {
  const navigate = useNavigate()
  const { tripId, stepId } = useParams<{ tripId?: string; stepId?: string }>()
  const user = getCurrentUser()
  const [refresh, setRefresh] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<RoadTripWizardStep>>(new Set([1]))

  const step = roadTripStepNumberFromId(stepId)

  useEffect(() => {
    if (!user) {
      navigate('/signin')
      return
    }
    if (!tripId) {
      startRoadTripCreate((path) => navigate(path), user.email)
      return
    }
    if (!stepId) {
      navigate(`/road-trip/create/${tripId}/basics`, { replace: true })
    }
  }, [user, tripId, stepId, navigate])

  useEffect(() => {
    setVisitedSteps((prev) => new Set(prev).add(step))
  }, [step])

  const trip = useMemo(() => {
    void refresh
    return tripId ? getRoadTripById(tripId) : undefined
  }, [tripId, refresh])

  const isEditing = Boolean(
    trip &&
      (trip.stopEventIds.length > 0 ||
        trip.status === 'planning' ||
        trip.status === 'active' ||
        (trip.name.trim() !== '' && trip.name !== 'Untitled road trip')),
  )

  function reload() {
    setRefresh((n) => n + 1)
  }

  function goToStep(next: RoadTripWizardStep) {
    if (!tripId) return
    navigate(`/road-trip/create/${tripId}/${roadTripStepIdFromNumber(next)}`)
  }

  function handleBack() {
    if (step === 1) {
      navigate('/road-trip')
      return
    }
    goToStep((step - 1) as RoadTripWizardStep)
  }

  function handleNext() {
    if (step === 1) {
      goToStep(2)
      return
    }
    if (step === 2) {
      goToStep(3)
    }
  }

  function handleUpdateBasics(partial: {
    name?: string
    plannedCities?: string[]
    taggedFollowerIds?: string[]
  }) {
    if (!trip) return
    updateRoadTrip(trip.id, partial)
    reload()
  }

  function handleSaveDraft() {
    if (!trip) return
    updateRoadTrip(trip.id, { status: 'draft' })
    navigate(`/road-trip/${trip.id}`)
  }

  function handleDiscard() {
    if (!trip) return
    if (window.confirm('Discard this road trip?')) {
      deleteRoadTrip(trip.id)
      navigate('/road-trip')
    }
  }

  function handleFinish() {
    if (!trip) return
    updateRoadTrip(trip.id, {
      status: trip.stopEventIds.length > 0 ? 'planning' : 'draft',
    })
    navigate(`/road-trip/${trip.id}`)
  }

  if (!user) {
    return null
  }

  if (!tripId || !stepId || !trip) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/road-trip" />
        <main className="px-4 pt-16 text-center text-sm text-brown-muted">
          Opening road trip editor…
        </main>
        <BottomNav />
      </div>
    )
  }

  const basicsComplete = isRoadTripBasicsComplete(trip.name)

  return (
    <CreateRoadTripLayout
      step={step}
      trip={trip}
      isEditing={isEditing}
      visitedSteps={visitedSteps}
      onStepClick={goToStep}
      onBack={handleBack}
      onNext={step < 3 ? handleNext : undefined}
      onSaveDraft={handleSaveDraft}
      onDiscard={handleDiscard}
      nextLabel={step === 2 ? 'Review' : 'Next'}
      showNext={step < 3}
      nextDisabled={step === 1 && !basicsComplete}
    >
      {step === 1 && <RoadTripBasicsStep trip={trip} onUpdate={handleUpdateBasics} />}

      {step === 2 && (
        <RoadTripStopsStep trip={trip} userEmail={user.email} onRefresh={reload} />
      )}

      {step === 3 && (
        <section className="space-y-4 pt-3">
          <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
            <p className="font-display text-base font-bold text-brown">{trip.name}</p>
            <p className="mt-1 text-sm text-brown-muted">
              {trip.destination ?? 'Add stops to set route'}
            </p>
            <p className="mt-2 text-xs text-brown-muted">
              {trip.stopEventIds.length} stop{trip.stopEventIds.length === 1 ? '' : 's'} on this trip
            </p>
            {(trip.taggedFollowerIds?.length ?? 0) > 0 && (
              <p className="mt-2 text-xs text-brown-muted">
                Tagged:{' '}
                {resolveTaggedFollowers(trip.taggedFollowerIds ?? [])
                  .map((p) => p.name)
                  .join(', ')}
              </p>
            )}
          </div>
          <p className="text-sm text-brown-muted">
            Review details will expand here — for now, save your trip to return to your routes.
          </p>
          <GradientButton type="button" fullWidth className="py-3.5" onClick={handleFinish}>
            Save trip
          </GradientButton>
        </section>
      )}
    </CreateRoadTripLayout>
  )
}
