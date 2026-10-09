import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, CalendarPlus, MapPin, Rocket } from 'lucide-react'
import type { UserTier, VerificationStatus } from '../../lib/account'
import { beginPaidCheckout } from '../../lib/payments'
import { useCurrentAccount } from '../../hooks/useCurrentAccount'
import {
  formatMoney,
  getAnnualSavingsPercent,
  getCalculatorTierPlans,
  getPlanFeatures,
  isPaidPlan,
  type BillingCycle,
} from '../../lib/tierPricing'
import {
  getTierConfig,
  isPaidPlanId,
  resolveOrgPlanId,
  resolveUserPlanId,
  type OrgPlanId,
  type TierConfig,
  type UserPlanId,
} from '../../lib/tierConfig'
import Toast from '../Toast'
import { FoundingPriceRow, FoundingSectionBanner } from './FoundingPriceTag'
import HiddenGemDeckPreviewSection from './HiddenGemDeckPreviewSection'
import EarningsComparisonCalculator from './EarningsComparisonCalculator'
import EventSlotsPanel from './EventSlotsPanel'

export type PlanScope = 'user' | 'org' | 'all'

type SubscriptionPlansPanelProps = {
  /** Compact layout for admin preview */
  compact?: boolean
  /** User plans, org plans, or both */
  scope?: PlanScope
  /** Highlight active plan (consumer page) */
  activeUserPlanId?: UserPlanId
  activeOrgPlanId?: OrgPlanId
  /** Show earnings calculator */
  showCalculator?: boolean
  /** Show add-ons section */
  showAddons?: boolean
  /** Admin preview — unsaved config draft */
  configOverride?: TierConfig
  className?: string
  /** Fires after a demo plan upgrade succeeds (consumer page). */
  onPlanUpgraded?: (planId: UserPlanId | OrgPlanId, scope: 'user' | 'org') => void
}

const USER_PLANS: UserPlanId[] = ['unverified', 'verified', 'explorer']
const ORG_PLANS: OrgPlanId[] = ['unverified', 'verified', 'pioneer', 'trusted']
/** Org pricing grid — unverified is account state, not a purchasable plan. */
const ORG_DISPLAY_PLANS = ORG_PLANS.filter((id): id is Exclude<OrgPlanId, 'unverified'> => id !== 'unverified')

const PLAN_PANEL = 'rounded-[14px] border border-app-subtle bg-cream-dark'

function planCardBorderStyle(borderColor: string, isActive: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    borderColor,
    borderTopWidth: 3,
  }
  if (!isActive) {
    return base
  }
  return {
    ...base,
    boxShadow: `0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06), 0 0 0 2px color-mix(in srgb, ${borderColor} 22%, transparent)`,
  }
}

const USER_PLAN_TAGLINE: Record<UserPlanId, string> = {
  unverified: 'Free · private events only',
  verified: 'Free · verify to publish',
  explorer: 'Personal upgrade',
}

const ORG_PLAN_TAGLINE: Record<OrgPlanId, string> = {
  unverified: 'Pending approval',
  verified: 'Free · approved org',
  pioneer: 'Early supporter',
  trusted: 'Business & teams',
}

