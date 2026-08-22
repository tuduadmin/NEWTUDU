import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BuildingLibraryIcon,
  CakeIcon,
  EnvelopeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import HostProfileAvatar from '../components/host/HostProfileAvatar'
import MyTuduLibrarySection from '../components/my-tudu/MyTuduLibrarySection'
import MyTuduFeedSection from '../components/my-tudu/MyTuduFeedSection'
import MyTuduTabBar from '../components/my-tudu/MyTuduTabBar'
import MyTicketsSection from '../components/my-tudu/MyTicketsSection'
import { getCurrentUser } from '../lib/auth'
import { useCurrentAccount } from '../hooks/useCurrentAccount'
import { getBucketLists, resolveEventFromAnySource } from '../lib/bucketLists'
import {
  getPersonalHostProfile,
  resolvePersonalHostDisplayName,
} from '../lib/personalHostProfile'
import { getPreferences } from '../lib/preferences'
import {
  getQuickPickOverride,
  hasExplorerQuickPickAccess,
  QUICK_PICK_CHANGED_EVENT,
  toggleQuickPickOverride,
  type QuickPickOverride,
} from '../lib/quickPickOverride'
import { getSavedEventIdsForUser } from '../lib/savedEvents'
import { getTierBadgeForAccount } from '../lib/tierDisplay'
import type { UserAccount } from '../lib/account'
import {
  ensureUserTickets,
  getPastTickets,
  getUpcomingTickets,
  USER_TICKETS_CHANGED_EVENT,
} from '../lib/userTickets'
import { getUnreadNotificationCount } from '../lib/userNotifications'
import type { DiscoverEvent } from '../data/discoverEvents'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../lib/prefChoiceClasses'

type SavedItem = {
  event: DiscoverEvent
  sources: ('saved' | 'bucket-list')[]
}

function getAvatarRingClass(account: UserAccount | null): string {
  if (!account) return 'ring-brown/20'
  const badge = getTierBadgeForAccount(account.tier, account.verificationStatus)
  if (badge.label === 'Unverified') return 'ring-brown/35'
  if (badge.label === 'Verified' || badge.planId === 'verified') return 'ring-emerald-500'
  if (badge.planId === 'pioneer') return 'ring-orange'
  if (badge.planId === 'trusted') return 'ring-blue-500'
  return 'ring-brown/20'
}

