import {
  getAccount,
  getHostEvents,
  getOrganization,
  getOrganizationApprovalStatus,
  getOrgDepartments,
  resolveOrgPlanForOrganization,
  type HostEvent,
  type OrgDepartment,
} from './account'
import { getOrgHostProfile } from './orgHostProfile'
import {
  getPersonalHostNameFallback,
  getPersonalHostProfile,
  resolvePersonalHostDisplayName,
  type HostContactInfo,
} from './personalHostProfile'
import {
  getHostMerchSettingsFromAccount,
  getHostMerchSettingsFromOrg,
  isHostMerchVisible,
  isHostMerchVisibleForOrg,
} from './hostMerch'
import { getOrgApprovalBadge, getTierBadgeForAccount } from './tierDisplay'

export type PublicHostKind = 'personal' | 'org'

export type PublicHostProfileData = {
  kind: PublicHostKind
  id: string
  displayName: string
  bio: string
  avatarUrl?: string
  social: ReturnType<typeof getPersonalHostProfile>['social']
  contact: HostContactInfo
  tierLabel?: string
  tierPillClass?: string
  isVerified: boolean
  galleryImages: string[]
  highlightImages: string[]
  upcomingEvents: HostEvent[]
  departments?: OrgDepartment[]
  showMerchShop: boolean
  merchShopUrl?: string
}

const UPCOMING_LIMIT = 5

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isUpcomingPublicEvent(event: HostEvent, now = new Date()): boolean {
  if (event.visibility !== 'public') return false
  if (event.status !== 'live' && event.status !== 'upcoming') return false
  if (event.eventDate) {
    const end = new Date(`${event.eventDate}T23:59:59`)
    if (end < now && event.status !== 'live') return false
  }
  return true
}

function sortEventsByDate(events: HostEvent[]): HostEvent[] {
  return [...events].sort((a, b) => {
    const da = a.eventDate ?? '9999-12-31'
    const db = b.eventDate ?? '9999-12-31'
    if (da !== db) return da.localeCompare(db)
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export function getUpcomingPublicEventsForPersonalHost(email: string): HostEvent[] {
  const normalized = normalizeEmail(email)
  return sortEventsByDate(
    getHostEvents().filter(
      (event) =>
        !event.hostAccountId &&
        isUpcomingPublicEvent(event) &&
        (normalizeEmail(event.createdBy) === normalized ||
          normalizeEmail(event.postedAsUserId ?? '') === normalized),
    ),
  ).slice(0, UPCOMING_LIMIT)
}

export function getUpcomingPublicEventsForOrg(orgId: string): HostEvent[] {
  return sortEventsByDate(
    getHostEvents().filter(
      (event) => event.hostAccountId === orgId && isUpcomingPublicEvent(event),
    ),
  ).slice(0, UPCOMING_LIMIT)
}

function collectHighlightImages(avatarUrl: string | undefined, events: HostEvent[]): string[] {
  const images: string[] = []
  if (avatarUrl?.trim()) images.push(avatarUrl.trim())
  for (const event of events) {
    for (const photo of event.photos ?? []) {
      if (photo.trim() && !images.includes(photo.trim())) {
        images.push(photo.trim())
      }
      if (images.length >= 3) return images
    }
  }
  return images.slice(0, 3)
}

export type PublicProfileFrom = 'host' | 'host-profile'

function appendPublicProfileFrom(url: string, from?: PublicProfileFrom): string {
  if (!from) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}from=${from}`
}

export function getPublicProfileBackUrl(from: string | null | undefined): string {
  switch (from) {
    case 'host':
    case 'event-manager':
      return '/host'
    case 'host-profile':
      return '/host/profile'
    default:
      return '/discover'
  }
}

export function getPersonalPublicProfileUrl(email: string, from?: PublicProfileFrom): string {
  return appendPublicProfileFrom(
    `/host/view/personal/${encodeURIComponent(normalizeEmail(email))}`,
    from,
  )
}

export function getOrgPublicProfileUrl(orgId: string, from?: PublicProfileFrom): string {
  return appendPublicProfileFrom(`/host/view/${encodeURIComponent(orgId)}`, from)
}

export function getHostProfileUrlFromEvent(event: HostEvent): string | null {
  if (event.hostAccountId) return getOrgPublicProfileUrl(event.hostAccountId)
  const email = event.postedAsUserId ?? event.createdBy
  if (!email) return null
  return getPersonalPublicProfileUrl(email)
}

function pickContact(profile: {
  address?: string
  phone?: string
  email?: string
  city?: string
}): HostContactInfo {
  return {
    address: profile.address?.trim() || undefined,
    phone: profile.phone?.trim() || undefined,
    email: profile.email?.trim() || undefined,
    city: profile.city?.trim() || undefined,
  }
}

export function loadPersonalPublicProfile(userId: string): PublicHostProfileData | null {
  const email = decodeURIComponent(userId).trim()
  if (!email) return null

  const fallbackName = getPersonalHostNameFallback(email)
  const profile = getPersonalHostProfile(email, fallbackName)
  const upcomingEvents = getUpcomingPublicEventsForPersonalHost(email)
  const account = getAccount(email)
  const tierBadge = account
    ? getTierBadgeForAccount(account.tier, account.verificationStatus)
    : null
  const isVerified = account?.verificationStatus === 'phone_verified'
  const merchSettings = getHostMerchSettingsFromAccount(account)

  return {
    kind: 'personal',
    id: normalizeEmail(email),
    displayName: resolvePersonalHostDisplayName(email, fallbackName),
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    social: profile.social,
    contact: pickContact(profile),
    tierLabel: tierBadge?.label,
    tierPillClass: tierBadge?.pillClass,
    isVerified,
    galleryImages: [],
    highlightImages: collectHighlightImages(profile.avatarUrl, upcomingEvents),
    upcomingEvents,
    showMerchShop: isHostMerchVisible(merchSettings),
    merchShopUrl: merchSettings.merchShopUrl,
  }
}

export function loadOrgPublicProfile(orgId: string): PublicHostProfileData | null {
  const org = getOrganization(orgId)
  if (!org) return null

  const profile = getOrgHostProfile(orgId)
  const upcomingEvents = getUpcomingPublicEventsForOrg(orgId)
  const departments = getOrgDepartments(orgId)
  const approvalBadge = getOrgApprovalBadge(getOrganizationApprovalStatus(org))
  const isVerified = getOrganizationApprovalStatus(org) === 'approved'
  const merchSettings = getHostMerchSettingsFromOrg(org)
  const orgPlanId = resolveOrgPlanForOrganization(org)

  return {
    kind: 'org',
    id: orgId,
    displayName: org.name,
    bio: profile.bio?.trim() || org.profile?.trim() || '',
    avatarUrl: profile.logoUrl,
    social: profile.social,
    contact: pickContact(profile),
    tierLabel: approvalBadge.label,
    tierPillClass: approvalBadge.pillClass,
    isVerified,
    galleryImages: profile.galleryImages ?? [],
    highlightImages: collectHighlightImages(profile.logoUrl, upcomingEvents),
    upcomingEvents,
    departments,
    showMerchShop: isHostMerchVisibleForOrg(merchSettings, orgPlanId),
    merchShopUrl: merchSettings.merchShopUrl,
  }
}
