import { getFeatureFlags } from './adminSettings'
import {
  formatFeeLabel,
  formatPrivateEventLimitLabel,
  formatThemeSlotsLabel,
  getTierConfig,
  getUserPlanPerks,
  isPaidPlanId,
  type OrgPlanId,
  type TierPlanId,
  type UserPlanId,
} from './tierConfig'

export type BillingCycle = 'monthly' | 'annual'

export type TierFeeStructure = {
  platformPercent: number
  perTicketCents: number
  label: string
}

export function getTierFees(): Record<'verified' | 'explorer' | 'pioneer' | 'trusted', TierFeeStructure> {
  const config = getTierConfig()
  return {
    verified: { ...config.verified.fees, label: formatFeeLabel(config.verified.fees) },
    explorer: { ...config.explorer.fees, label: formatFeeLabel(config.explorer.fees) },
    pioneer: { ...config.pioneer.fees, label: formatFeeLabel(config.pioneer.fees) },
    trusted: { ...config.trusted.fees, label: formatFeeLabel(config.trusted.fees) },
  }
}

export function getSubscriptionPrices() {
  const config = getTierConfig()
  return {
    explorer: config.explorer.pricing,
    pioneer: config.pioneer.pricing,
    trusted: config.trusted.pricing,
  }
}

export function getAddonPrices() {
  return getTierConfig().microTransactions
}

export function getAddonListPrices() {
  return getTierConfig().microTransactionListPrices
}

export const CALCULATOR_TICKET_PRICES = [25, 50, 100, 200] as const

/** Slider bounds for the subscription earnings comparison calculator. */
export const CALCULATOR_TICKET_PRICE_MIN = 5
export const CALCULATOR_TICKET_PRICE_MAX = 200
export const CALCULATOR_TICKET_PRICE_STEP = 5
export const CALCULATOR_TICKET_COUNT_MIN = 10
export const CALCULATOR_TICKET_COUNT_MAX = 500
export const CALCULATOR_TICKET_COUNT_STEP = 10

/** Stripe card processing — applied to Tudu net earnings (not competitor benchmarks). */
export const STRIPE_PROCESSING = {
  percent: 2.9,
  fixedCents: 30,
} as const

/** Anonymous benchmark tier IDs — no named competitors. */
export type PlatformBenchmarkId = 'typical' | 'premium'

export type PlatformBenchmark = {
  id: PlatformBenchmarkId
  /** Display label shown in calculator (anonymous). */
  label: string
  platformPercent: number
  perTicketCents: number
  /** Muted bar color for chart legend. */
  barColor: string
}

/**
 * Anonymous platform fee benchmarks for earnings comparison.
 * Ordered low → high fees. Based on commonly published industry structures;
 * not tied to any named competitor.
 *
 * DEV REFERENCE (not shown in UI):
 * - typical → Eventbrite-ish self-serve (~3.7% + ~$1.79 service fee per ticket)
 * - premium → Ticketmaster-ish venue-scale (~8% + ~$3.00 facility/service fees)
 *
 * | Tier              | Platform % | Per-ticket | Notes                          |
 * |-------------------|------------|------------|--------------------------------|
 * | Typical platform  | 3.7%       | $1.79      | Moderate self-serve fees       |
 * | Premium platform  | 8.0%       | $3.00      | High-fee tier (venue-scale)    |
 */
export const PLATFORM_BENCHMARKS: readonly PlatformBenchmark[] = [
  {
    id: 'typical',
    label: 'Typical platform',
    platformPercent: 3.7,
    perTicketCents: 179,
    barColor: '#9a8a82',
  },
  {
    id: 'premium',
    label: 'Premium platform tier',
    platformPercent: 8.0,
    perTicketCents: 300,
    barColor: '#7a6560',
  },
] as const

/** @deprecated Use PLATFORM_BENCHMARKS[0] */
export const TYPICAL_PLATFORM_BENCHMARK = {
  platformPercent: PLATFORM_BENCHMARKS[0].platformPercent,
  perTicketCents: PLATFORM_BENCHMARKS[0].perTicketCents,
} as const