export default function MyTuduPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isFeedTab = location.pathname.startsWith('/my-tudu/feed')

  const prefs = getPreferences()
  const { account } = useCurrentAccount()
  const currentUser = getCurrentUser()
  const displayName = currentUser
    ? resolvePersonalHostDisplayName(currentUser.email, prefs.screenName)
    : prefs.screenName
  const personalProfile = currentUser
    ? getPersonalHostProfile(currentUser.email, displayName)
    : null
  const headerAvatarUrl =
    prefs.avatarUrl?.trim() || personalProfile?.avatarUrl
  const tierBadge = account
    ? getTierBadgeForAccount(account.tier, account.verificationStatus)
    : null

  const unreadNotifications = currentUser
    ? getUnreadNotificationCount(currentUser.email)
    : 0

  const [searchQuery, setSearchQuery] = useState('')
  const [libraryRefresh, setLibraryRefresh] = useState(0)
  const [quickPickOverride, setQuickPickOverride] = useState<QuickPickOverride | null>(() =>
    getQuickPickOverride(),
  )
  const canUseQuickPick = hasExplorerQuickPickAccess(account)

  useEffect(() => {
    function syncQuickPick() {
      setQuickPickOverride(getQuickPickOverride())
    }
    window.addEventListener(QUICK_PICK_CHANGED_EVENT, syncQuickPick)
    window.addEventListener('storage', syncQuickPick)
    return () => {
      window.removeEventListener(QUICK_PICK_CHANGED_EVENT, syncQuickPick)
      window.removeEventListener('storage', syncQuickPick)
    }
  }, [])

  useEffect(() => {
    const refreshWallet = () => setLibraryRefresh((count) => count + 1)
    window.addEventListener(USER_TICKETS_CHANGED_EVENT, refreshWallet)
    return () => window.removeEventListener(USER_TICKETS_CHANGED_EVENT, refreshWallet)
  }, [])

  const upcomingTickets = useMemo(() => {
    if (!currentUser) return []
    ensureUserTickets(currentUser.email)
    return getUpcomingTickets(currentUser.email)
  }, [currentUser, libraryRefresh])

  const pastTickets = useMemo(() => {
    if (!currentUser) return []
    ensureUserTickets(currentUser.email)
    return getPastTickets(currentUser.email)
  }, [currentUser, libraryRefresh])

  const avatarRingClass = getAvatarRingClass(account)

  const savedItems = useMemo((): SavedItem[] => {
    if (!currentUser) return []
    const map = new Map<string, SavedItem>()

    for (const id of getSavedEventIdsForUser(currentUser.email)) {
      const event = resolveEventFromAnySource(id)
      if (!event) continue
      const existing = map.get(event.id)
      if (existing) {
        if (!existing.sources.includes('saved')) existing.sources.push('saved')
      } else {
        map.set(event.id, { event, sources: ['saved'] })
      }
    }

    for (const list of getBucketLists()) {
      for (const id of list.eventIds) {
        const event = resolveEventFromAnySource(id)
        if (!event) continue
        const existing = map.get(event.id)
        if (existing) {
          if (!existing.sources.includes('bucket-list')) existing.sources.push('bucket-list')
        } else {
          map.set(event.id, { event, sources: ['bucket-list'] })
        }
      }
    }

    return Array.from(map.values())
  }, [currentUser, libraryRefresh])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  function handleQuickPick(category: QuickPickOverride) {
    if (!canUseQuickPick) {
      navigate('/host/subscription')
      return
    }
    toggleQuickPickOverride(category)
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main className="px-4 pt-2">
        {/* Header — avatar, name, tier badge, messages */}
        <section className="flex items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <HostProfileAvatar
              name={displayName}
              avatarUrl={headerAvatarUrl}
              size="md"
              className={`h-12 w-12 shrink-0 text-base ring-2 ${avatarRingClass}`}
            />
            <div className="min-w-0">
              <h1 className="truncate font-display text-base font-bold capitalize text-brown">
                {displayName}
              </h1>
              {tierBadge && (
                <span
                  className={`mt-0.5 inline-flex items-center rounded-[14px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierBadge.pillClass}`}
                >
                  {tierBadge.label}
                </span>
              )}
            </div>
          </div>
          <Link
            to="/my-tudu/notifications"
            aria-label={
              unreadNotifications > 0
                ? `${unreadNotifications} unread messages`
                : 'Messages'
            }
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brown-muted no-underline transition hover:text-orange"
          >
            <EnvelopeIcon className="h-6 w-6" aria-hidden />
            {unreadNotifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-bold text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Link>
        </section>

        <MyTuduTabBar />

        {isFeedTab ? (
          currentUser ? (
            <MyTuduFeedSection viewerEmail={currentUser.email} />
          ) : (
            <section className="mt-4 rounded-[14px] border border-dashed border-app-subtle bg-cream/30 px-6 py-10 text-center">
              <p className="font-display text-sm font-bold text-brown">Sign in to see your feed</p>
              <GradientButton to="/signin" fullWidth className="mt-4 py-3">
                Sign in
              </GradientButton>
            </section>
          )
        ) : (
          <>
        {/* Quick pick + search */}
        <section className="mt-2 rounded-[14px] border border-app-subtle bg-app-elevated p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold text-brown">Quick pick</h2>
            {!canUseQuickPick && (
              <span className="inline-flex items-center gap-1 rounded-[14px] bg-[#7F77DD]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7F77DD]">
                <LockClosedIcon className="h-3 w-3" aria-hidden />
                Explorer
              </span>
            )}
          </div>
          {!canUseQuickPick && (
            <p className="mt-1 text-[11px] leading-snug text-brown-muted">
              Filter your Discover deck by category — upgrade to Explorer to unlock.
            </p>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                { id: 'food' as const, label: 'Food', Icon: CakeIcon },
                { id: 'entertainment' as const, label: 'Entertainment', Icon: SparklesIcon },
                { id: 'poi' as const, label: 'Points of interest', Icon: BuildingLibraryIcon },
              ] as const
            ).map((pick) => {
              const isActive = canUseQuickPick && quickPickOverride === pick.id
              const isLocked = !canUseQuickPick
              return (
                <button
                  key={pick.id}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={
                    isLocked
                      ? `${pick.label} — Explorer subscription required`
                      : isActive
                        ? `Clear ${pick.label} quick pick`
                        : `Quick pick ${pick.label} on Discover`
                  }
                  onClick={() => handleQuickPick(pick.id)}
                  className={
                    isLocked && !isActive
                      ? 'group relative flex flex-col items-center gap-1 rounded-[14px] border border-brown/10 bg-cream/30 px-2 py-2.5 text-center opacity-75 transition active:scale-[0.98] hover:border-[#7F77DD]/30'
                      : prefChoiceClasses(
                          isActive,
                          'group relative flex flex-col items-center gap-1 px-2 py-2.5 text-center',
                        )
                  }
                >
                  {isLocked && (
                    <LockClosedIcon
                      className="absolute right-1.5 top-1.5 h-3 w-3 text-[#7F77DD]"
                      aria-hidden
                    />
                  )}
                  <pick.Icon
                    className={`pref-choice-icon h-5 w-5 transition ${
                      isActive
                        ? ''
                        : isLocked
                          ? 'text-brown-muted/70 group-hover:text-[#7F77DD]'
                          : 'text-brown-muted'
                    }`}
                    aria-hidden
                  />
                  <span
                    className={`pref-choice-label text-[11px] leading-tight ${
                      isActive ? PREF_CHOICE_ACTIVE_TEXT : 'font-semibold text-brown'
                    }`}
                  >
                    {pick.label}
                  </span>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative mt-3">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brown-muted"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, places, keywords…"
              className="app-field w-full py-2.5 pl-9 pr-3"
            />
          </form>
        </section>

        {/* Interests and preferences */}
        <GradientButton
          to="/my-tudu/settings/profile"
          fullWidth
          className="mt-4 py-2.5 text-xs"
        >
          Interests and preferences
        </GradientButton>
        <Link
          to="/my-tudu/settings"
          className="mt-2 flex w-full items-center justify-center rounded-[14px] border border-app-subtle bg-app-elevated py-2.5 text-xs font-bold text-brown no-underline transition hover:border-orange/30"
        >
          Account settings
        </Link>

        {/* MY Tickets wallet */}
        <MyTicketsSection tickets={upcomingTickets} />

        {/* Saved & past */}
        <section className="mt-4 rounded-[14px] border border-app-subtle bg-app-elevated p-3 shadow-sm">
          <MyTuduLibrarySection
            savedItems={savedItems}
            pastTickets={pastTickets}
            userEmail={currentUser?.email ?? null}
            onRefresh={() => setLibraryRefresh((n) => n + 1)}
          />
        </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
