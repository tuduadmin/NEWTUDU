import { getCurrentUser } from './auth'
import { getHomeCity } from './location'

export type VerificationStatus = 'unverified' | 'phone_verified'
export type UserTier = 'free' | 'verified' | 'tier1' | 'tier2'
export type AccountType = 'personal' | 'organization_member'
export type OrgRole = 'owner' | 'admin' | 'staff' | 'viewer'
export type EventVisibility = 'public' | 'private'
export type HostEventStatus = 'draft' | 'upcoming' | 'live' | 'past'
export type PostingAs = 'personal' | string

/** Host Account — business entity separate from User (stored as Organization). */
export interface Organization {
  id: string
  name: string
  category: string
  logoInitial: string
  profile?: string
  createdBy: string
  createdAt: string
  /** Required backup admin email (must have a designated Admin). */
  backupAdminEmail: string
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
  createdBy: string
  createdAt: string
  status: HostEventStatus
}

const ACCOUNTS_KEY = 'tudu_accounts'
const ORGS_KEY = 'tudu_organizations'
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
  localStorage.setItem(key, JSON.stringify(value))
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
  return { ...event, hostAccountId, orgId: undefined }
}

function migrateOrganization(org: Organization): Organization {
  return {
    ...org,
    backupAdminEmail: org.backupAdminEmail ?? '',
  }
}

function getAccounts(): UserAccount[] {
  return readJson<UserAccount[]>(ACCOUNTS_KEY, [])
}

function saveAccounts(accounts: UserAccount[]): void {
  writeJson(ACCOUNTS_KEY, accounts)
}

export interface UserAccount {
  email: string
  verificationStatus: VerificationStatus
  tier: UserTier
  phone?: string
  publicEventCount: number
  homeCity: string
  accountType: AccountType
  /** Primary Host Account for Event Manager display. */
  activeOrgId?: string
  /** Post as personal or a Host Account id. */
  postingAs?: PostingAs
}

function defaultAccount(email: string): UserAccount {
  return {
    email,
    verificationStatus: 'unverified',
    tier: 'free',
    publicEventCount: 0,
    homeCity: getHomeCity(),
    accountType: 'personal',
    postingAs: 'personal',
  }
}

export function ensureAccount(email: string): UserAccount {
  const accounts = getAccounts()
  const normalized = normalizeEmail(email)
  const existing = accounts.find((a) => a.email.toLowerCase() === normalized)
  if (existing) return existing

  const account = defaultAccount(email)
  accounts.push(account)
  saveAccounts(accounts)
  return account
}

export function getAccount(email?: string | null): UserAccount | null {
  const resolved = email ?? getCurrentUser()?.email
  if (!resolved) return null
  return ensureAccount(resolved)
}

export function getCurrentAccount(): UserAccount | null {
  return getAccount(getCurrentUser()?.email)
}

export function saveAccount(account: UserAccount): UserAccount {
  const accounts = getAccounts()
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase())
  if (idx >= 0) accounts[idx] = account
  else accounts.push(account)
  saveAccounts(accounts)
  return account
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
  if (postingAs !== 'personal') {
    const member = getOrgMembers(postingAs).find((m) => m.email.toLowerCase() === normalizeEmail(email))
    if (!member) return null
  }
  return saveAccount({ ...account, postingAs, activeOrgId: postingAs === 'personal' ? account.activeOrgId : postingAs })
}

export function getPublicEventLimit(account: UserAccount): number {
  if (account.verificationStatus !== 'phone_verified') return 0

  switch (account.tier) {
    case 'tier2':
      return 50
    case 'tier1':
      return 10
    case 'verified':
    case 'free':
      return 2
    default:
      return 2
  }
}

export function getRemainingPublicSlots(account: UserAccount): number {
  const limit = getPublicEventLimit(account)
  return Math.max(0, limit - account.publicEventCount)
}

export type PublicEventBlockReason = 'verify' | 'upgrade'

export function canCreatePublicEvent(account: UserAccount): {
  allowed: boolean
  reason?: PublicEventBlockReason
  remaining: number
  limit: number
} {
  const limit = getPublicEventLimit(account)
  const remaining = getRemainingPublicSlots(account)

  if (limit === 0) {
    return { allowed: false, reason: 'verify', remaining: 0, limit }
  }
  if (account.publicEventCount >= limit) {
    return { allowed: false, reason: 'upgrade', remaining: 0, limit }
  }
  return { allowed: true, remaining, limit }
}

export function getTierLabel(tier: UserTier): string {
  switch (tier) {
    case 'tier2':
      return 'Tier 2'
    case 'tier1':
      return 'Tier 1'
    case 'verified':
      return 'Verified'
    default:
      return 'Free'
  }
}