export type EarningsBreakdown = { gross: number; fees: number; net: number }

export type PlatformBenchmarkEarnings = EarningsBreakdown & Pick<PlatformBenchmark, 'id' | 'label' | 'barColor'>

export type ComparisonChartEntry = {
  key: string
  label: string
  net: number
  barColor: string
  isTudu: boolean
}

export type EarningsComparison = {
  tudu: EarningsBreakdown
  benchmarks: PlatformBenchmarkEarnings[]
  /** Positive when Tudu net exceeds the highest-fee benchmark net. */
  savingsVsWorst: number
  /** Positive when Tudu net exceeds the median benchmark net. */
  savingsVsMedian: number
  /** Net earnings of the highest-fee benchmark (lowest host payout). */
  worstBenchmarkNet: number
  /** Label of the highest-fee benchmark. */
  worstBenchmarkLabel: string
  /** All chart rows sorted by net descending (best payout first). */
  chartEntries: ComparisonChartEntry[]
}

export function getSubscriptionPrice(
  plan: 'explorer' | 'pioneer' | 'trusted',
  cycle: BillingCycle,
): number {
  const prices = getSubscriptionPrices()[plan]
  return cycle === 'annual' ? prices.annual : prices.monthly
}

export function getAnnualSavingsPercent(plan: 'explorer' | 'pioneer' | 'trusted'): number {
  const prices = getSubscriptionPrices()[plan]
  const monthlyTotal = prices.monthly * 12
  return Math.round(((monthlyTotal - prices.annual) / monthlyTotal) * 100)
}

function feePlanForCalculator(planId: TierPlanId): keyof ReturnType<typeof getTierFees> {
  if (planId === 'unverified') return 'verified'
  if (planId === 'verified') return 'verified'
  if (planId === 'explorer') return 'explorer'
  if (planId === 'pioneer') return 'pioneer'
  return 'trusted'
}

function calcStripeFees(ticketPrice: number, ticketCount: number): number {
  const perTicket =
    ticketPrice * (STRIPE_PROCESSING.percent / 100) + STRIPE_PROCESSING.fixedCents / 100
  return perTicket * ticketCount
}

function calcEarningsWithFees(
  ticketPrice: number,
  ticketCount: number,
  fees: { platformPercent: number; perTicketCents: number },
  options?: { includeStripe?: boolean },
): EarningsBreakdown {
  const gross = ticketPrice * ticketCount
  const perTicketPlatformFee =
    ticketPrice * (fees.platformPercent / 100) + fees.perTicketCents / 100
  const platformFees = perTicketPlatformFee * ticketCount
  const stripeFees = options?.includeStripe ? calcStripeFees(ticketPrice, ticketCount) : 0
  const totalFees = platformFees + stripeFees
  return { gross, fees: totalFees, net: gross - totalFees }
}

export function calcTicketEarnings(
  ticketPrice: number,
  ticketCount: number,
  tier: TierPlanId,
): EarningsBreakdown {
  const fee = getTierFees()[feePlanForCalculator(tier)]
  return calcEarningsWithFees(ticketPrice, ticketCount, fee, { includeStripe: true })
}

export function calcPlatformBenchmarkEarnings(
  ticketPrice: number,
  ticketCount: number,
  benchmark: PlatformBenchmark,
): PlatformBenchmarkEarnings {
  const breakdown = calcEarningsWithFees(ticketPrice, ticketCount, benchmark)
  return {
    ...breakdown,
    id: benchmark.id,
    label: benchmark.label,
    barColor: benchmark.barColor,
  }
}

export function calcAllBenchmarkEarnings(
  ticketPrice: number,
  ticketCount: number,
): PlatformBenchmarkEarnings[] {
  return PLATFORM_BENCHMARKS.map((benchmark) =>
    calcPlatformBenchmarkEarnings(ticketPrice, ticketCount, benchmark),
  )
}

