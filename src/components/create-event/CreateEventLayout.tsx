import { Save } from 'lucide-react'
import type { KeyboardEventHandler } from 'react'
import { BackButton, BackLink } from '../NavActionButtons'
import type { CreateEventStep } from '../../lib/createEventDraft'
import type { HostEventFormData } from '../../lib/account'
import AppHeaderBar from '../locked/AppHeaderBar'
import BottomNav from '../BottomNav'
import { RequiredAsterisk } from '../RequiredAsterisk'
import GradientButton from '../GradientButton'
import CreateEventStepper from './CreateEventStepper'
import CreateEventStepHint from './CreateEventStepHint'
import { appFieldClass } from '../../lib/formFieldClasses'

type CreateEventLayoutProps = {
  step: CreateEventStep
  form: HostEventFormData
  visitedSteps: ReadonlySet<CreateEventStep>
  onStepClick: (step: CreateEventStep) => void
  children: React.ReactNode
  onBack: () => void
  onNext?: () => void
  onSaveDraft: () => void
  onDiscard: () => void
  nextLabel?: string
  showNext?: boolean
  nextDisabled?: boolean
  footerExtra?: React.ReactNode
}

export default function CreateEventLayout({
  step,
  form,
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
  footerExtra,
}: CreateEventLayoutProps) {
  return (
    <div className="app-page-shell pb-36">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-1">
        <BackLink to="/host" variant="chevron" />

        <div className="mt-2 flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Create Event</h1>
          <span className="font-display text-sm font-bold text-orange">Step {step} / 5</span>
        </div>

        <CreateEventStepper
          currentStep={step}
          form={form}
          visitedSteps={visitedSteps}
          onStepClick={onStepClick}
        />

        <div className="mt-8 pt-2">{children}</div>

        <CreateEventStepHint step={step} form={form} visitedSteps={visitedSteps} />

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
            ) : (
              footerExtra
            )}
          </div>

          {footerExtra && showNext && <div>{footerExtra}</div>}

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
            Discard Event
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export function FieldLabel({
  children,
  required,
  htmlFor,
  className = '',
}: {
  children: React.ReactNode
  required?: boolean
  htmlFor?: string
  className?: string
}) {
  return (
    <label htmlFor={htmlFor} className={`mb-1.5 block text-xs font-semibold text-brown-muted${className ? ` ${className}` : ''}`}>
      {children}
      {required && (
        <>
          {' '}
          <RequiredAsterisk />
        </>
      )}
    </label>
  )
}

/** Muted helper / subtext below fields (10px, brown-muted). */
export function FieldHelper({
  children,
  className = '',
  italic = false,
}: {
  children: React.ReactNode
  className?: string
  italic?: boolean
}) {
  return (
    <p
      className={`text-[10px] leading-snug text-brown-muted${italic ? ' italic' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </p>
  )
}

/** Inline section heading within a step (matches ScheduleStep group labels). */
export function SectionHeading({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={`mb-2 text-xs font-semibold text-brown-muted${className ? ` ${className}` : ''}`}>
      {children}
    </p>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  onKeyDown,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onKeyDown={onKeyDown}
      className={`${appFieldClass} w-full px-3 py-2.5 placeholder:text-brown-muted/50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className={`${appFieldClass} w-full resize-none px-3 py-2.5 placeholder:text-brown-muted/50`}
    />
  )
}