export function verifyPhone(email: string, phone: string, code: string): { ok: boolean; error?: string } {
  if (code !== DEMO_VERIFICATION_CODE) {
    return { ok: false, error: 'Invalid verification code. Demo code is 123456.' }
  }

  const account = ensureAccount(email)
  saveAccount({
    ...account,
    phone,
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

export function getOrganization(id: string): Organization | undefined {
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

export function getBackupAdminMember(orgId: string): OrganizationMember | undefined {
  return getOrgMembers(orgId).find((m) => m.isBackupAdmin)
}

export function createOrganization(input: {
  name: string
  category: string
  creatorEmail: string
  backupAdminEmail: string
}): { ok: boolean; org?: Organization; error?: string } {
  const backupEmail = normalizeEmail(input.backupAdminEmail)
  if (!backupEmail || !backupEmail.includes('@')) {
    return { ok: false, error: 'Backup admin email is required.' }
  }
  if (backupEmail === normalizeEmail(input.creatorEmail)) {
    return { ok: false, error: 'Backup admin must be a different person.' }
  }

  const org: Organization = {
    id: generateId('org'),
    name: input.name.trim(),
    category: input.category,
    logoInitial: input.name.trim().charAt(0).toUpperCase() || 'O',
    createdBy: input.creatorEmail,
    createdAt: new Date().toISOString(),
    backupAdminEmail: backupEmail,
  }

  const orgs = getOrganizations()
  orgs.push(org)
  writeJson(ORGS_KEY, orgs)

  const ownerMember: OrganizationMember = {
    id: generateId('member'),
    orgId: org.id,
    email: normalizeEmail(input.creatorEmail),
    role: 'owner',
    joinedAt: new Date().toISOString(),
  }

  inviteTeamMember({
    orgId: org.id,
    email: backupEmail,
    role: 'admin',
    invitedBy: input.creatorEmail,
    isBackupAdmin: true,
  })

  const members = getOrgMembers()
  members.push(ownerMember)
  writeJson(MEMBERS_KEY, members)

  const account = ensureAccount(input.creatorEmail)
  saveAccount({
    ...account,
    accountType: 'organization_member',
    activeOrgId: org.id,
    postingAs: org.id,
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
  saveAccount({
    ...account,
    accountType: 'organization_member',
    activeOrgId: invite.orgId,
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
  return readJson<HostEvent[]>(EVENTS_KEY, []).map(migrateHostEvent)
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

export function getPublicHostEventsForDiscover(): HostEvent[] {
  return getHostEvents().filter(
    (e) =>
      e.visibility === 'public' &&
      (e.status === 'live' || e.status === 'upcoming'),
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

export function publishHostEvent(eventId: string): { ok: boolean; event?: HostEvent; error?: string } {
  const event = getHostEventById(eventId)
  if (!event) return { ok: false, error: 'Event not found.' }
  if (event.visibility !== 'public') {
    return { ok: false, error: 'Only public events can be published to Discover.' }
  }

  const account = ensureAccount(event.createdBy)
  const check = canCreatePublicEvent(account)
  if (!check.allowed && event.status === 'draft') {
    if (check.reason === 'verify') {
      return { ok: false, error: 'Verify your phone to publish public events.' }
    }
    return { ok: false, error: 'Upgrade for more public events.' }
  }

  return updateHostEventStatus(eventId, 'live')
}

export function createHostEvent(input: {
  title: string
  visibility: EventVisibility
  createdBy: string
  hostAccountId?: string | null
  postedAsUserId?: string
  displayName?: string
  status?: HostEventStatus
}): { ok: boolean; event?: HostEvent; error?: string } {
  const account = ensureAccount(input.createdBy)

  if (input.visibility === 'public') {
    const check = canCreatePublicEvent(account)
    if (!check.allowed) {
      if (check.reason === 'verify') {
        return { ok: false, error: 'Verify your phone to post public events.' }
      }
      return { ok: false, error: 'Upgrade for more public events.' }
    }
  }

  const hostAccountId = input.hostAccountId ?? null
  const isPersonal = !hostAccountId

  const event: HostEvent = {
    id: generateId('event'),
    title: input.title.trim(),
    visibility: input.visibility,
    hostAccountId,
    postedAsUserId: isPersonal ? (input.postedAsUserId ?? input.createdBy) : undefined,
    displayName: isPersonal ? input.displayName : undefined,
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

export function seedDemoAccount(): void {
  ensureAccount('demo@tudu.ca')
}