/** @deprecated Use calcPlatformBenchmarkEarnings with PLATFORM_BENCHMARKS[0] */
export function calcTypicalPlatformEarnings(
  ticketPrice: number,
  ticketCount: number,
): EarningsBreakdown {
  return calcEarningsWithFees(ticketPrice, ticketCount, PLATFORM_BENCHMARKS[0])
}

export function calcEarningsComparison(
  ticketPrice: number,
  ticketCount: number,
  tier: TierPlanId,
): EarningsComparison {
  const tudu = calcTicketEarnings(ticketPrice, ticketCount, tier)
  const benchmarks = calcAllBenchmarkEarnings(ticketPrice, ticketCount)
  const benchmarkNets = benchmarks.map((b) => b.net)
  const worstBenchmarkNet = Math.min(...benchmarkNets)
  const medianBenchmarkNet = [...benchmarkNets].sort((a, b) => a - b)[Math.floor(benchmarkNets.length / 2)]
  const worstBenchmark = benchmarks.find((b) => b.net === worstBenchmarkNet)!

  const chartEntries: ComparisonChartEntry[] = [
    { key: 'tudu', label: 'Tudu', net: tudu.net, barColor: '', isTudu: true },
    ...benchmarks.map((b) => ({
      key: b.id,
      label: b.label,
      net: b.net,
      barColor: b.barColor,
      isTudu: false,
    })),
  ].sort((a, b) => b.net - a.net)

  return {
    tudu,
    benchmarks,
    savingsVsWorst: tudu.net - worstBenchmarkNet,
    savingsVsMedian: tudu.net - medianBenchmarkNet,
    worstBenchmarkNet,
    worstBenchmarkLabel: worstBenchmark.label,
    chartEntries,
  }
}

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-CA', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`
}

/** Platform fee rate only — no dollar amounts (for marketing surfaces). */
export function formatPlatformRateLabel(fees: { platformPercent: number }): string {
  if (fees.platformPercent === 0) {
    return '0% platform fee — lowest rate'
  }
  return `${fees.platformPercent}% platform fee`
}

export type PlanFeature = {
  text: string
  highlight?: boolean
  /** Group perks in UI (events, fees, bucket list, themes, travel, discover). */
  category?: 'events' | 'fees' | 'bucketList' | 'themes' | 'travel' | 'discover' | 'ads' | 'org'
}

function userPerkFeatures(planId: UserPlanId): PlanFeature[] {
  const perks = getUserPlanPerks(planId)
  const out: PlanFeature[] = []

  if (perks.adsEnabled) {
    out.push({ text: 'Ads supported (free tier)', category: 'ads' })
  } else {
    out.push({ text: 'No ads', highlight: true, category: 'ads' })
  }

  if (perks.bucketListEnabled) {
    out.push({ text: 'Bucket list', highlight: true, category: 'bucketList' })
  }

  if (perks.themeSlots > 0 || perks.extraThemes) {
    out.push({
      text: formatThemeSlotsLabel(perks.themeSlots, perks.extraThemes),
      category: 'themes',
    })
  }

  if (perks.travelPassIncluded) {
    out.push({ text: 'Travel Pass included', highlight: true, category: 'travel' })
  } else if (perks.travelPassTrialDays > 0) {
    out.push({
      text: `Travel Pass — ${perks.travelPassTrialDays}-day free trial`,
      category: 'travel',
    })
  } else if (planId === 'unverified') {
    out.push({ text: 'Travel Pass available to purchase', category: 'travel' })
  }

  if (perks.roadTripModeIncluded) {
    out.push({
      text:
        planId === 'verified' && perks.travelPassTrialDays > 0
          ? 'Road Trip Mode (with Travel Pass trial week)'
          : 'Road Trip Mode included',
      category: 'travel',
    })
  }

  if (perks.quickPickEnabled) {
    out.push({ text: 'Quick Pick deck filters', highlight: true, category: 'discover' })
    out.push({ text: 'Enhanced search filters', category: 'discover' })
  }

  return out
}

