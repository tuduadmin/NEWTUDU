import { Check, HelpCircle, Pencil } from 'lucide-react'

export type StepperStep = 'basics' | 'schedule' | 'category' | 'final' | 'review'

const STEPS: { id: StepperStep; label: string; number: number }[] = [
  { id: 'basics', label: 'BASICS', number: 1 },
  { id: 'schedule', label: 'SCHEDULE', number: 2 },
  { id: 'category', label: 'CATEGORY', number: 3 },
  { id: 'final', label: 'FINAL', number: 4 },
  { id: 'review', label: 'REVIEW', number: 5 },
]

type CreateEventStepperProps = {
  currentStep: number
  completedSteps?: number[]
}

export default function CreateEventStepper({ currentStep, completedSteps = [] }: CreateEventStepperProps) {
  return (
    <div className="mt-3">
      <div className="flex gap-1">
        {STEPS.map((step) => {
          const isActive = step.number === currentStep
          const isComplete = completedSteps.includes(step.number) && !isActive
          const isFuture = step.number > currentStep && !isComplete

          return (
            <div key={step.id} className="relative flex-1">
              {isActive && (
                <span
                  className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-orange"
                  aria-hidden
                />
              )}
              <div
                className={`flex h-9 items-center justify-center gap-1 rounded-md text-[9px] font-bold tracking-wide transition ${
                  isActive
                    ? 'bg-gradient-to-r from-warm-yellow to-orange text-brown'
                    : isComplete
                      ? 'bg-success text-white'
                      : 'bg-cream-dark text-brown-muted/70'
                }`}
              >
                {isComplete ? (
                  <Check size={12} strokeWidth={3} />
                ) : isActive ? (
                  <Pencil size={11} />
                ) : isFuture ? (
                  <HelpCircle size={11} />
                ) : null}
                <span className="hidden min-[380px]:inline">{step.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
