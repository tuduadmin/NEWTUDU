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
      className="sticky top-0 z-[var(--z-header)] px-2 pt-2"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div className="relative grid h-[52px] grid-cols-[1fr_auto_1fr] items-center gap-1.5 rounded-[14px] px-2.5 glass-surface sm:gap-2 sm:px-3">
        <div className="flex min-w-0 justify-start">
          <TuduLogo
            variant="iconWithText"
            size="sm"
            linkTo={logoLinkTo}
            className="min-w-0 gap-1.5 [&>span:last-child]:truncate [&>span:last-child]:text-base [&>span:last-child]:sm:text-lg"
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/my-tudu/settings/profile#primary-location')}
          className="flex h-9 max-w-[min(140px,100%)] items-center gap-1.5 truncate rounded-[14px] border border-white/[0.12] bg-midnight-surface/80 px-3 font-body text-xs font-medium text-white backdrop-blur-sm transition hover:border-white/20 active:scale-[0.98] sm:max-w-[160px] sm:px-3.5"
        >
          <MapPin size={14} className="shrink-0 text-sunset-orange" strokeWidth={2.5} />
          <span className="truncate">{cityLabel}</span>
        </button>

        <div className="flex justify-end">
          <Link
            to="/my-tudu/settings"
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-full glass-surface text-white/70 no-underline transition hover:text-white active:scale-95"
          >
            <Settings size={20} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  )
}