export function getPlanFeatures(
  planId: TierPlanId,
  configOverride?: ReturnType<typeof getTierConfig>,
): PlanFeature[] {
  const config = configOverride ?? getTierConfig()
  const fees = configOverride
    ? {
        verified: { ...config.verified.fees, label: formatFeeLabel(config.verified.fees) },
        explorer: { ...config.explorer.fees, label: formatFeeLabel(config.explorer.fees) },
        pioneer: { ...config.pioneer.fees, label: formatFeeLabel(config.pioneer.fees) },
        trusted: { ...config.trusted.fees, label: formatFeeLabel(config.trusted.fees) },
      }
    : getTierFees()

  switch (planId) {
    case 'unverified':
      return [
        {
          text: formatPrivateEventLimitLabel(config.unverifiedPrivateLimit),
          highlight: true,
          category: 'events',
        },
        { text: 'No public discover listing', category: 'events' },
        { text: 'Phone verification required to publish publicly', category: 'events' },
        ...userPerkFeatures('unverified'),
      ]
    case 'verified':
      return [
        {
          text: `${config.verified.publicEventLimit} public events per month (resets monthly)`,
          highlight: true,
          category: 'events',
        },
        {
          text: formatPrivateEventLimitLabel(config.verified.privateEventLimit),
          category: 'events',
        },
        { text: fees.verified.label, category: 'fees' },
        { text: 'Phone verification required', category: 'events' },
        ...userPerkFeatures('verified'),
      ]
    case 'explorer':
      return [
        {
          text: `${config.explorer.publicEventLimit} public events per month (resets monthly)`,
          highlight: true,
          category: 'events',
        },
        {
          text: formatPrivateEventLimitLabel(config.explorer.privateEventLimit),
          highlight: true,
          category: 'events',
        },
        { text: `${config.badges.explorer.label} badge on profile`, category: 'discover' },
        { text: fees.explorer.label, category: 'fees' },
        ...userPerkFeatures('explorer'),
      ]
    case 'pioneer':
      return [
        { text: `${config.pioneer.publicEventLimit} public events per month`, highlight: true, category: 'events' },
        {
          text: `${config.pioneer.monthlyBoosts} free Event Boost${config.pioneer.monthlyBoosts === 1 ? '' : 's'} per month`,
          category: 'org',
        },
        ...(config.pioneer.marketplaceEnabled
          ? [{ text: 'Event Marketplace — pre-order merch with tickets', highlight: true, category: 'org' as const }]
          : []),
        { text: 'Event Blast notifications', category: 'org' },
        { text: `${config.badges.pioneer.label} badge on Host Account`, category: 'org' },
        { text: fees.pioneer.label, category: 'fees' },
        { text: 'Hidden Gem listings available as add-on', category: 'org' },
      ]
    case 'trusted':
      return [
        { text: `${config.trusted.publicEventLimit} public events per month`, highlight: true, category: 'events' },
        ...(config.trusted.hiddenGemSlotsIncluded > 0 || config.trusted.businessListing
          ? [{
              text: `${config.trusted.hiddenGemSlotsIncluded || 1} Hidden Gem listing included`,
              highlight: true,
              category: 'org' as const,
            }]
          : []),
        { text: `${config.trusted.monthlyBoosts} Event Boosts per month`, category: 'org' },
        ...(config.trusted.marketplaceEnabled
          ? [{ text: 'Event Marketplace — pre-order merch with tickets', highlight: true, category: 'org' as const }]
          : []),
        { text: fees.trusted.label, category: 'fees' },
        { text: `${config.badges.trusted.label} badge`, category: 'org' },
        { text: 'Permanent business listing', category: 'org' },
        { text: 'Advanced analytics', category: 'org' },
        { text: 'Host Account & team features', category: 'org' },
        {
          text: 'Primary owner: Explorer perks on personal account (separate track)',
          category: 'org',
        },
        {
          text: 'Primary owner: personal ticketed events at Trusted Host fees (0% platform)',
          category: 'org',
        },
        { text: 'Additional Hidden Gem slots available as add-on', category: 'org' },
      ]
  }
}