export default function SubscriptionPlansPanel({
  compact = false,
  scope = 'all',
  activeUserPlanId,
  activeOrgPlanId,
  showCalculator = true,
  showAddons = false,
  configOverride,
  className = '',
  onPlanUpgraded,
}: SubscriptionPlansPanelProps) {
  const navigate = useNavigate()
  const { account: liveAccount } = useCurrentAccount()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [calcTier, setCalcTier] = useState<UserPlanId | OrgPlanId>(() =>
    scope === 'org' ? 'pioneer' : 'explorer',
  )
  const [ticketPrice, setTicketPrice] = useState(50)
  const [ticketCount, setTicketCount] = useState(100)
  const [toast, setToast] = useState<string | null>(null)
  const config = configOverride ?? getTierConfig()

  const resolvedUserPlan = liveAccount
    ? resolveUserPlanId(liveAccount.tier, liveAccount.verificationStatus)
    : 'unverified'
  const resolvedOrgPlan = liveAccount
    ? resolveOrgPlanId(liveAccount.tier, liveAccount.verificationStatus, false)
    : 'unverified'

  const effectiveUserPlanId = !compact && liveAccount ? resolvedUserPlan : activeUserPlanId
  const effectiveOrgPlanId = !compact && liveAccount ? resolvedOrgPlan : activeOrgPlanId

  function handleChooseUserPlan(planId: UserPlanId, isActive: boolean) {
    if (isActive) return
    if (compact) {
      alert(`Stripe checkout for ${config.badges[planId].label} — coming soon`)
      return
    }
    if (planId === 'unverified') {
      navigate('/signin?returnTo=/host/subscription')
      return
    }
    if (planId === 'verified') {
      navigate('/verify-phone?returnTo=/host/subscription')
      return
    }
    if (planId !== 'explorer') return
    void (async () => {
      const result = await beginPaidCheckout({
        kind: 'subscription_user',
        planId: 'explorer',
        billingCycle,
      })
      if (result.outcome === 'redirect') return
      if (result.outcome === 'error') {
        setToast(result.error)
        return
      }
      setToast(`You're on ${config.badges[planId].label} — plan benefits are active.`)
      onPlanUpgraded?.(planId, 'user')
    })()
  }

  function handleChooseOrgPlan(planId: OrgPlanId, isActive: boolean) {
    if (isActive) return
    if (compact) {
      alert(`Stripe checkout for ${config.badges[planId].label} — coming soon`)
      return
    }
    if (planId === 'verified') {
      navigate('/host/create-org')
      return
    }
    if (planId !== 'pioneer' && planId !== 'trusted') return
    void (async () => {
      const result = await beginPaidCheckout({
        kind: 'subscription_org',
        planId,
        billingCycle,
      })
      if (result.outcome === 'redirect') return
      if (result.outcome === 'error') {
        setToast(result.error)
        return
      }
      setToast(`You're on ${config.badges[planId].label} — plan benefits are active.`)
      onPlanUpgraded?.(planId, 'org')
    })()
  }

  const displayActiveOrgPlanId =
    effectiveOrgPlanId && effectiveOrgPlanId !== 'unverified' ? effectiveOrgPlanId : undefined

  const calcPlans = getCalculatorTierPlans(scope)

  useEffect(() => {
    const allowed = getCalculatorTierPlans(scope)
    const fallback = scope === 'org' ? 'pioneer' : 'explorer'
    setCalcTier((current) => (allowed.includes(current) ? current : fallback))
  }, [scope])

  const showUserSection = scope === 'user' || scope === 'all'
  const showOrgSection = scope === 'org' || scope === 'all'
  const defaultPaidPlan = scope === 'org' ? 'pioneer' : 'explorer'

  return (
    <div className={`${compact ? 'text-[11px]' : 'text-sm'} ${className}`}>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <BillingToggle
        billingCycle={billingCycle}
        onChange={setBillingCycle}
        compact={compact}
        savingsPlan={defaultPaidPlan}
      />

      {showUserSection && (
        <PlanSection
          title={scope === 'all' ? 'User' : undefined}
          subtitle={scope === 'all' ? 'Personal hosting' : undefined}
          compact={compact}
          banner={
            !compact && (scope === 'user' || scope === 'all') ? (
              <FoundingSectionBanner offer={config.explorer.foundingPricing} offerId="explorer" />
            ) : undefined
          }
        >
          <div
            className={`grid gap-3 ${
              compact ? 'grid-cols-1' : scope === 'all' ? 'sm:grid-cols-3' : 'md:grid-cols-3'
            }`}
          >
            {USER_PLANS.map((planId) => (
              <PlanCard
                key={`user-${planId}`}
                planId={planId}
                billingCycle={billingCycle}
                isActive={effectiveUserPlanId === planId}
                compact={compact}
                config={config}
                tagline={USER_PLAN_TAGLINE[planId]}
                onChoose={() => handleChooseUserPlan(planId, effectiveUserPlanId === planId)}
              />
            ))}
          </div>
        </PlanSection>
      )}

      {showOrgSection && (
        <PlanSection
          title={scope === 'all' ? 'Org' : undefined}
          subtitle={scope === 'all' ? 'Host Account' : undefined}
          compact={compact}
          className={showUserSection && scope === 'all' ? 'mt-5' : undefined}
          banner={
            !compact && (scope === 'org' || scope === 'all') ? (
              <FoundingSectionBanner offer={config.pioneer.foundingPricing} offerId="pioneer" />
            ) : undefined
          }
        >
          <div
            className={`grid gap-3 ${
              compact ? 'grid-cols-1' : scope === 'all' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3'
            }`}
          >
            {ORG_DISPLAY_PLANS.map((planId) => (
              <PlanCard
                key={`org-${planId}`}
                planId={planId}
                billingCycle={billingCycle}
                isActive={displayActiveOrgPlanId === planId}
                compact={compact}
                config={config}
                tagline={ORG_PLAN_TAGLINE[planId]}
                onChoose={() => handleChooseOrgPlan(planId, displayActiveOrgPlanId === planId)}
              />
            ))}
          </div>
          {config.partnerInviteOnly && !compact && (
            <p className="mt-3 text-xs text-brown-muted">
              Partner tier is invite-only —{' '}
              <a href="mailto:sales@tudu.ca" className="font-semibold text-purple no-underline hover:underline">
                contact sales
              </a>
            </p>
          )}
        </PlanSection>
      )}

      {showCalculator && (
        <div className={`mt-5 ${PLAN_PANEL} ${compact ? 'p-3' : 'p-4'}`}>
          <EarningsComparisonCalculator
            compact={compact}
            calcTier={calcTier}
            calcPlans={calcPlans}
            ticketPrice={ticketPrice}
            ticketCount={ticketCount}
            config={config}
            showOrgTierRecommendation={scope === 'org'}
            onCalcTierChange={setCalcTier}
            onTicketPriceChange={setTicketPrice}
            onTicketCountChange={setTicketCount}
          />
        </div>
      )}

      {showAddons && <AddonsSection compact={compact} config={config} scope={scope} />}

      {showOrgSection && compact && (
        <HiddenGemDeckPreviewSection compact className="mt-5" />
      )}
    </div>
  )
}

