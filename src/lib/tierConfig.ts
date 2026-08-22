import { BRAND_TOKENS } from './brandTokens'

/** Explorer tier pill — matches user-explorer token, not brand magenta `--color-purple`. */
const EXPLORER_PILL_CLASS = 'bg-[#7F77DD]/15 text-[#7F77DD]'

const TIER_CONFIG_KEY = 'tudu-admin-tier-config'

/** Personal hosting plans (User tab). */
export type UserPlanId = 'unverified' | 'verified' | 'explorer'
/** Host Account plans (Org tab). */
export type OrgPlanId = 'unverified' | 'verified' | 'pioneer' | 'trusted'
/** All subscription plan IDs across User and Org tracks. */
export type TierPlanId = UserPlanId | OrgPlanId

export type TierFeeStructure = {
  platformPercent: number
  perTicketCents: number
}

/** Consumer-app perks on the personal (User) track — not used on org Pioneer/Trusted limits. */
export type UserPlanPerks = {
  /** null = unlimited personal private events */
  privateEventLimit: number | null
  adsEnabled: boolean
  travelPassIncluded: boolean
  /** Free Travel Pass trial length in days (Verified: 7). 0 when not applicable. */
  travelPassTrialDays: number
  roadTripModeIncluded: boolean
  bucketListEnabled: boolean
  /** Selectable profile themes (Verified: 2 = one dark + one light). */
  themeSlots: number
  /** Explorer: additional theme packs beyond base slots. */
  extraThemes: boolean
  quickPickEnabled: boolean
}

export type TierPlanLimits = {
  publicEventLimit: number
  monthlyBoosts: number
  businessListing: boolean
  /** Included Hidden Gem listing slots (Trusted Host default: 1). */
  hiddenGemSlotsIncluded: number
  /** Event Marketplace — pre-order merch tied to events (org paid tiers). */
  marketplaceEnabled: boolean
  fees: TierFeeStructure
}

export type UserTierLimits = TierPlanLimits & UserPlanPerks

export type PaidPlanPricing = {
  /** Founding / current checkout price */
  monthly: number
  annual: number
  /** Standard list price (strikethrough) */
  wasMonthly: number
  wasAnnual: number
}

export type FoundingPricingConfig = {
  enabled: boolean
  maxSlots: number
  headline: string
  grandfatherNote: string
}

/** @deprecated Use FoundingPricingConfig */
export type LaunchDiscountConfig = {
  enabled: boolean
  percentOff: number
  maxPioneers: number
  headline: string
}

export type MicroTransactionListPrices = {
  extraEventSingle: number
  extraEvent5Pack: number
  hiddenGemSingle: number
  hiddenGem3Pack: number
}

export type AddonFoundingConfig = {
  hiddenGem: FoundingPricingConfig
  extraEvent: FoundingPricingConfig
}

export type MicroTransactionConfig = {
  boostSingle: number
  boost3Pack: number
  extraEventSingle: number
  extraEvent5Pack: number
  hiddenGemSingle: number
  hiddenGem3Pack: number
  travelPassWeekly: number
  travelPassMonthly: number
}

export type TierBadgeStyle = {
  label: string
  pillClass: string
  summary: string
  cardBorderColor: string
}

export type TierConfig = {
  version: 5
  unverifiedPublicLimit: number
  /** Personal hosts only — max private events before phone verify. */
  unverifiedPrivateLimit: number
  /** Personal track perks for unverified hosts (limits also on unverified*Limit fields). */
  unverifiedPerks: UserPlanPerks
  verified: UserTierLimits
  explorer: UserTierLimits & { pricing: PaidPlanPricing; foundingPricing: FoundingPricingConfig }
  pioneer: TierPlanLimits & { pricing: PaidPlanPricing; foundingPricing: FoundingPricingConfig }
  trusted: TierPlanLimits & { pricing: PaidPlanPricing; foundingPricing: FoundingPricingConfig }
  microTransactions: MicroTransactionConfig
  microTransactionListPrices: MicroTransactionListPrices
  addonFounding: AddonFoundingConfig
  badges: Record<TierPlanId | 'partner', TierBadgeStyle>
  partnerInviteOnly: boolean
}

