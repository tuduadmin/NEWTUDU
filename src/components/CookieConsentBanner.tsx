import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const CONSENT_KEY = 'tudu_cookie_consent'

export function hasCookieConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) !== null
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!hasCookieConsent())
  }, [])

  function saveConsent(value: 'accepted' | 'essential-only') {
    localStorage.setItem(CONSENT_KEY, value)
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-brown/10 bg-cream-dark/95 px-4 py-4 shadow-[0_-8px_32px_rgba(61,44,41,0.12)] backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p id="cookie-consent-title" className="mb-1 text-sm font-semibold text-brown">
            We use cookies
          </p>
          <p id="cookie-consent-description" className="text-sm leading-relaxed text-brown-muted">
            TUDU uses essential cookies to keep the Site working and optional cookies to understand usage
            and improve your experience. See our{' '}
            <Link to="/cookie-policy" className="font-semibold text-orange no-underline hover:underline">
              Cookie Policy
            </Link>{' '}
            for details.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveConsent('essential-only')}
            className="rounded-[14px] border border-brown/20 bg-cream px-4 py-2 text-sm font-semibold text-brown transition hover:border-brown/40"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => saveConsent('accepted')}
            className="rounded-[14px] bg-gradient-tudu px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
