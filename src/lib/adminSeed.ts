import type { EventCardBorderType } from './eventCardColors'
import {
  defaultHostEventFormData,
  ensureAccount,
  getAccount,
  getAdminSeededEvents,
  getHostAccount,
  getOrganizationApprovalStatus,
  getOrganizationOwnerEmail,
  getOrganizations,
  getSeedEventsInQueue,
  getSeedQueueStage,
  deleteHostEvent,
  getHostEventById,
  isSeedDraftArchived,
  isSeedEventInDiscoverDeck,
  publishHostEvent,
  saveHostEventFromWizard,
  updateHostEvent,
  type HostEvent,
  type HostEventFormData,
  type HostEventStatus,
  type SeedQueueStage,
} from './account'
import { logActivity } from './adminAnalytics'
import { sendAdminMessage } from './adminMessages'
import { getAttractions, getPublicAttractions } from './attractions'
import type { DeliveryChannel } from './userNotifications'
import { getCurrentUser, isPlatformAdmin, type StoredUser } from './auth'
import { BRAND_TOKENS } from './brandTokens'

const USERS_KEY = 'tudu_users'

export type SeedTargetType = 'personal' | 'org'

export type SeedTarget = {
  type: SeedTargetType
  id: string
  label: string
  email?: string
  tierLabel: string
  tierColor: string
  suggestedBorderType: EventCardBorderType
}

function personalTierForEmail(email: string): Pick<
  SeedTarget,
  'tierLabel' | 'tierColor' | 'suggestedBorderType'
> {
  const account = ensureAccount(email)
  if (account.verificationStatus !== 'phone_verified') {
    return {
      tierLabel: 'Unverified',
      tierColor: BRAND_TOKENS.user.unverified,
      suggestedBorderType: 'grey',
    }
  }
  if (account.tier === 'tier1') {
    return {
      tierLabel: 'Explorer',
      tierColor: BRAND_TOKENS.user.explorer,
      suggestedBorderType: 'explorer',
    }
  }
  if (account.tier === 'verified' || account.tier === 'tier2') {
    return {
      tierLabel: 'Verified',
      tierColor: BRAND_TOKENS.user.verified,
      suggestedBorderType: 'green',
    }
  }
  return {
    tierLabel: 'Verified',
    tierColor: BRAND_TOKENS.user.verified,
    suggestedBorderType: 'green',
  }
}

function orgTierForId(orgId: string): Pick<
  SeedTarget,
  'tierLabel' | 'tierColor' | 'suggestedBorderType'
> {
  const org = getOrganizations().find((o) => o.id === orgId)
  if (!org || getOrganizationApprovalStatus(org) !== 'approved') {
    return {
      tierLabel: 'Unverified',
      tierColor: BRAND_TOKENS.org.unverified,
      suggestedBorderType: 'grey',
    }
  }
  const ownerTier = getAccount(getOrganizationOwnerEmail(org))?.tier ?? 'free'
  if (ownerTier === 'tier2') {
    return {
      tierLabel: 'Trusted Host',
      tierColor: BRAND_TOKENS.org.trustedHost,
      suggestedBorderType: 'blue',
    }
  }
  if (ownerTier === 'tier1') {
    return {
      tierLabel: 'Pioneer',
      tierColor: BRAND_TOKENS.org.pioneer,
      suggestedBorderType: 'orange',
    }
  }
  return {
    tierLabel: 'Verified',
    tierColor: BRAND_TOKENS.org.verified,
    suggestedBorderType: 'green',
  }
}

