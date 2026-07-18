import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Settings } from 'lucide-react'
import TuduLogo from '../TuduLogo'
import {
  LOCATION_CHANGE_EVENT,
  formatCityLabel,
  getCurrentCity,
  requestGpsCity,
} from '../../lib/location'

type AppHeaderBarProps = {
  logoLinkTo?: string
}

export default function AppHeaderBar({ logoLinkTo = '/discover' }: AppHeaderBarProps) {
  const navigate = useNavigate()
  const [cityLabel, setCityLabel] = useState(() => formatCityLabel(getCurrentCity()))

  useEffect(() => {
    function refreshCity() {
      setCityLabel(formatCityLabel(getCurrentCity()))
    }

    refreshCity()
    window.addEventListener(LOCATION_CHANGE_EVENT, refreshCity)
    return () => window.removeEventListener(LOCATION_CHANGE_EVENT, refreshCity)
  }, [])

  useEffect(() => {
    requestGpsCity().catch(() => {
      /* GPS optional — home city remains default */
    })
  }, [])

  return (
    <header
      className="sticky top-0 z-[var(--z-header)] grid h-[52px] grid-cols-[44px_1fr_44px] items-center gap-2 px-4 glass-surface"
      style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
    >
      <div className="flex justify-start">
        <TuduLogo variant="iconOnly" size="sm" linkTo={logoLinkTo} />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => navigate('/my-tudu/settings#primary-location')}
          className="flex h-9 max-w-[180px] items-center gap-1.5 truncate rounded-full border border-white/[0.12] bg-midnight-surface/80 px-3.5 font-body text-xs font-medium text-white backdrop-blur-sm transition hover:border-white/20 active:scale-[0.98]"
        >
          <MapPin size={14} className="shrink-0 text-sunset-orange" strokeWidth={2.5} />
          <span className="truncate">{cityLabel}</span>
        </button>
      </div>

      <div className="flex justify-end">
        <Link
          to="/my-tudu/settings"
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full glass-surface text-white/70 no-underline transition hover:text-white active:scale-95"
        >
          <Settings size={20} strokeWidth={2} />
        </Link>
      </div>
    </header>
  )
}