export function isMicroTransactionEnabled(
  product: 'boosts' | 'travelPass' | 'extraEvents' | 'hiddenGems',
): boolean {
  const flags = getFeatureFlags()
  switch (product) {
    case 'boosts':
      return flags.boostsEnabled
    case 'travelPass':
      return flags.travelPassEnabled
    case 'extraEvents':
      return flags.extraEventsShopEnabled
    case 'hiddenGems':
      return flags.hiddenGemsShopEnabled
  }
}

export function stubPurchaseMessage(product: string): string {
  return `${product} — Stripe checkout coming soon. Your selection has been noted for beta testing.`
}

export type PlanScope = 'user' | 'org'

/** User tab calculator — personal tiers plus org fee tiers for comparison. */
export const CALC_USER_TIER_PLANS: TierPlanId[] = ['verified', 'explorer', 'pioneer', 'trusted']

/** Org tab calculator — approved org fee tiers. */
export const CALC_ORG_TIER_PLANS: OrgPlanId[] = ['verified', 'pioneer', 'trusted']

export function getCalculatorTierPlans(scope: PlanScope | 'all'): TierPlanId[] {
  if (scope === 'org') return CALC_ORG_TIER_PLANS
  if (scope === 'user') return CALC_USER_TIER_PLANS
  return [...CALC_USER_TIER_PLANS, ...CALC_ORG_TIER_PLANS.filter((id) => id !== 'verified')]
}

/** Short fee line for calculator tier pills (includes Stripe). */
export function getCalculatorTierFeeLabel(planId: TierPlanId): string {
  const fees = getTierFees()[feePlanForCalculator(planId)]
  if (fees.platformPercent === 0) {
    return `0% + $${(fees.perTicketCents / 100).toFixed(2)} + Stripe`
  }
  return `${fees.platformPercent}% + $${(fees.perTicketCents / 100).toFixed(2)} + Stripe`
}

/** Ticket-price bands for org tier guidance (Verified / Pioneer / Trusted Host). */
export const ORG_TIER_PRICE_THRESHOLDS = {
  verifiedMax: 35,
  pioneerMax: 140,
} as const

export type OrgRecommendableTier = 'verified' | 'pioneer' | 'trusted'

/** Recommend org tier from ticket price — Verified ≤$35, Pioneer ≤$140, else Trusted Host. */
export function getRecommendedOrgTier(ticketPrice: number): OrgRecommendableTier {
  if (ticketPrice <= ORG_TIER_PRICE_THRESHOLDS.verifiedMax) return 'verified'
  if (ticketPrice <= ORG_TIER_PRICE_THRESHOLDS.pioneerMax) return 'pioneer'
  return 'trusted'
}

export function getOrgTierRecommendationMessage(
  ticketPrice: number,
  tierLabel: string,
  recommendedTier: OrgRecommendableTier,
): string {
  const price = formatMoney(ticketPrice)
  if (recommendedTier === 'trusted') {
    return `${price} ticket → ${tierLabel} is the best fit — best all around`
  }
  return `${price} ticket → ${tierLabel} is the best fit`
}

/** Org tier with the highest net earnings at a given ticket price (fee math only). */
export function getLowestFeeOrgTier(
  ticketPrice: number,
  ticketCount = 1,
): OrgRecommendableTier {
  const tiers: OrgRecommendableTier[] = ['verified', 'pioneer', 'trusted']
  return tiers.reduce((best, tier) => {
    const bestNet = calcTicketEarnings(ticketPrice, ticketCount, best).net
    const tierNet = calcTicketEarnings(ticketPrice, ticketCount, tier).net
    return tierNet > bestNet ? tier : best
  })
}

export function isPaidPlan(planId: UserPlanId | OrgPlanId): boolean {
  return isPaidPlanId(planId)
}
