import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  Calendar,
  Eye,
  Heart,
  MapPin,
  Pencil,
  Plus,
  ScanLine,
  ShoppingBag,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import ReportProblemSheet from '../../components/ReportProblemSheet'
import HostContextToggle from '../../components/host/HostContextToggle'
import HostProfileAvatar from '../../components/host/HostProfileAvatar'
import HostProfileSocialLinks from '../../components/host/HostProfileSocialLinks'
import PublicProfileMerchBar from '../../components/host/PublicProfileMerchBar'
import HostAnalyticsPanel from '../../components/host/HostAnalyticsPanel'
import HostProfileTierBadge from '../../components/host/HostProfileTierBadge'
import HostAddSlotsLink from '../../components/host/HostAddSlotsLink'
import { formatPrivateEventSlotLabel, formatPublicEventSlotLabel } from '../../lib/eventSlots'
import {
  approveSeedEvent,
  canCreatePrivateEvent,
  canCreatePublicEvent,
  getConsumerAccountStatus,
  getHostEventById,
  getHostEventsForUser,
  getOrganization,
  getOrganizationApprovalStatus,
  getOrgDepartments,
  isSeedEventInDiscoverDeck,
  processScheduledPublishNotifications,
  rejectSeedEvent,
  resolveOrgPlanForOrganization,
} from '../../lib/account'
import { isRemovedDemoHostEvent } from '../../lib/removedDemoEvents'
import ShareEventModal from '../../components/ShareEventModal'
import { ShareIcon } from '../../components/NavActionButtons'
import Toast from '../../components/Toast'
import HostEventManagerCard from '../../components/host/HostEventManagerCard'
import GuestListModal from '../../components/host/GuestListModal'
import BoostEventModal from '../../components/host/BoostEventModal'
import type { HostEvent } from '../../lib/account'
import { getDistantSavesForHostEvents } from '../../lib/distantSaves'
import { formatCityLabel } from '../../lib/location'
import { useHostContext } from '../../hooks/useHostContext'
import { useCurrentAccount } from '../../hooks/useCurrentAccount'
import { useHostProfileStore } from '../../hooks/useHostProfileStore'
import { getOrgHostProfile } from '../../lib/orgHostProfile'
import { getPersonalHostProfile, resolvePersonalHostDisplayName } from '../../lib/personalHostProfile'
import { getOrgVerificationRequestForOrg, formatVerificationAttemptLabel } from '../../lib/orgVerificationRequests'
import {
  getOrgPublicProfileUrl,
  getPersonalPublicProfileUrl,
} from '../../lib/publicHostProfile'
import { getOrgApprovalBadge, getTierBadgeForAccount } from '../../lib/tierDisplay'
import {
  getHostMerchSettingsFromAccount,
  getHostMerchSettingsFromOrg,
  isHostMerchVisible,
  isHostMerchVisibleForOrg,
} from '../../lib/hostMerch'
import {
  DEFAULT_HIDDEN_GEM_IMAGE,
  deleteOrgHiddenGem,
  formatHiddenGemTimestamp,
  getHiddenGemDeckStatus,
  getHiddenGemDeckStatusBadgeClass,
  getHiddenGemMetrics,
  getHiddenGemUpdatedAt,
  listHiddenGemsForOrg,
  setOrgHiddenGemPublished,
  type HiddenGemListItem,
  type OrgHiddenGem,
} from '../../lib/hiddenGems'
import { canCreateHiddenGem, formatEventManagerHiddenGemSlots } from '../../lib/hiddenGemSlots'
import HostAddHiddenGemSlotsLink from '../../components/host/HostAddHiddenGemSlotsLink'
import HiddenGemPreviewOverlay from '../../components/HiddenGemPreviewOverlay'
import {
  clearCreateEventDraft,
  clearCreateEventSession,
  hasResumableCreateEventDraft,
} from '../../lib/createEventDraft'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../../lib/prefChoiceClasses'
type EventTab = 'upcoming' | 'drafts' | 'past'

