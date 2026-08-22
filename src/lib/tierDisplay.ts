import type { OrgApprovalStatus, UserTier, VerificationStatus } from './account'
import {
  BRAND_TOKENS,
  pillStyleFromHex,
  userTierTokenColor,
  orgTierTokenColor,
} from './brandTokens'
import {
  formatFeeLabel,
  getTierConfig,
  resolveOrgPlanId,
  resolveUserPlanId,
  type TierPlanId,
} from './tierConfig'

export type { TierPlanId }

export type TierBadgeAction =
  | { type: 'verify'; text: string; href: string }
  | { type: 'upgrade'; text: string; href: string }
  | { type: 'manage'; text: string; href: string }

export type TierBadgeDisplay = {
  planId: TierPlanId
  label: string
  pillClass: string
  summary: string
  action?: TierBadgeAction
}

/** Verified host pill — brand token user-verified. */
export const VERIFIED_HOST_PILL_CLASS = 'bg-success/25 text-success-deep'

export const VERIFIED_HOST_PILL_STYLE = pillStyleFromHex(BRAND_TOKENS.user.verified)

/** Unverified — brand token user-unverified / org-unverified. */
export const UNVERIFIED_PILL_STYLE = pillStyleFromHex(BRAND_TOKENS.user.unverified)

/** Explorer (paid) — brand token user-explorer. */
export const EXPLORER_PILL_STYLE = pillStyleFromHex(BRAND_TOKENS.user.explorer)

export const PIONEER_PILL_STYLE = pillStyleFromHex(BRAND_TOKENS.org.pioneer)

export const TRUSTED_HOST_PILL_STYLE = pillStyleFromHex(BRAND_TOKENS.org.trustedHost)

/** @deprecated Prefer UNVERIFIED_PILL_STYLE — kept for class-based call sites. */
export const UNVERIFIED_PILL_CLASS = 'bg-gray-400/20 text-gray-600'

/** @deprecated Prefer EXPLORER_PILL_STYLE */
export const EXPLORER_PILL_CLASS = 'bg-teal-500/15 text-teal-700'

/** Host/cream-theme pill colors by internal user tier. */
export function getTierPillClass(tier: UserTier): string {
  switch (tier) {
    case 'tier2':
      return 'bg-blue-500/15 text-blue-600'
    case 'tier1':
      return 'bg-orange/15 text-orange'
    case 'verified':
      return VERIFIED_HOST_PILL_CLASS
    default:
      return UNVERIFIED_PILL_CLASS
  }
}

export function getTierPillStyle(tier: UserTier): { backgroundColor: string; color: string } {
  switch (tier) {
    case 'tier2':
      return pillStyleFromHex(BRAND_TOKENS.org.trustedHost)
    case 'tier1':
      return pillStyleFromHex(BRAND_TOKENS.org.pioneer)
    case 'verified':
      return VERIFIED_HOST_PILL_STYLE
    default:
      return UNVERIFIED_PILL_STYLE
  }
}

export function getPersonalUserTierPillStyle(
  bucket: 'unverified' | 'verified' | 'explorer',
): { backgroundColor: string; color: string } {
  return pillStyleFromHex(userTierTokenColor(bucket))
}

export function getOrgTierPillStyle(
  bucket: 'unverified' | 'verified' | 'pioneer' | 'trusted',
): { backgroundColor: string; color: string } {
  return pillStyleFromHex(orgTierTokenColor(bucket === 'trusted' ? 'trustedHost' : bucket))
}

export function getTierBadgeForPlan(planId: TierPlanId): TierBadgeDisplay {
  const config = getTierConfig()
  const badge = config.badges[planId]
  return {
    planId,
    label: badge.label,
    pillClass: badge.pillClass,
    summary: badge.summary,
  }
}

/** Host Account approval badge — shown in Event Manager org mode. */
export function getOrgApprovalBadge(status: OrgApprovalStatus): TierBadgeDisplay {
  switch (status) {
    case 'approved':
      return {
        planId: 'verified',
        label: 'Verified',
        pillClass: VERIFIED_HOST_PILL_CLASS,
        summary: 'Host Account approved - public events unlocked.',
      }
    case 'rejected':
      return {
        planId: 'verified',
        label: 'Rejected',
        pillClass: 'bg-rose-100 text-rose-700',
        summary: 'Host Account was not approved. Contact support for details.',
      }
    default:
      return {
        planId: 'verified',
        label: 'Unverified',
        pillClass: UNVERIFIED_PILL_CLASS,
        summary: 'Pending Control Room approval before public events.',
      }
  }
}

/** Personal user badge — never shows org plans (Pioneer / Trusted Host). */
export function getTierBadgeForAccount(
  tier: UserTier,
  verificationStatus: VerificationStatus,
): TierBadgeDisplay {
  const planId = resolveUserPlanId(tier, verificationStatus)

  if (planId === 'unverified') {
    return {
      planId: 'verified',
      label: 'Unverified',
      pillClass: getTierPillClass('free'),
      summary: 'Verify your phone to unlock public events.',
      action: { type: 'verify', text: 'Verify', href: '/verify-phone' },
    }
  }

  if (planId === 'explorer') {
    const display = getTierBadgeForPlan('explorer')
    return {
      ...display,
      action: { type: 'manage', text: 'Manage', href: '/host/subscription' },
    }
  }

  const display = getTierBadgeForPlan('verified')
  return {
    ...display,
    label: 'Verified',
    pillClass: getTierPillClass('verified'),
    summary: 'Phone verified - 5 public events/mo, bucket list, Travel Pass trial.',
    action: { type: 'upgrade', text: 'UPGRADE', href: '/host/subscription' },
  }
}

/** Org subscription badge from the owner account tier (Pioneer / Trusted Host). */
export function getOrgSubscriptionBadgeForAccount(
  tier: UserTier,
  verificationStatus: VerificationStatus,
  orgApproved: boolean,
): TierBadgeDisplay | null {
  const planId = resolveOrgPlanId(tier, verificationStatus, orgApproved)
  if (planId === 'unverified' || planId === 'verified') return null
  const display = getTierBadgeForPlan(planId)
  return {
    ...display,
    action: { type: 'manage', text: 'Manage', href: '/host/subscription' },
  }
}

export function getPlanCardMeta(planId: TierPlanId): {
  title: string
  subtitle: string
  borderColor: string
  feeLabel: string
} {
  const config = getTierConfig()
  const badge = config.badges[planId]
  const limits =
    planId === 'unverified'
      ? config.verified
      : planId === 'verified' || planId === 'explorer' || planId === 'pioneer' || planId === 'trusted'
        ? config[planId]
        : config.verified
  const feeLabel = formatFeeLabel(limits.fees)

  const subtitles: Partial<Record<TierPlanId, string>> = {
    unverified: 'Private events only until verified',
    verified: 'Free forever — phone verification required',
    explorer: 'No ads — Travel Pass & Road Trip included',
    pioneer: 'Early org supporter — more reach',
    trusted: 'Businesses, venues & high-volume sellers',
  }

  return {
    title: badge.label,
    subtitle: subtitles[planId] ?? badge.summary,
    borderColor: badge.cardBorderColor,
    feeLabel,
  }
}