/** @deprecated Legacy shape — migrated on read */
export type LegacyTierConfig = {
  freePublicLimit?: number
  verifiedPublicLimit?: number
  tier1PublicLimit?: number
  tier2PublicLimit?: number
  tier1PriceLabel?: string
  tier2PriceLabel?: string
  version?: number
}

const DEFAULT_FOUNDING_GRANDFATHER =
  'Founding rate locked while your subscription stays active.'

/** Locked User-track defaults for Unverified — synced with unverifiedPublic/PrivateLimit. */
export const DEFAULT_UNVERIFIED_PERKS: UserPlanPerks = {
  privateEventLimit: 2,
  adsEnabled: true,
  travelPassIncluded: false,
  travelPassTrialDays: 0,
  roadTripModeIncluded: false,
  bucketListEnabled: false,
  themeSlots: 0,
  extraThemes: false,
  quickPickEnabled: false,
}

/** Locked User-track defaults for Verified (free, phone-verified). */
export const DEFAULT_VERIFIED_PERKS: UserPlanPerks = {
  privateEventLimit: 10,
  adsEnabled: true,
  travelPassIncluded: false,
  travelPassTrialDays: 7,
  roadTripModeIncluded: true,
  bucketListEnabled: true,
  themeSlots: 2,
  extraThemes: false,
  quickPickEnabled: false,
}

/** Locked User-track defaults for Explorer (paid personal upgrade). */
export const DEFAULT_EXPLORER_PERKS: UserPlanPerks = {
  privateEventLimit: null,
  adsEnabled: false,
  travelPassIncluded: true,
  travelPassTrialDays: 0,
  roadTripModeIncluded: true,
  bucketListEnabled: true,
  themeSlots: 2,
  extraThemes: true,
  quickPickEnabled: true,
}