const HOST_CARD = 'app-surface-card p-4'
const HOST_PANEL = 'rounded-[14px] border border-app-subtle bg-app-elevated'
const HOST_OUTLINE_BTN =
  'inline-flex items-center justify-center rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2 text-xs font-semibold text-brown transition hover:border-orange/30 hover:bg-orange/5'
const HOST_SECONDARY_LINK =
  'inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-app-subtle bg-app-elevated py-3 font-display font-bold text-brown no-underline transition hover:border-orange/30 hover:bg-orange/5'
const HOST_MANAGER_ACTION_BTN =
  'flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 px-1.5 py-3 text-center no-underline'
const HOST_MANAGER_PROFILE_BTN =
  'flex items-center justify-center gap-2 py-2.5 text-sm no-underline'

function hostManagerActionLinkClass(isActive: boolean, variant: 'action' | 'profile' = 'action') {
  const layout = variant === 'profile' ? HOST_MANAGER_PROFILE_BTN : HOST_MANAGER_ACTION_BTN
  return prefChoiceClasses(isActive, layout)
}

function HostManagerActionLabel({ isActive, children }: { isActive: boolean; children: ReactNode }) {
  return (
    <span className={`pref-choice-label text-[11px] leading-tight sm:text-xs ${isActive ? PREF_CHOICE_ACTIVE_TEXT : 'font-semibold text-brown-muted'}`}>
      {children}
    </span>
  )
}

