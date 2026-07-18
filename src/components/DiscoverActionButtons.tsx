type DiscoverActionButtonsProps = {
  onBack: () => void
  onSkip: () => void
  onView: () => void
  onSave: () => void
  onShare: () => void
  backDisabled?: boolean
}

type ActionProps = {
  label: string
  color: string
  onClick: () => void
  disabled?: boolean
  large?: boolean
  children: React.ReactNode
}

function ActionButton({ label, color, onClick, disabled, large, children }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 disabled:opacity-40"
    >
      <span
        className={`flex items-center justify-center rounded-full bg-app-dark-elevated transition active:scale-95 ${
          large ? 'h-[4.25rem] w-[4.25rem] shadow-[0_0_24px_rgba(246,142,93,0.45)]' : 'h-12 w-12'
        }`}
      >
        {children}
      </span>
      <span className={`text-[10px] font-medium ${color}`}>{label}</span>
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
}: DiscoverActionButtonsProps) {
  return (
    <div className="mx-auto flex w-full max-w-md items-end justify-between px-2 py-3">
      <ActionButton label="Back" color="text-blue-400" onClick={onBack} disabled={backDisabled}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 14 4 9l5-5M20 20v-7a4 4 0 0 0-4-4H4"
            stroke="#60A5FA"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ActionButton>

      <ActionButton label="Skip" color="text-red-400" onClick={onSkip}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </ActionButton>

      <ActionButton label="View" color="text-orange" onClick={onView} large>
        <span className="flex h-full w-full items-center justify-center rounded-full bg-orange">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
            <path d="M11 8v3l2 2M16 16l4 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </ActionButton>

      <ActionButton label="Save" color="text-green-400" onClick={onSave}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 4h12v16l-6-4-6 4V4Z"
            stroke="#4ADE80"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </ActionButton>

      <ActionButton label="Share" color="text-purple-400" onClick={onShare}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v12M12 15l4-4M12 15l-4-4M5 19h14"
            stroke="#C084FC"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ActionButton>
    </div>
  )
}
