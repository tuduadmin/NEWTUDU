import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import {
  NavBucketIcon,
  NavCarIcon,
  NavHostEventsIcon,
  NavMyTuduIcon,
  NavThingsTuduIcon,
} from './icons/NavIcons'
import { useFeatureFlags } from '../hooks/useFeatureFlags'

type NavItem = {
  label: string
  to: string
  icon: (active: boolean) => React.ReactNode
  badge?: number
}

function navIconClass(active: boolean) {
  return `h-9 w-9 shrink-0 transition-colors duration-[var(--duration-fast)] ${
    active ? 'text-orange' : 'text-brown-muted'
  }`
}

const allNavItems: NavItem[] = [
  {
    label: 'Host Events',
    to: '/host',
    icon: (active) => <NavHostEventsIcon className={navIconClass(active)} />,
  },
  {
    label: 'Road Trip',
    to: '/road-trip',
    icon: (active) => <NavCarIcon className={navIconClass(active)} />,
  },
  {
    label: 'Things Tudu',
    to: '/discover',
    icon: (active) => <NavThingsTuduIcon active={active} />,
  },
  {
    label: 'Bucket List',
    to: '/bucket-list',
    icon: (active) => <NavBucketIcon className={navIconClass(active)} />,
  },
  {
    label: 'My Tudu',
    to: '/my-tudu',
    icon: (active) => <NavMyTuduIcon className={navIconClass(active)} />,
  },
]

function isActiveRoute(pathname: string, to: string) {
  if (to === '/discover') return pathname === '/discover' || pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function navIconShellClass() {
  const media =
    '[&_img]:max-h-full [&_img]:max-w-full [&_img]:object-contain [&_svg]:h-full [&_svg]:w-full [&_svg]:max-h-full [&_svg]:max-w-full'

  return `relative flex h-9 w-9 shrink-0 items-center justify-center ${media}`
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const flags = useFeatureFlags()

  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      if (item.to === '/road-trip') return flags.roadTripEnabled
      if (item.to === '/bucket-list') return flags.bucketListEnabled
      if (item.to === '/discover') return flags.discoverEnabled
      return true
    })
  }, [flags.bucketListEnabled, flags.discoverEnabled, flags.roadTripEnabled])

  return (
    <nav
      className="app-column-fixed fixed bottom-0 z-[var(--z-header)] px-2"
      aria-label="Main navigation"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="sol-bottom-nav overflow-hidden rounded-[14px] border border-white/10 glass-surface">
        <div className="flex h-[var(--app-bottom-nav-h)] items-center px-0.5">
          {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.to)

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-[var(--app-bottom-nav-h)] min-w-0 flex-1 flex-col items-center justify-start gap-0.5 px-0.5 pt-1.5 no-underline transition-colors duration-[var(--duration-fast)]"
            >
              {active && (
                <span
                  className="absolute top-0 h-0.5 w-7 rounded-full bg-gradient-to-r from-magenta via-sunset-pink to-sunset-orange"
                  aria-hidden
                />
              )}

              <span className={navIconShellClass()}>
                {item.icon(active)}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-magenta px-1 font-display text-[10px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                )}
              </span>

              <span
                className={`block h-2.5 w-full max-w-full truncate text-center font-display text-[9px] font-semibold leading-none tracking-wide ${
                  active ? 'text-orange' : 'text-brown-muted'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
        </div>
      </div>
    </nav>
  )
}
