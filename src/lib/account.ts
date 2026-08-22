import { birthYearFromDob, getHomeRegionFromCity, type GenderOption } from './demographics'
import {
  expandOccurrenceDates,
  getEffectiveOccurrences,
  isHostEventDiscoverVisible,
  migrateScheduleFields,
  scheduleFieldsFromForm,
  type DayShape,
  type EventOccurrence,
  type ScheduleRepeatMode,
  type ScheduleMode,
  type ScheduleType,
} from './eventSchedule'

export type { DayShape, EventOccurrence, ScheduleMode, ScheduleRepeatMode, ScheduleType } from './eventSchedule'
import { getCurrentUser, getSessionEmail } from './auth'
import { addUserNotification } from './userNotifications'
import { getHomeCity } from './location'
import { parsePhoneDigits } from './phoneFormat'
import { notifyHostProfilesCleared } from './hostProfileStore'
import { persistOrgMerchSettings, persistUserMerchSettings, type HostMerchSettings } from './hostMerch'
import { isRemovedDemoHostEvent } from './removedDemoEvents'
import { isEventHiddenFromDiscover } from './adminEventModeration'
import {
  getPrivateEventLimitForUserPlan,
  getPublicLimitForUserTier,
  getTierConfig,
  getUserPlanPerks,
  orgPlanIdToUserTier,
  resolveOrgPlanId,
  resolveUserPlanId,
  userPlanIdToUserTier,
  type OrgPlanId,
  type TierFeeStructure,
  type UserPlanId,
  type UserPlanPerks,
} from './tierConfig'
import type { DoorPaymentMode } from './eventDoorPayment'

export type VerificationStatus = 'unverified' | 'phone_verified'
export type UserTier = 'free' | 'verified' | 'tier1' | 'tier2'
export type SuspendDuration = '24h' | '3d' | '1w' | '1mo'
export type AccountType = 'personal' | 'organization_member'
export type OrgRole = 'owner' | 'admin' | 'staff' | 'viewer'
export type EventVisibility = 'public' | 'private'
/** Wizard-only — neither option selected until the host chooses on Review. */
export type EventVisibilityChoice = EventVisibility | ''
export type HostEventStatus = 'draft' | 'upcoming' | 'live' | 'past'
export type PostingAs = 'personal' | string
export type EventType = 'single' | 'multi-day' | 'seasonal'
export type RepeatPattern = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type VisitDuration = 'short' | 'medium' | 'long'
export type AgeRestriction = 'all-ages' | 'family-friendly' | '18+'
export type TicketingMode = 'free_rsvp' | 'free_donation' | 'sell' | 'external'
export type ChecklistItemType = 'single_pick' | 'multi_check' | 'text_note'
export type ChecklistTemplate = 'potluck' | 'conference' | 'custom'

export type ChecklistItem = {
  id: string
  label: string
  day?: string
  type: ChecklistItemType
  /** How many guests may claim this item (default 1). */
  maxClaims?: number
  /** Guest may add a note when claiming (e.g. "vegan dressing"). */
  allowNote?: boolean
}

export type EventChecklist = {
  enabled: boolean
  mandatory: boolean
  allowSkip: boolean
  template: ChecklistTemplate | null
  items: ChecklistItem[]
}

export type TicketTier = {
  id: string
  name: string
  priceCents: number
  quantity: number | null
  sold: number
  description: string
  availableAtDoor: boolean
}

/** Per schedule occurrence — shared capacity pool + price tiers. */
export type TicketSession = {
  occurrenceIndex: number
  capacity: number | null
  tiers: TicketTier[]
  /** When true, capacity + tiers mirror session 0 (default for extra time slots). */
  tiersLocked?: boolean
}

export const MAX_EVENT_ADDITIONAL_PHOTOS = 4
export const MAX_EVENT_PHOTOS_TOTAL = 5

export type HostEventFormData = {
  title: string
  venueName: string
  streetAddress: string
  streetSuite: string
  city: string
  province: string
  postalCode: string
  country: string
  description: string
  /** Card deck cover — shown on Discover swipe card */
  coverImage: string
  /** Up to 4 additional photos for detail panel carousel */
  additionalPhotos: string[]
  eventType: EventType
  /** Canonical day span — drives date inputs and card face. */
  dayShape: DayShape
  /** @deprecated — derived from dayShape on save. */
  scheduleType: ScheduleType
  /** Repeat frequency — none, weekly, biweekly, or monthly. */
  repeats: RepeatPattern
  /** How many times the card appears on deck when repeating. */
  weeksOnDeck: number
  /** Guests pick a day/date when buying — per-day tickets. */
  sellTicketsPerDay: boolean
  /** @deprecated — use sellTicketsPerDay */
  advancedTicketSales: boolean
  recurrenceStartDate: string
  recurrenceEndDate: string
  /** Computed on save from weeksOnDeck when recurring. */
  seriesEndDate: string
  /** @deprecated — migrated to weeksOnDeck */
  recurrenceCount: number | null
  /** Explicit dates when dayShape is pick_dates. */
  multiDates: string[]
  /** Per-date schedule rows — canonical for calendar multi-pick. */
  occurrences: EventOccurrence[]
  /** Repeat UX mode: none, pattern (weekly/etc), or multi_pick. */
  scheduleRepeatMode: ScheduleRepeatMode
  /** Top-level schedule type: single, multiple, or seasonal (stub). */
  scheduleMode: ScheduleMode
  /** Same day, multiple seatings (e.g. tea party 11–1, 2–4, 3–6). */
  scheduleTimeSlots: boolean
  /** @deprecated — folded into multi_day date range */
  seasonStartDate: string
  /** @deprecated — folded into multi_day date range */
  seasonEndDate: string
  /** Optional go-live datetime — card hidden from Discover until then. */
  scheduledPublishAt: string
  eventDate: string
  startHour: string
  startMinute: string
  startPeriod: 'AM' | 'PM'
  endHour: string
  endMinute: string
  endPeriod: 'AM' | 'PM'
  allDay: boolean
  visitDuration: VisitDuration
  primaryCategory: string
  secondaryCategory: string
  subCategories: string[]
  customTags: string[]
  ticketTiers: TicketTier[]
  /** Per-occurrence ticketing — canonical when schedule has multiple rows. */
  ticketSessions: TicketSession[]
  ticketingMode: TicketingMode
  capacity: number | null
  waitlistEnabled: boolean
  externalTicketUrl: string
  checklist: EventChecklist
  ageRestriction: AgeRestriction | ''
  amenities: string[]
  doorPayment: DoorPaymentMode
  atmOnSite: boolean
  visibility: EventVisibilityChoice
  /** Individual emails invited when visibility is private. */
  privateInviteEmails: string[]
  /** Saved share lists to include when visibility is private. */
  privateShareListIds: string[]
}

/** Host Account — business entity separate from User (stored as Organization). */
export type OrgApprovalStatus = 'pending' | 'approved' | 'rejected'
export type SeedApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface OrgDepartment {
  id: string
  name: string
  description?: string
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  category: string
  logoInitial: string
  profile?: string
  createdBy: string
  createdAt: string
  /** Primary org admin — personal login email of the Owner (set at create). */
  primaryAdminEmail: string
  /** Optional backup admin email; receives an Admin invite when set. */
  backupAdminEmail: string
  /** Optional public contact email shown on org profile. */
  contactEmail?: string
  /** Platform admin approval gate. */
  approvalStatus?: OrgApprovalStatus
  rejectedAt?: string
  rejectedBy?: string
  /** Admin's short reason (fills template {reason} placeholder). */
  rejectionReason?: string
  /** Full message sent to the org owner. */
  rejectionMessage?: string
  /** Sub-units within the org (e.g. Social Club, Public Education). */
  departments: OrgDepartment[]
  /** Per-org verification attempt (1–3). */
  verificationAttemptNumber?: number
  /** @deprecated Use verificationAttemptNumber — migrated on read. */
  verificationRequestNumber?: number
  /** When the host submitted for verification. */
  verificationSubmittedAt?: string
  /** Host country for Control Room geo filters (see analyticsGeo). */
  country?: string
  /** Admin suspension — org cannot publish public events; profile hidden/flagged. */
  suspended?: boolean
  suspendedUntil?: string
  suspendedAt?: string
  suspendDuration?: SuspendDuration
  /** Platform ban — org terminated; owner sign-in blocked. */
  banned?: boolean
  bannedAt?: string
  banReviewUntil?: string
  /** Recurring Hidden Gem slot subscription (demo / localStorage). */
  hiddenGemSubscription?: HiddenGemSubscription
  /** @deprecated Migrated to hiddenGemSubscription on read. */
  hiddenGemSlotsPurchased?: number
  /** Admin-enabled merch shop on public org profile. */
  merchShopEnabled?: boolean
  merchBlocked?: boolean
  merchBlockedReason?: string
  merchReportedAt?: string
  merchShopUrl?: string
  /** Platform-managed tourism / calendar partner (green Discover cards). */
  isTrustedPartner?: boolean
  /** active = imported by Tudu · invited = claim sent · graduated = self-serve org. */
  partnerLifecycle?: 'active' | 'invited' | 'graduated'
  calendarFeedUrl?: string
  lastPartnerImportAt?: string
  lastPartnerImportCount?: number
  partnerDefaultTicketing?: TicketingMode
  partnerDefaultZeffyUrl?: string
  partnerCity?: string
  partnerProvince?: string
  partnerNotes?: string
}

/** Paid Hidden Gem deck slots — active only while subscription is active. */
export type HiddenGemSubscription = {
  slotsPurchased: number
  active: boolean
}

/** Alias: Organization is the Host Account entity in product copy. */
export type HostAccount = Organization

export interface OrganizationMember {
  id: string
  orgId: string
  email: string
  role: OrgRole
  joinedAt: string
  isBackupAdmin?: boolean
}

export interface OrgInvite {
  id: string
  orgId: string
  email: string
  role: OrgRole
  invitedBy: string
  invitedAt: string
  status: 'pending' | 'accepted'
}

export interface HostEvent {
  id: string
  title: string
  visibility: EventVisibility
  /** Host Account that owns this event; null/undefined = personal event. */
  hostAccountId?: string | null
  /** @deprecated use hostAccountId — kept for localStorage migration */
  orgId?: string
  /** User email when posted as personal. */
  postedAsUserId?: string
  /** Display name when posted as personal (first + last). */
  displayName?: string
  /** Share token for private invite links. */
  shareToken?: string
  /** Emails invited to a private event. */
  privateInviteEmails?: string[]
  /** Share list IDs included when the event was set to private. */
  privateShareListIds?: string[]
  createdBy: string
  createdAt: string
  status: HostEventStatus
  venueName?: string
  streetAddress?: string
  streetSuite?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  description?: string
  photos?: string[]
  eventType?: EventType
  dayShape?: DayShape
  scheduleType?: ScheduleType
  repeatsWeekly?: boolean
  weeksOnDeck?: number
  sellTicketsPerDay?: boolean
  /** @deprecated — use sellTicketsPerDay */
  advancedTicketSales?: boolean
  /** Phase 1 flag — tickets reset each occurrence when recurring (full logic Phase 2). */
  ticketScope?: 'per_occurrence'
  repeats?: RepeatPattern
  recurrenceStartDate?: string
  recurrenceEndDate?: string
  seriesEndDate?: string
  recurrenceCount?: number | null
  multiDates?: string[]
  occurrences?: EventOccurrence[]
  scheduleRepeatMode?: ScheduleRepeatMode
  scheduleMode?: ScheduleMode
  scheduleTimeSlots?: boolean
  seasonStartDate?: string
  seasonEndDate?: string
  scheduledPublishAt?: string
  /** Set when the host is notified that a delayed post went live on Discover. */
  scheduledPublishNotifiedAt?: string
  /** Computed on save — deck removes card after this instant. */
  expiresAt?: string
  eventDate?: string
  startHour?: string
  startMinute?: string
  startPeriod?: 'AM' | 'PM'
  endHour?: string
  endMinute?: string
  endPeriod?: 'AM' | 'PM'
  allDay?: boolean
  visitDuration?: VisitDuration
  primaryCategory?: string
  secondaryCategory?: string
  subCategories?: string[]
  customTags?: string[]
  ticketTiers?: TicketTier[]
  ticketSessions?: TicketSession[]
  ticketingMode?: TicketingMode
  capacity?: number | null
  waitlistEnabled?: boolean
  externalTicketUrl?: string
  checklist?: EventChecklist
  ageRestriction?: AgeRestriction
  amenities?: string[]
  doorPayment?: DoorPaymentMode
  atmOnSite?: boolean
  /** Platform admin seeded this event (God Mode). */
  seededByAdmin?: boolean
  /** Admin email that created the seed event. */
  createdByAdminId?: string
  /** Host/org approval gate before seeded events appear on Discover. */
  seedApprovalStatus?: SeedApprovalStatus
  /** Reminder nudges sent while host has not accepted a seeded event. */
  seedReminderCount?: number
  seedLastReminderAt?: string
  /** Returned to draft after host non-response — auto-delete after period. */
  seedDraftArchivedAt?: string
  seedDeleteAfterDays?: number
  seedScheduledDeleteAt?: string
  /** Optional promo / discount code for distant savers outreach. */
  promoCode?: string
  /** Discover deck border tier override. */
  discoverBorderType?: 'none' | 'grey' | 'green' | 'orange' | 'blue' | 'gold' | 'teal' | 'pink'
  /** Org department that posted this event (optional — org-wide if unset). */
  departmentId?: string
  /** Denormalized department name for display. */
  departmentName?: string
}

