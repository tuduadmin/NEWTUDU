import TuduLogo from './TuduLogo'
import GradientButton from './GradientButton'
import AdminEntryLink from './AdminEntryLink'

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
          {!isDark && (
            <AdminEntryLink
              className="text-[11px] font-medium text-brown-muted no-underline opacity-55 transition hover:text-brown hover:opacity-90"
              aria-label="Platform admin sign in"
            >
              Admin
            </AdminEntryLink>
          )}
          <GradientButton to="/signin" variant={isDark ? 'default' : 'default'} className="px-5 py-2 text-sm">
            Sign In
          </GradientButton>
        </div>
      </div>
    </header>
  )
}
