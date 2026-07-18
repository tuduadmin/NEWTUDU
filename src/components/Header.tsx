import TuduLogo from './TuduLogo'
import GradientButton from './GradientButton'

type HeaderProps = {
  variant?: 'light' | 'dark'
}

export default function Header({ variant = 'dark' }: HeaderProps) {
  const isDark = variant === 'dark'

  return (
    <header
      className={`sticky top-0 z-[var(--z-header)] flex items-center justify-between px-4 py-3 backdrop-blur-md sm:px-6 ${
        isDark
          ? 'border-b border-white/[0.08] bg-midnight/90'
          : 'bg-cream/95'
      }`}
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <TuduLogo variant="iconWithText" />
      <GradientButton to="/signin" variant={isDark ? 'default' : 'default'} className="px-5 py-2 text-sm">
        Sign In
      </GradientButton>
    </header>
  )
}
