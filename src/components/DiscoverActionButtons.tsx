import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ShareIcon } from './NavActionButtons'

type DiscoverActionButtonsProps = {
  onBack: () => void
  onSkip: () => void
  onView: () => void
  onSave: () => void
  onShare: () => void
  backDisabled?: boolean
  backsRemaining?: number
}

type DeckCircleButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  size: 'side' | 'center' | 'view'
  variant: 'orange' | 'back' | 'skip' | 'save' | 'share'
  children: React.ReactNode
}

const borderedCircleClass = 'border border-brown/15 bg-white shadow-sm'

const accentClass = {
  back: 'text-electric-blue',
  skip: 'text-red-500',
  save: 'text-green-500',
  share: 'text-purple',
} as const

function DeckCircleButton({
  label,
  onClick,
  disabled,
  size,
  variant,
  children,
}: DeckCircleButtonProps) {
  const sizeClass =
    size === 'view'
      ? 'h-[5.25rem] w-[5.25rem]'
      : size === 'center'
        ? 'h-[4rem] w-[4rem]'
        : 'h-[3.75rem] w-[3.75rem]'

  const variantClass =
    variant === 'orange'
      ? 'bg-orange text-white shadow-[0_0_24px_rgba(246,142,93,0.45)]'
      : `${borderedCircleClass} ${accentClass[variant]}`

  const labelClass =
    variant === 'orange'
      ? 'text-[11px] font-bold leading-none text-white'
      : `text-[11px] font-bold leading-none ${accentClass[variant]}`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex shrink-0 disabled:opacity-40"
    >
      <span
        className={`flex flex-col items-center justify-center gap-0.5 rounded-full transition active:scale-95 ${sizeClass} ${variantClass}`}
      >
        {children}
        <span className={labelClass}>{label}</span>
      </span>
    </button>
  )
}

export default function DiscoverActionButtons({
  onBack,
  onSkip,
  onView,
  onSave,
  onShare,
  backDisabled = false,
  backsRemaining,
}: DiscoverActionButtonsProps) {
  const backLabel =
    backsRemaining != null && backsRemaining >= 0 ? `Back (${backsRemaining})` : 'Back'

  return (
    <div className="mx-auto flex w-full max-w-md shrink-0 items-center justify-between px-0">
      <DeckCircleButton
        label={backLabel}
        onClick={onBack}
        disabled={backDisabled}
        size="side"
        variant="back"
      >
        <ArrowLeftIcon className="h-7 w-7 shrink-0 stroke-[2.5] drop-shadow-sm" aria-hidden />
      </DeckCircleButton>

      <DeckCircleButton label="Skip" onClick={onSkip} size="center" variant="skip">
        <XMarkIcon className="h-7 w-7 shrink-0 stroke-[2.5] drop-shadow-sm" aria-hidden />
      </DeckCircleButton>

      <DeckCircleButton label="View" onClick={onView} size="view" variant="orange">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 drop-shadow-sm">
          <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="3" />
          <path d="M11 8v3l2 2M16 16l4 4" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </DeckCircleButton>

      <DeckCircleButton label="Save" onClick={onSave} size="center" variant="save">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 drop-shadow-sm">
          <path
            d="M6 4h12v16l-6-4-6 4V4Z"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      </DeckCircleButton>

      <DeckCircleButton label="Share" onClick={onShare} size="side" variant="share">
        <ShareIcon className="h-6 w-6 shrink-0 drop-shadow-sm" aria-hidden />
      </DeckCircleButton>
    </div>
  )
}
