import { Link, useLocation } from 'react-router-dom'
import { Bookmark, Route, Ticket, User } from 'lucide-react'

type NavItem = {
  label: string
  to: string
  icon: (active: boolean) => React.ReactNode
  center?: boolean
  badge?: number
}

function TuduPinIcon({ active }: { active: boolean }) {
  return (
    <span
      className={`relative flex items-center justify-center rounded-full transition-transform duration-[var(--duration-normal)] ${
        active ? 'scale-110' : 'scale-100'
      }`}
      style={{ width: active ? 40 : 34, height: active ? 40 : 34 }}
    >
      <span
        className={`story-ring flex h-full w-full items-center justify-center ${active ? 'animate-pulse' : ''}`}
      >
        <span className="flex h-[calc(100%-4px)] w-[calc(100%-4px)] items-center justify-center overflow-hidden rounded-full bg-midnight-elevated ring-2 ring-midnight">
          <img
            src="/logo.png"
            alt=""
            className="h-full w-full object-contain"
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <span
            className="hidden h-full w-full items-center justify-center bg-gradient-tudu font-display text-xs font-bold text-white"
            aria-hidden
          >
            T
          </span>
        </span>
      </span>
    </span>
  )
}

const navItems: NavItem[] = [
  {
    label: 'Host Events',
    to: '/host',
    icon: (active) => (
      <Ticket
        size={22}
        strokeWidth={active ? 2.5 : 2}
        className={active ? 'text-sunset-orange' : 'text-white/50'}
      />
    ),
  },
  {
    label: 'Road Trip',
    to: '/road-trip',
    icon: (active) => (
      <Route
        size={22}
        strokeWidth={active ? 2.5 : 2}
        className={active ? 'text-sunset-orange' : 'text-white/50'}
      />
    ),
  },
  {
    label: 'Things Tudu',
    to: '/discover',
    center: true,
    icon: (active) => <TuduPinIcon active={active} />,
  },
  {
    label: 'Bucket List',
    to: '/bucket-list',
    icon: (active) => (
      <Bookmark
        size={22}
        strokeWidth={active ? 2.5 : 2}
        fill={active ? 'currentColor' : 'none'}
        className={active ? 'text-sunset-orange' : 'text-white/50'}
      />
    ),
  },
  {
    label: 'My Tudu',
    to: '/my-tudu',
    badge: 1,
    icon: (active) => (
      <User
        size={22}
        strokeWidth={active ? 2.5 : 2}
        className={active ? 'text-sunset-orange' : 'text-white/50'}
      />
    ),
  },
]

function isActiveRoute(pathname: string, to: string) {
  if (to === '/discover') return pathname === '/discover' || pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[var(--z-header)] border-t border-white/[0.08] bg-midnight-elevated/95 backdrop-blur-md"
      aria-label="Main navigation"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-end justify-between px-1 pt-1">
        {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.to)

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-1 no-underline transition-colors duration-[var(--duration-fast)] ${
                item.center ? '-mt-3' : ''
              }`}
            >
              {active && (
                <span
                  className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-gradient-to-r from-magenta via-sunset-pink to-sunset-orange"
                  aria-hidden
                />
              )}

              <span className={`relative flex items-center justify-center ${item.center ? 'h-10' : 'h-7'}`}>
                {item.icon(active)}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-magenta px-1 font-display text-[10px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                )}
              </span>

              <span
                className={`max-w-full truncate text-center font-display text-[10px] font-bold leading-tight tracking-wide ${
                  active ? 'text-sunset-orange' : 'text-white/48'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
