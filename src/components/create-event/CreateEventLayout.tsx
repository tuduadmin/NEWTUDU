import { ChevronLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import AppHeaderBar from '../locked/AppHeaderBar'
import BottomNav from '../BottomNav'
import GradientButton from '../GradientButton'
import CreateEventStepper from './CreateEventStepper'

type CreateEventLayoutProps = {
  step: number
  completedSteps?: number[]
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
  completedSteps,
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
    <div className="mx-auto min-h-svh max-w-lg bg-cream pb-36">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-1">
        <Link
          to="/host"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-orange"
        >
          <ChevronLeft size={16} />
          Back
        </Link>

        <div className="mt-2 flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Create Event</h1>
          <span className="font-display text-sm font-bold text-orange">Step {step} / 5</span>
        </div>

        <CreateEventStepper currentStep={step} completedSteps={completedSteps} />

        <div className="mt-5">{children}</div>

        <div className="mt-8 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-brown/15 bg-white py-3.5 font-display text-sm font-bold text-brown transition hover:border-orange/30"
            >
              Back
            </button>
            {showNext && onNext ? (
              <GradientButton
                type="button"
                fullWidth
                className="rounded-full py-3.5"
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

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-brown-muted">
      {children}
      {required && <span className="text-maroon"> *</span>}
    </label>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white px-3 py-2.5 text-sm text-brown outline-none placeholder:text-brown-muted/50 focus:border-purple focus:ring-2 focus:ring-purple/20 ${className}`}
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
      className="w-full resize-none rounded-[var(--radius-lg)] border border-brown/15 bg-white px-3 py-2.5 text-sm text-brown outline-none placeholder:text-brown-muted/50 focus:border-purple focus:ring-2 focus:ring-purple/20"
    />
  )
}