export const DEFAULT_TIER_CONFIG: TierConfig = {
  version: 5,
  unverifiedPublicLimit: 0,
  unverifiedPrivateLimit: 2,
  unverifiedPerks: DEFAULT_UNVERIFIED_PERKS,
  verified: {
    publicEventLimit: 5,
    monthlyBoosts: 0,
    businessListing: false,
    hiddenGemSlotsIncluded: 0,
    marketplaceEnabled: false,
    fees: { platformPercent: 3.5, perTicketCents: 49 },
    ...DEFAULT_VERIFIED_PERKS,
  },
  explorer: {
    publicEventLimit: 5,
    monthlyBoosts: 0,
    businessListing: false,
    hiddenGemSlotsIncluded: 0,
    marketplaceEnabled: false,
    fees: { platformPercent: 2.5, perTicketCents: 49 },
    ...DEFAULT_EXPLORER_PERKS,
    pricing: { monthly: 7.99, annual: 79.9, wasMonthly: 14.99, wasAnnual: 149.9 },
    foundingPricing: {
      enabled: true,
      maxSlots: 500,
      headline: 'Founding Explorer rate',
      grandfatherNote: DEFAULT_FOUNDING_GRANDFATHER,
    },
  },
  pioneer: {
    publicEventLimit: 10,
    monthlyBoosts: 1,
    businessListing: false,
    hiddenGemSlotsIncluded: 0,
    marketplaceEnabled: true,
    fees: { platformPercent: 1.5, perTicketCents: 49 },
    pricing: { monthly: 14.99, annual: 149.9, wasMonthly: 24.99, wasAnnual: 249.9 },
    foundingPricing: {
      enabled: true,
      maxSlots: 500,
      headline: 'Founding Pioneer rate',
      grandfatherNote: DEFAULT_FOUNDING_GRANDFATHER,
    },
  },
  trusted: {
    publicEventLimit: 20,
    monthlyBoosts: 3,
    businessListing: true,
    hiddenGemSlotsIncluded: 1,
    marketplaceEnabled: true,
    fees: { platformPercent: 0, perTicketCents: 49 },
    pricing: { monthly: 34.99, annual: 349.9, wasMonthly: 49.99, wasAnnual: 499.9 },
    foundingPricing: {
      enabled: true,
      maxSlots: 200,
      headline: 'Founding Trusted Host rate',
      grandfatherNote: DEFAULT_FOUNDING_GRANDFATHER,
    },
  },
  microTransactions: {
    boostSingle: 4.99,
    boost3Pack: 12.99,
    extraEventSingle: 2.99,
    extraEvent5Pack: 9.99,
    hiddenGemSingle: 14.99,
    hiddenGem3Pack: 24.99,
    travelPassWeekly: 4.99,
    travelPassMonthly: 9.99,
  },
  microTransactionListPrices: {
    extraEventSingle: 4.99,
    extraEvent5Pack: 19.99,
    hiddenGemSingle: 19.99,
    hiddenGem3Pack: 34.99,
  },
  addonFounding: {
    hiddenGem: {
      enabled: true,
      maxSlots: 500,
      headline: 'Founding Hidden Gem listing',
      grandfatherNote: DEFAULT_FOUNDING_GRANDFATHER,
    },
    extraEvent: {
      enabled: true,
      maxSlots: 1000,
      headline: 'Beta extra event slot',
      grandfatherNote: 'Founding slot price — one-time purchase.',
    },
  },
  badges: {
    unverified: {
      label: 'Unverified',
      pillClass: 'bg-gray-400/20 text-gray-600',
      summary: 'Private events only — verify phone to publish publicly.',
      cardBorderColor: BRAND_TOKENS.user.unverified,
    },
    verified: {
      label: 'Verified',
      pillClass: 'bg-success/25 text-success-deep',
      summary: 'Phone verified — 5 public events/mo, bucket list, Travel Pass trial.',
      cardBorderColor: BRAND_TOKENS.user.verified,
    },
    explorer: {
      label: 'Explorer',
      pillClass: EXPLORER_PILL_CLASS,
      summary: 'No ads — unlimited private events, Travel Pass & Road Trip included.',
      cardBorderColor: BRAND_TOKENS.user.explorer,
    },
    pioneer: {
      label: 'Pioneer',
      pillClass: 'bg-orange/15 text-orange',
      summary: 'Early org supporter — Event Marketplace, boosts, lower fees.',
      cardBorderColor: BRAND_TOKENS.org.pioneer,
    },
    trusted: {
      label: 'Trusted Host',
      pillClass: 'bg-electric-blue/15 text-electric-blue',
      summary:
        'Business-ready — Event Marketplace, permanent listing, lowest fees. Primary owner gets Explorer perks on personal account.',
      cardBorderColor: BRAND_TOKENS.org.trustedHost,
    },
    partner: {
      label: 'Partner',
      pillClass: 'bg-purple/15 text-purple',
      summary: 'Invite-only partner tier — sales team managed.',
      cardBorderColor: BRAND_TOKENS.category.partner,
    },
  },
  partnerInviteOnly: true,
}

function ensureUserPlanPerks(
  partial: Partial<UserPlanPerks> | undefined,
  defaults: UserPlanPerks,
): UserPlanPerks {
  return {
    privateEventLimit:
      partial?.privateEventLimit !== undefined
        ? partial.privateEventLimit
        : defaults.privateEventLimit,
    adsEnabled: partial?.adsEnabled ?? defaults.adsEnabled,
    travelPassIncluded: partial?.travelPassIncluded ?? defaults.travelPassIncluded,
    travelPassTrialDays: partial?.travelPassTrialDays ?? defaults.travelPassTrialDays,
    roadTripModeIncluded: partial?.roadTripModeIncluded ?? defaults.roadTripModeIncluded,
    bucketListEnabled: partial?.bucketListEnabled ?? defaults.bucketListEnabled,
    themeSlots: partial?.themeSlots ?? defaults.themeSlots,
    extraThemes: partial?.extraThemes ?? defaults.extraThemes,
    quickPickEnabled: partial?.quickPickEnabled ?? defaults.quickPickEnabled,
  }
}

