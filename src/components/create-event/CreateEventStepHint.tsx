import type { CreateEventStep } from '../../lib/createEventDraft'
import type { HostEventFormData } from '../../lib/account'
import { getStepHintMessage } from '../../lib/createEventValidation'

type CreateEventStepHintProps = {
  step: CreateEventStep
  form: HostEventFormData
  visitedSteps: ReadonlySet<CreateEventStep>
}

export default function CreateEventStepHint({ step, form, visitedSteps }: CreateEventStepHintProps) {
  if (step === 6 || !visitedSteps.has(step)) return null

  const message = getStepHintMessage(step, form)
  if (!message) return null

  return (
    <p className="text-center text-sm font-semibold text-maroon" role="status" aria-live="polite">
      {message}
    </p>
  )
}
