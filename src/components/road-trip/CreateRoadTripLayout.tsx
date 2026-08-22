import { Save } from 'lucide-react'
import { BackButton, BackLink } from '../NavActionButtons'
import AppHeaderBar from '../locked/AppHeaderBar'
import BottomNav from '../BottomNav'
import GradientButton from '../GradientButton'
import CreateRoadTripStepper from './CreateRoadTripStepper'
import type { RoadTrip } from '../../lib/roadTrips'
import type { RoadTripWizardStep } from '../../lib/roadTripWizard'

type CreateRoadTripLayoutProps = {
  step: RoadTripWizardStep
  trip: RoadTrip
  isEditing: boolean
  visitedSteps: ReadonlySet<RoadTripWizardStep>
  onStepClick: (step: RoadTripWizardStep) => void
  children: React.ReactNode
  onBack: () => void
  onNext?: () => void
  onSaveDraft: () => void
  onDiscard: () => void
  nextLabel?: string
  showNext?: boolean
  nextDisabled?: boolean
}

export default function CreateRoadTripLayout({
  step,
  trip,
  isEditing,
  visitedSteps,
  onStepClick,
  children,
  onBack,
  onNext,
  onSaveDraft,
  onDiscard,
  nextLabel = 'Next',
  showNext = true,
  nextDisabled = false,
}: CreateRoadTripLayoutProps) {
  return (
    <div className="app-page-shell pb-36">
      <AppHeaderBar logoLinkTo="/road-trip" />

      <main className="px-4 pt-1">
        <BackLink to="/road-trip" variant="chevron" />

        <div className="mt-2 flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
            {isEditing ? 'Edit Road Trip' : 'Create Road Trip'}
          </h1>
          <span className="font-display text-sm font-bold text-orange">Step {step} / 3</span>
        </div>

        <CreateRoadTripStepper
          currentStep={step}
          trip={trip}
          visitedSteps={visitedSteps}
          onStepClick={onStepClick}
        />

        <div className="mt-8 pt-2">{children}</div>

        <div className="mt-8 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <BackButton variant="secondaryRounded" onClick={onBack} showIcon={false} />
            {showNext && onNext ? (
              <GradientButton
                type="button"
                fullWidth
                className="rounded-[14px] py-3.5"
                onClick={onNext}
                disabled={nextDisabled}
              >
                {nextLabel}
              </GradientButton>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onSaveDraft}
            className="flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-brown-muted transition hover:text-orange"
          >
            <Save size={16} />
            Save as Draft
          </button>

          <button
            type="button"
            onClick={onDiscard}
            className="w-full py-2 text-xs font-bold uppercase tracking-wider text-maroon/70 transition hover:text-maroon"
          >
            Discard Trip
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
