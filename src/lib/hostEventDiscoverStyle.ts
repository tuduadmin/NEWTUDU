import type { EventCardBorderType } from './eventCardColors'
import {
  ensureAccount,
  getAccount,
  getOrganizationApprovalStatus,
  getOrganizationOwnerEmail,
  getOrganizations,
  type HostEvent,
} from './account'

export type HostDiscoverBadge = 'TRUSTED HOST'

/** Personal host deck border from account tier (matches admin seed picker). */
export function resolvePersonalHostDiscoverBorder(email: string): EventCardBorderType {
  const account = ensureAccount(email)
  if (account.verificationStatus !== 'phone_verified') return 'grey'
  if (account.tier === 'tier1') return 'explorer'
  return 'green'
}

/** Org host deck border from owner subscription tier. */
export function resolveOrgHostDiscoverBorder(orgId: string): EventCardBorderType {
  const org = getOrganizations().find((o) => o.id === orgId)
  if (!org || getOrganizationApprovalStatus(org) !== 'approved') return 'grey'
  const ownerTier = getAccount(getOrganizationOwnerEmail(org))?.tier ?? 'free'
  if (ownerTier === 'tier2') return 'blue'
  if (ownerTier === 'tier1') return 'orange'
  return 'green'
}

export function resolveHostEventDiscoverBorder(event: HostEvent): EventCardBorderType {
  if (event.discoverBorderType) {
    // Legacy alias — personal verified used teal before explorer border existed.
    if (event.discoverBorderType === 'teal') return 'green'
    return event.discoverBorderType
  }
  if (event.hostAccountId) {
    return resolveOrgHostDiscoverBorder(event.hostAccountId)
  }
  return resolvePersonalHostDiscoverBorder(event.createdBy)
}

/** Deck corner badges — Hidden Gem is for gem listings only, not host events. */
export function resolveHostEventDiscoverBadges(event: HostEvent): HostDiscoverBadge[] {
  if (!event.hostAccountId) return []
  const org = getOrganizations().find((o) => o.id === event.hostAccountId)
  if (!org || getOrganizationApprovalStatus(org) !== 'approved') return []
  const ownerTier = getAccount(getOrganizationOwnerEmail(org))?.tier ?? 'free'
  if (ownerTier === 'tier2') return ['TRUSTED HOST']
  return []
}
