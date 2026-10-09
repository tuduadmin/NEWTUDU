import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import SubscriptionPlansPanel, {
  resolveActiveOrgPlanId,
  resolveActiveUserPlanId,
  type PlanScope,
} from '../../components/host/SubscriptionPlansPanel'
import HiddenGemSlotsPanel from '../../components/host/HiddenGemSlotsPanel'
import { BackLink } from '../../components/NavActionButtons'
import { getOrganizationApprovalStatus, getOrganizationsForUser } from '../../lib/account'
import { useCurrentAccount } from '../../hooks/useCurrentAccount'
import { getTierConfig } from '../../lib/tierConfig'
import {
  getSubscriptionReturnLabel,
  getSubscriptionReturnUrl,
} from '../../lib/subscriptionNav'

type PlanTab = 'user' | 'org'

function defaultTab(
  activeUserPlanId: ReturnType<typeof resolveActiveUserPlanId>,
  activeOrgPlanId: ReturnType<typeof resolveActiveOrgPlanId>,
): PlanTab {
  if (activeOrgPlanId === 'pioneer' || activeOrgPlanId === 'trusted') return 'org'
  if (activeUserPlanId === 'explorer') return 'user'
  return 'user'
}

export default function HostSubscriptionPage() {
  const [searchParams] = useSearchParams()
  const returnTo = getSubscriptionReturnUrl(searchParams)
  const returnLabel = getSubscriptionReturnLabel(returnTo)
  const { account, sessionEmail } = useCurrentAccount()
  const config = getTierConfig()

  const userOrgs = useMemo(() => {
    if (!account) return []
    return getOrganizationsForUser(account.email)
  }, [account])

  const orgApproved = useMemo(
    () => userOrgs.some((org) => getOrganizationApprovalStatus(org) === 'approved'),
    [userOrgs],
  )

  const pendingOrg = useMemo(
    () => userOrgs.find((org) => getOrganizationApprovalStatus(org) === 'pending') ?? null,
    [userOrgs],
  )

  const activeUserPlanId = account
    ? resolveActiveUserPlanId(account.tier, account.verificationStatus)
    : 'unverified'
  const activeOrgPlanId = account
    ? resolveActiveOrgPlanId(account.tier, account.verificationStatus, orgApproved)
    : 'unverified'

  const planBadge = config.badges[activeUserPlanId]
  const planLabel = account ? config.badges[activeUserPlanId].label : 'Sign in required'
  const [tab, setTab] = useState<PlanTab>(() => defaultTab(activeUserPlanId, activeOrgPlanId))

  useEffect(() => {
    setTab(defaultTab(activeUserPlanId, activeOrgPlanId))
  }, [activeUserPlanId, activeOrgPlanId])

  useEffect(() => {
    function scrollToPlanHash() {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'hidden-gems') {
        setTab('org')
        window.requestAnimationFrame(() => {
          document.getElementById('hidden-gems')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        return
      }
      if (hash === 'event-slots') {
        window.requestAnimationFrame(() => {
          document.getElementById('event-slots')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
    scrollToPlanHash()
    window.addEventListener('hashchange', scrollToPlanHash)
    return () => window.removeEventListener('hashchange', scrollToPlanHash)
  }, [])

  function selectPlanTab(next: PlanTab) {
    setTab(next)
    const hash = window.location.hash.replace('#', '')
    if (hash === 'event-slots' || hash === 'hidden-gems') {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  const scope: PlanScope = tab

  return (
    <div className="app-page-shell max-w-3xl pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <BackLink to={returnTo} variant="chevron" className="mb-3">
          {returnLabel}
        </BackLink>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
          Plans &amp; pricing
        </h1>

        {sessionEmail ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-[14px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${planBadge.pillClass}`}
            >
              {planLabel}
            </span>
            <span className="text-sm text-brown-muted">{sessionEmail}</span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-brown-muted">
            <Link to="/signin" className="font-semibold text-orange no-underline hover:underline">
              Sign in
            </Link>{' '}
            to manage your plan.
          </p>
        )}

        <nav
          className="mt-5 flex border-b border-brown/10"
          aria-label="Plan type"
        >
          {(['user', 'org'] as PlanTab[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => selectPlanTab(id)}
              className={`flex-1 border-b-2 pb-2.5 text-center text-sm font-semibold transition ${
                tab === id
                  ? 'border-orange text-orange'
                  : 'border-transparent text-brown-muted hover:text-brown'
              }`}
              aria-current={tab === id ? 'page' : undefined}
            >
              {id === 'user' ? 'User' : 'Org'}
            </button>
          ))}
        </nav>

        <p className="mt-2 text-xs text-brown-muted">
          {tab === 'user'
            ? 'Personal hosting — verify free, upgrade for more reach.'
            : 'Host Account — business profile, teams, and Hidden Gems.'}
        </p>

        {tab === 'org' && pendingOrg && (
          <p className="mt-2 rounded-[14px] border border-orange/20 bg-orange/5 px-3 py-2 text-xs text-brown">
            Your Host Account is under review. You&apos;ll unlock Verified when approved.
          </p>
        )}

        <div className="mt-4">
          <SubscriptionPlansPanel
            scope={scope}
            activeUserPlanId={activeUserPlanId}
            activeOrgPlanId={activeOrgPlanId}
            showCalculator
            showAddons
          />
        </div>

        {tab === 'org' && <HiddenGemSlotsPanel />}
      </main>

      <BottomNav />
    </div>
  )
}
