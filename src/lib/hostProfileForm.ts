import { getOrganization, getOrganizationApprovalStatus, getCurrentAccount, getAccount, resolveOrgPlanForOrganization } from './account'
import { getOrgApprovalBadge, getTierBadgeForAccount } from './tierDisplay'
import {
  getHostMerchSettingsFromAccount,
  getHostMerchSettingsFromOrg,
  isHostMerchVisible,
  isHostMerchVisibleForOrg,
} from './hostMerch'
import { normalizeSocialUrl } from './hostSocialLinks'
import type { HostContactInfo, PersonalHostSocialLinks } from './personalHostProfile'
import type { PublicHostProfileData } from './publicHostProfile'
import { normalizeWebsiteUrl, isWebsiteInputValid } from './websiteUrl'

export function normalizeHostSocialLinks(social: PersonalHostSocialLinks): PersonalHostSocialLinks {
  const result: PersonalHostSocialLinks = {}
  for (const id of ['website', 'instagram', 'twitter', 'facebook', 'youtube', 'tiktok', 'twitch', 'kick'] as const) {
    const trimmed = social[id]?.trim()
    if (!trimmed) continue
    if (id === 'website') {
      result.website = normalizeWebsiteUrl(trimmed) || trimmed
    } else {
      result[id] = normalizeSocialUrl(trimmed)
    }
  }
  return result
}

export function validateHostProfileForm(input: {
  contactEmail?: string
  social: PersonalHostSocialLinks
  orgName?: string
  isOrg: boolean
}): string | null {
  const email = input.contactEmail?.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Contact email format is invalid.'
  }
  const website = input.social.website?.trim()
  if (website && !isWebsiteInputValid(website)) {
    return 'Website URL looks invalid — try www.yoursite.com or https://…'
  }
  if (input.isOrg && input.orgName !== undefined && !input.orgName.trim()) {
    return 'Organization name is required.'
  }
  return null
}

export type HostProfileFormPreviewInput = {
  kind: 'personal' | 'org'
  displayName: string
  bio: string
  avatarUrl?: string
  galleryImages: string[]
  address?: string
  city?: string
  phone?: string
  email?: string
  social: PersonalHostSocialLinks
  orgId?: string
  userEmail?: string
}

/** Build unsaved public profile preview data from edit-form state (no persistence). */
export function buildHostProfilePreviewFromForm(
  form: HostProfileFormPreviewInput,
): PublicHostProfileData {
  const social = normalizeHostSocialLinks(form.social)
  const contact: HostContactInfo = {
    address: form.address?.trim() || undefined,
    city: form.city?.trim() || undefined,
    phone: form.phone?.trim() || undefined,
    email: form.email?.trim() || undefined,
  }
  const displayName = form.displayName.trim() || (form.kind === 'org' ? 'Your Organization' : 'Host')

  if (form.kind === 'org' && form.orgId) {
    const org = getOrganization(form.orgId)
    const approvalBadge = org
      ? getOrgApprovalBadge(getOrganizationApprovalStatus(org))
      : getOrgApprovalBadge('pending')
    const merchSettings = getHostMerchSettingsFromOrg(org)
    const orgPlanId = org ? resolveOrgPlanForOrganization(org) : 'unverified'
    return {
      kind: 'org',
      id: form.orgId,
      displayName,
      bio: form.bio.trim(),
      avatarUrl: form.avatarUrl?.trim() || undefined,
      social,
      contact,
      tierLabel: approvalBadge.label,
      tierPillClass: approvalBadge.pillClass,
      isVerified: org ? getOrganizationApprovalStatus(org) === 'approved' : false,
      galleryImages: form.galleryImages,
      highlightImages: [],
      upcomingEvents: [],
      showMerchShop: isHostMerchVisibleForOrg(merchSettings, orgPlanId),
      merchShopUrl: merchSettings.merchShopUrl,
    }
  }

  const account =
    form.userEmail ? getAccount(form.userEmail) ?? getCurrentAccount() : getCurrentAccount()
  const tierBadge = account
    ? getTierBadgeForAccount(account.tier, account.verificationStatus)
    : null
  const merchSettings = getHostMerchSettingsFromAccount(account)

  return {
    kind: 'personal',
    id: form.userEmail?.trim().toLowerCase() ?? 'preview',
    displayName,
    bio: form.bio.trim(),
    avatarUrl: form.avatarUrl?.trim() || undefined,
    social,
    contact,
    tierLabel: tierBadge?.label,
    tierPillClass: tierBadge?.pillClass,
    isVerified: account?.verificationStatus === 'phone_verified',
    galleryImages: [],
    highlightImages: [],
    upcomingEvents: [],
    showMerchShop: isHostMerchVisible(merchSettings),
    merchShopUrl: merchSettings.merchShopUrl,
  }
}
