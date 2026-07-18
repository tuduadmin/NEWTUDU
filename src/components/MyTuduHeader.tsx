import { Link } from 'react-router-dom'
import TuduLogo from './TuduLogo'

type MyTuduHeaderProps = {
  location?: string
  onHelpClick?: () => void
  settingsTo?: string
}

export default function MyTuduHeader({
  location = 'Kindersley',
  onHelpClick,
  settingsTo = '/my-tudu/settings',
}: MyTuduHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-brown/5 bg-cream/95 px-4 py-3 backdrop-blur-sm">
      <TuduLogo size="sm" linkTo="/my-tudu" />

      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full border border-brown/10 bg-white px-3 py-1.5 text-xs font-medium text-brown shadow-sm"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
            stroke="#f97316"
            strokeWidth="2"
          />
          <circle cx="12" cy="10" r="2.5" fill="#f97316" />
        </svg>
        {location}
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onHelpClick}
          aria-label="Help"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-brown/10 bg-white text-sm font-semibold text-brown-muted shadow-sm transition hover:text-brown"
        >
          ?
        </button>
        <Link
          to={settingsTo}
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-brown/10 bg-white text-brown-muted shadow-sm no-underline transition hover:text-brown"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  )
}
