type SaveButtonVariant = 'primary' | 'secondary'

type SaveButtonProps = {
  label: string
  savedLabel?: string
  justSaved?: boolean
  saving?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit'
  fullWidth?: boolean
  className?: string
  disabled?: boolean
  variant?: SaveButtonVariant
}

const baseClasses =
  'inline-flex items-center justify-center rounded-[14px] px-6 font-display text-sm font-bold tracking-wide transition duration-[var(--duration-fast)]'

const activeVariantClasses: Record<SaveButtonVariant, string> = {
  primary:
    'bg-gradient-tudu text-[var(--gradient-cta-fg)] hover:brightness-110 active:scale-[0.98]',
  secondary:
    'border border-app-subtle bg-app-elevated text-brown hover:border-orange/30 hover:bg-orange/5 active:scale-[0.98]',
}

const savedClasses =
  'border border-app-subtle bg-app-elevated text-brown-muted shadow-none hover:bg-app-elevated'

export default function SaveButton({
  label,
  savedLabel = 'Saved',
  justSaved = false,
  saving = false,
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
  disabled = false,
  variant = 'primary',
}: SaveButtonProps) {
  const isSavedState = justSaved && !saving
  const displayLabel = saving ? 'Savingâ€¦' : isSavedState ? savedLabel : label

  const stateClasses = isSavedState ? savedClasses : activeVariantClasses[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || saving}
      className={[baseClasses, stateClasses, fullWidth ? 'w-full' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {displayLabel}
    </button>
  )
}
