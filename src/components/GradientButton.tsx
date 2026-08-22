import { Link } from 'react-router-dom'
import type { ComponentPropsWithoutRef } from 'react'

type ButtonVariant = 'default' | 'dark' | 'outline' | 'ghost'

type BaseProps = {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
  variant?: ButtonVariant
}

type ButtonAsButton = BaseProps &
  ComponentPropsWithoutRef<'button'> & {
    to?: undefined
  }

type ButtonAsLink = BaseProps &
  Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
    to: string
  }

type GradientButtonProps = ButtonAsButton | ButtonAsLink

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-gradient-tudu text-white shadow-md hover:brightness-110 active:scale-[0.98] hover:shadow-[var(--shadow-glow-warm)]',
  dark: 'bg-midnight-surface text-white border border-white/[0.12] shadow-md hover:brightness-110',
  outline:
    'border-2 border-white/30 bg-transparent text-white shadow-none hover:bg-white/10 active:scale-[0.98]',
  ghost: 'bg-transparent text-sunset-orange shadow-none hover:bg-sunset-orange/10',
}

export default function GradientButton({
  to,
  children,
  className = '',
  fullWidth = false,
  variant = 'default',
  ...rest
}: GradientButtonProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-[14px] px-6 py-3 font-display text-sm font-bold tracking-wide transition duration-[var(--duration-fast)]',
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    const linkProps = rest as Omit<ButtonAsLink, keyof BaseProps | 'to'>
    return (
      <Link to={to} className={classes} {...linkProps}>
        {children}
      </Link>
    )
  }

  const buttonProps = rest as Omit<ButtonAsButton, keyof BaseProps>
  const buttonType = buttonProps.type ?? 'button'
  const { type: _type, ...remainingButtonProps } = buttonProps
  return (
    <button type={buttonType} className={classes} {...remainingButtonProps}>
      {children}
    </button>
  )
}
