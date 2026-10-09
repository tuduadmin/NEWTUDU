import type { ReactNode } from 'react'

export type ModeActionTone = 'neutral' | 'edit' | 'danger'

type ModeActionTileProps = {
  label: string
  tone: ModeActionTone
  onClick: () => void
  children: ReactNode
  compact?: boolean
}

/** Icon-over-label action — matches Road Trip trip card footer. */
export function ModeActionTile({ label, tone, onClick, children, compact }: ModeActionTileProps) {
  const toneClass =
    tone === 'edit'
      ? 'border-electric-blue/35 text-electric-blue hover:border-electric-blue/55 hover:bg-electric-blue/5'
      : tone === 'danger'
        ? 'border-error/35 text-error hover:border-error/55 hover:bg-error/5'
        : 'border-brown/20 text-brown-muted hover:border-orange/30 hover:bg-orange/5 hover:text-brown'

  const sizeClass = compact
    ? 'min-h-[42px] gap-0.5 py-1.5 text-[10px]'
    : 'min-h-[52px] gap-1 py-2 text-[11px]'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-center justify-center rounded-[12px] border bg-app-elevated px-1 font-bold transition active:scale-[0.98] ${sizeClass} ${toneClass}`}
    >
      {children}
      <span className="max-w-full truncate px-0.5">{label}</span>
    </button>
  )
}

type ModeActionPrimaryBarProps = {
  label: string
  onClick: () => void
  icon?: ReactNode
}

export function ModeActionPrimaryBar({ label, onClick, icon }: ModeActionPrimaryBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-tudu px-4 py-2.5 font-display text-sm font-bold text-white transition active:scale-[0.98]"
    >
      {icon}
      {label}
    </button>
  )
}

export function ModeActionBar({ children }: { children: ReactNode }) {
  return (
    <section className="mx-4 rounded-[14px] border border-app-subtle bg-app-elevated p-2.5 shadow-sm">
      {children}
    </section>
  )
}
