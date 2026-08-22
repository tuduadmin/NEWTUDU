import {
  cancelHiddenGemSubscription,
  getAccount,
  getHiddenGemSlotsPurchased,
  getOrganization,
  getOrganizationOwnerEmail,
  isHiddenGemSubscriptionActive,
  type Organization,
} from './account'
import { getHiddenGemsForOrg, isHiddenGemOnDiscoverDeck, setOrgHiddenGemPublished } from './hiddenGems'
import { getHiddenGemSlotsIncludedForUserTier } from './tierConfig'

export const HOST_HIDDEN_GEMS_HREF = '/host/subscription#hidden-gems'

export type HiddenGemBlockReason = 'upgrade' | 'purchase'

export function getHiddenGemSlotUsed(orgId: string): number {
  return getHiddenGemsForOrg(orgId).filter((g) => isHiddenGemOnDiscoverDeck(g)).length
}

export function getHiddenGemSlotsIncluded(orgId: string): number {
  const org = getOrganization(orgId)
  if (!org) return 0
  return getHiddenGemSlotsIncludedForOrg(org)
}

export function getHiddenGemSlotsIncludedForOrg(org: Organization): number {
  const ownerEmail = getOrganizationOwnerEmail(org)
  const account = getAccount(ownerEmail)
  if (!account) return 0
  const verified = account.verificationStatus === 'phone_verified'
  return getHiddenGemSlotsIncludedForUserTier(account.tier, verified)
}

export function getHiddenGemSlotLimit(orgId: string): number {
  const org = getOrganization(orgId)
  if (!org) return 0
  return getHiddenGemSlotsIncluded(orgId) + getHiddenGemSlotsPurchased(org)
}

export function getRemainingHiddenGemSlots(orgId: string): number {
  const limit = getHiddenGemSlotLimit(orgId)
  return Math.max(0, limit - getHiddenGemSlotUsed(orgId))
}

/** Unpublish deck gems over the current slot limit (keeps saved listings in the box). */
export function enforceHiddenGemSlotLimit(orgId: string): {
  unpublishedCount: number
  message?: string
} {
  const limit = getHiddenGemSlotLimit(orgId)
  const deckGems = getHiddenGemsForOrg(orgId).filter((g) => isHiddenGemOnDiscoverDeck(g))

  if (deckGems.length <= limit) {
    return { unpublishedCount: 0 }
  }

  const sorted = [...deckGems].sort((a, b) => {
    const aTime = a.publishedToDeckAt ? new Date(a.publishedToDeckAt).getTime() : 0
    const bTime = b.publishedToDeckAt ? new Date(b.publishedToDeckAt).getTime() : 0
    return aTime - bTime
  })

  const toUnpublish = sorted.slice(limit)
  let unpublishedCount = 0
  for (const gem of toUnpublish) {
    const result = setOrgHiddenGemPublished(gem.id, false)
    if (result.ok) unpublishedCount++
  }

  return {
    unpublishedCount,
    message:
      unpublishedCount > 0
        ? `${unpublishedCount} Hidden Gem${unpublishedCount === 1 ? '' : 's'} removed from Discover — slot limit reduced. Listings remain saved in your box.`
        : undefined,
  }
}

export function cancelHiddenGemSubscriptionWithEnforcement(orgId: string): {
  ok: boolean
  error?: string
  unpublishedCount?: number
  message?: string
} {
  const result = cancelHiddenGemSubscription(orgId)
  if (!result.ok) {
    return { ok: false, error: result.error }
  }
  const enforcement = enforceHiddenGemSlotLimit(orgId)
  return {
    ok: true,
    unpublishedCount: enforcement.unpublishedCount,
    message: enforcement.message,
  }
}