function ensureUserTierLimits(
  partial: Partial<UserTierLimits> | undefined,
  defaults: UserTierLimits,
): UserTierLimits {
  return {
    publicEventLimit: partial?.publicEventLimit ?? defaults.publicEventLimit,
    monthlyBoosts: partial?.monthlyBoosts ?? defaults.monthlyBoosts,
    businessListing: partial?.businessListing ?? defaults.businessListing,
    hiddenGemSlotsIncluded: partial?.hiddenGemSlotsIncluded ?? defaults.hiddenGemSlotsIncluded,
    marketplaceEnabled: partial?.marketplaceEnabled ?? defaults.marketplaceEnabled,
    fees: partial?.fees ?? defaults.fees,
    ...ensureUserPlanPerks(partial, defaults),
  }
}

function migrateUserTierLimits(
  partial: Partial<UserTierLimits> | undefined,
  defaults: UserTierLimits,
): UserTierLimits {
  const merged = ensureUserTierLimits(partial, defaults)
  // v4 → v5: lock agreed public/private caps when stored config still has legacy values.
  if (defaults === DEFAULT_TIER_CONFIG.verified) {
    if (partial?.publicEventLimit === 2) merged.publicEventLimit = DEFAULT_TIER_CONFIG.verified.publicEventLimit
  }
  if (defaults === DEFAULT_TIER_CONFIG.explorer) {
    if (partial?.publicEventLimit === 10) merged.publicEventLimit = DEFAULT_TIER_CONFIG.explorer.publicEventLimit
    if (partial?.fees?.platformPercent === 1.5) merged.fees = DEFAULT_TIER_CONFIG.explorer.fees
  }
  return merged
}

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Partial<T>): T {
  const out = { ...base }
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const val = patch[key]
    if (val && typeof val === 'object' && !Array.isArray(val) && typeof base[key] === 'object') {
      out[key] = deepMerge(base[key] as Record<string, unknown>, val as Record<string, unknown>) as T[keyof T]
    } else if (val !== undefined) {
      out[key] = val as T[keyof T]
    }
  }
  return out
}

function migratePioneerFounding(
  pioneer: Partial<TierConfig['pioneer']> & { launchDiscount?: LaunchDiscountConfig },
): FoundingPricingConfig {
  if (pioneer.foundingPricing) return pioneer.foundingPricing
  const legacy = pioneer.launchDiscount
  if (legacy) {
    return {
      enabled: legacy.enabled,
      maxSlots: legacy.maxPioneers ?? DEFAULT_TIER_CONFIG.pioneer.foundingPricing.maxSlots,
      headline: legacy.headline?.includes('Pioneer')
        ? 'Founding Pioneer rate'
        : (legacy.headline ?? DEFAULT_TIER_CONFIG.pioneer.foundingPricing.headline),
      grandfatherNote: DEFAULT_FOUNDING_GRANDFATHER,
    }
  }
  return DEFAULT_TIER_CONFIG.pioneer.foundingPricing
}

