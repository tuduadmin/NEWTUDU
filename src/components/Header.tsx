import TuduLogo from './TuduLogo'
import GradientButton from './GradientButton'
type HeaderProps = {
  variant?: 'light' | 'dark'
}

export default function Header({ variant = 'dark' }: HeaderProps) {
  const isDark = variant === 'dark'

  return (
    <header
      className="sticky top-0 z-[var(--z-header)] px-2 pt-2"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div
        className={`flex items-center justify-between rounded-[14px] border px-4 py-3 backdrop-blur-md sm:px-6 ${
          isDark
            ? 'border-white/10 bg-midnight/90'
            : 'border-brown/10 bg-cream/95'
        }`}
      >
        <TuduLogo variant="iconWithText" />
        <div className="flex items-center gap-2 sm:gap-3">
          <GradientButton to="/signin" variant={isDark ? 'default' : 'default'} className="px-5 py-2 text-sm">
            Sign In
          </GradientButton>
        </div>
      </div>
    </header>
  )
}
