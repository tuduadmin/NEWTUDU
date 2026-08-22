import { useMemo, useState, type FormEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  AdminButton,
  AdminInput,
  AdminKpi,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPanel,
} from '../../components/admin/AdminUI'
import { BillingToggle, PlanCard } from '../../components/host/SubscriptionPlansPanel'
import { getTierSubscriptionAnalytics } from '../../lib/adminAnalytics'
import {
  getTierConfig,
  resetTierConfig,
  saveTierConfig,
  type FoundingPricingConfig,
  type OrgPlanId,
  type PaidPlanPricing,
  type TierConfig,
  type TierPlanId,
  type UserPlanId,
  type UserPlanPerks,
  type UserTierLimits,
} from '../../lib/tierConfig'
import {
  getFoundingSlotsClaimed,
  resetFoundingClaims,
  setFoundingSlotsClaimed,
  type FoundingOfferId,
} from '../../lib/foundingPricing'
import { formatMoney, type BillingCycle } from '../../lib/tierPricing'

type TrackTab = 'user' | 'organizer'

const USER_TIER_ORDER: UserPlanId[] = ['unverified', 'verified', 'explorer']
const ORG_TIER_ORDER: OrgPlanId[] = ['unverified', 'verified', 'pioneer', 'trusted']

const TIER_TAGLINES: Record<UserPlanId | OrgPlanId, string> = {
  unverified: 'Free · limited until verified',
  verified: 'Free · phone verified',
  explorer: 'Personal upgrade',
  pioneer: 'Early org supporter',
  trusted: 'Business & teams',
}

const TIER_TITLES: Record<UserPlanId | OrgPlanId, string> = {
  unverified: 'Unverified',
  verified: 'Verified',
  explorer: 'Explorer',
  pioneer: 'Pioneer',
  trusted: 'Trusted Host',
}