function migrateExplorerFromPioneer(raw: Partial<TierConfig>): TierConfig['explorer'] {
  if (raw.explorer?.pricing) {
    const limits = migrateUserTierLimits(raw.explorer, DEFAULT_TIER_CONFIG.explorer)
    const pricing = ensurePaidPricing(raw.explorer.pricing, DEFAULT_TIER_CONFIG.explorer.pricing)
    if (raw.explorer.pricing.monthly === 14.99 && pricing.monthly === 14.99) {
      pricing.monthly = DEFAULT_TIER_CONFIG.explorer.pricing.monthly
      pricing.annual = DEFAULT_TIER_CONFIG.explorer.pricing.annual
    }
    return {
      ...limits,
      pricing,
      foundingPricing: raw.explorer.foundingPricing ?? DEFAULT_TIER_CONFIG.explorer.foundingPricing,
    }
  }
  const pioneer = raw.pioneer
  if (pioneer?.pricing) {
    const limits = migrateUserTierLimits(
      {
        ...raw.explorer,
        publicEventLimit: pioneer.publicEventLimit ?? DEFAULT_TIER_CONFIG.explorer.publicEventLimit,
        monthlyBoosts: pioneer.monthlyBoosts ?? DEFAULT_TIER_CONFIG.explorer.monthlyBoosts,
        businessListing: pioneer.businessListing ?? false,
        hiddenGemSlotsIncluded: pioneer.hiddenGemSlotsIncluded ?? 0,
        fees: pioneer.fees ?? DEFAULT_TIER_CONFIG.explorer.fees,
      },
      DEFAULT_TIER_CONFIG.explorer,
    )
    return {
      ...limits,
      pricing: ensurePaidPricing(pioneer.pricing, DEFAULT_TIER_CONFIG.explorer.pricing),
      foundingPricing: pioneer.foundingPricing
        ? {
            ...pioneer.foundingPricing,
            headline: pioneer.foundingPricing.headline?.includes('Explorer')
              ? pioneer.foundingPricing.headline
              : 'Founding Explorer rate',
          }
        : DEFAULT_TIER_CONFIG.explorer.foundingPricing,
    }
  }
  return DEFAULT_TIER_CONFIG.explorer
}

function ensurePaidPricing(
  pricing: Partial<PaidPlanPricing> | undefined,
  defaults: PaidPlanPricing,
): PaidPlanPricing {
  return {
    monthly: pricing?.monthly ?? defaults.monthly,
    annual: pricing?.annual ?? defaults.annual,
    wasMonthly: pricing?.wasMonthly ?? defaults.wasMonthly,
    wasAnnual: pricing?.wasAnnual ?? defaults.wasAnnual,
  }
}

function migrateBadges(raw: Partial<TierConfig>): TierConfig['badges'] {
  const merged = { ...DEFAULT_TIER_CONFIG.badges, ...raw.badges }
  const legacyVerified = raw.badges?.verified
  if (legacyVerified?.label === 'Verified Host') {
    merged.verified = { ...merged.verified, label: 'Verified' }
  }
  if (!raw.badges?.unverified) merged.unverified = DEFAULT_TIER_CONFIG.badges.unverified
  if (!raw.badges?.explorer) {
    merged.explorer = raw.badges?.pioneer
      ? {
          ...DEFAULT_TIER_CONFIG.badges.explorer,
          label: 'Explorer',
          summary: 'Personal upgrade — no ads, Travel Pass & Road Trip included.',
          cardBorderColor: BRAND_TOKENS.user.explorer,
          pillClass: EXPLORER_PILL_CLASS,
        }
      : DEFAULT_TIER_CONFIG.badges.explorer
  }
  if (merged.explorer.pillClass === 'bg-purple/15 text-purple') {
    merged.explorer = { ...merged.explorer, pillClass: EXPLORER_PILL_CLASS }
  }
  if (merged.pioneer.label !== 'Pioneer') merged.pioneer = DEFAULT_TIER_CONFIG.badges.pioneer
  if (merged.trusted.label !== 'Trusted Host') merged.trusted = DEFAULT_TIER_CONFIG.badges.trusted
  if (merged.trusted.pillClass.includes('blue-500') || merged.trusted.pillClass.includes('blue-600')) {
    merged.trusted = { ...merged.trusted, pillClass: DEFAULT_TIER_CONFIG.badges.trusted.pillClass }
  }
  return merged
}

