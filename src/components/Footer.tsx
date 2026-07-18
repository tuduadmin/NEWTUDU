import { Link } from 'react-router-dom'

type FooterProps = {
  variant?: 'light' | 'dark' | 'marketing'
}

export default function Footer({ variant = 'dark' }: FooterProps) {
  const isDark = variant === 'dark'
  const isMarketing = variant === 'marketing'

  return (
    <footer
      className={`px-4 py-10 text-center ${
        isDark
          ? 'border-t border-white/[0.08] bg-midnight text-white/48'
          : 'border-t border-brown/10 bg-cream text-brown-muted'
      }`}
    >
      {isMarketing ? (
        <p className="mb-4 text-sm">© 2024 Tudu.ca Made with ❤️ in Canada</p>
      ) : (
        <>
          <p className="mb-1 text-sm">© 2026 TUDU Entertainment Inc.</p>
          <p className="mb-5 text-xs opacity-80">Made with ❤️ in Canada</p>
        </>
      )}
      <nav
        className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm"
        aria-label="Footer"
      >
        <a
          href="#about"
          className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
        >
          About Us
        </a>
        <span className={isDark ? 'text-white/20' : 'text-brown/30'} aria-hidden>
          {isMarketing ? '|' : '·'}
        </span>
        <a
          href="#partners"
          className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
        >
          National Partners
        </a>
        <span className={isDark ? 'text-white/20' : 'text-brown/30'} aria-hidden>
          {isMarketing ? '|' : '·'}
        </span>
        {isMarketing ? (
          <a
            href="#privacy"
            className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
          >
            Privacy Policy
          </a>
        ) : (
          <>
            <Link
              to="/terms-of-service"
              className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
            >
              Terms of Service
            </Link>
            <span className={isDark ? 'text-white/20' : 'text-brown/30'} aria-hidden>
              ·
            </span>
            <a
              href="#privacy"
              className={`no-underline transition ${isDark ? 'text-white/48 hover:text-white' : 'text-brown-muted hover:text-brown'}`}
            >
              Privacy Policy
            </a>
            <span className={isDark ? 'text-white/20' : 'text-brown/30'} aria-hidden>
              ·
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
    </footer>
  )
}
