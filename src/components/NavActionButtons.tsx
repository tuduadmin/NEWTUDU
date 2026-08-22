import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ShareIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'

/** Secondary nav button â€” matches Event Manager `border-brown/15 bg-white` style. */
export const secondaryNavButtonClass =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center gap-1.5 rounded-[14px] border border-brown/15 bg-white px-4 py-2.5 text-sm font-semibold text-brown transition hover:border-orange/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'

export const secondaryNavButtonRoundedClass =
  'inline-flex min-h-[var(--touch-min)] w-full items-center justify-center gap-1.5 rounded-[14px] border border-brown/15 bg-white px-4 py-2.5 font-display text-sm font-bold text-brown transition hover:border-orange/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'

export const backLinkClass =
  'inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-orange'

export const backLinkChevronClass =
  'inline-flex items-center gap-0.5 text-sm font-medium text-brown-muted no-underline transition hover:text-brown'

export const skipTextButtonClass =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center px-3 py-2 text-sm font-semibold text-brown-muted transition hover:text-brown'

export const skipOutlinedButtonClass =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-[14px] border border-brown/15 bg-white px-4 py-2.5 text-sm font-semibold text-brown-muted transition hover:border-orange/30 hover:text-brown'

export const shareIconButtonClass =
  'flex h-11 w-11 min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-full border border-brown/15 bg-white text-brown transition hover:border-orange/30 active:scale-[0.98]'

export const shareIconButtonGlassClass =
  'glass-surface flex h-11 w-11 min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-full text-white/90 transition hover:text-white active:scale-[0.98]'

export const backIconButtonClass =
  'flex h-11 w-11 min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-full border border-brown/15 bg-white text-brown transition hover:border-orange/30 active:scale-[0.98]'

export const backIconButtonPlainClass =
  'flex h-11 w-11 min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-full text-brown-muted transition hover:text-brown'

export const backIconButtonGlassClass =
  'glass-surface flex h-11 w-11 min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-full text-white no-underline transition hover:text-white/90'

export const deckActionButtonClass = 'flex flex-col items-center gap-1 disabled:opacity-40'

export const deckActionIconClass =
  'flex h-12 w-12 items-center justify-center rounded-full border border-brown/15 bg-white text-brown shadow-sm transition hover:border-orange/30 active:scale-95'

export const deckActionLabelClass = 'text-[10px] font-semibold text-brown-muted'

function mergeClass(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base
}

type BackLinkProps = Omit<LinkProps, 'className'> & {
  className?: string
  variant?: 'link' | 'chevron'
  showIcon?: boolean
  children?: ReactNode
}

/** Text back link with chevron â€” Event Manager / settings style. */
export function BackLink({
  className,
  variant = 'link',
  showIcon = true,
  children = 'Back',
  ...props
}: BackLinkProps) {
  const base = variant === 'chevron' ? backLinkChevronClass : backLinkClass
  const Icon = variant === 'chevron' ? ChevronLeftIcon : ArrowLeftIcon
  return (
    <Link {...props} className={mergeClass(base, className)}>
      {showIcon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
    </Link>
  )
}

type BackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'secondary' | 'secondaryRounded' | 'link'
  showIcon?: boolean
  children?: ReactNode
}

/** Bordered back button for wizards and forms. */
export function BackButton({
  className,
  variant = 'secondary',
  showIcon = true,
  children = 'Back',
  type = 'button',
  ...props
}: BackButtonProps) {
  const classes =
    variant === 'secondaryRounded'
      ? secondaryNavButtonRoundedClass
      : variant === 'link'
        ? backLinkClass
        : secondaryNavButtonClass
  return (
    <button type={type} className={mergeClass(classes, className)} {...props}>
      {showIcon && <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
    </button>
  )
}

type BackIconButtonProps = {
  onClick?: () => void
  to?: string
  variant?: 'default' | 'plain' | 'glass'
  ariaLabel?: string
  className?: string
}

/** Compact icon-only back control for page headers (44px touch target). */
export function BackIconButton({
  onClick,
  to,
  variant = 'default',
  ariaLabel = 'Back',
  className,
}: BackIconButtonProps) {
  const classes =
    variant === 'glass'
      ? backIconButtonGlassClass
      : variant === 'plain'
        ? backIconButtonPlainClass
        : backIconButtonClass
  const icon = (
    <ArrowLeftIcon
      className={`h-5 w-5${variant === 'glass' ? ' text-current' : ''}`}
      aria-hidden
    />
  )

  if (to) {
    return (
      <Link to={to} className={mergeClass(classes, className)} aria-label={ariaLabel}>
        {icon}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={mergeClass(classes, className)}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  )
}

type ShareButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'secondary' | 'inline' | 'icon' | 'iconGlass'
  showLabel?: boolean
  children?: ReactNode
}

/** Share action with solid Heroicon. */
export function ShareButton({
  className,
  variant = 'secondary',
  showLabel = true,
  children = 'Share',
  type = 'button',
  ...props
}: ShareButtonProps) {
  const icon = <ShareIcon className="h-5 w-5 shrink-0 text-brown" aria-hidden />

  if (variant === 'icon' || variant === 'iconGlass') {
    const classes = variant === 'iconGlass' ? shareIconButtonGlassClass : shareIconButtonClass
    const iconClass =
      variant === 'iconGlass' ? 'h-5 w-5 shrink-0 text-current' : 'h-5 w-5 shrink-0 text-brown'
    return (
      <button type={type} className={mergeClass(classes, className)} aria-label="Share" {...props}>
        <ShareIcon className={iconClass} aria-hidden />
      </button>
    )
  }

  if (variant === 'inline') {
    return (
      <button
        type={type}
        className={mergeClass(
          'inline-flex items-center gap-1 text-xs font-semibold text-brown-muted transition hover:text-orange',
          className,
        )}
        {...props}
      >
        <ShareIcon className="h-3 w-3 shrink-0" aria-hidden />
        {showLabel && children}
      </button>
    )
  }

  return (
    <button type={type} className={mergeClass(secondaryNavButtonClass, className)} {...props}>
      {icon}
      {showLabel && children}
    </button>
  )
}

type SkipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'text' | 'outlined' | 'dark'
  selected?: boolean
  children?: ReactNode
}

/** Skip action â€” muted text or outlined secondary. */
export function SkipButton({
  className,
  variant = 'text',
  selected = false,
  children = 'Skip',
  type = 'button',
  ...props
}: SkipButtonProps) {
  let classes = variant === 'outlined' ? skipOutlinedButtonClass : skipTextButtonClass
  if (variant === 'dark') {
    classes =
      'block w-full min-h-[var(--touch-min)] text-center text-sm font-semibold text-white/48 transition hover:text-sunset-orange'
  }
  if (selected) {
    classes =
      'inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-[14px] border border-orange bg-orange/10 px-4 py-2.5 text-sm font-bold text-orange'
  }
  return (
    <button type={type} className={mergeClass(classes, className)} {...props}>
      {children}
    </button>
  )
}

type DeckActionButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  icon: ReactNode
  className?: string
}

/** Icon + label column for Discover deck action rows. */
export function DeckActionButton({
  label,
  onClick,
  disabled,
  icon,
  className,
}: DeckActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={mergeClass(deckActionButtonClass, className)}
    >
      <span className={deckActionIconClass}>{icon}</span>
      <span className={deckActionLabelClass}>{label}</span>
    </button>
  )
}

export { ArrowLeftIcon, ChevronLeftIcon, ShareIcon, XMarkIcon }
