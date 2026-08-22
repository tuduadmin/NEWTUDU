import { Check, Pencil } from 'lucide-react'
import type { CreateEventStep } from '../../lib/createEventDraft'
import type { HostEventFormData } from '../../lib/account'
import {
  CREATE_EVENT_STEPS,
  getStepStatus,
  type StepStatus,
} from '../../lib/createEventValidation'

type StepVisualState = 'untouched' | 'incomplete' | 'complete'

type CreateEventStepperProps = {
  currentStep: CreateEventStep
  form: HostEventFormData
  visitedSteps: ReadonlySet<CreateEventStep>
  onStepClick: (step: CreateEventStep) => void
}

function getStepVisualState(
  step: CreateEventStep,
  status: StepStatus,
  visitedSteps: ReadonlySet<CreateEventStep>,
): StepVisualState {
  if (status === 'complete') return 'complete'
  if (!visitedSteps.has(step)) return 'untouched'
  return 'incomplete'
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
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full bg-white"
        aria-hidden
      >
        <Check size={10} className="text-success" strokeWidth={3} />
      </span>
    )
  }

  if (visual === 'incomplete') {
    return <Pencil size={12} className="text-white" strokeWidth={2.5} aria-hidden />
  }

  return null
}

function stepAriaLabel(
  label: string,
  visual: StepVisualState,
  isCurrent: boolean,
): string {
  const current = isCurrent ? ', current step' : ''
  if (visual === 'complete') return `${label} â€” complete${current}`
  if (visual === 'untouched') return `${label} â€” not started${current}`
  return `${label} â€” in progress, required fields missing${current}`
}

export default function CreateEventStepper({
  currentStep,
  form,
  visitedSteps,
  onStepClick,
}: CreateEventStepperProps) {
  return (
    <nav className="mt-3" aria-label="Create event steps">
      <div className="overflow-x-auto">
        <div className="flex min-w-full gap-1.5 px-2 pt-2 pb-0.5">
          {CREATE_EVENT_STEPS.map((step) => {
            const status = getStepStatus(step.number, form)
            const visual = getStepVisualState(step.number, status, visitedSteps)
            const isCurrent = step.number === currentStep
            const label = stepAriaLabel(step.label, visual, isCurrent)

            return (
              <div
                key={step.id}
                className="flex min-w-[3rem] flex-1 flex-col items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() => onStepClick(step.number)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={label}
                  title={label}
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