function migrateLegacy(raw: LegacyTierConfig & Partial<TierConfig>): TierConfig {
  const merged = deepMerge(DEFAULT_TIER_CONFIG, raw as Partial<TierConfig>)
  merged.explorer = migrateExplorerFromPioneer(raw)
  merged.verified = migrateUserTierLimits(raw.verified, DEFAULT_TIER_CONFIG.verified)
  merged.unverifiedPerks = ensureUserPlanPerks(
    raw.unverifiedPerks ?? {
      ...DEFAULT_UNVERIFIED_PERKS,
      privateEventLimit: raw.unverifiedPrivateLimit ?? DEFAULT_TIER_CONFIG.unverifiedPrivateLimit,
    },
    DEFAULT_UNVERIFIED_PERKS,
  )
  merged.unverifiedPerks.privateEventLimit =
    raw.unverifiedPrivateLimit ?? merged.unverifiedPrivateLimit ?? DEFAULT_UNVERIFIED_PERKS.privateEventLimit
  merged.badges = migrateBadges(raw)
  const storedVersion = (raw as LegacyTierConfig).version

  if ((storedVersion === 4 || storedVersion === 5) && raw.verified && raw.pioneer && raw.trusted) {
    merged.pioneer = {
      ...merged.pioneer,
      pricing: ensurePaidPricing(raw.pioneer?.pricing, DEFAULT_TIER_CONFIG.pioneer.pricing),
      foundingPricing: migratePioneerFounding(raw.pioneer ?? {}),
    }
    merged.trusted = {
      ...merged.trusted,
      pricing: ensurePaidPricing(raw.trusted?.pricing, DEFAULT_TIER_CONFIG.trusted.pricing),
      foundingPricing: raw.trusted?.foundingPricing ?? DEFAULT_TIER_CONFIG.trusted.foundingPricing,
    }
    merged.microTransactionListPrices =
      raw.microTransactionListPrices ?? DEFAULT_TIER_CONFIG.microTransactionListPrices
    merged.addonFounding = raw.addonFounding ?? DEFAULT_TIER_CONFIG.addonFounding
    merged.version = 5
    return merged
  }

  if ((storedVersion === 3 || storedVersion === 2) && raw.verified && raw.pioneer && raw.trusted) {
    merged.pioneer = {
      ...merged.pioneer,
      pricing: ensurePaidPricing(raw.pioneer?.pricing, DEFAULT_TIER_CONFIG.pioneer.pricing),
      foundingPricing: migratePioneerFounding(raw.pioneer ?? {}),
    }
    merged.trusted = {
      ...merged.trusted,
      pricing: ensurePaidPricing(
        {
          ...raw.trusted?.pricing,
          wasAnnual: raw.trusted?.pricing?.wasAnnual ?? DEFAULT_TIER_CONFIG.trusted.pricing.wasAnnual,
        },
        DEFAULT_TIER_CONFIG.trusted.pricing,
      ),
      foundingPricing: raw.trusted?.foundingPricing ?? DEFAULT_TIER_CONFIG.trusted.foundingPricing,
    }
    merged.microTransactionListPrices =
      raw.microTransactionListPrices ?? DEFAULT_TIER_CONFIG.microTransactionListPrices
    merged.addonFounding = raw.addonFounding ?? DEFAULT_TIER_CONFIG.addonFounding
    if (storedVersion === 2) {
      merged.microTransactions = {
        ...merged.microTransactions,
        hiddenGemSingle: DEFAULT_TIER_CONFIG.microTransactions.hiddenGemSingle,
        hiddenGem3Pack: DEFAULT_TIER_CONFIG.microTransactions.hiddenGem3Pack,
      }
    }
    merged.version = 5
    return merged
  }

  const legacyMerged = deepMerge(DEFAULT_TIER_CONFIG, {
    unverifiedPublicLimit: raw.freePublicLimit ?? raw.unverifiedPublicLimit ?? 0,
    verified: {
      publicEventLimit: raw.verifiedPublicLimit ?? raw.verified?.publicEventLimit ?? 5,
    },
    pioneer: {
      publicEventLimit: raw.tier1PublicLimit ?? raw.pioneer?.publicEventLimit ?? 10,
    },
    trusted: {
      publicEventLimit: raw.tier2PublicLimit ?? raw.trusted?.publicEventLimit ?? 20,
    },
  } as Partial<TierConfig>)

  legacyMerged.explorer = migrateExplorerFromPioneer(raw)
  legacyMerged.verified = migrateUserTierLimits(raw.verified, DEFAULT_TIER_CONFIG.verified)
  legacyMerged.badges = migrateBadges(raw)
  legacyMerged.version = 5
  return legacyMerged
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getTierConfig(): TierConfig {
  const stored = readJson<LegacyTierConfig & Partial<TierConfig>>(TIER_CONFIG_KEY, {})
  if (!stored || Object.keys(stored).length === 0) return { ...DEFAULT_TIER_CONFIG }
  return migrateLegacy(stored)
}

export function saveTierConfig(config: TierConfig): void {
  writeJson(TIER_CONFIG_KEY, { ...config, version: 5 })
}

export function resetTierConfig(): TierConfig {
  const fresh = { ...DEFAULT_TIER_CONFIG }
  writeJson(TIER_CONFIG_KEY, fresh)
  return fresh
}

export function formatFeeLabel(fees: TierFeeStructure): string {
  const perTicket = `$${(fees.perTicketCents / 100).toFixed(2)}/ticket`
  if (fees.platformPercent === 0) {
    return `0% + ${perTicket} + Stripe processing`
  }
  return `${fees.platformPercent}% + ${perTicket} + Stripe processing`
}

export function getUnverifiedPrivateEventLimit(): number {
  return getTierConfig().unverifiedPrivateLimit ?? DEFAULT_UNVERIFIED_PERKS.privateEventLimit ?? 2
}

/** Personal-track private event cap — null means unlimited. */
export function getPrivateEventLimitForUserPlan(planId: UserPlanId): number | null {
  const config = getTierConfig()
  switch (planId) {
    case 'unverified':
      return config.unverifiedPrivateLimit ?? config.unverifiedPerks.privateEventLimit ?? 2
    case 'verified':
      return config.verified.privateEventLimit ?? DEFAULT_VERIFIED_PERKS.privateEventLimit
    case 'explorer':
      return config.explorer.privateEventLimit
    default:
      return null
  }
}

export function getUserPlanPerks(planId: UserPlanId): UserPlanPerks {
  const config = getTierConfig()
  switch (planId) {
    case 'verified':
      return ensureUserPlanPerks(config.verified, DEFAULT_VERIFIED_PERKS)
    case 'explorer':
      return ensureUserPlanPerks(config.explorer, DEFAULT_EXPLORER_PERKS)
    default:
      return ensureUserPlanPerks(
        {
          ...config.unverifiedPerks,
          privateEventLimit: config.unverifiedPrivateLimit ?? config.unverifiedPerks.privateEventLimit,
        },
        DEFAULT_UNVERIFIED_PERKS,
      )
  }
}

export function formatPrivateEventLimitLabel(limit: number | null): string {
  if (limit === null) return 'Unlimited private events'
  if (limit === 1) return '1 private event'
  return `${limit} private events`
}

export function formatThemeSlotsLabel(slots: number, extraThemes: boolean): string {
  if (extraThemes) {
    return slots > 0 ? `${slots} base themes + extra theme packs` : 'Extra theme packs'
  }
  if (slots === 2) return '1 dark + 1 light theme'
  if (slots <= 0) return 'Default theme only'
  return `${slots} profile theme${slots === 1 ? '' : 's'}`
}

export function isPaidPlanId(planId: TierPlanId): planId is 'explorer' | 'pioneer' | 'trusted' {
  return planId === 'explorer' || planId === 'pioneer' || planId === 'trusted'
}

export function getPublicLimitForUserTier(tier: 'free' | 'verified' | 'tier1' | 'tier2', verified: boolean): number {
  const config = getTierConfig()
  switch (tier) {
    case 'tier2':
      return config.trusted.publicEventLimit
    case 'tier1':
      return config.explorer.publicEventLimit
    default:
      if (!verified) return config.unverifiedPublicLimit
      return config.verified.publicEventLimit
  }
}

/** @deprecated Use resolveUserPlanId or resolveOrgPlanId with scope. */
export function userTierToPlanId(tier: 'free' | 'verified' | 'tier1' | 'tier2'): TierPlanId {
  return resolveUserPlanId(tier, tier === 'free' ? 'unverified' : 'phone_verified')
}

export function resolveUserPlanId(
  tier: 'free' | 'verified' | 'tier1' | 'tier2',
  verificationStatus: 'unverified' | 'phone_verified',
): UserPlanId {
  if (verificationStatus !== 'phone_verified') return 'unverified'
  if (tier === 'tier1') return 'explorer'
  // tier2 on the account record is org subscription storage — personal track caps at verified.
  if (tier === 'verified' || tier === 'tier2') return 'verified'
  return 'unverified'
}

export function resolveOrgPlanId(
  tier: 'free' | 'verified' | 'tier1' | 'tier2',
  verificationStatus: 'unverified' | 'phone_verified',
  orgApproved: boolean,
): OrgPlanId {
  if (!orgApproved) return 'unverified'
  if (tier === 'tier2') return 'trusted'
  if (tier === 'tier1') return 'pioneer'
  if (verificationStatus === 'phone_verified') return 'verified'
  return 'unverified'
}

export function userPlanIdToUserTier(planId: UserPlanId): 'free' | 'verified' | 'tier1' | 'tier2' {
  switch (planId) {
    case 'explorer':
      return 'tier1'
    case 'verified':
      return 'verified'
    default:
      return 'free'
  }
}

export function orgPlanIdToUserTier(planId: OrgPlanId): 'free' | 'verified' | 'tier1' | 'tier2' {
  switch (planId) {
    case 'trusted':
      return 'tier2'
    case 'pioneer':
      return 'tier1'
    case 'verified':
      return 'verified'
    default:
      return 'free'
  }
}

/** @deprecated Use userPlanIdToUserTier or orgPlanIdToUserTier with scope. */
export function planIdToUserTier(planId: TierPlanId): 'free' | 'verified' | 'tier1' | 'tier2' {
  if (planId === 'trusted') return 'tier2'
  if (planId === 'pioneer' || planId === 'explorer') return 'tier1'
  if (planId === 'verified') return 'verified'
  return 'free'
}

/** Tier-included Hidden Gem slots for the org owner's account. */
export function getHiddenGemSlotsIncludedForUserTier(
  tier: 'free' | 'verified' | 'tier1' | 'tier2',
  verified: boolean,
): number {
  if (!verified) return 0
  const config = getTierConfig()
  switch (tier) {
    case 'tier2':
      return config.trusted.hiddenGemSlotsIncluded ?? (config.trusted.businessListing ? 1 : 0)
    case 'tier1':
      return config.pioneer.hiddenGemSlotsIncluded ?? 0
    default:
      return config.verified.hiddenGemSlotsIncluded ?? 0
  }
}

/** Event Marketplace included on org paid tiers (Control Room toggle per tier). */
export function isMarketplaceEnabledForOrgPlan(planId: OrgPlanId): boolean {
  const config = getTierConfig()
  switch (planId) {
    case 'pioneer':
      return config.pioneer.marketplaceEnabled
    case 'trusted':
      return config.trusted.marketplaceEnabled
    default:
      return false
  }
}