export function BillingToggle({
  billingCycle,
  onChange,
  compact,
  savingsPlan,
}: {
  billingCycle: BillingCycle
  onChange: (cycle: BillingCycle) => void
  compact: boolean
  savingsPlan: 'explorer' | 'pioneer' | 'trusted'
}) {
  return (
    <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-3' : 'mb-4'}`}>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`rounded-[14px] px-3 py-1 font-semibold transition ${
          billingCycle === 'monthly'
            ? 'bg-brown text-cream'
            : 'bg-cream-dark text-brown-muted hover:text-brown'
        } ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('annual')}
        className={`rounded-[14px] px-3 py-1 font-semibold transition ${
          billingCycle === 'annual'
            ? 'bg-brown text-cream'
            : 'bg-cream-dark text-brown-muted hover:text-brown'
        } ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        Annual
        {!compact && (
          <span className="ml-1 text-[10px] opacity-80">
            (~{getAnnualSavingsPercent(savingsPlan)}% off)
          </span>
        )}
      </button>
    </div>
  )
}

function PlanSection({
  title,
  subtitle,
  banner,
  compact,
  className,
  children,
}: {
  title?: string
  subtitle?: string
  banner?: React.ReactNode
  compact: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={className}>
      {title && (
        <div className={`${compact ? 'mb-2' : 'mb-3'}`}>
          <h2 className={`font-display font-bold text-brown ${compact ? 'text-xs' : 'text-sm'}`}>
            {title}
            {subtitle && (
              <span className="ml-2 font-normal text-brown-muted">· {subtitle}</span>
            )}
          </h2>
        </div>
      )}
      {banner && <div className={compact ? 'mb-2' : 'mb-3'}>{banner}</div>}
      {children}
    </section>
  )
}

export function PlanCard({
  planId,
  billingCycle,
  isActive,
  compact,
  config,
  tagline,
  onChoose,
}: {
  planId: UserPlanId | OrgPlanId
  billingCycle: BillingCycle
  isActive: boolean
  compact: boolean
  config: TierConfig
  tagline: string
  onChoose: () => void
}) {
  const badge = config.badges[planId]
  const features = getPlanFeatures(planId, config)
  const paid = isPaidPlan(planId)
  const pricing = paid && isPaidPlanId(planId) ? config[planId].pricing : null
  const founding = paid && isPaidPlanId(planId) ? config[planId].foundingPricing : null

  const pillLabel =
    planId === 'unverified' || planId === 'verified' ? 'Free' : badge.label

  const ctaLabel = (() => {
    if (isActive) return 'Current plan'
    if (planId === 'unverified') return 'Get started'
    if (planId === 'verified') return 'Verify to unlock'
    return `Choose ${badge.label}`
  })()

  return (
    <div
      className={`relative flex flex-col ${PLAN_PANEL} ${compact ? 'p-3' : 'p-4'}`}
      style={planCardBorderStyle(badge.cardBorderColor, isActive)}
    >
      {isActive && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-[14px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: badge.cardBorderColor }}
        >
          Active
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={`font-display font-bold text-brown ${compact ? 'text-sm' : 'text-lg'}`}>
            {badge.label}
          </h3>
          <p className={`text-brown-muted ${compact ? 'text-[10px]' : 'text-xs'}`}>{tagline}</p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-[14px] px-2 py-0.5 font-bold uppercase ${badge.pillClass} ${compact ? 'text-[8px]' : 'text-[10px]'}`}
        >
          {pillLabel}
        </span>
      </div>

      {pricing && founding && paid ? (
        <div className="mt-2">
          <FoundingPriceRow
            offer={founding}
            offerId={planId as 'explorer' | 'pioneer' | 'trusted'}
            foundingPrice={billingCycle === 'annual' ? pricing.annual : pricing.monthly}
            standardPrice={billingCycle === 'annual' ? pricing.wasAnnual : pricing.wasMonthly}
            suffix={billingCycle === 'annual' ? '/yr' : '/mo'}
            compact={compact}
            showHeadline={false}
          />
        </div>
      ) : (
        <div className={`mt-2 ${compact ? 'text-lg' : 'text-2xl'} font-display font-extrabold text-brown`}>
          Free
        </div>
      )}

      <ul className={`mt-3 flex-1 space-y-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-1.5 text-brown-muted">
            <Check size={compact ? 12 : 14} className="mt-0.5 shrink-0 text-success" />
            <span className={f.highlight ? 'font-semibold text-brown' : undefined}>{f.text}</span>
          </li>
        ))}
      </ul>

      {!compact && (
        <button
          type="button"
          className={`mt-4 w-full rounded-[14px] py-2.5 text-sm font-bold transition ${
            isActive
              ? 'bg-brown/10 text-brown'
              : 'bg-gradient-tudu text-white hover:brightness-105'
          }`}
          onClick={onChoose}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}

const USER_ADDONS: {
  title: string
  priceKey: keyof TierConfig['microTransactions']
  suffix?: string
}[] = [
  { title: 'Event Boost', priceKey: 'boostSingle' },
  { title: '3 Boosts', priceKey: 'boost3Pack' },
  { title: 'Travel Pass · week', priceKey: 'travelPassWeekly' },
  { title: 'Travel Pass · month', priceKey: 'travelPassMonthly' },
]

const BOOST_ADDONS = USER_ADDONS.filter(
  (a) => a.priceKey === 'boostSingle' || a.priceKey === 'boost3Pack',
)
const TRAVEL_PASS_ADDONS = USER_ADDONS.filter(
  (a) => a.priceKey === 'travelPassWeekly' || a.priceKey === 'travelPassMonthly',
)

function AddonsSection({
  compact,
  config,
  scope,
}: {
  compact: boolean
  config: TierConfig
  scope: PlanScope
}) {
  const addons = config.microTransactions
  const showUser = scope === 'user' || scope === 'all'
  const showOrg = scope === 'org' || scope === 'all'
  const showShared = showUser || showOrg

  return (
    <div className={`mt-5 space-y-5 ${compact ? 'text-[10px]' : ''}`}>
      {showShared && (
        <AddonCategorySection
          title="Event Boosts"
          subtitle="Push your event higher in Discover"
          icon={Rocket}
          iconClassName="bg-orange/10 text-orange"
          compact={compact}
        >
          <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
            {BOOST_ADDONS.map((addon) => (
              <UserAddonCard
                key={addon.priceKey}
                title={addon.title}
                price={addons[addon.priceKey]}
                suffix={addon.suffix}
                compact={compact}
              />
            ))}
          </div>
        </AddonCategorySection>
      )}

      {showShared && !compact && <EventSlotsPanel />}

      {showShared && compact && (
        <AddonCategorySection
          title="Extra public events"
          subtitle="One-time slot packs"
          icon={CalendarPlus}
          iconClassName="bg-orange/10 text-orange"
          compact={compact}
        >
          <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
            <UserAddonCard
              title="+1 public event"
              price={addons.extraEventSingle}
              compact={compact}
            />
            <UserAddonCard
              title="+5 public events"
              price={addons.extraEvent5Pack}
              compact={compact}
            />
          </div>
        </AddonCategorySection>
      )}

      {showUser && (
        <AddonCategorySection
          title="Travel Pass"
          subtitle="Browse Discover in other cities"
          icon={MapPin}
          iconClassName="bg-[#7F77DD]/10 text-[#7F77DD]"
          compact={compact}
        >
          <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
            {TRAVEL_PASS_ADDONS.map((addon) => (
              <UserAddonCard
                key={addon.priceKey}
                title={addon.title}
                price={addons[addon.priceKey]}
                suffix={addon.suffix}
                compact={compact}
              />
            ))}
          </div>
        </AddonCategorySection>
      )}
    </div>
  )
}

function AddonCategorySection({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  compact,
  children,
}: {
  title: string
  subtitle: string
  icon: typeof Rocket
  iconClassName: string
  compact: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`${PLAN_PANEL} ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${iconClassName}`}
        >
          <Icon size={18} />
        </div>
        <div>
          <h3 className={`font-display font-bold text-brown ${compact ? 'text-xs' : 'text-base'}`}>
            {title}
          </h3>
          <p className={`text-brown-muted ${compact ? 'text-[10px]' : 'text-xs'}`}>{subtitle}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function UserAddonCard({
  title,
  price,
  suffix = '',
  compact,
}: {
  title: string
  price: number
  suffix?: string
  compact: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${PLAN_PANEL} ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}>
      <p className={`font-semibold text-brown ${compact ? 'text-[10px]' : 'text-sm'}`}>{title}</p>
      <p className={`shrink-0 font-bold text-purple ${compact ? 'text-xs' : 'text-sm'}`}>
        {formatMoney(price)}
        {suffix}
      </p>
    </div>
  )
}

export function resolveActiveUserPlanId(
  tier: UserTier,
  verificationStatus: VerificationStatus,
): UserPlanId {
  return resolveUserPlanId(tier, verificationStatus)
}

export function resolveActiveOrgPlanId(
  tier: UserTier,
  verificationStatus: VerificationStatus,
  orgApproved: boolean,
): OrgPlanId {
  return resolveOrgPlanId(tier, verificationStatus, orgApproved)
}

export function SubscriptionPageLink({ className = '' }: { className?: string }) {
  return (
    <Link to="/host/subscription" className={`text-purple font-semibold no-underline hover:underline ${className}`}>
      View plans →
    </Link>
  )
}