const ACCOUNTS_KEY = 'tudu_accounts'

export const ACCOUNTS_CHANGED_EVENT = 'tudu-accounts-changed'
const ORGS_KEY = 'tudu_organizations'
export const ORGANIZATIONS_CHANGED_EVENT = 'tudu-organizations-changed'
const MEMBERS_KEY = 'tudu_org_members'
const INVITES_KEY = 'tudu_org_invites'
const EVENTS_KEY = 'tudu_host_events'

export const DEMO_VERIFICATION_CODE = '123456'

export const ORG_ROLES: { id: OrgRole; label: string }[] = [
  { id: 'owner', label: 'Owner' },
  { id: 'admin', label: 'Admin' },
  { id: 'staff', label: 'Staff' },
  { id: 'viewer', label: 'Viewer' },
]

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[TUDU] Failed to write localStorage key "${key}":`, err)
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function generateShareToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function migrateHostEvent(event: HostEvent): HostEvent {
  const hostAccountId = event.hostAccountId ?? event.orgId ?? null
  let migrated: HostEvent = migrateScheduleFields({ ...event, hostAccountId, orgId: undefined })

  if (migrated.seededByAdmin && !migrated.seedApprovalStatus) {
    const alreadyLiveEligible =
      migrated.visibility === 'public' &&
      (migrated.status === 'live' || migrated.status === 'upcoming')
    migrated = {
      ...migrated,
      seedApprovalStatus: alreadyLiveEligible ? 'approved' : 'pending',
    }
  }

  return migrated
}

function migrateOrganization(org: Organization): Organization {
  const verificationAttemptNumber =
    org.verificationAttemptNumber ?? org.verificationRequestNumber
  let hiddenGemSubscription = org.hiddenGemSubscription
  const legacyPurchased = org.hiddenGemSlotsPurchased ?? 0
  if (!hiddenGemSubscription && legacyPurchased > 0) {
    hiddenGemSubscription = {
      slotsPurchased: legacyPurchased,
      active: true,
    }
  }
  return {
    ...org,
    primaryAdminEmail: org.primaryAdminEmail ?? org.createdBy,
    backupAdminEmail: org.backupAdminEmail ?? '',
    contactEmail: org.contactEmail,
    approvalStatus: org.approvalStatus ?? 'pending',
    departments: org.departments ?? [],
    verificationAttemptNumber,
    country: org.country ?? 'Canada',
    hiddenGemSubscription,
  }
}

/** Resolved org country — falls back to owner account, then Canada. */
export function getOrganizationCountry(org: Organization): string {
  if (org.country?.trim()) return org.country.trim()
  const ownerAccount = getAccount(org.primaryAdminEmail ?? org.createdBy)
  return ownerAccount?.country ?? 'Canada'
}

/** Resolved org approval — new/migrated orgs default to pending until admin approves. */
export function getOrganizationApprovalStatus(org: Organization): OrgApprovalStatus {
  return org.approvalStatus ?? 'pending'
}

export function isOrganizationApproved(orgId: string): boolean {
  const org = getOrganization(orgId)
  return org ? getOrganizationApprovalStatus(org) === 'approved' : false
}

export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim()
  return trimmed.length > 0 && trimmed.includes('@') && !trimmed.startsWith('@')
}

function getAccounts(): UserAccount[] {
  const raw = readJson<UserAccount[]>(ACCOUNTS_KEY, [])
  const deduped = dedupeAccounts(raw)
  if (deduped.length !== raw.length) {
    writeJson(ACCOUNTS_KEY, deduped)
  }
  return deduped
}

const TIER_RANK: Record<UserTier, number> = {
  free: 0,
  verified: 1,
  tier1: 2,
  tier2: 3,
}

function mergeDuplicateAccounts(a: UserAccount, b: UserAccount): UserAccount {
  const email = normalizeEmail(a.email)
  const prefer = (a.lastActiveAt ?? '') >= (b.lastActiveAt ?? '') ? a : b
  const tier = TIER_RANK[a.tier] >= TIER_RANK[b.tier] ? a.tier : b.tier
  const verificationStatus =
    a.verificationStatus === 'phone_verified' || b.verificationStatus === 'phone_verified'
      ? 'phone_verified'
      : 'unverified'
  return {
    ...prefer,
    ...a,
    ...b,
    email,
    tier,
    verificationStatus,
  }
}

function dedupeAccounts(accounts: UserAccount[]): UserAccount[] {
  const byEmail = new Map<string, UserAccount>()
  for (const account of accounts) {
    const key = normalizeEmail(account.email)
    if (!key) continue
    const existing = byEmail.get(key)
    byEmail.set(
      key,
      existing ? mergeDuplicateAccounts(existing, account) : { ...account, email: key },
    )
  }
  return Array.from(byEmail.values())
}

function saveAccounts(accounts: UserAccount[]): void {
  writeJson(ACCOUNTS_KEY, dedupeAccounts(accounts))
  window.dispatchEvent(new Event(ACCOUNTS_CHANGED_EVENT))
}

/** One-time repair for duplicate rows / mixed-case emails in localStorage. */
export function repairStoredAccounts(): void {
  const repaired = dedupeAccounts(getAccounts())
  writeJson(ACCOUNTS_KEY, repaired)
}

export interface UserAccount {
  email: string
  verificationStatus: VerificationStatus
  tier: UserTier
  phone?: string
  publicEventCount: number
  /** Bonus public event slots purchased as add-ons (demo / localStorage). */
  extraPublicEventSlots?: number
  homeCity: string
  accountType: AccountType
  /** Primary Host Account for Event Manager display. */
  activeOrgId?: string
  /** Post as personal or a Host Account id. */
  postingAs?: PostingAs
  /** ISO timestamp — updated on sign-in and page views. */
  lastActiveAt?: string
  /** ISO timestamp — set on account creation. */
  joinedAt?: string
  /** Admin suspension — cannot post/create events; can still browse. */
  suspended?: boolean
  /** ISO timestamp — auto-unsuspend when passed. */
  suspendedUntil?: string
  suspendedAt?: string
  suspendDuration?: SuspendDuration
  /** Platform ban — sign-in rejected; account disabled. */
  banned?: boolean
  bannedAt?: string
  /** bannedAt + 1 year — data retained pending review. */
  banReviewUntil?: string
  /** Set on ban — blocks sign-in and new sign-ups with this email. */
  emailFlagged?: boolean
  /** Province / region parsed from home city (e.g. SK). */
  homeRegion?: string
  /** ISO-style province or state code (e.g. SK, CA). Synced from homeCity when unset. */
  province?: string
  /** Country name (e.g. Canada, United States). Defaults to Canada for seeded cities. */
  country?: string
  /** Optional user-provided gender. */
  gender?: GenderOption
  /** Birth year for age / bracket analytics. */
  birthYear?: number
  /** Admin-enabled merch shop on public personal profile. */
  merchShopEnabled?: boolean
  merchBlocked?: boolean
  merchBlockedReason?: string
  merchReportedAt?: string
  merchShopUrl?: string
}

function defaultAccount(email: string): UserAccount {
  const now = new Date().toISOString()
  return {
    email,
    verificationStatus: 'unverified',
    tier: 'free',
    publicEventCount: 0,
    homeCity: getHomeCity(),
    accountType: 'personal',
    postingAs: 'personal',
    joinedAt: now,
    lastActiveAt: now,
  }
}

function defaultCountryForProvince(province: string): string {
  const usStates = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
  ])
  return usStates.has(province) ? 'United States' : 'Canada'
}

function syncAccountDemographics(account: UserAccount): UserAccount {
  const users = readJson<{ email: string; dob?: string }[]>('tudu_users', [])
  const user = users.find((u) => u.email.toLowerCase() === account.email.toLowerCase())
  const birthYear = account.birthYear ?? birthYearFromDob(user?.dob)
  const homeRegion = account.homeRegion || getHomeRegionFromCity(account.homeCity)
  const province = account.province || homeRegion
  const country = account.country || (province ? defaultCountryForProvince(province) : 'Canada')
  return { ...account, birthYear, homeRegion, province, country }
}

export function isAccountSuspended(account: UserAccount): boolean {
  if (account.banned) return false
  if (account.suspended !== true) return false
  if (!account.suspendedUntil) return true
  return new Date(account.suspendedUntil).getTime() > Date.now()
}

export function maybeClearExpiredSuspension(email: string): UserAccount | null {
  const accounts = getAccounts()
  const normalized = normalizeEmail(email)
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === normalized)
  if (idx < 0) return null

  const account = accounts[idx]
  if (account.suspended !== true || !account.suspendedUntil) return account
  if (new Date(account.suspendedUntil).getTime() > Date.now()) return account

  const cleared: UserAccount = {
    ...account,
    suspended: false,
    suspendedAt: undefined,
    suspendedUntil: undefined,
    suspendDuration: undefined,
  }
  accounts[idx] = cleared
  saveAccounts(accounts)
  return cleared
}

export function flagBannedEmail(email: string): UserAccount | null {
  const account = getAccounts().find((a) => a.email.toLowerCase() === normalizeEmail(email))
  if (!account) return null
  return saveAccount({ ...account, emailFlagged: true })
}

export function isEmailFlagged(email: string): boolean {
  const account = getAccounts().find((a) => a.email.toLowerCase() === normalizeEmail(email))
  return account?.emailFlagged === true || account?.banned === true
}

export function ensureAccount(email: string): UserAccount {
  maybeClearExpiredSuspension(email)
  const accounts = getAccounts()
  const normalized = normalizeEmail(email)
  const existing = accounts.find((a) => a.email.toLowerCase() === normalized)
  if (existing) {
    const synced = syncAccountDemographics(existing)
    if (
      synced.birthYear !== existing.birthYear ||
      synced.homeRegion !== existing.homeRegion ||
      synced.province !== existing.province ||
      synced.country !== existing.country
    ) {
      saveAccount(synced)
    }
    return synced
  }

  const account = syncAccountDemographics(defaultAccount(email))
  accounts.push(account)
  saveAccounts(accounts)
  return account
}

export function getAccount(email?: string | null): UserAccount | null {
  const resolved = email ?? getSessionEmail() ?? getCurrentUser()?.email
  if (!resolved) return null

  const normalized = normalizeEmail(resolved)
  const existing = getAccounts().find((a) => normalizeEmail(a.email) === normalized)
  if (existing) {
    return syncAccountDemographics(existing)
  }

  return ensureAccount(resolved)
}

export function getCurrentAccount(): UserAccount | null {
  const email = getSessionEmail()
  if (!email) return null
  return getAccount(email)
}

export function saveAccount(account: UserAccount): UserAccount {
  const accounts = getAccounts()
  const normalizedEmail = normalizeEmail(account.email)
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === normalizedEmail)
  const record = { ...account, email: normalizedEmail }
  if (idx >= 0) accounts[idx] = record
  else accounts.push(record)
  saveAccounts(accounts)

  const merchPartial: Partial<HostMerchSettings> = {}
  if (account.merchShopEnabled !== undefined) merchPartial.merchShopEnabled = account.merchShopEnabled
  if (account.merchBlocked !== undefined) merchPartial.merchBlocked = account.merchBlocked
  if (account.merchBlockedReason !== undefined) {
    merchPartial.merchBlockedReason = account.merchBlockedReason
  }
  if (account.merchReportedAt !== undefined) merchPartial.merchReportedAt = account.merchReportedAt
  if (account.merchShopUrl !== undefined) merchPartial.merchShopUrl = account.merchShopUrl
  if (Object.keys(merchPartial).length > 0) {
    persistUserMerchSettings(normalizedEmail, merchPartial)
    notifyHostProfilesCleared()
  }

  return record
}

export function updateCurrentAccount(partial: Partial<UserAccount>): UserAccount | null {
  const current = getCurrentAccount()
  if (!current) return null
  return saveAccount({ ...current, ...partial })
}

export function getPostingAs(account: UserAccount): PostingAs {
  return account.postingAs ?? 'personal'
}

export function setPostingAs(email: string, postingAs: PostingAs): UserAccount | null {
  const account = ensureAccount(email)
  if (postingAs === 'personal') {
    if (!canUsePersonalHostMode(email)) return null
  } else {
    const member = getOrgMembers(postingAs).find((m) => m.email.toLowerCase() === normalizeEmail(email))
    if (!member) return null
  }
  return saveAccount({ ...account, postingAs, activeOrgId: postingAs === 'personal' ? account.activeOrgId : postingAs })
}

/** Primary admin of an approved Trusted Host org (not backup admins). */
export function isPrimaryTrustedOrgOwner(account: UserAccount): boolean {
  const email = normalizeEmail(account.email)
  if (account.tier !== 'tier2' || account.verificationStatus !== 'phone_verified') return false
  return getOrganizationsForUser(account.email).some((org) => {
    if (getOrganizationApprovalStatus(org) !== 'approved') return false
    if (normalizeEmail(getOrganizationOwnerEmail(org)) !== email) return false
    return resolveOrgPlanId(account.tier, account.verificationStatus, true) === 'trusted'
  })
}

export type EffectiveUserPerks = UserPlanPerks & {
  planId: UserPlanId
  /** Explorer-equivalent perks granted via Trusted Host primary ownership. */
  trustedHostPersonalPerks: boolean
}

/** Personal-track perks — Trusted Host primary owners receive Explorer-equivalent perks. */
export function getEffectiveUserPerks(account: UserAccount): EffectiveUserPerks {
  const planId = resolveUserPlanId(account.tier, account.verificationStatus)
  const base = getUserPlanPerks(planId)
  const trustedHostPersonalPerks = planId !== 'explorer' && isPrimaryTrustedOrgOwner(account)

  if (!trustedHostPersonalPerks) {
    return { ...base, planId, trustedHostPersonalPerks: false }
  }

  const explorer = getUserPlanPerks('explorer')
  return {
    ...base,
    ...explorer,
    planId,
    trustedHostPersonalPerks: true,
  }
}

/** Private event cap for personal hosting — null = unlimited. */
export function getPrivateEventLimitForAccount(account: UserAccount): number | null {
  if (account.verificationStatus !== 'phone_verified') {
    return getPrivateEventLimitForUserPlan('unverified')
  }
  return getEffectiveUserPerks(account).privateEventLimit
}

/** Personal ticketed events — Trusted Host primary owners use org Trusted fees (0% platform). */
export function getPersonalTicketFeesForAccount(account: UserAccount): TierFeeStructure {
  if (isPrimaryTrustedOrgOwner(account)) {
    return getTierConfig().trusted.fees
  }
  const planId = resolveUserPlanId(account.tier, account.verificationStatus)
  if (planId === 'explorer') return getTierConfig().explorer.fees
  return getTierConfig().verified.fees
}

export function getExtraPublicEventSlots(account: UserAccount): number {
  return account.extraPublicEventSlots ?? 0
}

/** Tier plan cap only — excludes purchased add-on slots. */
export function getBasePublicEventLimit(account: UserAccount): number {
  const verified = account.verificationStatus === 'phone_verified'
  return getPublicLimitForUserTier(account.tier, verified)
}

export function getPublicEventLimit(account: UserAccount): number {
  return getBasePublicEventLimit(account) + getExtraPublicEventSlots(account)
}

export function purchaseExtraEventSlots(
  email: string,
  slots: number,
): { ok: boolean; account?: UserAccount; error?: string } {
  if (slots <= 0) {
    return { ok: false, error: 'Invalid slot count.' }
  }
  const account = ensureAccount(email)
  if (account.verificationStatus !== 'phone_verified') {
    return { ok: false, error: 'Verify your phone before purchasing extra public event slots.' }
  }
  const updated = saveAccount({
    ...account,
    extraPublicEventSlots: getExtraPublicEventSlots(account) + slots,
  })
  return { ok: true, account: updated }
}

export function getHiddenGemSubscription(org: Organization): HiddenGemSubscription | undefined {
  return org.hiddenGemSubscription
}

export function isHiddenGemSubscriptionActive(org: Organization): boolean {
  return org.hiddenGemSubscription?.active === true
}

/** Purchased slots count only while subscription is active. */
export function getHiddenGemSlotsPurchased(org: Organization): number {
  if (!isHiddenGemSubscriptionActive(org)) return 0
  return org.hiddenGemSubscription?.slotsPurchased ?? 0
}

/** Activate or change Hidden Gem slot subscription (sets total purchased slots, not incremental). */
export function subscribeHiddenGemSlots(
  orgId: string,
  slots: number,
): { ok: boolean; org?: Organization; error?: string } {
  if (slots <= 0) {
    return { ok: false, error: 'Invalid slot count.' }
  }
  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) {
    return { ok: false, error: 'Organization not found.' }
  }
  const current = orgs[idx]
  orgs[idx] = {
    ...current,
    hiddenGemSubscription: {
      slotsPurchased: slots,
      active: true,
    },
    hiddenGemSlotsPurchased: undefined,
  }
  writeJson(ORGS_KEY, orgs)
  return { ok: true, org: orgs[idx] }
}

/** Demo: stop paying — purchased slots no longer count toward deck limit. */
export function cancelHiddenGemSubscription(
  orgId: string,
): { ok: boolean; org?: Organization; error?: string } {
  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) {
    return { ok: false, error: 'Organization not found.' }
  }
  const current = orgs[idx]
  if (!current.hiddenGemSubscription?.active) {
    return { ok: false, error: 'No active Hidden Gem subscription.' }
  }
  orgs[idx] = {
    ...current,
    hiddenGemSubscription: {
      slotsPurchased: current.hiddenGemSubscription.slotsPurchased,
      active: false,
    },
  }
  writeJson(ORGS_KEY, orgs)
  return { ok: true, org: orgs[idx] }
}

/** @deprecated Use subscribeHiddenGemSlots — sets subscription, not a one-time counter. */
export function purchaseExtraHiddenGemSlots(
  orgId: string,
  slots: number,
): { ok: boolean; org?: Organization; error?: string } {
  return subscribeHiddenGemSlots(orgId, slots)
}

export function getRemainingPublicSlots(account: UserAccount): number {
  const limit = getPublicEventLimit(account)
  return Math.max(0, limit - account.publicEventCount)
}

export type PublicEventBlockReason =
  | 'verify'
  | 'upgrade'
  | 'org_pending'
  | 'org_rejected'
  | 'org_suspended'
  | 'org_banned'

export function isAccountPostingBlocked(account: UserAccount): boolean {
  return isAccountSuspended(account)
}

function publicEventBlockForOrg(hostAccountId: string | null | undefined): PublicEventBlockReason | null {
  if (!hostAccountId) return null
  const org = getOrganization(hostAccountId)
  if (!org) return 'org_pending'
  if (isOrganizationBanned(org)) return 'org_banned'
  if (isOrganizationSuspended(org)) return 'org_suspended'
  const status = getOrganizationApprovalStatus(org)
  if (status === 'pending') return 'org_pending'
  if (status === 'rejected') return 'org_rejected'
  return null
}

export function publicEventBlockMessage(reason: PublicEventBlockReason): string {
  switch (reason) {
    case 'org_pending':
      return 'Your Host Account is pending approval. Public events unlock after Control Room review.'
    case 'org_rejected':
      return 'Your Host Account was not approved. Contact support for details.'
    case 'org_suspended':
      return 'Your organization is suspended. Public events and publishing are disabled until the suspension ends.'
    case 'org_banned':
      return 'Your organization has been terminated. Contact support if you believe this is an error.'
    case 'verify':
      return 'Verify your phone to publish public events.'
    default:
      return 'Upgrade for more public events.'
  }
}

export function canCreatePublicEvent(
  account: UserAccount,
  hostAccountId?: string | null,
): {
  allowed: boolean
  reason?: PublicEventBlockReason
  remaining: number
  /** Total cap including purchased add-on slots. */
  limit: number
  /** Tier plan cap only. */
  baseLimit: number
  /** Purchased add-on slots. */
  extraSlots: number
} {
  if (isAccountPostingBlocked(account)) {
    return { allowed: false, reason: 'upgrade', remaining: 0, limit: 0, baseLimit: 0, extraSlots: 0 }
  }

  const orgBlock = publicEventBlockForOrg(hostAccountId)
  if (orgBlock) {
    return { allowed: false, reason: orgBlock, remaining: 0, limit: 0, baseLimit: 0, extraSlots: 0 }
  }

  const baseLimit = getBasePublicEventLimit(account)
  const extraSlots =
    account.verificationStatus === 'phone_verified' ? getExtraPublicEventSlots(account) : 0
  const limit = baseLimit + extraSlots
  const remaining = getRemainingPublicSlots(account)

  if (limit === 0) {
    return { allowed: false, reason: 'verify', remaining: 0, limit, baseLimit, extraSlots }
  }
  if (account.publicEventCount >= limit) {
    return { allowed: false, reason: 'upgrade', remaining: 0, limit, baseLimit, extraSlots }
  }
  return { allowed: true, remaining, limit, baseLimit, extraSlots }
}

export function getPersonalPrivateEventCount(email: string): number {
  const normalized = normalizeEmail(email)
  return getHostEvents().filter(
    (e) =>
      e.createdBy.toLowerCase() === normalized &&
      !e.hostAccountId &&
      e.visibility === 'private',
  ).length
}

export type PrivateEventBlockReason = 'limit'

export function privateEventBlockMessage(
  reason: PrivateEventBlockReason,
  limit?: number,
  account?: UserAccount,
): string {
  if (reason === 'limit') {
    const cap = limit ?? getPrivateEventLimitForUserPlan('unverified') ?? 2
    if (account?.verificationStatus !== 'phone_verified') {
      return `You have used your ${cap} private event slots. Verify your phone to unlock more private events and public publishing.`
    }
    const planId = resolveUserPlanId(account.tier, account.verificationStatus)
    if (planId === 'verified') {
      return `You have used all ${cap} private event slots. Upgrade to Explorer for unlimited private events.`
    }
    return `You have used all ${cap} private event slots.`
  }
  return 'Cannot create this event.'
}

export function canCreatePrivateEvent(
  account: UserAccount,
  hostAccountId?: string | null,
): {
  allowed: boolean
  reason?: PrivateEventBlockReason
  remaining: number
  limit: number
  used: number
} {
  if (hostAccountId) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, limit: 0, used: 0 }
  }

  const privateLimit = getPrivateEventLimitForAccount(account)
  if (privateLimit === null) {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      limit: 0,
      used: getPersonalPrivateEventCount(account.email),
    }
  }

  const limit = privateLimit
  const used = getPersonalPrivateEventCount(account.email)
  const remaining = Math.max(0, limit - used)
  if (used >= limit) {
    return { allowed: false, reason: 'limit', remaining: 0, limit, used }
  }
  return { allowed: true, remaining, limit, used }
}

export const USER_TIERS: UserTier[] = ['free', 'verified', 'tier1', 'tier2']

export function getTierLabel(tier: UserTier): string {
  switch (tier) {
    case 'tier2':
      return 'Trusted Host'
    case 'tier1':
      return 'Explorer'
    case 'verified':
      return 'Verified'
    default:
      return 'Unverified'
  }
}

/** Admin badge tone for user tier — grey / green / orange / blue. */
export type TierBadgeTone = 'neutral' | 'emerald' | 'amber' | 'cyan'

export function getTierBadgeTone(tier: UserTier): TierBadgeTone {
  switch (tier) {
    case 'tier2':
      return 'cyan'
    case 'tier1':
      return 'amber'
    case 'verified':
      return 'emerald'
    default:
      return 'neutral'
  }
}

export const USER_TIER_OPTIONS = USER_TIERS.map((value) => ({
  value,
  label: getTierLabel(value),
}))

/** Status label shown in the consumer app — personal user track only. */
export function getConsumerAccountStatus(account: UserAccount): {
  label: string
  tone: TierBadgeTone
} {
  if (account.verificationStatus !== 'phone_verified') {
    return { label: 'Unverified', tone: 'neutral' }
  }
  if (account.tier === 'tier1') {
    return { label: 'Explorer', tone: 'amber' }
  }
  // tier2 on the account is org subscription storage — personal plan shows as Verified.
  return { label: 'Verified', tone: 'emerald' }
}

/** Admin tier / verification edits — keep fields aligned with the consumer app. */
export function applyAdminTierChange(account: UserAccount, tier: UserTier): UserAccount {
  if (tier === 'free') {
    return { ...account, tier: 'free', verificationStatus: 'unverified' }
  }
  return { ...account, tier, verificationStatus: 'phone_verified' }
}

/** Admin verification edits — sync with tier for free vs verified hosts. */
export function applyAdminVerificationChange(
  account: UserAccount,
  verificationStatus: VerificationStatus,
): UserAccount {
  if (verificationStatus === 'unverified') {
    if (account.tier === 'tier1' || account.tier === 'tier2') {
      return { ...account, verificationStatus: 'unverified' }
    }
    return { ...account, verificationStatus: 'unverified', tier: 'free' }
  }
  if (account.tier === 'free') {
    return { ...account, verificationStatus: 'phone_verified', tier: 'verified' }
  }
  return { ...account, verificationStatus: 'phone_verified' }
}

/** Demo checkout — apply a subscription plan locally (no Stripe yet). */
export function applyDemoSubscriptionUpgrade(
  planId: UserPlanId | OrgPlanId,
  scope: 'user' | 'org',
): { ok: boolean; error?: string; account?: UserAccount } {
  const current = getCurrentAccount()
  if (!current) {
    return { ok: false, error: 'Sign in to upgrade your plan.' }
  }

  if (scope === 'user') {
    const userPlanId = planId as UserPlanId
    if (userPlanId === 'unverified') {
      return { ok: false, error: 'Sign in and verify your phone to continue.' }
    }
    if (userPlanId === 'verified') {
      if (current.verificationStatus !== 'phone_verified') {
        return { ok: false, error: 'Verify your phone to unlock the free Verified plan.' }
      }
      return { ok: true, account: saveAccount({ ...current, tier: 'verified' }) }
    }
    if (userPlanId === 'explorer') {
      if (current.verificationStatus !== 'phone_verified') {
        return { ok: false, error: 'Verify your phone before upgrading to Explorer.' }
      }
      return { ok: true, account: saveAccount(applyAdminTierChange(current, userPlanIdToUserTier(userPlanId))) }
    }
  }

  const orgPlanId = planId as OrgPlanId
  if (orgPlanId === 'unverified' || orgPlanId === 'verified') {
    return { ok: false, error: 'Create and get your Host Account approved first.' }
  }
  if (current.verificationStatus !== 'phone_verified') {
    return { ok: false, error: 'Verify your phone before upgrading your org plan.' }
  }
  return {
    ok: true,
    account: saveAccount(applyAdminTierChange(current, orgPlanIdToUserTier(orgPlanId))),
  }
}

/** Admin or tools — set tier on any account by email. */
export function setAccountTierByEmail(email: string, tier: UserTier): UserAccount {
  const account = ensureAccount(email)
  return saveAccount(applyAdminTierChange(account, tier))
}

export function setAccountVerificationByEmail(
  email: string,
  verificationStatus: VerificationStatus,
): UserAccount {
  const account = ensureAccount(email)
  return saveAccount(applyAdminVerificationChange(account, verificationStatus))
}

export function verifyPhone(email: string, phone: string, code: string): { ok: boolean; error?: string } {
  if (code !== DEMO_VERIFICATION_CODE) {
    return { ok: false, error: 'Invalid verification code. Demo code is 123456.' }
  }

  const account = ensureAccount(email)
  const normalizedPhone = parsePhoneDigits(phone)
  saveAccount({
    ...account,
    phone: normalizedPhone,
    verificationStatus: 'phone_verified',
    tier: account.tier === 'free' ? 'verified' : account.tier,
  })
  return { ok: true }
}

function syncPublicEventCount(email: string): void {
  const events = getHostEvents().filter(
    (e) => e.createdBy.toLowerCase() === email.toLowerCase() && e.visibility === 'public',
  )
  const account = ensureAccount(email)
  saveAccount({ ...account, publicEventCount: events.length })
}

export function getOrganizations(): Organization[] {
  return readJson<Organization[]>(ORGS_KEY, []).map(migrateOrganization)
}

export function getOrganizationOwnerEmail(org: Organization): string {
  return org.primaryAdminEmail ?? org.createdBy
}

/** Org subscription tier from owner account + approval status. */
export function resolveOrgPlanForOrganization(org: Organization): OrgPlanId {
  const owner = getAccount(getOrganizationOwnerEmail(org))
  return resolveOrgPlanId(
    owner?.tier ?? 'free',
    owner?.verificationStatus ?? 'unverified',
    getOrganizationApprovalStatus(org) === 'approved',
  )
}

export function isOrganizationSuspended(org: Organization): boolean {
  if (org.banned) return false
  if (org.suspended !== true) return false
  if (!org.suspendedUntil) return true
  return new Date(org.suspendedUntil).getTime() > Date.now()
}

export function isOrganizationBanned(org: Organization): boolean {
  return org.banned === true
}

export function maybeClearExpiredOrgSuspension(orgId: string): Organization | null {
  const orgs = readJson<Organization[]>(ORGS_KEY, []).map(migrateOrganization)
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) return null

  const org = orgs[idx]
  if (org.suspended !== true || !org.suspendedUntil) return org
  if (new Date(org.suspendedUntil).getTime() > Date.now()) return org

  orgs[idx] = {
    ...org,
    suspended: false,
    suspendedAt: undefined,
    suspendedUntil: undefined,
    suspendDuration: undefined,
  }
  writeJson(ORGS_KEY, orgs)
  return orgs[idx]
}

export function getOrganization(id: string): Organization | undefined {
  maybeClearExpiredOrgSuspension(id)
  return getOrganizations().find((o) => o.id === id)
}

export const getHostAccount = getOrganization
export const getHostAccounts = getOrganizations

export function getOrgMembers(orgId?: string): OrganizationMember[] {
  const members = readJson<OrganizationMember[]>(MEMBERS_KEY, [])
  return orgId ? members.filter((m) => m.orgId === orgId) : members
}

export function getOrgInvites(orgId?: string): OrgInvite[] {
  const invites = readJson<OrgInvite[]>(INVITES_KEY, [])
  return orgId ? invites.filter((i) => i.orgId === orgId) : invites
}

export function getOrganizationsForUser(email: string): Organization[] {
  const normalized = normalizeEmail(email)
  const memberOrgIds = getOrgMembers()
    .filter((m) => m.email.toLowerCase() === normalized)
    .map((m) => m.orgId)
  return getOrganizations().filter((o) => memberOrgIds.includes(o.id))
}

export const getHostAccountsForUser = getOrganizationsForUser

export function getPrimaryOrgForUser(email: string): Organization | null {
  const account = getAccount(email)
  if (account?.activeOrgId) {
    const active = getOrganization(account.activeOrgId)
    if (active) return active
  }

  const orgs = getOrganizationsForUser(email)
  if (orgs.length === 0) return null

  const owned = orgs.find((o) => o.createdBy.toLowerCase() === normalizeEmail(email))
  return owned ?? orgs[0]
}

export function getMemberRole(orgId: string, email: string): OrgRole | null {
  const member = getOrgMembers(orgId).find((m) => m.email.toLowerCase() === normalizeEmail(email))
  return member?.role ?? null
}

/** True when the user created the org or holds the owner role. */
export function isHostAccountOwner(email: string, orgId: string): boolean {
  const normalized = normalizeEmail(email)
  const org = getOrganization(orgId)
  if (org && normalizeEmail(org.createdBy) === normalized) return true
  return getMemberRole(orgId, email) === 'owner'
}

/** Member of at least one org but not owner of any — invited admin/staff only. */
export function isOrgOnlyMember(email: string): boolean {
  const orgs = getOrganizationsForUser(email)
  if (orgs.length === 0) return false
  return !orgs.some((org) => isHostAccountOwner(email, org.id))
}

/** Personal Event Manager mode — owners and users with no org membership. */
export function canUsePersonalHostMode(email: string): boolean {
  return !isOrgOnlyMember(email)
}

export function getDefaultOrgContextForUser(email: string): PostingAs {
  if (canUsePersonalHostMode(email)) return 'personal'
  const orgs = getOrganizationsForUser(email)
  const account = getAccount(email)
  if (account?.activeOrgId && orgs.some((o) => o.id === account.activeOrgId)) {
    return account.activeOrgId
  }
  return orgs[0]?.id ?? 'personal'
}

export function getBackupAdminMember(orgId: string): OrganizationMember | undefined {
  return getOrgMembers(orgId).find((m) => m.isBackupAdmin)
}

/** Host Account creation requires a phone-verified user at submit time (soft funnel: form first, verify on apply). */
export function canCreateOrganization(email: string): { allowed: boolean; error?: string } {
  const account = getAccount(email)
  if (!account) {
    return { allowed: false, error: 'Sign in to create a Host Account.' }
  }
  if (account.verificationStatus !== 'phone_verified') {
    return {
      allowed: false,
      error: 'Verify your phone before creating a Host Account.',
    }
  }
  return { allowed: true }
}

export function createOrganization(input: {
  name: string
  category: string
  creatorEmail: string
  primaryAdminEmail?: string
  backupAdminEmail?: string
  contactEmail?: string
}): { ok: boolean; org?: Organization; error?: string } {
  const creatorEmail = normalizeEmail(input.creatorEmail)
  const createGate = canCreateOrganization(creatorEmail)
  if (!createGate.allowed) {
    return { ok: false, error: createGate.error }
  }

  const primaryEmail = normalizeEmail(input.primaryAdminEmail ?? input.creatorEmail)
  if (!isValidEmailFormat(primaryEmail)) {
    return { ok: false, error: 'Primary admin email is invalid.' }
  }

  const backupRaw = input.backupAdminEmail?.trim() ?? ''
  const backupEmail = backupRaw ? normalizeEmail(backupRaw) : ''
  if (backupRaw && !isValidEmailFormat(backupEmail)) {
    return { ok: false, error: 'Backup admin email format is invalid.' }
  }
  if (backupEmail && backupEmail === creatorEmail) {
    return { ok: false, error: 'Backup admin must be a different person.' }
  }

  const contactRaw = input.contactEmail?.trim() ?? ''
  const contactEmail = contactRaw ? normalizeEmail(contactRaw) : undefined
  if (contactRaw && !isValidEmailFormat(contactEmail!)) {
    return { ok: false, error: 'Public contact email format is invalid.' }
  }

  const org: Organization = {
    id: generateId('org'),
    name: input.name.trim(),
    category: input.category,
    logoInitial: input.name.trim().charAt(0).toUpperCase() || 'O',
    createdBy: creatorEmail,
    createdAt: new Date().toISOString(),
    primaryAdminEmail: primaryEmail,
    backupAdminEmail: backupEmail,
    contactEmail,
    approvalStatus: 'pending',
    departments: [],
  }

  const orgs = getOrganizations()
  orgs.push(org)
  writeJson(ORGS_KEY, orgs)

  const ownerMember: OrganizationMember = {
    id: generateId('member'),
    orgId: org.id,
    email: creatorEmail,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  }

  if (backupEmail) {
    inviteTeamMember({
      orgId: org.id,
      email: backupEmail,
      role: 'admin',
      invitedBy: creatorEmail,
      isBackupAdmin: true,
    })
  }

  const members = getOrgMembers()
  members.push(ownerMember)
  writeJson(MEMBERS_KEY, members)

  const account = ensureAccount(input.creatorEmail)
  saveAccount({
    ...account,
    accountType: 'organization_member',
    activeOrgId: org.id,
    postingAs: account.postingAs ?? 'personal',
  })

  return { ok: true, org }
}

export function inviteTeamMember(input: {
  orgId: string
  email: string
  role: OrgRole
  invitedBy: string
  isBackupAdmin?: boolean
}): OrgInvite {
  const email = normalizeEmail(input.email)
  const invite: OrgInvite = {
    id: generateId('invite'),
    orgId: input.orgId,
    email,
    role: input.role,
    invitedBy: input.invitedBy,
    invitedAt: new Date().toISOString(),
    status: 'pending',
  }

  const invites = getOrgInvites()
  invites.push(invite)
  writeJson(INVITES_KEY, invites)

  if (input.isBackupAdmin) {
    const orgs = getOrganizations()
    const idx = orgs.findIndex((o) => o.id === input.orgId)
    if (idx >= 0) {
      orgs[idx] = { ...orgs[idx], backupAdminEmail: email }
      writeJson(ORGS_KEY, orgs)
    }
  }

  return invite
}

export function acceptInvite(inviteId: string, acceptEmail: string): { ok: boolean; error?: string } {
  const invites = getOrgInvites()
  const invite = invites.find((i) => i.id === inviteId)
  if (!invite) return { ok: false, error: 'Invite not found.' }
  if (invite.status === 'accepted') return { ok: false, error: 'Invite already accepted.' }
  if (invite.email !== normalizeEmail(acceptEmail)) {
    return { ok: false, error: 'This invite is for a different email address.' }
  }

  invite.status = 'accepted'
  writeJson(INVITES_KEY, invites)

  const members = getOrgMembers()
  const org = getOrganization(invite.orgId)
  const isBackupAdmin = org?.backupAdminEmail === invite.email

  const alreadyMember = members.some(
    (m) => m.orgId === invite.orgId && m.email.toLowerCase() === invite.email,
  )
  if (!alreadyMember) {
    members.push({
      id: generateId('member'),
      orgId: invite.orgId,
      email: invite.email,
      role: invite.role,
      joinedAt: new Date().toISOString(),
      isBackupAdmin,
    })
    writeJson(MEMBERS_KEY, members)
  } else {
    const idx = members.findIndex(
      (m) => m.orgId === invite.orgId && m.email.toLowerCase() === invite.email,
    )
    if (idx >= 0 && isBackupAdmin) {
      members[idx] = { ...members[idx], isBackupAdmin: true }
      writeJson(MEMBERS_KEY, members)
    }
  }

  const account = ensureAccount(acceptEmail)
  const orgOnly = isOrgOnlyMember(acceptEmail)
  saveAccount({
    ...account,
    accountType: 'organization_member',
    activeOrgId: invite.orgId,
    postingAs: orgOnly ? invite.orgId : account.postingAs ?? 'personal',
  })

  return { ok: true }
}

export function getPendingInvitesForEmail(email: string): OrgInvite[] {
  const normalized = normalizeEmail(email)
  return getOrgInvites().filter((i) => i.email === normalized && i.status === 'pending')
}

export function transferOwnership(
  orgId: string,
  fromEmail: string,
  toEmail: string,
): { ok: boolean; error?: string } {
  const fromRole = getMemberRole(orgId, fromEmail)
  if (fromRole !== 'owner') {
    return { ok: false, error: 'Only the Owner can transfer ownership.' }
  }

  const toMember = getOrgMembers(orgId).find((m) => m.email.toLowerCase() === normalizeEmail(toEmail))
  if (!toMember || toMember.role !== 'admin') {
    return { ok: false, error: 'Ownership can only be transferred to an Admin.' }
  }

  const members = getOrgMembers()
  members.forEach((m, idx) => {
    if (m.orgId !== orgId) return
    if (m.email.toLowerCase() === normalizeEmail(fromEmail)) {
      members[idx] = { ...m, role: 'admin' }
    }
    if (m.email.toLowerCase() === normalizeEmail(toEmail)) {
      members[idx] = { ...m, role: 'owner' }
    }
  })
  writeJson(MEMBERS_KEY, members)

  const orgs = getOrganizations()
  const orgIdx = orgs.findIndex((o) => o.id === orgId)
  if (orgIdx >= 0) {
    orgs[orgIdx] = { ...orgs[orgIdx], createdBy: normalizeEmail(toEmail) }
    writeJson(ORGS_KEY, orgs)
  }

  return { ok: true }
}

/** Platform admin removes a member from an org without deleting their personal account. */
export function adminRemoveMemberFromOrg(
  orgId: string,
  memberEmail: string,
  _adminEmail: string,
): { ok: boolean; error?: string } {
  const org = getOrganization(orgId)
  if (!org) return { ok: false, error: 'Organization not found.' }

  const target = getOrgMembers(orgId).find(
    (m) => m.email.toLowerCase() === normalizeEmail(memberEmail),
  )
  if (!target) return { ok: false, error: 'Member not found in this organization.' }
  if (target.role === 'owner') {
    return { ok: false, error: 'Transfer ownership before removing the Owner.' }
  }

  const members = getOrgMembers().filter(
    (m) => !(m.orgId === orgId && m.email.toLowerCase() === normalizeEmail(memberEmail)),
  )
  writeJson(MEMBERS_KEY, members)

  const account = getAccount(memberEmail)
  if (account?.activeOrgId === orgId || account?.postingAs === orgId) {
    const remainingOrgs = getOrganizationsForUser(memberEmail)
    saveAccount({
      ...account,
      activeOrgId: remainingOrgs[0]?.id,
      postingAs: remainingOrgs[0]?.id ?? 'personal',
      accountType: remainingOrgs.length > 0 ? 'organization_member' : 'personal',
    })
  }

  return { ok: true }
}

export function removeMember(
  orgId: string,
  memberEmail: string,
  removedBy: string,
): { ok: boolean; error?: string } {
  const removerRole = getMemberRole(orgId, removedBy)
  if (removerRole !== 'owner') {
    return { ok: false, error: 'Only the Owner can remove team members.' }
  }

  const target = getOrgMembers(orgId).find((m) => m.email.toLowerCase() === normalizeEmail(memberEmail))
  if (!target) return { ok: false, error: 'Member not found.' }
  if (target.role === 'owner') {
    return { ok: false, error: 'Transfer ownership before removing the Owner.' }
  }
  if (target.isBackupAdmin) {
    return { ok: false, error: 'Assign a replacement backup admin before removing them.' }
  }

  const members = getOrgMembers().filter(
    (m) => !(m.orgId === orgId && m.email.toLowerCase() === normalizeEmail(memberEmail)),
  )
  writeJson(MEMBERS_KEY, members)
  return { ok: true }
}

export function updateMemberRole(
  orgId: string,
  memberEmail: string,
  newRole: OrgRole,
  updatedBy: string,
): { ok: boolean; error?: string } {
  const updaterRole = getMemberRole(orgId, updatedBy)
  if (updaterRole !== 'owner') {
    return { ok: false, error: 'Only the Owner can change member roles.' }
  }
  if (newRole === 'owner') {
    return { ok: false, error: 'Use Transfer Ownership to change the Owner.' }
  }

  const members = getOrgMembers()
  const idx = members.findIndex(
    (m) => m.orgId === orgId && m.email.toLowerCase() === normalizeEmail(memberEmail),
  )
  if (idx < 0) return { ok: false, error: 'Member not found.' }

  const target = members[idx]
  if (target.role === 'owner') {
    return { ok: false, error: 'Cannot change the Owner role directly.' }
  }

  members[idx] = { ...target, role: newRole }
  writeJson(MEMBERS_KEY, members)
  return { ok: true }
}

export function designateBackupAdmin(
  orgId: string,
  newBackupEmail: string,
  designatedBy: string,
): { ok: boolean; error?: string } {
  const role = getMemberRole(orgId, designatedBy)
  if (role !== 'owner') {
    return { ok: false, error: 'Only the Owner can designate a backup admin.' }
  }

  const email = normalizeEmail(newBackupEmail)
  if (!email.includes('@')) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const members = getOrgMembers()
  members.forEach((m, idx) => {
    if (m.orgId === orgId && m.isBackupAdmin) {
      members[idx] = { ...m, isBackupAdmin: false }
    }
  })

  const existing = members.find(
    (m) => m.orgId === orgId && m.email.toLowerCase() === email,
  )
  if (existing) {
    const idx = members.indexOf(existing)
    members[idx] = { ...existing, role: 'admin', isBackupAdmin: true }
    writeJson(MEMBERS_KEY, members)
  } else {
    writeJson(MEMBERS_KEY, members)
    inviteTeamMember({
      orgId,
      email,
      role: 'admin',
      invitedBy: designatedBy,
      isBackupAdmin: true,
    })
  }

  const orgs = getOrganizations()
  const orgIdx = orgs.findIndex((o) => o.id === orgId)
  if (orgIdx >= 0) {
    orgs[orgIdx] = { ...orgs[orgIdx], backupAdminEmail: email }
    writeJson(ORGS_KEY, orgs)
  }

  return { ok: true }
}

export function getHostEvents(): HostEvent[] {
  return readJson<HostEvent[]>(EVENTS_KEY, [])
    .map(migrateHostEvent)
    .filter((e) => !isRemovedDemoHostEvent(e))
}

export function getHostEventById(id: string): HostEvent | undefined {
  return getHostEvents().find((e) => e.id === id)
}

export function getHostEventByShareToken(token: string): HostEvent | undefined {
  return getHostEvents().find((e) => e.shareToken === token)
}

export function getHostEventsForUser(email: string): HostEvent[] {
  const normalized = normalizeEmail(email)
  return getHostEvents().filter((e) => e.createdBy.toLowerCase() === normalized)
}

export function getHostEventsForOrg(orgId: string): HostEvent[] {
  return getHostEvents().filter((e) => e.hostAccountId === orgId)
}

export function getSeedApprovalStatus(event: HostEvent): SeedApprovalStatus | undefined {
  if (!event.seededByAdmin) return undefined
  return event.seedApprovalStatus ?? 'pending'
}

export function isSeedEventDiscoverEligible(event: HostEvent): boolean {
  if (!event.seededByAdmin) return true
  return getSeedApprovalStatus(event) === 'approved'
}

export function isSeedEventInDiscoverDeck(event: HostEvent): boolean {
  return (
    event.visibility === 'public' &&
    (event.status === 'live' || event.status === 'upcoming') &&
    isSeedEventDiscoverEligible(event)
  )
}

export function approveSeedEvent(
  eventId: string,
): { ok: boolean; event?: HostEvent; error?: string } {
  const event = getHostEventById(eventId)
  if (!event?.seededByAdmin) return { ok: false, error: 'Not a seeded event.' }
  if (getSeedApprovalStatus(event) === 'approved') {
    return { ok: true, event }
  }
  return updateHostEvent(eventId, { seedApprovalStatus: 'approved' })
}

export function rejectSeedEvent(
  eventId: string,
): { ok: boolean; event?: HostEvent; error?: string } {
  const event = getHostEventById(eventId)
  if (!event?.seededByAdmin) return { ok: false, error: 'Not a seeded event.' }
  return updateHostEvent(eventId, { seedApprovalStatus: 'rejected' })
}

const SYSTEM_NOTIFY_EMAIL = 'notifications@tudu.ca'

/** Notify hosts when a delayed Discover post reaches its go-live time. */
export function processScheduledPublishNotifications(now = new Date()): number {
  let notified = 0

  for (const event of getHostEvents()) {
    if (!event.scheduledPublishAt?.trim()) continue
    if (event.scheduledPublishNotifiedAt) continue
    if (event.visibility !== 'public') continue
    if (event.status !== 'live' && event.status !== 'upcoming') continue

    const publishAt = new Date(event.scheduledPublishAt)
    if (Number.isNaN(publishAt.getTime()) || now < publishAt) continue

    const publishLabel = publishAt.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tudu.ca'

    addUserNotification({
      userEmail: event.createdBy,
      adminMessageId: `scheduled_publish_${event.id}`,
      fromEmail: SYSTEM_NOTIFY_EMAIL,
      subject: `Now live on Discover: ${event.title}`,
      body: `Your scheduled post went live at ${publishLabel}.\n\n"${event.title}" is now visible in the Discover card deck.\n\nManage event: ${origin}/host\nView Discover: ${origin}/discover`,
      type: 'event_scheduled_live',
    })

    updateHostEvent(event.id, { scheduledPublishNotifiedAt: now.toISOString() })
    notified += 1
  }

  return notified
}

export function getPublicHostEventsForDiscover(now = new Date()): HostEvent[] {
  processScheduledPublishNotifications(now)
  return getHostEvents().filter(
    (e) =>
      e.visibility === 'public' &&
      (e.status === 'live' || e.status === 'upcoming') &&
      isSeedEventDiscoverEligible(e) &&
      isHostEventDiscoverVisible(e, now) &&
      !isEventHiddenFromDiscover(e.id),
  )
}

export function getPrivateShareUrl(event: HostEvent): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  if (event.shareToken) {
    return `${origin}/e/${event.shareToken}`
  }
  return `${origin}/event/private/${event.id}`
}

export function updateHostEventStatus(
  eventId: string,
  status: HostEventStatus,
): { ok: boolean; event?: HostEvent; error?: string } {
  const events = getHostEvents()
  const idx = events.findIndex((e) => e.id === eventId)
  if (idx < 0) return { ok: false, error: 'Event not found.' }

  events[idx] = { ...events[idx], status }
  writeJson(EVENTS_KEY, events)
  syncPublicEventCount(events[idx].createdBy)
  return { ok: true, event: events[idx] }
}

const ACTIVE_SLOT_STATUSES = new Set<HostEventStatus>(['draft', 'upcoming', 'live'])

function countHostEventScheduleDays(event: HostEvent): number {
  const migrated = migrateScheduleFields(event)
  const days = expandOccurrenceDates(
    getEffectiveOccurrences({ ...event, ...migrated }),
  )
  if (days.length > 0) return days.length
  return event.eventDate ? 1 : 0
}

function sumHostScheduleDays(
  email: string,
  visibility: EventVisibility,
  hostAccountId: string | null,
  excludeEventId?: string,
): number {
  const normalized = normalizeEmail(email)
  return getHostEvents()
    .filter(
      (event) =>
        event.createdBy.toLowerCase() === normalized &&
        (event.hostAccountId ?? null) === hostAccountId &&
        event.visibility === visibility &&
        event.id !== excludeEventId &&
        ACTIVE_SLOT_STATUSES.has(event.status),
    )
    .reduce((total, event) => total + countHostEventScheduleDays(event), 0)
}

function isHostEventOverScheduleSlotLimit(event: HostEvent, account: UserAccount): boolean {
  const hostAccountId = event.hostAccountId ?? null
  const eventDays = countHostEventScheduleDays(event)

  if (event.visibility === 'private' && !hostAccountId) {
    const privateLimit = getPrivateEventLimitForAccount(account)
    if (privateLimit === null) return false
    const used = sumHostScheduleDays(account.email, 'private', null, event.id)
    return used + eventDays > privateLimit
  }

  const isVerified = account.verificationStatus === 'phone_verified'
  if (!isVerified) {
    if (hostAccountId) return false
    const limit = getPrivateEventLimitForUserPlan('unverified') ?? 2
    const used = sumHostScheduleDays(account.email, 'private', null, event.id)
    return used + eventDays > limit
  }

  const check = canCreatePublicEvent(account, hostAccountId)
  if (check.limit === 0) return true
  const used = sumHostScheduleDays(account.email, 'public', hostAccountId, event.id)
  return used + eventDays > check.limit
}

export function publishHostEvent(
  eventId: string,
  options?: { adminBypass?: boolean },
): { ok: boolean; event?: HostEvent; error?: string } {
  const event = getHostEventById(eventId)
  if (!event) return { ok: false, error: 'Event not found.' }
  if (event.visibility !== 'public') {
    return { ok: false, error: 'Only public events can be published to Discover.' }
  }

  if (!options?.adminBypass && !event.seededByAdmin) {
    const account = ensureAccount(event.createdBy)
    if (isAccountPostingBlocked(account)) {
      return { ok: false, error: 'Account suspended — cannot publish events.' }
    }
    const check = canCreatePublicEvent(account, event.hostAccountId)
    if (check.reason === 'verify' || check.reason === 'org_pending' || check.reason === 'org_rejected' || check.reason === 'org_suspended' || check.reason === 'org_banned') {
      return { ok: false, error: publicEventBlockMessage(check.reason) }
    }
    if (event.status === 'draft' && isHostEventOverScheduleSlotLimit(event, account)) {
      return { ok: false, error: publicEventBlockMessage('upgrade') }
    }
  }

  return updateHostEventStatus(eventId, 'live')
}

export function unpublishHostEvent(
  eventId: string,
): { ok: boolean; event?: HostEvent; error?: string } {
  return updateHostEventStatus(eventId, 'draft')
}

export function getAdminSeededEvents(): HostEvent[] {
  return getHostEvents().filter((e) => e.seededByAdmin)
}

export type SeedQueueStage = 'draft' | 'pending_review' | 'rejected' | 'accepted'

export function isSeedDraftArchived(event: HostEvent): boolean {
  return Boolean(event.seededByAdmin && event.seedDraftArchivedAt)
}

/** Where a platform seed sits in the admin → host approval pipeline. */
export function getSeedQueueStage(event: HostEvent): SeedQueueStage | undefined {
  if (!event.seededByAdmin) return undefined
  const approval = getSeedApprovalStatus(event)
  if (approval === 'approved') return 'accepted'
  if (approval === 'rejected') return 'rejected'
  if (event.status === 'draft') return 'draft'
  return 'pending_review'
}

/** Seeds still waiting on admin draft send-off, host review, or rejection — not yet accepted. */
export function getSeedEventsInQueue(): HostEvent[] {
  return getAdminSeededEvents().filter(
    (e) => getSeedQueueStage(e) !== 'accepted' && !isSeedDraftArchived(e),
  )
}

/** Platform seeds moved to draft archive with a scheduled deletion date. */
export function getSeedDraftArchiveEvents(): HostEvent[] {
  return getAdminSeededEvents()
    .filter(isSeedDraftArchived)
    .sort((a, b) => {
      const aAt = a.seedScheduledDeleteAt ? new Date(a.seedScheduledDeleteAt).getTime() : 0
      const bAt = b.seedScheduledDeleteAt ? new Date(b.seedScheduledDeleteAt).getTime() : 0
      return aAt - bAt
    })
}

/** Accepted seeds — shown in the main events registry, not the seed queue. */
export function getAcceptedSeedEvents(): HostEvent[] {
  return getAdminSeededEvents().filter((e) => getSeedQueueStage(e) === 'accepted')
}

export function submitSeedEventForReview(
  eventId: string,
): { ok: boolean; event?: HostEvent; error?: string } {
  const event = getHostEventById(eventId)
  if (!event?.seededByAdmin) return { ok: false, error: 'Not a seeded event.' }
  if (getSeedApprovalStatus(event) !== 'pending') {
    return { ok: false, error: 'Only pending seeds can be sent for review.' }
  }
  if (event.status !== 'draft') {
    return { ok: false, error: 'This seed is already with the host for review.' }
  }
  return updateHostEvent(eventId, { status: 'upcoming' })
}

export function defaultTicketTier(): TicketTier {
  return {
    id: `tier_${Date.now()}`,
    name: '',
    priceCents: 0,
    quantity: null,
    sold: 0,
    description: '',
    availableAtDoor: false,
  }
}

export function generateChecklistItemId(): string {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function defaultPotluckItems(): ChecklistItem[] {
  return ['Salad', 'Dessert', 'Drinks', 'Main dish'].map((label) => ({
    id: generateChecklistItemId(),
    label,
    type: 'single_pick' as const,
    maxClaims: 1,
    allowNote: false,
  }))
}

export function defaultConferenceItems(): ChecklistItem[] {
  const slots = [
    'Day 1 Breakfast',
    'Day 1 Lunch',
    'Day 1 Dinner',
    'Day 2 Breakfast',
    'Day 2 Lunch',
    'Day 2 Dinner',
  ]
  return slots.map((label) => ({
    id: generateChecklistItemId(),
    label,
    day: label.split(' ').slice(0, 2).join(' '),
    type: 'multi_check' as const,
  }))
}

export function defaultEventChecklist(): EventChecklist {
  return {
    enabled: false,
    mandatory: false,
    allowSkip: false,
    template: null,
    items: [],
  }
}

/** Migrate stored checklist items — maxClaims defaults to 1. */
export function normalizeEventChecklist(checklist: EventChecklist): EventChecklist {
  return {
    ...checklist,
    items: checklist.items.map((item) => ({
      ...item,
      maxClaims: item.maxClaims ?? 1,
      allowNote: item.allowNote ?? false,
    })),
  }
}

/** Fixed grid slots (empty strings = unused). Saved events compact via getFormAllPhotos. */
export function normalizeAdditionalPhotoSlots(photos: string[]): string[] {
  return Array.from({ length: MAX_EVENT_ADDITIONAL_PHOTOS }, (_, i) => {
    const photo = photos[i]
    return photo?.trim() ? photo : ''
  })
}

export function countFilledAdditionalPhotos(photos: string[]): number {
  return normalizeAdditionalPhotoSlots(photos).filter(Boolean).length
}

/** Combine cover + extras for HostEvent.photos and Discover carousel. */
export function getFormAllPhotos(
  form: Pick<HostEventFormData, 'coverImage' | 'additionalPhotos'>,
): string[] {
  return [form.coverImage, ...normalizeAdditionalPhotoSlots(form.additionalPhotos)]
    .filter(Boolean)
    .slice(0, MAX_EVENT_PHOTOS_TOTAL)
}

export function defaultHostEventFormData(): HostEventFormData {
  return {
    title: '',
    venueName: '',
    streetAddress: '',
    streetSuite: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada',
    description: '',
    coverImage: '',
    additionalPhotos: [],
    eventType: 'single',
    dayShape: 'one_day',
    scheduleType: 'single',
    repeats: 'none',
    weeksOnDeck: 8,
    sellTicketsPerDay: false,
    advancedTicketSales: false,
    recurrenceStartDate: '',
    recurrenceEndDate: '',
    seriesEndDate: '',
    recurrenceCount: null,
    multiDates: [],
    occurrences: [],
    scheduleRepeatMode: 'none',
    scheduleMode: 'single',
    scheduleTimeSlots: false,
    seasonStartDate: '',
    seasonEndDate: '',
    scheduledPublishAt: '',
    eventDate: '',
    startHour: '12',
    startMinute: '00',
    startPeriod: 'PM',
    endHour: '02',
    endMinute: '00',
    endPeriod: 'PM',
    allDay: false,
    visitDuration: 'medium',
    primaryCategory: '',
    secondaryCategory: '',
    subCategories: [],
    customTags: [],
    ticketTiers: [defaultTicketTier()],
    ticketSessions: [],
    ticketingMode: 'free_rsvp',
    capacity: null,
    waitlistEnabled: false,
    externalTicketUrl: '',
    checklist: defaultEventChecklist(),
    ageRestriction: '',
    amenities: [],
    doorPayment: '',
    atmOnSite: false,
    visibility: '',
    privateInviteEmails: [],
    privateShareListIds: [],
  }
}

export function hostEventToFormData(event: HostEvent): HostEventFormData {
  const defaults = defaultHostEventFormData()
  const migrated = migrateScheduleFields(event)
  const eventPhotos = event.photos ?? []
  return {
    ...defaults,
    title: event.title ?? '',
    venueName: event.venueName ?? '',
    streetAddress: event.streetAddress ?? '',
    streetSuite: event.streetSuite ?? '',
    city: event.city ?? '',
    province: event.province ?? '',
    postalCode: event.postalCode ?? '',
    country: event.country ?? 'Canada',
    description: event.description ?? '',
    coverImage: eventPhotos[0] ?? '',
    additionalPhotos: eventPhotos.slice(1, MAX_EVENT_PHOTOS_TOTAL),
    eventType: migrated.eventType ?? defaults.eventType,
    dayShape: migrated.dayShape,
    scheduleType: migrated.scheduleType,
    repeats: migrated.repeats,
    weeksOnDeck: migrated.weeksOnDeck,
    sellTicketsPerDay: migrated.sellTicketsPerDay,
    advancedTicketSales: migrated.advancedTicketSales,
    recurrenceStartDate: event.recurrenceStartDate ?? '',
    recurrenceEndDate: event.recurrenceEndDate ?? '',
    seriesEndDate: event.seriesEndDate ?? event.recurrenceEndDate ?? '',
    recurrenceCount: event.recurrenceCount ?? null,
    multiDates: event.multiDates ?? (event.eventDate ? [event.eventDate] : []),
    occurrences: migrated.occurrences,
    scheduleRepeatMode: migrated.scheduleRepeatMode,
    scheduleMode: migrated.scheduleMode,
    scheduleTimeSlots: migrated.scheduleTimeSlots ?? false,
    seasonStartDate: event.seasonStartDate ?? event.recurrenceStartDate ?? '',
    seasonEndDate: event.seasonEndDate ?? event.recurrenceEndDate ?? '',
    scheduledPublishAt: event.scheduledPublishAt ?? '',
    eventDate: event.eventDate ?? '',
    startHour: event.startHour ?? defaults.startHour,
    startMinute: event.startMinute ?? defaults.startMinute,
    startPeriod: event.startPeriod ?? defaults.startPeriod,
    endHour: event.endHour ?? defaults.endHour,
    endMinute: event.endMinute ?? defaults.endMinute,
    endPeriod: event.endPeriod ?? defaults.endPeriod,
    allDay: event.allDay ?? false,
    visitDuration: event.visitDuration ?? defaults.visitDuration,
    primaryCategory: event.primaryCategory ?? '',
    secondaryCategory: event.secondaryCategory ?? '',
    subCategories: event.subCategories ?? [],
    customTags: event.customTags ?? [],
    ticketTiers: event.ticketTiers?.length ? event.ticketTiers : defaults.ticketTiers,
    ticketSessions: event.ticketSessions ?? [],
    ticketingMode: event.ticketingMode ?? defaults.ticketingMode,
    capacity: event.capacity ?? null,
    waitlistEnabled: event.waitlistEnabled ?? false,
    externalTicketUrl: event.externalTicketUrl ?? '',
    checklist: event.checklist ? normalizeEventChecklist(event.checklist) : defaults.checklist,
    ageRestriction: event.ageRestriction ?? '',
    amenities: (event.amenities ?? []).filter((id) => id !== 'atm'),
    doorPayment: event.doorPayment ?? '',
    atmOnSite: event.atmOnSite ?? event.amenities?.includes('atm') ?? false,
    visibility: event.visibility,
    privateInviteEmails: event.privateInviteEmails ?? [],
    privateShareListIds: event.privateShareListIds ?? [],
  }
}

export function resolveTicketingMode(event: HostEvent): TicketingMode {
  if (event.ticketingMode) return event.ticketingMode
  const tiers = event.ticketTiers ?? []
  if (tiers.length === 0) return 'free_rsvp'
  if (tiers.every((t) => t.priceCents === 0)) return 'free_rsvp'
  return 'sell'
}

export function isEventFree(event: HostEvent): boolean {
  const mode = resolveTicketingMode(event)
  return mode === 'free_rsvp' || mode === 'free_donation'
}

export function isEventSoldOut(event: HostEvent): boolean {
  const mode = resolveTicketingMode(event)
  if (mode === 'free_rsvp' || mode === 'free_donation') {
    if (event.capacity == null) return false
    const rsvpCount = event.ticketTiers?.[0]?.sold ?? 0
    if (rsvpCount < event.capacity) return false
    return !event.waitlistEnabled
  }
  if (mode === 'external') return false
  const tiers = event.ticketTiers ?? []
  if (tiers.length === 0) return false
  return tiers.every((t) => t.quantity != null && t.sold >= t.quantity)
}

export function isEventWaitlist(event: HostEvent): boolean {
  const mode = resolveTicketingMode(event)
  if (mode !== 'free_rsvp' && mode !== 'free_donation') return false
  if (event.capacity == null || !event.waitlistEnabled) return false
  const rsvpCount = event.ticketTiers?.[0]?.sold ?? 0
  return rsvpCount >= event.capacity
}

export function getEventLowestPriceCents(event: HostEvent): number | null {
  const mode = resolveTicketingMode(event)
  if (mode === 'free_rsvp') return null
  const tiers = event.ticketTiers ?? []
  const paid = tiers.filter((t) => t.priceCents > 0)
  if (paid.length === 0) return null
  return Math.min(...paid.map((t) => t.priceCents))
}

export function getEventCostLabel(event: HostEvent): string {
  if (isEventSoldOut(event)) return 'UNAVAILABLE'
  if (isEventWaitlist(event)) return 'WAITLIST'
  const mode = resolveTicketingMode(event)
  if (mode === 'free_rsvp') return 'RSVP'
  if (mode === 'external') return 'GET TICKETS'
  if (mode === 'free_donation') {
    const lowest = getEventLowestPriceCents(event)
    return lowest == null ? 'RSVP' : `$${(lowest / 100).toFixed(lowest % 100 === 0 ? 0 : 2)}+`
  }
  const lowest = getEventLowestPriceCents(event)
  if (lowest == null) return 'RSVP'
  return `$${(lowest / 100).toFixed(lowest % 100 === 0 ? 0 : 2)}`
}

export function getEventActionLabel(event: HostEvent): string {
  const label = getEventCostLabel(event)
  if (label === 'RSVP') return 'RSVP'
  if (label === 'WAITLIST') return 'Join Waitlist'
  if (label === 'UNAVAILABLE') return 'Unavailable'
  if (label === 'GET TICKETS') return 'Get Tickets'
  return 'Get Tickets'
}

export function getAgeRestrictionLabel(restriction?: AgeRestriction | ''): string {
  switch (restriction) {
    case 'family-friendly':
      return 'Family Friendly'
    case '18+':
      return '18+'
    default:
      return 'All Ages'
  }
}

function resolveFormVisibilityForSave(
  visibility: EventVisibilityChoice,
  status: HostEvent['status'],
): EventVisibility | null {
  if (visibility === 'public' || visibility === 'private') return visibility
  if (status === 'draft') return 'private'
  return null
}

function formDataToEventFields(form: HostEventFormData, visibility: EventVisibility): Partial<HostEvent> {
  const scheduleFields = scheduleFieldsFromForm(form)

  return {
    title: form.title.trim(),
    venueName: form.venueName.trim(),
    streetAddress: form.streetAddress.trim(),
    streetSuite: form.streetSuite.trim() || undefined,
    city: form.city.trim(),
    province: form.province.trim(),
    postalCode: form.postalCode.trim() || undefined,
    country: form.country.trim(),
    description: form.description.trim(),
    photos: getFormAllPhotos(form),
    ...scheduleFields,
    recurrenceStartDate: form.recurrenceStartDate,
    recurrenceEndDate: form.recurrenceEndDate,
    eventDate: form.eventDate,
    startHour: form.startHour,
    startMinute: form.startMinute,
    startPeriod: form.startPeriod,
    endHour: form.endHour,
    endMinute: form.endMinute,
    endPeriod: form.endPeriod,
    allDay: form.allDay,
    visitDuration: form.visitDuration,
    primaryCategory: form.primaryCategory,
    secondaryCategory: form.secondaryCategory,
    subCategories: form.subCategories,
    customTags: form.customTags,
    ticketTiers: form.ticketTiers,
    ticketSessions: form.ticketSessions.length > 0 ? form.ticketSessions : undefined,
    ticketingMode: form.ticketingMode,
    capacity: form.capacity,
    waitlistEnabled: form.waitlistEnabled,
    externalTicketUrl: form.externalTicketUrl.trim() || undefined,
    checklist: form.checklist.enabled ? form.checklist : undefined,
    ageRestriction: form.ageRestriction || undefined,
    amenities: form.amenities.filter((id) => id !== 'atm'),
    doorPayment: form.doorPayment || undefined,
    atmOnSite: form.atmOnSite || undefined,
    visibility,
    privateInviteEmails:
      visibility === 'private' ? [...new Set(form.privateInviteEmails.map((e) => e.toLowerCase()))] : undefined,
    privateShareListIds:
      visibility === 'private' && form.privateShareListIds.length > 0
        ? [...form.privateShareListIds]
        : undefined,
  }
}

export function updateHostEvent(
  eventId: string,
  partial: Partial<HostEvent>,
): { ok: boolean; event?: HostEvent; error?: string } {
  const events = getHostEvents()
  const idx = events.findIndex((e) => e.id === eventId)
  if (idx < 0) return { ok: false, error: 'Event not found.' }

  events[idx] = { ...events[idx], ...partial }
  writeJson(EVENTS_KEY, events)
  syncPublicEventCount(events[idx].createdBy)
  return { ok: true, event: events[idx] }
}

export function getOrgDepartments(orgId: string): OrgDepartment[] {
  return getOrganization(orgId)?.departments ?? []
}

export function getOrgDepartment(orgId: string, departmentId: string): OrgDepartment | undefined {
  return getOrgDepartments(orgId).find((d) => d.id === departmentId)
}

export function addOrgDepartment(
  orgId: string,
  input: { name: string; description?: string },
): { ok: boolean; department?: OrgDepartment; error?: string } {
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Department name is required.' }

  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) return { ok: false, error: 'Organization not found.' }

  const department: OrgDepartment = {
    id: generateId('dept'),
    name,
    description: input.description?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }

  orgs[idx] = {
    ...orgs[idx],
    departments: [...(orgs[idx].departments ?? []), department],
  }
  writeJson(ORGS_KEY, orgs)
  return { ok: true, department }
}

export function updateOrgDepartment(
  orgId: string,
  departmentId: string,
  input: { name?: string; description?: string },
): { ok: boolean; department?: OrgDepartment; error?: string } {
  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) return { ok: false, error: 'Organization not found.' }

  const departments = orgs[idx].departments ?? []
  const deptIdx = departments.findIndex((d) => d.id === departmentId)
  if (deptIdx < 0) return { ok: false, error: 'Department not found.' }

  const name = input.name?.trim() || departments[deptIdx].name
  if (!name) return { ok: false, error: 'Department name is required.' }

  const updated: OrgDepartment = {
    ...departments[deptIdx],
    name,
    description: input.description !== undefined ? input.description.trim() || undefined : departments[deptIdx].description,
  }
  departments[deptIdx] = updated
  orgs[idx] = { ...orgs[idx], departments: [...departments] }
  writeJson(ORGS_KEY, orgs)

  // Sync denormalized name on events
  const events = getHostEvents()
  let eventsChanged = false
  events.forEach((event, eventIdx) => {
    if (event.hostAccountId === orgId && event.departmentId === departmentId) {
      events[eventIdx] = { ...event, departmentName: updated.name }
      eventsChanged = true
    }
  })
  if (eventsChanged) writeJson(EVENTS_KEY, events)

  return { ok: true, department: updated }
}

export function removeOrgDepartment(
  orgId: string,
  departmentId: string,
): { ok: boolean; error?: string } {
  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) return { ok: false, error: 'Organization not found.' }

  orgs[idx] = {
    ...orgs[idx],
    departments: (orgs[idx].departments ?? []).filter((d) => d.id !== departmentId),
  }
  writeJson(ORGS_KEY, orgs)

  // Clear department from events (become org-wide)
  const events = getHostEvents()
  let eventsChanged = false
  events.forEach((event, eventIdx) => {
    if (event.hostAccountId === orgId && event.departmentId === departmentId) {
      events[eventIdx] = { ...event, departmentId: undefined, departmentName: undefined }
      eventsChanged = true
    }
  })
  if (eventsChanged) writeJson(EVENTS_KEY, events)

  return { ok: true }
}

export function resolveDepartmentFields(
  hostAccountId: string | null | undefined,
  departmentId?: string | null,
): { departmentId?: string; departmentName?: string } {
  if (!hostAccountId || !departmentId) return {}
  const dept = getOrgDepartment(hostAccountId, departmentId)
  if (!dept) return {}
  return { departmentId: dept.id, departmentName: dept.name }
}

export function saveHostEventFromWizard(input: {
  form: HostEventFormData
  createdBy: string
  hostAccountId?: string | null
  postedAsUserId?: string
  displayName?: string
  departmentId?: string | null
  status: HostEventStatus
  eventId?: string
  adminSeed?: { adminId: string }
}): { ok: boolean; event?: HostEvent; error?: string } {
  const visibility = resolveFormVisibilityForSave(input.form.visibility, input.status)
  if (!visibility) {
    return { ok: false, error: 'Choose public or private before publishing.' }
  }

  const fields = formDataToEventFields(input.form, visibility)
  const isPersonal = !input.hostAccountId
  const deptFields = isPersonal
    ? { departmentId: undefined, departmentName: undefined }
    : resolveDepartmentFields(input.hostAccountId, input.departmentId)

  if (input.eventId) {
    const existing = getHostEventById(input.eventId)
    if (!existing) return { ok: false, error: 'Event not found.' }

    const shareToken =
      visibility === 'private'
        ? existing.shareToken ?? generateShareToken()
        : undefined

    return updateHostEvent(input.eventId, {
      ...fields,
      ...deptFields,
      status: input.status,
      shareToken,
      seededByAdmin: input.adminSeed ? true : existing.seededByAdmin,
      createdByAdminId: input.adminSeed?.adminId ?? existing.createdByAdminId,
      seedApprovalStatus: input.adminSeed
        ? (existing.seedApprovalStatus ?? 'pending')
        : existing.seedApprovalStatus,
    })
  }

  if (!input.adminSeed) {
    const account = ensureAccount(input.createdBy)
    if (isAccountPostingBlocked(account)) {
      return { ok: false, error: 'Your account is suspended. You cannot create or post events.' }
    }
  }

  if (!input.adminSeed && visibility === 'public' && input.status !== 'draft') {
    const account = ensureAccount(input.createdBy)
    const check = canCreatePublicEvent(account, input.hostAccountId)
    if (check.reason === 'verify' || check.reason === 'org_pending' || check.reason === 'org_rejected' || check.reason === 'org_suspended' || check.reason === 'org_banned') {
      return { ok: false, error: publicEventBlockMessage(check.reason) }
    }
  }

  const event: HostEvent = {
    id: generateId('event'),
    ...fields,
    title: fields.title ?? '',
    visibility,
    hostAccountId: input.hostAccountId ?? null,
    postedAsUserId: isPersonal ? (input.postedAsUserId ?? input.createdBy) : undefined,
    displayName: isPersonal ? input.displayName : undefined,
    ...deptFields,
    shareToken: visibility === 'private' ? generateShareToken() : undefined,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    status: input.status,
    seededByAdmin: input.adminSeed ? true : undefined,
    createdByAdminId: input.adminSeed?.adminId,
    seedApprovalStatus: input.adminSeed ? 'pending' : undefined,
  }

  const events = getHostEvents()
  events.push(event)
  writeJson(EVENTS_KEY, events)
  syncPublicEventCount(input.createdBy)
  return { ok: true, event }
}

export function createHostEvent(input: {
  title: string
  visibility: EventVisibility
  createdBy: string
  hostAccountId?: string | null
  postedAsUserId?: string
  displayName?: string
  departmentId?: string | null
  status?: HostEventStatus
}): { ok: boolean; event?: HostEvent; error?: string } {
  const account = ensureAccount(input.createdBy)

  if (isAccountPostingBlocked(account)) {
    return { ok: false, error: 'Your account is suspended. You cannot create events.' }
  }

  if (input.visibility === 'public') {
    const check = canCreatePublicEvent(account, input.hostAccountId)
    if (!check.allowed) {
      if (check.reason) {
        return { ok: false, error: publicEventBlockMessage(check.reason) }
      }
      return { ok: false, error: publicEventBlockMessage('upgrade') }
    }
  } else {
    const privateCheck = canCreatePrivateEvent(account, input.hostAccountId)
    if (!privateCheck.allowed) {
      return {
        ok: false,
        error: privateCheck.reason
          ? privateEventBlockMessage(privateCheck.reason, privateCheck.limit, account)
          : privateEventBlockMessage('limit', privateCheck.limit, account),
      }
    }
  }

  const hostAccountId = input.hostAccountId ?? null
  const isPersonal = !hostAccountId
  const deptFields = isPersonal
    ? {}
    : resolveDepartmentFields(hostAccountId, input.departmentId)

  const event: HostEvent = {
    id: generateId('event'),
    title: input.title.trim(),
    visibility: input.visibility,
    hostAccountId,
    postedAsUserId: isPersonal ? (input.postedAsUserId ?? input.createdBy) : undefined,
    displayName: isPersonal ? input.displayName : undefined,
    ...deptFields,
    shareToken: input.visibility === 'private' ? generateShareToken() : undefined,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    status: input.status ?? 'draft',
  }

  const events = getHostEvents()
  events.push(event)
  writeJson(EVENTS_KEY, events)
  syncPublicEventCount(input.createdBy)

  return { ok: true, event }
}

export function getAllAccounts(): UserAccount[] {
  return getAccounts()
}

export function touchLastActive(email?: string | null): void {
  const resolved = email ?? getCurrentUser()?.email
  if (!resolved) return
  const account = getAccount(resolved)
  if (!account) return
  saveAccount({ ...account, lastActiveAt: new Date().toISOString() })
}

export function deleteHostEvent(eventId: string): boolean {
  const events = getHostEvents()
  const idx = events.findIndex((e) => e.id === eventId)
  if (idx < 0) return false
  const removed = events[idx]
  events.splice(idx, 1)
  writeJson(EVENTS_KEY, events)
  syncPublicEventCount(removed.createdBy)
  return true
}

export function updateOrganization(
  orgId: string,
  partial: Pick<
    Partial<Organization>,
    | 'name'
    | 'profile'
    | 'logoInitial'
    | 'verificationAttemptNumber'
    | 'verificationSubmittedAt'
    | 'country'
    | 'suspended'
    | 'suspendedUntil'
    | 'suspendedAt'
    | 'suspendDuration'
    | 'banned'
    | 'bannedAt'
    | 'banReviewUntil'
    | 'merchShopEnabled'
    | 'merchBlocked'
    | 'merchBlockedReason'
    | 'merchReportedAt'
    | 'merchShopUrl'
    | 'isTrustedPartner'
    | 'partnerLifecycle'
    | 'calendarFeedUrl'
    | 'lastPartnerImportAt'
    | 'lastPartnerImportCount'
    | 'partnerDefaultTicketing'
    | 'partnerDefaultZeffyUrl'
    | 'partnerCity'
    | 'partnerProvince'
    | 'partnerNotes'
    | 'approvalStatus'
  >,
): Organization | null {
  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) return null

  const current = orgs[idx]
  const name = partial.name?.trim() || current.name
  orgs[idx] = {
    ...current,
    ...partial,
    name,
    logoInitial: partial.logoInitial ?? (name.trim().charAt(0).toUpperCase() || 'O'),
  }
  writeJson(ORGS_KEY, orgs)
  window.dispatchEvent(new Event(ORGANIZATIONS_CHANGED_EVENT))

  const hasMerchUpdate =
    partial.merchShopEnabled !== undefined ||
    partial.merchBlocked !== undefined ||
    partial.merchBlockedReason !== undefined ||
    partial.merchReportedAt !== undefined ||
    partial.merchShopUrl !== undefined
  if (hasMerchUpdate) {
    persistOrgMerchSettings(orgId, partial)
    notifyHostProfilesCleared()
  } else if (partial.name !== undefined || partial.profile !== undefined) {
    notifyHostProfilesCleared()
  }

  return orgs[idx]
}

export function updateOrganizationApproval(
  orgId: string,
  approvalStatus: OrgApprovalStatus,
): Organization | null {
  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) return null
  const current = orgs[idx]
  if (approvalStatus === 'approved') {
    orgs[idx] = {
      ...current,
      approvalStatus,
      rejectedAt: undefined,
      rejectedBy: undefined,
      rejectionReason: undefined,
      rejectionMessage: undefined,
    }
  } else {
    orgs[idx] = { ...current, approvalStatus }
  }
  writeJson(ORGS_KEY, orgs)
  return orgs[idx]
}

export type RejectOrganizationInput = {
  rejectionReason: string
  rejectionMessage: string
  rejectedBy?: string
}

export function rejectOrganization(
  orgId: string,
  input: RejectOrganizationInput,
): Organization | null {
  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) return null
  const rejectedBy = input.rejectedBy ?? getCurrentUser()?.email ?? 'admin@tudu.ca'
  orgs[idx] = {
    ...orgs[idx],
    approvalStatus: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectedBy,
    rejectionReason: input.rejectionReason.trim(),
    rejectionMessage: input.rejectionMessage.trim(),
  }
  writeJson(ORGS_KEY, orgs)
  return orgs[idx]
}

const DEMO_ORG_SEED_ID = 'org_demo_kindersley'
const DEMO_ORG_PENDING_SEED_ID = 'org_demo_pending_review'

export function seedDemoAccount(): void {
  const account = ensureAccount('demo@tudu.ca')
  saveAccount({
    ...account,
    country: account.country ?? 'Canada',
    // Explorer tier so demo can exercise subscriber features (e.g. Quick Pick).
    tier: 'tier1',
    verificationStatus: 'phone_verified',
  })
}

/** Demo org owned by demo@tudu.ca with orgadmin@tudu.ca as invited admin (for org-only testing). */
export function seedDemoOrgWithAdmin(): void {
  const ownerEmail = 'demo@tudu.ca'
  const adminEmail = 'orgadmin@tudu.ca'
  const orgs = getOrganizations()
  const existingDemo = orgs.find((o) => o.id === DEMO_ORG_SEED_ID)
  if (existingDemo) {
    if (existingDemo.merchShopEnabled !== true) {
      updateOrganization(DEMO_ORG_SEED_ID, { merchShopEnabled: true })
    } else {
      persistOrgMerchSettings(DEMO_ORG_SEED_ID, { merchShopEnabled: true })
    }
    return
  }

  const org: Organization = {
    id: DEMO_ORG_SEED_ID,
    name: 'Kindersley Events Co.',
    category: 'Community',
    logoInitial: 'K',
    createdBy: ownerEmail,
    createdAt: new Date().toISOString(),
    primaryAdminEmail: ownerEmail,
    backupAdminEmail: adminEmail,
    contactEmail: 'events@kindersley.example',
    approvalStatus: 'approved',
    departments: [],
    country: 'Canada',
    merchShopEnabled: true,
  }
  orgs.push(org)
  writeJson(ORGS_KEY, orgs)
  persistOrgMerchSettings(org.id, { merchShopEnabled: true })

  const members = getOrgMembers()
  if (!members.some((m) => m.orgId === org.id && m.email === ownerEmail)) {
    members.push({
      id: generateId('member'),
      orgId: org.id,
      email: ownerEmail,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    })
  }
  if (!members.some((m) => m.orgId === org.id && m.email === adminEmail)) {
    members.push({
      id: generateId('member'),
      orgId: org.id,
      email: adminEmail,
      role: 'admin',
      joinedAt: new Date().toISOString(),
      isBackupAdmin: true,
    })
  }
  writeJson(MEMBERS_KEY, members)

  const ownerAccount = ensureAccount(ownerEmail)
  saveAccount({
    ...ownerAccount,
    accountType: 'organization_member',
    activeOrgId: org.id,
  })

  const adminAccount = ensureAccount(adminEmail)
  saveAccount({
    ...adminAccount,
    accountType: 'organization_member',
    activeOrgId: org.id,
    postingAs: org.id,
  })
}

/** Pending demo org for Control Room approval queue testing (no members — admin-only visibility). */
export function seedDemoPendingOrg(): void {
  const orgs = getOrganizations()
  if (orgs.some((o) => o.id === DEMO_ORG_PENDING_SEED_ID)) return

  const org: Organization = {
    id: DEMO_ORG_PENDING_SEED_ID,
    name: 'Prairie Community Events',
    category: 'Community',
    logoInitial: 'P',
    createdBy: 'pendinghost@example.com',
    createdAt: new Date().toISOString(),
    primaryAdminEmail: 'pendinghost@example.com',
    backupAdminEmail: '',
    contactEmail: 'hello@prairie.example',
    approvalStatus: 'pending',
    departments: [],
    country: 'Canada',
  }
  orgs.push(org)
  writeJson(ORGS_KEY, orgs)
}
