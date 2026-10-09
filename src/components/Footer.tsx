import { Link } from 'react-router-dom'

type FooterProps = {
  variant?: 'light' | 'dark' | 'marketing'
}

export default function Footer({ variant = 'dark' }: FooterProps) {
  const isDark = variant === 'dark'
  const isMarketing = variant === 'marketing'

  return (
    <footer
      className="px-2 pb-2"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className={`rounded-[14px] border px-4 py-10 text-center ${
          isDark
            ? 'border-white/10 bg-midnight text-white/48'
            : 'border-brown/10 bg-cream text-brown-muted'
        }`}
      >
        {isMarketing ? (
          <p className="mb-4 text-sm">© 2025 Tudu.ca Made with ❤️</p>
        ) : (
          <>
            <p className="mb-1 text-sm">© 2026 TUDU Entertainment Inc.</p>
            <p className="mb-5 text-xs opacity-80">Made with ❤️</p>
          </>
        )}
        <nav
          className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm"
          aria-label="Footer"
        >
          <Link
            to="/#about"
            className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
          >
            About Us
          </Link>
          <span className={isDark ? 'text-white/20' : 'text-brown/30'} aria-hidden>
            |
          </span>
          <Link
            to="/#partners"
            className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
          >
            National Partners
          </Link>
          <span className={isDark ? 'text-white/20' : 'text-brown/30'} aria-hidden>
            |
          </span>
          {isMarketing ? (
            <Link
              to="/privacy"
              className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
            >
              Privacy Policy
            </Link>
          ) : (
            <>
              <Link
                to="/terms-of-service"
                className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
              >
                Terms of Service
              </Link>
              <span className={isDark ? 'text-white/20' : 'text-brown/30'} aria-hidden>
                |
              </span>
              <Link
                to="/privacy"
                className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
              >
                Privacy Policy
              </Link>
              <span className={isDark ? 'text-white/20' : 'text-brown/30'} aria-hidden>
                |
              </span>
              <Link
                to="/cookie-policy"
                className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
              >
                Cookie Policy
              </Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  )
}
