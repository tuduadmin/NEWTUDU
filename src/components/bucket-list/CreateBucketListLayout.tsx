import { BackButton } from '../NavActionButtons'
import AppHeaderBar from '../locked/AppHeaderBar'
import BottomNav from '../BottomNav'
import GradientButton from '../GradientButton'
import CreateBucketListStepper from './CreateBucketListStepper'
import type { BucketList } from '../../types/bucketList'
import type { BucketListWizardStep } from '../../lib/bucketListWizard'

type CreateBucketListLayoutProps = {
  step: BucketListWizardStep
  list: BucketList
  isEditing: boolean
  visitedSteps: ReadonlySet<BucketListWizardStep>
  onStepClick: (step: BucketListWizardStep) => void
  children: React.ReactNode
  onBack: () => void
  onNext?: () => void
  onDiscard: () => void
  onLeaveHub: () => void
  nextLabel?: string
  showNext?: boolean
  nextDisabled?: boolean
}

export default function CreateBucketListLayout({
  step,
  list,
  isEditing,
  visitedSteps,
  onStepClick,
  children,
  onBack,
  onNext,
  onDiscard,
  onLeaveHub,
  nextLabel = 'Next',
  showNext = true,
  nextDisabled = false,
}: CreateBucketListLayoutProps) {
  return (
    <div className="app-page-shell pb-36">
      <AppHeaderBar logoLinkTo="/bucket-list" />

      <main className="px-4 pt-1">
        <BackButton variant="link" showIcon className="!px-0" onClick={onLeaveHub}>
          Back
        </BackButton>

        <div className="mt-2 flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
            {isEditing ? 'Edit bucket list' : 'Create bucket list'}
          </h1>
          <span className="font-display text-sm font-bold text-orange">Step {step} / 3</span>
        </div>

        <CreateBucketListStepper
          currentStep={step}
          list={list}
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
            onClick={onDiscard}
            className="w-full py-2 text-xs font-bold uppercase tracking-wider text-maroon/70 transition hover:text-maroon"
          >
            Discard list
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