function withSeedTargetTier(base: Omit<SeedTarget, 'tierLabel' | 'tierColor' | 'suggestedBorderType'>): SeedTarget {
  const tier =
    base.type === 'personal'
      ? personalTierForEmail(base.email ?? base.id)
      : orgTierForId(base.id)
  return { ...base, ...tier }
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

/** Deep link from admin People → Manage into the seed event form with host pre-selected. */
export function buildAdminSeedEventCreatePath(input: {
  userEmail?: string
  orgId?: string
}): string {
  const params = new URLSearchParams()
  if (input.orgId?.trim()) {
    params.set('orgId', input.orgId.trim())
  } else if (input.userEmail?.trim()) {
    params.set('userId', input.userEmail.trim())
  }
  const query = params.toString()
  return query ? `/admin/seed-events/create?${query}` : '/admin/seed-events/create'
}

export function resolveSeedTargetFromQuery(searchParams: URLSearchParams): SeedTarget | null {
  const orgId = searchParams.get('orgId')?.trim()
  if (orgId) {
    const org = getOrganizations().find((o) => o.id === orgId)
    if (!org) return null
    return withSeedTargetTier({ type: 'org', id: org.id, label: org.name })
  }

  const emailRaw = searchParams.get('userId') ?? searchParams.get('hostEmail')
  const email = emailRaw?.trim()
  if (!email) return null

  const user = getStoredUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (user) {
    return withSeedTargetTier({
      type: 'personal',
      id: user.email,
      label: `${user.firstName} ${user.lastName}`.trim() || user.email,
      email: user.email,
    })
  }

  return (
    getSeedTargets().find(
      (t) => t.type === 'personal' && t.id.toLowerCase() === email.toLowerCase(),
    ) ?? null
  )
}

export function getSeedTargets(): SeedTarget[] {
  const targets: SeedTarget[] = []

  for (const user of getStoredUsers()) {
    if (user.email.toLowerCase() === 'admin@tudu.ca') continue
    targets.push(
      withSeedTargetTier({
        type: 'personal',
        id: user.email,
        label: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
      }),
    )
  }

  for (const org of getOrganizations()) {
    targets.push(withSeedTargetTier({ type: 'org', id: org.id, label: org.name }))
  }

  return targets
}

export type { SeedQueueStage } from './account'
export { getSeedEventsInQueue, getSeedDraftArchiveEvents, getSeedQueueStage, isSeedDraftArchived, submitSeedEventForReview } from './account'

export function getSeedContentStats(): {
  seededEvents: number
  publicSeededEvents: number
  attractions: number
  publicAttractions: number
} {
  const seeded = getAdminSeededEvents()
  return {
    seededEvents: seeded.length,
    publicSeededEvents: seeded.filter((e) => isSeedEventInDiscoverDeck(e)).length,
    attractions: getAttractions().length,
    publicAttractions: getPublicAttractions().length,
  }
}

export function getSeedContentCounts(): { seededEvents: number; attractions: number } {
  return {
    seededEvents: getAdminSeededEvents().length,
    attractions: getPublicAttractions().length,
  }
}

export function requirePlatformAdmin(): { ok: true; admin: StoredUser } | { ok: false; error: string } {
  const admin = getCurrentUser()
  if (!admin || !isPlatformAdmin(admin.email)) {
    return { ok: false, error: 'Platform admin access required.' }
  }
  return { ok: true, admin }
}

export function createAdminSeededEvent(input: {
  target: SeedTarget
  form: HostEventFormData
  publishLive: boolean
  saveAsDraft?: boolean
  promoCode?: string
  discoverBorderType?: EventCardBorderType
}): { ok: boolean; event?: HostEvent; error?: string } {
  const gate = requirePlatformAdmin()
  if (!gate.ok) return gate

  const targetEmail =
    input.target.type === 'personal'
      ? input.target.email ?? input.target.id
      : getHostAccount(input.target.id)?.createdBy

  if (!targetEmail) {
    return { ok: false, error: 'Could not resolve event owner for this target.' }
  }

  const user = getStoredUsers().find((u) => u.email.toLowerCase() === targetEmail.toLowerCase())
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : undefined

  const status: HostEventStatus = input.saveAsDraft
    ? 'draft'
    : input.form.visibility === 'private'
      ? 'upcoming'
      : input.publishLive
        ? 'live'
        : 'upcoming'

  const saved = saveHostEventFromWizard({
    form: input.form,
    createdBy: targetEmail,
    hostAccountId: input.target.type === 'org' ? input.target.id : null,
    postedAsUserId: input.target.type === 'personal' ? targetEmail : undefined,
    displayName: input.target.type === 'personal' ? displayName : undefined,
    status,
    adminSeed: { adminId: gate.admin.email },
  })

  if (!saved.ok || !saved.event) {
    return saved
  }

  if (input.promoCode || input.discoverBorderType) {
    updateHostEvent(saved.event.id, {
      promoCode: input.promoCode?.trim() || undefined,
      discoverBorderType: input.discoverBorderType,
    })
  }

  if (input.form.visibility === 'public' && input.publishLive && !input.saveAsDraft && saved.event.status !== 'live') {
    const published = publishHostEvent(saved.event.id, { adminBypass: true })
    if (!published.ok) {
      return { ok: false, error: published.error ?? 'Event saved but could not publish.' }
    }
    return { ok: true, event: published.event }
  }

  return saved
}

export function defaultAdminSeedEventForm(): HostEventFormData {
  const form = defaultHostEventFormData()
  form.province = form.province || 'SK'
  form.visibility = 'public'
  form.eventDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  return form
}

export const SEED_DRAFT_DELETE_DAY_OPTIONS = [7, 14, 30, 60, 90] as const

export type SeedDraftDeleteDays = (typeof SEED_DRAFT_DELETE_DAY_OPTIONS)[number]

export function resolveSeedEventHostEmail(event: HostEvent): string {
  return event.createdBy.trim().toLowerCase()
}

function seedReviewReminderBody(event: HostEvent, origin: string): string {
  return [
    `TUDU created "${event.title}" for your host account and needs your review before it can go live on Discover.`,
    '',
    'Open Event Manager to approve or decline this seeded event.',
    `${origin}/host`,
  ].join('\n')
}

/** Nudge host to approve a pending seed — SMS and/or in-app (demo delivery stubs). */
export function sendSeedEventReminder(
  eventId: string,
  channels: DeliveryChannel[],
): { ok: boolean; event?: HostEvent; error?: string; messageId?: string } {
  const gate = requirePlatformAdmin()
  if (!gate.ok) return gate

  const event = getHostEventById(eventId)
  if (!event?.seededByAdmin) return { ok: false, error: 'Not a seeded event.' }

  const stage = getSeedQueueStage(event)
  if (stage !== 'pending_review') {
    return { ok: false, error: 'Reminders are only for seeds awaiting host review.' }
  }

  const selected = channels.filter((c) => c === 'sms' || c === 'in_app')
  if (selected.length === 0) {
    return { ok: false, error: 'Choose SMS and/or in-app messaging.' }
  }

  const hostEmail = resolveSeedEventHostEmail(event)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tudu.ca'
  const subject = `Reminder: review seeded event "${event.title}"`

  const msg = sendAdminMessage({
    toEmail: hostEmail,
    subject,
    body: seedReviewReminderBody(event, origin),
    fromEmail: gate.admin.email,
    deliveryChannels: selected,
    notificationMeta: {
      orgId: event.hostAccountId ?? undefined,
      type: 'seed_event_reminder',
    },
  })

  const reminderCount = (event.seedReminderCount ?? 0) + 1
  const updated = updateHostEvent(eventId, {
    seedReminderCount: reminderCount,
    seedLastReminderAt: new Date().toISOString(),
  })

  if (!updated.ok) {
    return { ok: false, error: updated.error ?? 'Reminder sent but event record not updated.' }
  }

  logActivity({
    type: 'message_delivery',
    label: `Seed reminder #${reminderCount} — ${event.title} → ${hostEmail} (${selected.join(', ')})`,
    meta: { eventId, channels: selected.join(',') },
  })

  return { ok: true, event: updated.event, messageId: msg.id }
}

/** Move unaccepted seed back to draft archive with scheduled deletion. */
export function archiveSeedEventToDraft(
  eventId: string,
  deleteAfterDays: SeedDraftDeleteDays,
): { ok: boolean; event?: HostEvent; error?: string } {
  const gate = requirePlatformAdmin()
  if (!gate.ok) return gate

  const event = getHostEventById(eventId)
  if (!event?.seededByAdmin) return { ok: false, error: 'Not a seeded event.' }

  const stage = getSeedQueueStage(event)
  if (stage !== 'pending_review' && stage !== 'rejected') {
    return {
      ok: false,
      error: 'Only pending or declined seeds can move to the draft archive.',
    }
  }

  const archivedAt = new Date()
  const scheduled = new Date(archivedAt)
  scheduled.setDate(scheduled.getDate() + deleteAfterDays)

  const result = updateHostEvent(eventId, {
    status: 'draft',
    seedApprovalStatus: 'pending',
    seedDraftArchivedAt: archivedAt.toISOString(),
    seedDeleteAfterDays: deleteAfterDays,
    seedScheduledDeleteAt: scheduled.toISOString(),
  })

  if (result.ok) {
    logActivity({
      type: 'sync',
      label: `Seed archived to draft — ${event.title} (delete in ${deleteAfterDays}d)`,
      meta: { eventId, deleteAfterDays: String(deleteAfterDays) },
    })
  }

  return result
}

/** Restore archived draft seed back to host review queue. */
export function restoreSeedEventFromDraftArchive(
  eventId: string,
): { ok: boolean; event?: HostEvent; error?: string } {
  const event = getHostEventById(eventId)
  if (!event?.seededByAdmin) return { ok: false, error: 'Not a seeded event.' }
  if (!isSeedDraftArchived(event)) {
    return { ok: false, error: 'This seed is not in the draft archive.' }
  }

  return updateHostEvent(eventId, {
    status: 'upcoming',
    seedApprovalStatus: 'pending',
    seedDraftArchivedAt: undefined,
    seedDeleteAfterDays: undefined,
    seedScheduledDeleteAt: undefined,
  })
}

/** Delete seed draft archives past their scheduled deletion date. */
export function processExpiredSeedDraftDeletions(now = new Date()): number {
  let deleted = 0
  for (const event of getAdminSeededEvents()) {
    if (!event.seedScheduledDeleteAt || event.status !== 'draft') continue
    const deleteAt = new Date(event.seedScheduledDeleteAt)
    if (Number.isNaN(deleteAt.getTime()) || now < deleteAt) continue
    if (deleteHostEvent(event.id)) {
      logActivity({
        type: 'sync',
        label: `Auto-deleted expired seed draft — ${event.title}`,
        meta: { eventId: event.id },
      })
      deleted += 1
    }
  }
  return deleted
}

/** Permanently delete a platform seed (admin only). */
export function deleteAdminSeedEvent(
  eventId: string,
): { ok: boolean; error?: string } {
  const gate = requirePlatformAdmin()
  if (!gate.ok) return gate

  const event = getHostEventById(eventId)
  if (!event?.seededByAdmin) {
    return { ok: false, error: 'Not a seeded event.' }
  }

  if (!deleteHostEvent(eventId)) {
    return { ok: false, error: 'Could not delete event.' }
  }

  logActivity({
    type: 'sync',
    label: `Deleted seed event — ${event.title}`,
    meta: { eventId },
  })

  return { ok: true }
}