export function canCreateHiddenGem(
  orgId: string,
  options?: { adminBypass?: boolean },
): {
  allowed: boolean
  reason?: HiddenGemBlockReason
  remaining: number
  limit: number
  includedSlots: number
  purchasedSlots: number
  used: number
  subscriptionActive: boolean
} {
  const org = getOrganization(orgId)
  if (!org) {
    return {
      allowed: false,
      reason: 'upgrade',
      remaining: 0,
      limit: 0,
      includedSlots: 0,
      purchasedSlots: 0,
      used: 0,
      subscriptionActive: false,
    }
  }

  const includedSlots = getHiddenGemSlotsIncludedForOrg(org)
  const purchasedSlots = getHiddenGemSlotsPurchased(org)
  const subscriptionActive = isHiddenGemSubscriptionActive(org)
  const limit = includedSlots + purchasedSlots
  const used = getHiddenGemSlotUsed(orgId)
  const remaining = Math.max(0, limit - used)

  if (options?.adminBypass) {
    return { allowed: true, remaining, limit, includedSlots, purchasedSlots, used, subscriptionActive }
  }

  if (limit === 0) {
    return {
      allowed: false,
      reason: 'upgrade',
      remaining: 0,
      limit,
      includedSlots,
      purchasedSlots,
      used,
      subscriptionActive,
    }
  }

  if (used >= limit) {
    return {
      allowed: false,
      reason: 'purchase',
      remaining: 0,
      limit,
      includedSlots,
      purchasedSlots,
      used,
      subscriptionActive,
    }
  }

  return { allowed: true, remaining, limit, includedSlots, purchasedSlots, used, subscriptionActive }
}

export function hiddenGemBlockMessage(reason: HiddenGemBlockReason): string {
  switch (reason) {
    case 'upgrade':
      return 'Upgrade to Trusted Host or subscribe to Hidden Gem slots to add a permanent listing.'
    case 'purchase':
      return 'You have used all Hidden Gem slots. Subscribe for additional slots to publish another listing.'
  }
}

export function isHiddenGemLimitTight(remaining: number): boolean {
  return remaining <= 0
}

/** Event Manager slot line, e.g. "2/2 Hidden Gem slots (subscribed)". */
export function formatEventManagerHiddenGemSlots(check: {
  used: number
  limit: number
  purchasedSlots: number
  subscriptionActive: boolean
}): string {
  if (check.limit === 0) {
    return `${check.used}/0 — Subscribe for Hidden Gems`
  }
  if (check.subscriptionActive && check.purchasedSlots > 0) {
    return `${check.used}/${check.limit} Hidden Gem slots (subscribed)`
  }
  return `${check.used}/${check.limit}`
}

/** e.g. "1/1" or "2/3 (+1 subscribed)" */
export function formatHiddenGemSlotUsage(
  used: number,
  includedSlots: number,
  purchasedSlots: number,
  subscriptionActive?: boolean,
): string {
  if (purchasedSlots <= 0 || !subscriptionActive) {
    return `${used}/${includedSlots + purchasedSlots}`
  }
  const total = includedSlots + purchasedSlots
  if (includedSlots > 0) {
    return `${used}/${total} (+${purchasedSlots} subscribed)`
  }
  return `${used}/${total}`
}

/** Full label for host UI, e.g. "Hidden gems: 1/1" */
export function formatHiddenGemSlotLabel(
  used: number,
  includedSlots: number,
  purchasedSlots: number,
  subscriptionActive?: boolean,
): string {
  return `Hidden gems: ${formatHiddenGemSlotUsage(used, includedSlots, purchasedSlots, subscriptionActive)}`
}

/** Usage line for subscription slot packs section. */
export function formatHiddenGemSlotCapacity(
  used: number,
  includedSlots: number,
  purchasedSlots: number,
  subscriptionActive?: boolean,
): string {
  const total = includedSlots + purchasedSlots
  if (total === 0) {
    return 'No Hidden Gem slots — upgrade or subscribe to add a permanent listing'
  }
  if (subscriptionActive && purchasedSlots > 0) {
    const slotWord = purchasedSlots === 1 ? 'slot' : 'slots'
    return `${purchasedSlots} Hidden Gem ${slotWord} — active while subscribed (using ${used}/${total} total)`
  }
  if (purchasedSlots <= 0) {
    return `Using ${used} of ${includedSlots} Hidden Gem slot${includedSlots === 1 ? '' : 's'}`
  }
  const usage = formatHiddenGemSlotUsage(used, includedSlots, purchasedSlots, subscriptionActive)
  return `Using ${usage} Hidden Gem slots (${total} total capacity)`
}