export default function AdminTiersPage() {
  const [config, setConfig] = useState<TierConfig>(() => getTierConfig())
  const [saved, setSaved] = useState(false)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [trackTab, setTrackTab] = useState<TrackTab>('user')
  const analytics = useMemo(() => getTierSubscriptionAnalytics(), [config, saved])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    saveTierConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    if (!window.confirm('Reset tier config to defaults?')) return
    setConfig(resetTierConfig())
  }

  const tierIds = trackTab === 'user' ? USER_TIER_ORDER : ORG_TIER_ORDER

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Tier & Pricing"
        subtitle="User and Organizer plans · same editor for every tier"
        actions={
          <>
            <a
              href="/host/subscription"
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-secondary inline-flex items-center gap-1.5 text-xs no-underline"
            >
              Consumer page
              <ExternalLink size={14} />
            </a>
            <AdminButton type="button" variant="ghost" onClick={handleReset}>
              Reset defaults
            </AdminButton>
          </>
        }
      />

      <AdminKpiGrid>
        <AdminKpi label="Verified hosts" value={analytics.verifiedHosts} accent="neutral" />
        <AdminKpi label="Explorer subs" value={analytics.explorerSubs} accent="neutral" />
        <AdminKpi label="Pioneer subs" value={analytics.pioneerSubs} accent="amber" />
        <AdminKpi label="Trusted Host subs" value={analytics.trustedSubs} accent="cyan" />
        <AdminKpi label="Est. MRR (stub)" value={formatMoney(analytics.estimatedMrr)} accent="emerald" />
      </AdminKpiGrid>

      <form onSubmit={handleSubmit} className="mx-auto mt-4 max-w-5xl space-y-4">
        <AdminPanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] p-0.5">
              <TrackTabButton active={trackTab === 'user'} onClick={() => setTrackTab('user')}>
                User
              </TrackTabButton>
              <TrackTabButton active={trackTab === 'organizer'} onClick={() => setTrackTab('organizer')}>
                Organizer
              </TrackTabButton>
            </div>
            <BillingToggle
              billingCycle={billingCycle}
              onChange={setBillingCycle}
              compact
              savingsPlan="pioneer"
            />
          </div>
          <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
            Each tier uses the same fields — preview card on the left, limits, fees, perks, and pricing on
            the right. Uncheck or edit as needed.
          </p>
        </AdminPanel>

        {tierIds.map((planId) => (
          <UnifiedTierEditor
            key={`${trackTab}-${planId}`}
            track={trackTab}
            planId={planId}
            config={config}
            setConfig={setConfig}
            billingCycle={billingCycle}
          />
        ))}

        <AdminPanel>
          <SectionTitle>Add-on pricing</SectionTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MoneyField
              label="Single boost (founding)"
              value={config.microTransactions.boostSingle}
              onChange={(v) => updateMicro(setConfig, 'boostSingle', v)}
            />
            <MoneyField
              label="3-pack boosts (founding)"
              value={config.microTransactions.boost3Pack}
              onChange={(v) => updateMicro(setConfig, 'boost3Pack', v)}
            />
            <MoneyField
              label="Extra public event — founding"
              value={config.microTransactions.extraEventSingle}
              onChange={(v) => updateMicro(setConfig, 'extraEventSingle', v)}
            />
            <MoneyField
              label="Extra public event — list"
              value={config.microTransactionListPrices.extraEventSingle}
              onChange={(v) =>
                setConfig((p) => ({
                  ...p,
                  microTransactionListPrices: { ...p.microTransactionListPrices, extraEventSingle: v },
                }))
              }
            />
            <MoneyField
              label="Travel Pass — weekly"
              value={config.microTransactions.travelPassWeekly}
              onChange={(v) => updateMicro(setConfig, 'travelPassWeekly', v)}
            />
            <MoneyField
              label="Travel Pass — monthly"
              value={config.microTransactions.travelPassMonthly}
              onChange={(v) => updateMicro(setConfig, 'travelPassMonthly', v)}
            />
          </div>
        </AdminPanel>

        <AdminPanel>
          <SectionTitle>Display settings</SectionTitle>
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3">
            <span className="text-sm font-medium">Partner invite-only</span>
            <input
              type="checkbox"
              checked={config.partnerInviteOnly}
              onChange={(e) => setConfig((p) => ({ ...p, partnerInviteOnly: e.target.checked }))}
              className="h-4 w-4 accent-[var(--admin-accent)]"
            />
          </label>
          <div className="mt-4 space-y-4">
            {(['unverified', 'verified', 'explorer', 'pioneer', 'trusted', 'partner'] as const).map((id) => (
              <BadgeEditor
                key={id}
                planId={id}
                badge={config.badges[id]}
                onChange={(badge) =>
                  setConfig((p) => ({ ...p, badges: { ...p.badges, [id]: badge } }))
                }
              />
            ))}
          </div>
        </AdminPanel>

        <div className="flex items-center gap-3">
          <AdminButton type="submit" variant="primary">
            Save tier config
          </AdminButton>
          {saved && <span className="text-xs text-[var(--admin-success)]">Saved — preview updated</span>}
        </div>
      </form>
    </div>
  )
}

function TrackTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[calc(var(--admin-radius)-2px)] px-4 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-[var(--admin-accent)] text-white'
          : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
      }`}
    >
      {children}
    </button>
  )
}

function UnifiedTierEditor({
  track,
  planId,
  config,
  setConfig,
  billingCycle,
}: {
  track: TrackTab
  planId: UserPlanId | OrgPlanId
  config: TierConfig
  setConfig: React.Dispatch<React.SetStateAction<TierConfig>>
  billingCycle: BillingCycle
}) {
  const isPaid = planId === 'explorer' || planId === 'pioneer' || planId === 'trusted'
  const isUserTrack = track === 'user'
  const showUserPerks = isUserTrack
  const showOrgPaidLimits = !isUserTrack && (planId === 'pioneer' || planId === 'trusted')

  const limits = resolveLimits(config, track, planId)
  const perks = resolvePerks(config, track, planId)
  const pricing = isPaid ? config[planId as 'explorer' | 'pioneer' | 'trusted'].pricing : null
  const founding = isPaid
    ? config[planId as 'explorer' | 'pioneer' | 'trusted'].foundingPricing
    : null

  function patchLimits(patch: Partial<ReturnType<typeof resolveLimits>>) {
    setConfig((prev) => applyLimitsPatch(prev, track, planId, patch))
  }

  function patchPerks(patch: Partial<UserPlanPerks>) {
    setConfig((prev) => applyPerksPatch(prev, track, planId, patch))
  }

  function patchPricing(patch: Partial<PaidPlanPricing>) {
    if (!isPaid) return
    const key = planId as 'explorer' | 'pioneer' | 'trusted'
    setConfig((p) => ({
      ...p,
      [key]: { ...p[key], pricing: { ...p[key].pricing, ...patch } },
    }))
  }

  function patchFounding(offer: FoundingPricingConfig) {
    if (!isPaid) return
    const key = planId as 'explorer' | 'pioneer' | 'trusted'
    setConfig((p) => ({ ...p, [key]: { ...p[key], foundingPricing: offer } }))
  }

  return (
    <AdminPanel>
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,260px)_1fr] lg:items-start">
        <div className="rounded-[var(--admin-radius)] bg-cream p-2 text-[11px]">
          <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-text-dim)]">
            {track === 'user' ? 'User' : 'Organizer'}
          </p>
          <PlanCard
            planId={planId}
            billingCycle={billingCycle}
            isActive={false}
            compact
            config={config}
            tagline={TIER_TAGLINES[planId]}
            onChoose={() => undefined}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--admin-text)]">{TIER_TITLES[planId]}</h2>
            <p className="text-xs text-[var(--admin-text-muted)]">{TIER_TAGLINES[planId]}</p>
          </div>

          <FieldGroup title="Subscription pricing">
            {isPaid && pricing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MoneyField label="Founding monthly" value={pricing.monthly} onChange={(v) => patchPricing({ monthly: v })} />
                <MoneyField label="List monthly" value={pricing.wasMonthly} onChange={(v) => patchPricing({ wasMonthly: v })} />
                <MoneyField label="Founding annual" value={pricing.annual} onChange={(v) => patchPricing({ annual: v })} />
                <MoneyField label="List annual" value={pricing.wasAnnual} onChange={(v) => patchPricing({ wasAnnual: v })} />
              </div>
            ) : (
              <p className="text-xs text-[var(--admin-text-muted)]">Free tier — no subscription price.</p>
            )}
          </FieldGroup>

          <FieldGroup title="Event limits">
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label="Public events / month"
                value={limits.publicEventLimit}
                onChange={(v) => patchLimits({ publicEventLimit: v })}
              />
              {showUserPerks && (
                <>
                  <NumberField
                    label="Private events (cap)"
                    value={perks.privateEventLimit ?? 0}
                    disabled={perks.privateEventLimit === null}
                    onChange={(v) => patchPerks({ privateEventLimit: v })}
                  />
                  <CheckboxField
                    label="Unlimited private events"
                    checked={perks.privateEventLimit === null}
                    onChange={(checked) =>
                      patchPerks({ privateEventLimit: checked ? null : planId === 'explorer' ? 10 : 2 })
                    }
                  />
                </>
              )}
              {showOrgPaidLimits && (
                <>
                  <NumberField
                    label="Boosts included / month"
                    value={limits.monthlyBoosts}
                    onChange={(v) => patchLimits({ monthlyBoosts: v })}
                  />
                  <NumberField
                    label="Hidden Gem slots included"
                    value={limits.hiddenGemSlotsIncluded}
                    onChange={(v) => patchLimits({ hiddenGemSlotsIncluded: v })}
                  />
                  {planId === 'trusted' && (
                    <CheckboxField
                      label="Permanent business listing"
                      checked={limits.businessListing}
                      onChange={(checked) => patchLimits({ businessListing: checked })}
                    />
                  )}
                  <CheckboxField
                    label="Event Marketplace"
                    checked={limits.marketplaceEnabled ?? false}
                    onChange={(checked) => patchLimits({ marketplaceEnabled: checked })}
                  />
                </>
              )}
            </div>
          </FieldGroup>

          <FieldGroup title="Ticket fees">
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label="Platform fee %"
                step={0.1}
                value={limits.fees.platformPercent}
                onChange={(v) => patchLimits({ fees: { ...limits.fees, platformPercent: v } })}
              />
              <NumberField
                label="Flat fee (¢ per ticket)"
                value={limits.fees.perTicketCents}
                onChange={(v) => patchLimits({ fees: { ...limits.fees, perTicketCents: v } })}
              />
            </div>
          </FieldGroup>

          {showUserPerks && (
            <FieldGroup title="Perks & amenities">
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckboxField
                  label="Ads enabled"
                  checked={perks.adsEnabled}
                  onChange={(checked) => patchPerks({ adsEnabled: checked })}
                />
                <CheckboxField
                  label="Bucket list"
                  checked={perks.bucketListEnabled}
                  onChange={(checked) => patchPerks({ bucketListEnabled: checked })}
                />
                <CheckboxField
                  label="Extra theme packs"
                  checked={perks.extraThemes}
                  onChange={(checked) => patchPerks({ extraThemes: checked })}
                />
                <CheckboxField
                  label="Travel Pass included"
                  checked={perks.travelPassIncluded}
                  onChange={(checked) => patchPerks({ travelPassIncluded: checked })}
                />
                <CheckboxField
                  label="Road Trip Mode"
                  checked={perks.roadTripModeIncluded}
                  onChange={(checked) => patchPerks({ roadTripModeIncluded: checked })}
                />
                <CheckboxField
                  label="Quick Pick + search"
                  checked={perks.quickPickEnabled}
                  onChange={(checked) => patchPerks({ quickPickEnabled: checked })}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <NumberField
                  label="Travel Pass trial (days)"
                  value={perks.travelPassTrialDays}
                  disabled={perks.travelPassIncluded}
                  onChange={(v) => patchPerks({ travelPassTrialDays: v })}
                />
                <NumberField
                  label="Theme slots"
                  value={perks.themeSlots}
                  onChange={(v) => patchPerks({ themeSlots: v })}
                />
              </div>
            </FieldGroup>
          )}

          {isPaid && founding && (
            <FieldGroup title="Founding cohort">
              <FoundingPricingEditor
                title={`${TIER_TITLES[planId]} founding`}
                offerId={planId as FoundingOfferId}
                offer={founding}
                onChange={patchFounding}
              />
            </FieldGroup>
          )}

          {!isUserTrack && (
            <p className="text-xs text-[var(--admin-text-muted)]">
              {planId === 'unverified' &&
                'Org Unverified shares the public event cap with User Unverified until Control Room approval. Personal perks (bucket list, Road Trip, etc.) are edited on the User tab.'}
              {planId === 'verified' &&
                'Org Verified (approved, free) shares public limits and ticket fees with User Verified. Personal perks are edited on the User tab.'}
              {planId === 'pioneer' &&
                'Org hosting — Event Marketplace, boosts, and lower fees. Team members keep their own personal tier perks.'}
              {planId === 'trusted' &&
                'Primary org owner receives Explorer-equivalent personal perks on their separate personal account (not configured here).'}
            </p>
          )}
        </div>
      </div>
    </AdminPanel>
  )
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] p-3">
      <p className="admin-label mb-2">{title}</p>
      {children}
    </div>
  )
}

function resolveLimits(
  config: TierConfig,
  track: TrackTab,
  planId: UserPlanId | OrgPlanId,
): UserTierLimits | TierConfig['pioneer'] {
  if (planId === 'unverified') {
    return {
      publicEventLimit: config.unverifiedPublicLimit,
      monthlyBoosts: 0,
      businessListing: false,
      hiddenGemSlotsIncluded: 0,
      marketplaceEnabled: false,
      fees: { platformPercent: 0, perTicketCents: 0 },
      ...config.unverifiedPerks,
    }
  }
  if (planId === 'verified') {
    return config.verified
  }
  return config[planId as 'explorer' | 'pioneer' | 'trusted']
}

function resolvePerks(config: TierConfig, track: TrackTab, planId: UserPlanId | OrgPlanId): UserPlanPerks {
  if (planId === 'unverified') return config.unverifiedPerks
  if (planId === 'verified') return config.verified
  if (planId === 'explorer') return config.explorer
  return {
    privateEventLimit: 0,
    adsEnabled: false,
    travelPassIncluded: false,
    travelPassTrialDays: 0,
    roadTripModeIncluded: false,
    bucketListEnabled: false,
    themeSlots: 0,
    extraThemes: false,
    quickPickEnabled: false,
  }
}

function applyLimitsPatch(
  config: TierConfig,
  track: TrackTab,
  planId: UserPlanId | OrgPlanId,
  patch: Partial<UserTierLimits>,
): TierConfig {
  if (planId === 'unverified') {
    return {
      ...config,
      unverifiedPublicLimit: patch.publicEventLimit ?? config.unverifiedPublicLimit,
      unverifiedPrivateLimit: patch.privateEventLimit ?? config.unverifiedPrivateLimit,
      unverifiedPerks: {
        ...config.unverifiedPerks,
        privateEventLimit: patch.privateEventLimit ?? config.unverifiedPerks.privateEventLimit,
      },
    }
  }
  if (planId === 'verified') {
    return { ...config, verified: { ...config.verified, ...patch, fees: patch.fees ?? config.verified.fees } }
  }
  const key = planId as 'explorer' | 'pioneer' | 'trusted'
  return {
    ...config,
    [key]: {
      ...config[key],
      ...patch,
      fees: patch.fees ?? config[key].fees,
    },
  }
}

function applyPerksPatch(
  config: TierConfig,
  track: TrackTab,
  planId: UserPlanId | OrgPlanId,
  patch: Partial<UserPlanPerks>,
): TierConfig {
  if (planId === 'unverified') {
    const nextPerks = { ...config.unverifiedPerks, ...patch }
    return {
      ...config,
      unverifiedPerks: nextPerks,
      unverifiedPrivateLimit:
        nextPerks.privateEventLimit ?? config.unverifiedPrivateLimit,
    }
  }
  if (planId === 'verified') {
    return { ...config, verified: { ...config.verified, ...patch } }
  }
  if (planId === 'explorer') {
    return { ...config, explorer: { ...config.explorer, ...patch } }
  }
  return config
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-[var(--admin-text)]">{children}</h2>
}

function CheckboxField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--admin-accent)]"
      />
      <span className="text-xs">{label}</span>
    </label>
  )
}

function FoundingPricingEditor({
  title,
  offerId,
  offer,
  onChange,
}: {
  title: string
  offerId: FoundingOfferId
  offer: FoundingPricingConfig
  onChange: (offer: FoundingPricingConfig) => void
}) {
  const claimed = getFoundingSlotsClaimed(offerId)

  return (
    <div>
      <p className="mb-1 text-[10px] text-[var(--admin-text-dim)]">
        {claimed}/{offer.maxSlots} claimed
      </p>
      <CheckboxField label="Show founding rate" checked={offer.enabled} onChange={(v) => onChange({ ...offer, enabled: v })} />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <NumberField label="Max founding slots" value={offer.maxSlots} onChange={(v) => onChange({ ...offer, maxSlots: v })} />
        <NumberField
          label="Demo: slots claimed"
          value={claimed}
          onChange={(v) => setFoundingSlotsClaimed(offerId, v)}
        />
        <label className="block sm:col-span-2">
          <span className="admin-label">Headline</span>
          <AdminInput className="mt-1" value={offer.headline} onChange={(e) => onChange({ ...offer, headline: e.target.value })} />
        </label>
      </div>
    </div>
  )
}

function BadgeEditor({
  planId,
  badge,
  onChange,
}: {
  planId: TierPlanId | 'partner'
  badge: TierConfig['badges'][TierPlanId | 'partner']
  onChange: (b: TierConfig['badges'][TierPlanId | 'partner']) => void
}) {
  return (
    <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] p-3">
      <p className="admin-label mb-2 capitalize">{planId} badge</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] uppercase text-[var(--admin-text-dim)]">Label</span>
          <AdminInput className="mt-0.5" value={badge.label} onChange={(e) => onChange({ ...badge, label: e.target.value })} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[10px] uppercase text-[var(--admin-text-dim)]">Summary</span>
          <AdminInput className="mt-0.5" value={badge.summary} onChange={(e) => onChange({ ...badge, summary: e.target.value })} />
        </label>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  disabled?: boolean
}) {
  return (
    <label className={`block ${disabled ? 'opacity-50' : ''}`}>
      <span className="admin-label">{label}</span>
      <AdminInput
        type="number"
        min={0}
        step={step ?? 1}
        disabled={disabled}
        className="mt-1 admin-tabular"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      <AdminInput
        type="number"
        min={0}
        step={0.01}
        className="mt-1 admin-tabular"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function updateMicro(
  setConfig: React.Dispatch<React.SetStateAction<TierConfig>>,
  key: keyof TierConfig['microTransactions'],
  value: number,
) {
  setConfig((p) => ({
    ...p,
    microTransactions: { ...p.microTransactions, [key]: value },
  }))
}
