import { Check, Pencil } from 'lucide-react'
import type { RoadTrip } from '../../lib/roadTrips'
import {
  isRoadTripBasicsComplete,
  ROAD_TRIP_WIZARD_STEPS,
  type RoadTripWizardStep,
} from '../../lib/roadTripWizard'

type StepVisualState = 'untouched' | 'incomplete' | 'complete'

type CreateRoadTripStepperProps = {
  currentStep: RoadTripWizardStep
  trip: RoadTrip
  visitedSteps: ReadonlySet<RoadTripWizardStep>
  onStepClick: (step: RoadTripWizardStep) => void
}

function getBasicsVisual(trip: RoadTrip, visited: boolean): StepVisualState {
  if (isRoadTripBasicsComplete(trip.name)) return 'complete'
  if (!visited) return 'untouched'
  return 'incomplete'
}

function getStopsVisual(trip: RoadTrip, visited: boolean): StepVisualState {
  if (trip.stopEventIds.length > 0) return 'complete'
  if (!visited) return 'untouched'
  return 'incomplete'
}

function getReviewVisual(visited: boolean): StepVisualState {
  if (!visited) return 'untouched'
  return 'incomplete'
}

function getStepVisual(
  step: RoadTripWizardStep,
  trip: RoadTrip,
  visitedSteps: ReadonlySet<RoadTripWizardStep>,
): StepVisualState {
  const visited = visitedSteps.has(step)
  if (step === 1) return getBasicsVisual(trip, visited)
  if (step === 2) return getStopsVisual(trip, visited)
  return getReviewVisual(visited)
}

function stepButtonClass(visual: StepVisualState, isCurrent: boolean): string {
  const focus =
    'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2 focus-visible:ring-offset-cream'

  if (visual === 'complete') {
    return `bg-success hover:bg-success-deep ${focus}${isCurrent ? ' ring-2 ring-success-deep/40' : ''}`
  }
  if (visual === 'incomplete') {
    return `bg-warm-yellow hover:bg-amber-400 ${focus}${isCurrent ? ' ring-2 ring-amber-500/50' : ''}`
  }
  return `bg-brown-muted/25 hover:bg-brown-muted/35 ${focus}${isCurrent ? ' ring-2 ring-brown-muted/30' : ''}`
}

function stepIcon(visual: StepVisualState) {
  if (visual === 'complete') {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white" aria-hidden>
        <Check size={10} className="text-success" strokeWidth={3} />
      </span>
    )
  }
  if (visual === 'incomplete') {
    return <Pencil size={12} className="text-white" strokeWidth={2.5} aria-hidden />
  }
  return null
}

export default function CreateRoadTripStepper({
  currentStep,
  trip,
  visitedSteps,
  onStepClick,
}: CreateRoadTripStepperProps) {
  return (
    <nav className="mt-3" aria-label="Create road trip steps">
      <div className="overflow-x-auto">
        <div className="flex min-w-full gap-1.5 px-2 pt-2 pb-0.5">
          {ROAD_TRIP_WIZARD_STEPS.map((step) => {
            const visual = getStepVisual(step.number, trip, visitedSteps)
            const isCurrent = step.number === currentStep
            return (
              <div
                key={step.id}
                className="flex min-w-[3rem] flex-1 flex-col items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() => onStepClick(step.number)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${step.label}${isCurrent ? ', current step' : ''}`}
                  className={`flex h-6 w-full origin-center items-center justify-center rounded-[14px] ${stepButtonClass(visual, isCurrent)}`}
                >
                  {stepIcon(visual)}
                </button>
                <span
                  className={`text-center text-[8px] font-bold leading-tight tracking-wide ${
                    isCurrent ? 'text-brown' : 'text-brown-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