export default function EventManagerPage() {
  const [activeTab, setActiveTab] = useState<EventTab>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [refresh, setRefresh] = useState(0)
  const [shareEvent, setShareEvent] = useState<string | null>(null)
  const [shareDefaultTab, setShareDefaultTab] = useState<'public' | 'private' | undefined>()
  const [sharePublishedJustNow, setSharePublishedJustNow] = useState(false)
  const [guestListEvent, setGuestListEvent] = useState<HostEvent | null>(null)
  const [boostEvent, setBoostEvent] = useState<HostEvent | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [previewGem, setPreviewGem] = useState<HiddenGemListItem | null>(null)
  const [gemActionError, setGemActionError] = useState('')
  const [showDraftBanner, setShowDraftBanner] = useState(() => hasResumableCreateEventDraft())
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false)

  useEffect(() => {
    processScheduledPublishNotifications()
  }, [])

  const { isPersonal, activeOrg, hostAccounts, personalName, setHostContext, user, canUsePersonalMode } =
    useHostContext()
  const profileRevision = useHostProfileStore()
  const { account, sessionEmail } = useCurrentAccount()
  const planStatus = account ? getConsumerAccountStatus(account) : null
  const publicCheck = account
    ? canCreatePublicEvent(account, isPersonal ? null : activeOrg?.id)
    : null
  const isPhoneVerified = account?.verificationStatus === 'phone_verified'
  const privateCheck = useMemo(() => {
    if (!account || !isPersonal) return null
    const check = canCreatePrivateEvent(account, null)
    if (check.limit === 0) return null
    return check
  }, [account, isPersonal])

  const { displayName, avatarUrl, profileSocial } = useMemo(() => {
    void profileRevision
    const personalProfile = user ? getPersonalHostProfile(user.email, personalName) : null
    const orgProfile = activeOrg ? getOrgHostProfile(activeOrg.id) : null
    const org = activeOrg ? getOrganization(activeOrg.id) : null
    return {
      displayName: isPersonal
        ? (user ? resolvePersonalHostDisplayName(user.email, personalName) : personalName)
        : (org?.name ?? activeOrg?.name ?? 'Your Organization'),
      avatarUrl: isPersonal ? personalProfile?.avatarUrl : orgProfile?.logoUrl,
      profileSocial: isPersonal ? (personalProfile?.social ?? {}) : (orgProfile?.social ?? {}),
    }
  }, [user, personalName, isPersonal, activeOrg, profileRevision])
  const personalPlanBadge = useMemo(
    () => (account ? getTierBadgeForAccount(account.tier, account.verificationStatus) : null),
    [account?.tier, account?.verificationStatus],
  )
  const orgApprovalBadge = useMemo(() => {
    if (isPersonal || !activeOrg) return null
    return getOrgApprovalBadge(getOrganizationApprovalStatus(activeOrg))
  }, [isPersonal, activeOrg])

  const { showMerchShop, merchShopUrl } = useMemo(() => {
    void profileRevision
    if (isPersonal) {
      const settings = getHostMerchSettingsFromAccount(account)
      return {
        showMerchShop: isHostMerchVisible(settings),
        merchShopUrl: settings.merchShopUrl,
      }
    }
    if (activeOrg) {
      const org = getOrganization(activeOrg.id)
      const settings = getHostMerchSettingsFromOrg(org)
      const orgPlanId = org ? resolveOrgPlanForOrganization(org) : 'unverified'
      return {
        showMerchShop: isHostMerchVisibleForOrg(settings, orgPlanId),
        merchShopUrl: settings.merchShopUrl,
      }
    }
    return { showMerchShop: false, merchShopUrl: undefined }
  }, [isPersonal, activeOrg, account, profileRevision])
  const orgDepartments = !isPersonal && activeOrg ? getOrgDepartments(activeOrg.id) : []
  const orgVerificationRequest =
    !isPersonal && activeOrg ? getOrgVerificationRequestForOrg(activeOrg.id) : undefined
  const orgApprovalStatus =
    !isPersonal && activeOrg ? getOrganizationApprovalStatus(activeOrg) : null

  const allHostEvents = user
    ? getHostEventsForUser(user.email).filter((e) => !isRemovedDemoHostEvent(e))
    : []
  const contextEvents = useMemo(() => {
    void refresh
    if (isPersonal) {
      return allHostEvents.filter((e) => !e.hostAccountId)
    }
    if (!activeOrg) return []
    return allHostEvents.filter((e) => e.hostAccountId === activeOrg.id)
  }, [allHostEvents, isPersonal, activeOrg, refresh])

  const tabCounts = useMemo(() => {
    const counts = { upcoming: 0, drafts: 0, past: 0 }
    contextEvents.forEach((event) => {
      if (event.status === 'draft') counts.drafts += 1
      else if (event.status === 'past') counts.past += 1
      else counts.upcoming += 1
    })
    return counts
  }, [contextEvents])

  const orgHiddenGems = useMemo(() => {
    void refresh
    if (isPersonal || !activeOrg) return []
    return listHiddenGemsForOrg(activeOrg.id)
  }, [isPersonal, activeOrg, refresh])

  const hiddenGemSlotCheck =
    !isPersonal && activeOrg ? canCreateHiddenGem(activeOrg.id) : null

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return contextEvents.filter((event) => {
      if (isRemovedDemoHostEvent(event)) return false
      const matchesTab =
        activeTab === 'drafts'
          ? event.status === 'draft'
          : activeTab === 'past'
            ? event.status === 'past'
            : event.status !== 'draft' && event.status !== 'past'
      if (!matchesTab) return false
      if (departmentFilter === 'general') {
        if (event.departmentId) return false
      } else if (departmentFilter !== 'all') {
        if (event.departmentId !== departmentFilter) return false
      }
      if (!q) return true
      return event.title.toLowerCase().includes(q)
    })
  }, [contextEvents, activeTab, searchQuery, departmentFilter])

  const distantSaves = getDistantSavesForHostEvents(contextEvents.map((e) => e.id))

  function reloadEvents() {
    setRefresh((r) => r + 1)
  }

  function handlePublishGem(gem: HiddenGemListItem) {
    if (gem.source !== 'org-hidden-gem') return
    setGemActionError('')
    const result = setOrgHiddenGemPublished(gem.id, true)
    if (!result.ok) {
      setGemActionError(result.error ?? 'Could not publish Hidden Gem.')
      return
    }
    reloadEvents()
    if (previewGem?.id === gem.id && result.gem) {
      setPreviewGem({ ...result.gem, source: 'org-hidden-gem' })
    }
  }

  function handleDeleteGem(gem: OrgHiddenGem) {
    const result = deleteOrgHiddenGem(gem.id)
    if (!result.ok) {
      setGemActionError(result.error ?? 'Could not delete Hidden Gem.')
      return
    }
    setPreviewGem(null)
    reloadEvents()
  }

  function handleApproveSeed(eventId: string) {
    const result = approveSeedEvent(eventId)
    reloadEvents()
    if (result.ok && result.event && isSeedEventInDiscoverDeck(result.event)) {
      setSharePublishedJustNow(true)
      setShareEvent(eventId)
    }
  }

  function openShare(eventId: string, defaultTab?: 'public' | 'private') {
    setSharePublishedJustNow(false)
    setShareDefaultTab(defaultTab)
    setShareEvent(eventId)
  }

  const showSessionBanner =
    import.meta.env.DEV || sessionEmail?.toLowerCase() === 'demo@tudu.ca'

  const sessionBanner =
    showSessionBanner && sessionEmail && account ? (
      <div className="app-surface-card mt-3 px-3 py-2.5 text-xs text-brown">
        <p>
          Signed in as <span className="font-semibold">{sessionEmail}</span>
          {' · '}
          Your plan: <span className="font-semibold">{planStatus?.label}</span>
        </p>
        {!isPersonal && orgApprovalBadge && (
          <p className="mt-1 text-brown-muted">
            &ldquo;Host account&rdquo; below is org approval — not your personal subscription.
          </p>
        )}
        {sessionEmail.toLowerCase() !== 'demo@tudu.ca' && (
          <p className="mt-1 text-brown-muted">
            Upgraded demo@tudu.ca in Control Room?{' '}
            <Link to="/signin" className="font-semibold text-orange no-underline">
              Sign in as demo@tudu.ca
            </Link>{' '}
            (password: password123) or use Manage → &ldquo;Sign in as user&rdquo; in Control Room.
          </p>
        )}
      </div>
    ) : null

  return (
    <div className="host-event-manager app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Event Manager</h1>

        {sessionBanner}

        <div className="mt-4">
          <HostContextToggle
            isPersonal={isPersonal}
            activeOrg={activeOrg}
            hostAccounts={hostAccounts}
            onChange={setHostContext}
            showPersonalOption={canUsePersonalMode}
          />
        </div>

        {/* Profile card */}
        <section className={`relative mt-3 ${HOST_CARD}`}>
          {((user && isPersonal) || (!isPersonal && activeOrg)) && (
            <Link
              to={
                isPersonal && user
                  ? getPersonalPublicProfileUrl(user.email, 'host')
                  : getOrgPublicProfileUrl(activeOrg!.id, 'host')
              }
              className="absolute right-4 top-4 text-xs font-semibold text-brown-muted no-underline transition hover:text-orange"
            >
              View Profile
            </Link>
          )}
          <div className="flex flex-col items-center text-center">
            <HostProfileAvatar name={displayName} avatarUrl={avatarUrl} size="md" />
            <h2 className="mt-3 font-display text-2xl font-bold text-brown">{displayName}</h2>
            {orgApprovalBadge && (
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brown-muted">
                  Host account
                </p>
                <HostProfileTierBadge
                  badge={orgApprovalBadge}
                  account={account}
                  returnTo="/host"
                  showPhoneVerifyLink={false}
                />
              </div>
            )}
            {personalPlanBadge && (
              <div className={orgApprovalBadge ? 'mt-3' : 'mt-3'}>
                {!isPersonal && (
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brown-muted">
                    Your plan
                  </p>
                )}
                <HostProfileTierBadge
                  badge={personalPlanBadge}
                  account={account}
                  returnTo="/host"
                  showPhoneVerifyLink={isPersonal}
                />
              </div>
            )}
            {!isPersonal && orgApprovalStatus === 'pending' && orgVerificationRequest && (
              <p className="app-notice-pending mt-2 px-3 py-1.5 text-[11px]">
                {formatVerificationAttemptLabel(orgVerificationRequest.requestNumber)} - pending Control Room
                review
              </p>
            )}
            <HostProfileSocialLinks social={profileSocial} reserveSpace />
            {showMerchShop && (
              <PublicProfileMerchBar
                shopUrl={merchShopUrl}
                prominent
                hostKind={isPersonal ? 'personal' : 'org'}
                hostId={isPersonal ? (user?.email ?? '') : (activeOrg?.id ?? '')}
                showMerchShop={showMerchShop}
              />
            )}
            {account && privateCheck && (
              <p className="mt-4 text-xs text-brown-muted">
                {formatPrivateEventSlotLabel(privateCheck.used, privateCheck.limit)}
                {privateCheck.remaining > 0 && ` | ${privateCheck.remaining} remaining`}
              </p>
            )}
            {account && publicCheck && (isPhoneVerified || !isPersonal) && (
              <p className="mt-4 text-xs text-brown-muted">
                {formatPublicEventSlotLabel(
                  account.publicEventCount,
                  publicCheck.baseLimit,
                  publicCheck.extraSlots,
                )}
                {publicCheck.remaining > 0 && ` | ${publicCheck.remaining} remaining`}
                {isPhoneVerified && (
                  <>
                    {' | '}
                    <HostAddSlotsLink remaining={publicCheck.remaining} />
                  </>
                )}
              </p>
            )}
          </div>

          <GradientButton fullWidth className="mt-4 px-4 py-2 text-sm" to="/host/create-event?new=1">
            <Plus size={16} className="mr-1" />
            {isPersonal ? 'Create personal event' : 'Create Event'}
          </GradientButton>

          {showDraftBanner && (
            <div className="mt-3 rounded-[14px] border border-orange/25 bg-orange/10 px-4 py-3">
              <p className="text-sm font-semibold text-brown">You have an unfinished event</p>
              <p className="mt-0.5 text-xs text-brown-muted">Pick up where you left off or start fresh.</p>
              <div className="mt-2 flex gap-2">
                <GradientButton
                  to="/host/create-event?resume=1"
                  className="min-w-0 flex-1 px-3 py-2 text-xs"
                >
                  Continue draft
                </GradientButton>
                <button
                  type="button"
                  onClick={() => {
                    clearCreateEventDraft()
                    clearCreateEventSession()
                    setShowDraftBanner(false)
                  }}
                  className={`flex-1 ${HOST_OUTLINE_BTN}`}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {!isPersonal && activeOrg && (
            <>
              <Link
                to="/host/team"
                className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-brown-muted no-underline transition hover:text-orange"
              >
                <Users size={14} />
                Team &amp; Admins
              </Link>
              <Link
                to="/host/departments"
                className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-brown-muted no-underline transition hover:text-orange"
              >
                <Building2 size={14} />
                Departments
              </Link>
            </>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <NavLink to="/host/scan" className={({ isActive }) => hostManagerActionLinkClass(isActive, 'action')}>
              {({ isActive }) => (
                <>
                  <ScanLine
                    size={18}
                    className={isActive ? 'theme-accent-icon shrink-0' : 'shrink-0 text-brown-muted'}
                    aria-hidden
                  />
                  <HostManagerActionLabel isActive={isActive}>Scan Tickets</HostManagerActionLabel>
                </>
              )}
            </NavLink>
            <NavLink
              to="/host/scan?mode=merch"
              className={({ isActive }) => hostManagerActionLinkClass(isActive, 'action')}
            >
              {({ isActive }) => (
                <>
                  <ShoppingBag
                    size={18}
                    className={isActive ? 'theme-accent-icon shrink-0' : 'shrink-0 text-brown-muted'}
                    aria-hidden
                  />
                  <HostManagerActionLabel isActive={isActive}>Merch Pickup</HostManagerActionLabel>
                </>
              )}
            </NavLink>
            <NavLink
              to="/host/profile"
              className={({ isActive }) => `${hostManagerActionLinkClass(isActive, 'profile')} col-span-2`}
            >
              {({ isActive }) => (
                <>
                  <Pencil
                    size={16}
                    className={isActive ? 'theme-accent-icon shrink-0' : 'shrink-0 text-brown-muted'}
                    aria-hidden
                  />
                  <HostManagerActionLabel isActive={isActive}>
                    {isPersonal ? 'Edit Profile' : 'Edit Public Profile'}
                  </HostManagerActionLabel>
                </>
              )}
            </NavLink>
          </div>
        </section>

        {/* Events tabs — primary host workflow */}
        <section className="mt-6">
          <div className="flex border-b border-app-subtle">
            {(['upcoming', 'drafts', 'past'] as EventTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 px-1 pb-2 pt-1 text-center text-sm font-semibold capitalize transition ${
                  activeTab === tab ? 'theme-accent-text' : 'text-brown-muted'
                }`}
              >
                {tab} ({tabCounts[tab]})
                {activeTab === tab && (
                  <span
                    className="theme-accent-underline absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    aria-hidden
                  />
                )}
              </button>
            ))}
          </div>

          <div className="relative mt-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab} events...`}
              className="app-field py-3 pl-10 pr-4"
            />
            <Ticket size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-muted" />
          </div>

          {!isPersonal && orgDepartments.length > 0 && (
            <div className="mt-3">
              <label htmlFor="dept-filter" className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
                Filter by department
              </label>
              <select
                id="dept-filter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="app-field mt-1 px-3 py-2 font-semibold"
              >
                <option value="all">All departments</option>
                <option value="general">General (org-wide)</option>
                {orgDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filteredEvents.length === 0 ? (
            <div className={`mt-6 ${HOST_PANEL} p-8 text-center`}>
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark">
                <Calendar size={28} className="text-brown-muted" />
              </div>
              <p className="font-display text-sm font-bold text-brown">No {activeTab} events found.</p>
              <p className="mt-1 text-xs text-brown-muted">
                {isPersonal
                  ? 'Create a personal event - no organization required.'
                  : `You don't have any ${activeTab} events for ${displayName} yet.`}
              </p>
              <GradientButton fullWidth className="mt-4 px-4 py-2 text-sm" to="/host/create-event?new=1">
                <Plus size={16} className="mr-1" />
                {isPersonal ? 'Create personal event' : 'Create Event'}
              </GradientButton>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {filteredEvents.map((event) =>
                user ? (
                  <HostEventManagerCard
                    key={event.id}
                    event={event}
                    userEmail={user.email}
                    showMarketplace={showMerchShop}
                    onReload={reloadEvents}
                    onToast={setToast}
                    onShare={openShare}
                    onGuestList={setGuestListEvent}
                    onBoost={setBoostEvent}
                    onApproveSeed={handleApproveSeed}
                    onRejectSeed={(eventId) => {
                      rejectSeedEvent(eventId)
                      reloadEvents()
                    }}
                  />
                ) : null,
              )}
            </ul>
          )}
        </section>

        {account && (
          <HostAnalyticsPanel
            account={account}
            hostAccountId={isPersonal ? null : activeOrg?.id}
            events={contextEvents}
          />
        )}

        {/* Distant savers */}
        {(!isPersonal || distantSaves.length > 0) && (
          <section className={`mt-6 ${HOST_CARD}`}>
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-orange" />
              <h2 className="font-display text-base font-bold text-brown">Saves from outside your area</h2>
            </div>
            <p className="text-xs leading-relaxed text-brown-muted">
              People whose home city differs from your event city have saved to their bucket list - reach out with a promo code or discount.
            </p>
            {distantSaves.length === 0 ? (
              <p className="mt-3 text-xs text-brown-muted/80">No distant saves yet. Share events on Discover to attract travelers.</p>
            ) : (
              <ul className="mt-3 divide-y divide-app-subtle">
                {distantSaves.slice(0, 8).map((save) => (
                  <li key={save.id} className="flex items-center justify-between py-2 text-xs">
                    <span className="font-medium text-brown">
                      {formatCityLabel(save.saverCity)} to {formatCityLabel(save.eventCity)}
                    </span>
                    <span className="text-brown-muted">{new Date(save.savedAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Permanent Locations - org only */}
        {!isPersonal && activeOrg && (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-brown">Permanent Locations</h2>
              {hiddenGemSlotCheck && (
                <span className="text-xs font-semibold text-brown-muted">
                  {formatEventManagerHiddenGemSlots(hiddenGemSlotCheck)}
                </span>
              )}
            </div>

            {orgHiddenGems.length === 0 ? (
              <div className={`${HOST_PANEL} p-4 text-center`}>
                <p className="text-sm text-brown-muted">No Permanent Locations</p>
                <GradientButton fullWidth className="mt-3 px-4 py-3 text-sm" to="/host/hidden-gem">
                  <Plus size={16} className="mr-1" />
                  Add Hidden Gem
                </GradientButton>
                {hiddenGemSlotCheck && hiddenGemSlotCheck.limit === 0 && (
                  <p className="mt-3 text-xs text-brown-muted">
                    <HostAddHiddenGemSlotsLink
                      remaining={hiddenGemSlotCheck.remaining}
                      prominent
                      label="Buy another Hidden Gem ->"
                    />
                  </p>
                )}
              </div>
            ) : (
              <>
                {gemActionError && (
                  <p className="mb-2 text-xs text-error">{gemActionError}</p>
                )}
                <ul className="space-y-2">
                  {orgHiddenGems.map((gem) => {
                    const isManaged = gem.source === 'org-hidden-gem'
                    const metrics = getHiddenGemMetrics(gem)
                    const deckStatus = isManaged ? getHiddenGemDeckStatus(gem) : null
                    const lastUpdated = formatHiddenGemTimestamp(getHiddenGemUpdatedAt(gem))
                    return (
                      <li
                        key={`${gem.source}-${gem.id}`}
                        className={`overflow-hidden ${HOST_PANEL}`}
                      >
                        <div className="flex gap-0">
                          <div className="aspect-square w-24 shrink-0 overflow-hidden bg-cream-dark sm:w-28">
                            <img
                              src={gem.images[0] ?? DEFAULT_HIDDEN_GEM_IMAGE}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-between px-3 py-2.5">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-display text-sm font-bold text-brown">{gem.title}</p>
                                {isManaged && deckStatus && (
                                  <span
                                    className={`shrink-0 rounded-[14px] px-2 py-0.5 text-[10px] font-bold ${getHiddenGemDeckStatusBadgeClass(deckStatus.tone)}`}
                                  >
                                    {deckStatus.label}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[10px] text-brown-muted/80">
                                Last updated {lastUpdated}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-brown-muted">
                                <span className="inline-flex items-center gap-1">
                                  <Heart size={12} className="text-rose-500" aria-hidden />
                                  {metrics.saves}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Eye size={12} className="text-brown-muted" aria-hidden />
                                  {metrics.views}
                                </span>
                                <span className="inline-flex items-center gap-1" title="Detail opens">
                                  <Sparkles size={12} className="text-brown-muted" aria-hidden />
                                  {metrics.opens}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <ShareIcon className="h-3 w-3 text-brown-muted" aria-hidden />
                                  {metrics.shares}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setPreviewGem(gem)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brown-muted transition hover:text-orange"
                              >
                                <Eye size={12} />
                                View
                              </button>
                              {isManaged && (
                                <>
                                  <Link
                                    to={`/host/hidden-gem/insights/${encodeURIComponent(gem.id)}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-brown-muted no-underline transition hover:text-orange"
                                  >
                                    <BarChart3 size={12} />
                                    Insights
                                  </Link>
                                  <Link
                                    to={`/host/hidden-gem?edit=${encodeURIComponent(gem.id)}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange no-underline"
                                  >
                                    <Pencil size={12} />
                                    Update
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handlePublishGem(gem)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple transition hover:text-purple/80"
                                  >
                                    <Sparkles size={12} />
                                    {deckStatus && deckStatus.tone !== 'saved'
                                      ? 'Publish update'
                                      : 'Publish'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {hiddenGemSlotCheck && hiddenGemSlotCheck.remaining > 0 ? (
                  <Link
                    to="/host/hidden-gem"
                    className={`mt-3 inline-flex w-full py-3 font-display font-bold ${HOST_SECONDARY_LINK}`}
                  >
                    <Plus size={16} className="text-orange" />
                    Add another Hidden Gem
                  </Link>
                ) : (
                  hiddenGemSlotCheck && (
                    <p className="mt-3 text-center text-xs text-brown-muted">
                      All Discover slots in use.{' '}
                      <HostAddHiddenGemSlotsLink
                        remaining={hiddenGemSlotCheck.remaining}
                        prominent
                        label="Buy another Hidden Gem ->"
                      />
                    </p>
                  )
                )}
              </>
            )}
          </section>
        )}

        {/* Beta Feedback */}
        <section className={`mt-6 ${HOST_CARD}`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-purple/10">
              <Sparkles size={18} className="text-purple" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Beta Feedback</p>
              <p className="mt-1.5 text-xs leading-relaxed text-brown-muted">
                Tudu&apos;s still growing, and you&apos;re helping shape it. Tell us what&apos;s working,
                what&apos;s broken, and what you wish it did. We&apos;re all ears — real people are on the other
                end, and we read every word. Promise.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFeedbackSheet(true)}
            className="mt-4 flex w-full items-center justify-center rounded-[14px] border border-orange/35 bg-app-elevated py-2.5 text-sm font-semibold text-orange transition hover:border-orange/50 hover:bg-orange/5 active:scale-[0.98]"
          >
            Send feedback
          </button>
        </section>
      </main>

      <BottomNav />

      <ShareEventModal
        open={!!shareEvent}
        event={shareEvent ? (getHostEventById(shareEvent) ?? null) : null}
        publishedJustNow={sharePublishedJustNow}
        defaultTab={shareDefaultTab}
        onClose={() => {
          setShareEvent(null)
          setSharePublishedJustNow(false)
          setShareDefaultTab(undefined)
        }}
      />

      <GuestListModal
        open={!!guestListEvent}
        event={guestListEvent}
        onClose={() => setGuestListEvent(null)}
      />

      {user && (
        <BoostEventModal
          open={!!boostEvent}
          event={boostEvent}
          hostEmail={user.email}
          onClose={() => setBoostEvent(null)}
          onBoostUsed={() => setToast('Boost applied for 24 hours (demo).')}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <ReportProblemSheet
        open={showFeedbackSheet}
        onClose={() => setShowFeedbackSheet(false)}
        kind="feedback"
        title="Send feedback"
        subtitle="You're helping shape TUDU — we read every message."
      />

      <HiddenGemPreviewOverlay
        open={!!previewGem}
        gem={previewGem ?? undefined}
        onClose={() => setPreviewGem(null)}
        onDelete={handleDeleteGem}
      />
    </div>
  )
}
