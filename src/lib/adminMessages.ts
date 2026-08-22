import {
  ensureAccount,
  getAccount,
  getAllAccounts,
  getOrganization,
  getOrganizations,
  getOrganizationOwnerEmail,
  isAccountSuspended,
} from './account'
import { logActivity } from './adminAnalytics'
import {
  accountMatchesFilters,
  getProvinceLabel,
  isAdminEmail,
  resolveAccountGeo,
  type AnalyticsFilters,
} from './analyticsGeo'
import { getAllUsers, getCurrentUser, PLATFORM_ADMIN } from './auth'
import {
  addUserNotification,
  type DeliveryChannel,
  type UserNotificationType,
} from './userNotifications'

export type { AnalyticsFilters as GeoFilters }

export type { DeliveryChannel }
export type DeliveryStatusValue = 'sent' | 'failed' | 'skipped'

export const ADMIN_MESSAGES_CHANGED_EVENT = 'tudu-admin-messages-changed'

const MESSAGES_KEY = 'tudu-admin-messages'

export interface AdminMessage {
  id: string
  threadId: string
  fromEmail: string
  toEmail: string
  subject: string
  body: string
  timestamp: string
  read: boolean
  direction: 'inbound' | 'outbound'
  deliveryChannels?: DeliveryChannel[]
  deliveryStatus?: Partial<Record<DeliveryChannel, DeliveryStatusValue>>
  deliveryErrors?: Partial<Record<DeliveryChannel, string>>
  batchId?: string
  batchLabel?: string
  /** Hidden from main inbox; viewable under Archived. */
  archived?: boolean
  /** Soft-deleted; viewable under Trash and restorable. */
  deleted?: boolean
  /** Support reference — e.g. DEL-000001 */
  ticketNumber?: string
}

export type InboxFilter = 'inbox' | 'archived' | 'trash'

export type BatchMessageRecipient = {
  email: string
  firstName: string
  lastName: string
  city: string
  province: string
  tier: string
  verificationStatus: string
  suspended: boolean
}

export type BatchSendSummary = {
  sent: number
  skippedBanned: number
  emailOk: number
  smsOk: number
  smsFailed: number
  inAppOk: number
  batchId: string
  batchLabel: string
  suspendedIncluded: number
}

export interface MessageThread {
  threadId: string
  participantEmail: string
  subject: string
  lastMessage: string
  lastTimestamp: string
  unreadCount: number
  messages: AdminMessage[]
}

export const POKE_TEMPLATES = [
  {
    id: 'events-week',
    label: 'New events this week',
    subject: 'New events near you',
    body: 'Hey! New events in Saskatoon this week — open TUDU and check the discover deck.',
  },
  {
    id: 'invite-back',
    label: 'Invite back',
    subject: 'We miss you on TUDU',
    body: "Hey! It's been a while. There are fresh events and attractions waiting in your city. Come back and explore!",
  },
  {
    id: 'verify-reminder',
    label: 'Verify reminder',
    subject: 'Verify to unlock public posting',
    body: 'Quick reminder: verify your phone to post public events and reach more people on TUDU.',
  },
  {
    id: 'host-nudge',
    label: 'Host nudge',
    subject: 'Ready to host?',
    body: 'You have events in draft — publish them live and start collecting RSVPs today.',
  },
] as const

function readMessages(): AdminMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    return raw ? (JSON.parse(raw) as AdminMessage[]) : []
  } catch {
    return []
  }
}

function saveMessages(messages: AdminMessage[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_MESSAGES_CHANGED_EVENT))
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function threadKey(emailA: string, emailB: string): string {
  return [emailA, emailB].map((e) => e.toLowerCase()).sort().join('::')
}

/** Route org ids / org contact emails to the org owner's personal account. */
export function resolveAdminMessageRecipientEmail(toEmail: string): {
  email: string
  orgId?: string
  orgName?: string
  routedFromOrg: boolean
} {
  const trimmed = toEmail.trim()
  if (!trimmed) {
    return { email: '', routedFromOrg: false }
  }

  const normalized = trimmed.toLowerCase()

  const orgById = getOrganization(trimmed)
  if (orgById) {
    return {
      email: getOrganizationOwnerEmail(orgById).toLowerCase(),
      orgId: orgById.id,
      orgName: orgById.name,
      routedFromOrg: true,
    }
  }

  for (const org of getOrganizations()) {
    if (org.name.trim().toLowerCase() === normalized) {
      return {
        email: getOrganizationOwnerEmail(org).toLowerCase(),
        orgId: org.id,
        orgName: org.name,
        routedFromOrg: true,
      }
    }
    if (org.contactEmail?.trim().toLowerCase() === normalized) {
      return {
        email: getOrganizationOwnerEmail(org).toLowerCase(),
        orgId: org.id,
        orgName: org.name,
        routedFromOrg: true,
      }
    }
  }

  if (getAccount(normalized)) {
    return { email: normalized, routedFromOrg: false }
  }

  return { email: normalized, routedFromOrg: false }
}

function deliverEmailStub(toEmail: string, subject: string): DeliveryStatusValue {
  console.info('[TUDU Phase 1] Email stub delivery', { to: toEmail, subject })
  logActivity({
    type: 'message_delivery',
    label: `Email stub sent to ${toEmail}`,
    meta: { channel: 'email', toEmail, subject, status: 'sent' },
  })
  return 'sent'
}

function deliverSmsStub(
  toEmail: string,
  phone: string | undefined,
  verified: boolean,
  subject: string,
): { status: DeliveryStatusValue; error?: string } {
  if (!phone) {
    return { status: 'failed', error: 'No phone number on account' }
  }
  if (!verified) {
    return { status: 'failed', error: 'Phone not verified' }
  }
  console.info('[TUDU Phase 1] SMS stub delivery', { to: toEmail, phone, subject })
  logActivity({
    type: 'message_delivery',
    label: `SMS stub sent to ${toEmail}`,
    meta: { channel: 'sms', toEmail, phone, subject, status: 'sent' },
  })
  return { status: 'sent' }
}

function deliverInApp(
  msg: AdminMessage,
  notificationMeta?: { feedbackId?: string; ticketNumber?: string; orgId?: string; type?: UserNotificationType },
): DeliveryStatusValue {
  addUserNotification({
    userEmail: msg.toEmail,
    adminMessageId: msg.id,
    fromEmail: msg.fromEmail,
    subject: msg.subject,
    body: msg.body,
    feedbackId: notificationMeta?.feedbackId,
    ticketNumber: notificationMeta?.ticketNumber,
    orgId: notificationMeta?.orgId,
    type: notificationMeta?.type,
  })
  logActivity({
    type: 'message_delivery',
    label: `In-app notification for ${msg.toEmail}`,
    meta: { channel: 'in_app', toEmail: msg.toEmail, subject: msg.subject, status: 'sent' },
  })
  return 'sent'
}

function runDelivery(
  msg: AdminMessage,
  channels: DeliveryChannel[],
  notificationMeta?: { feedbackId?: string; ticketNumber?: string; orgId?: string; type?: UserNotificationType },
): AdminMessage {
  const account = ensureAccount(msg.toEmail)
  const phoneVerified = account.verificationStatus === 'phone_verified'
  const deliveryStatus: Partial<Record<DeliveryChannel, DeliveryStatusValue>> = {}
  const deliveryErrors: Partial<Record<DeliveryChannel, string>> = {}

  for (const channel of channels) {
    if (channel === 'email') {
      deliveryStatus.email = deliverEmailStub(msg.toEmail, msg.subject)
    } else if (channel === 'sms') {
      const result = deliverSmsStub(msg.toEmail, account.phone, phoneVerified, msg.subject)
      deliveryStatus.sms = result.status
      if (result.error) deliveryErrors.sms = result.error
    } else if (channel === 'in_app') {
      deliveryStatus.in_app = deliverInApp(msg, notificationMeta)
    }
  }

  return {
    ...msg,
    deliveryChannels: channels,
    deliveryStatus,
    deliveryErrors: Object.keys(deliveryErrors).length > 0 ? deliveryErrors : undefined,
  }
}

function isMessageDeleted(msg: AdminMessage): boolean {
  return msg.deleted === true
}

function isMessageArchived(msg: AdminMessage): boolean {
  return msg.archived === true && !isMessageDeleted(msg)
}

function getThreadInboxFilter(messages: AdminMessage[]): InboxFilter {
  const active = messages.filter((m) => !isMessageDeleted(m))
  if (active.length === 0) return 'trash'
  if (active.every((m) => isMessageArchived(m))) return 'archived'
  return 'inbox'
}

function buildAllThreads(): MessageThread[] {
  const messages = readMessages()
  const adminEmail = PLATFORM_ADMIN.email.toLowerCase()
  const map = new Map<string, AdminMessage[]>()

  for (const msg of messages) {
    const participant =
      msg.fromEmail.toLowerCase() === adminEmail ? msg.toEmail : msg.fromEmail
    const key = threadKey(adminEmail, participant)
    const list = map.get(key) ?? []
    list.push(msg)
    map.set(key, list)
  }

  const threads: MessageThread[] = []
  for (const [key, msgs] of map) {
    const sorted = [...msgs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    const latest = sorted[0]
    const participantEmail =
      latest.fromEmail.toLowerCase() === adminEmail ? latest.toEmail : latest.fromEmail
    const inboxMessages = sorted.filter((m) => !isMessageDeleted(m) && !isMessageArchived(m))
    threads.push({
      threadId: key,
      participantEmail,
      subject: (inboxMessages[0] ?? latest).subject,
      lastMessage: (inboxMessages[0] ?? latest).body.slice(0, 120),
      lastTimestamp: (inboxMessages[0] ?? latest).timestamp,
      unreadCount: sorted.filter(
        (m) => !m.read && m.direction === 'inbound' && !isMessageDeleted(m) && !isMessageArchived(m),
      ).length,
      messages: sorted.reverse(),
    })
  }

  return threads.sort(
    (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime(),
  )
}

export function getInboxCounts(): Record<InboxFilter, number> {
  const counts: Record<InboxFilter, number> = { inbox: 0, archived: 0, trash: 0 }
  for (const thread of buildAllThreads()) {
    counts[getThreadInboxFilter(thread.messages)] += 1
  }
  return counts
}

export function getMessages(filter?: InboxFilter): AdminMessage[] {
  let messages = readMessages()
  if (filter) {
    const threadIds = new Set(
      buildAllThreads()
        .filter((t) => getThreadInboxFilter(t.messages) === filter)
        .map((t) => t.threadId),
    )
    messages = messages.filter((m) => threadIds.has(m.threadId))
  }
  return messages.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function getThreads(filter: InboxFilter = 'inbox'): MessageThread[] {
  return buildAllThreads().filter((t) => getThreadInboxFilter(t.messages) === filter)
}

export function getThread(threadId: string): MessageThread | null {
  return buildAllThreads().find((t) => t.threadId === threadId) ?? null
}

export function getUnreadCount(): number {
  return readMessages().filter(
    (m) =>
      !m.read &&
      m.direction === 'inbound' &&
      !isMessageDeleted(m) &&
      !isMessageArchived(m),
  ).length
}

function updateMessagesMatching(
  predicate: (msg: AdminMessage) => boolean,
  updater: (msg: AdminMessage) => AdminMessage,
): boolean {
  const messages = readMessages()
  let changed = false
  const next = messages.map((msg) => {
    if (!predicate(msg)) return msg
    changed = true
    return updater(msg)
  })
  if (changed) saveMessages(next)
  return changed
}

export function archiveThread(threadId: string): boolean {
  return updateMessagesMatching(
    (m) => m.threadId === threadId && !isMessageDeleted(m),
    (m) => ({ ...m, archived: true }),
  )
}

export function archiveThreads(threadIds: string[]): number {
  const ids = new Set(threadIds)
  let count = 0
  for (const id of ids) {
    if (archiveThread(id)) count += 1
  }
  return count
}

export function deleteThread(threadId: string): boolean {
  return updateMessagesMatching(
    (m) => m.threadId === threadId,
    (m) => ({ ...m, deleted: true }),
  )
}

export function deleteThreads(threadIds: string[]): number {
  const ids = new Set(threadIds)
  let count = 0
  for (const id of ids) {
    if (deleteThread(id)) count += 1
  }
  return count
}

export function restoreThread(threadId: string): boolean {
  return updateMessagesMatching(
    (m) => m.threadId === threadId && (isMessageDeleted(m) || isMessageArchived(m)),
    (m) => ({ ...m, archived: false, deleted: false }),
  )
}

export function restoreThreads(threadIds: string[]): number {
  const ids = new Set(threadIds)
  let count = 0
  for (const id of ids) {
    if (restoreThread(id)) count += 1
  }
  return count
}

export function permanentlyDeleteThread(threadId: string): boolean {
  const messages = readMessages()
  const next = messages.filter((m) => m.threadId !== threadId)
  if (next.length === messages.length) return false
  saveMessages(next)
  return true
}

export function permanentlyDeleteThreads(threadIds: string[]): number {
  const ids = new Set(threadIds)
  let count = 0
  for (const id of ids) {
    if (permanentlyDeleteThread(id)) count += 1
  }
  return count
}

export function archiveMessage(messageId: string): boolean {
  return updateMessagesMatching(
    (m) => m.id === messageId && !isMessageDeleted(m),
    (m) => ({ ...m, archived: true }),
  )
}

export function deleteMessage(messageId: string): boolean {
  return updateMessagesMatching(
    (m) => m.id === messageId,
    (m) => ({ ...m, deleted: true }),
  )
}

export function restoreMessage(messageId: string): boolean {
  return updateMessagesMatching(
    (m) => m.id === messageId && (isMessageDeleted(m) || isMessageArchived(m)),
    (m) => ({ ...m, archived: false, deleted: false }),
  )
}

export function buildBatchLabel(filters: AnalyticsFilters): string {
  const parts: string[] = []
  if (filters.country && filters.country !== 'all') parts.push(filters.country)
  const region = filters.province || filters.state
  if (region && region !== 'all') {
    parts.push(getProvinceLabel(region, filters.country === 'all' ? undefined : filters.country))
  }
  if (filters.city && filters.city !== 'all') parts.push(filters.city)
  return parts.length > 0 ? parts.join(' · ') : 'All regions'
}

export function getUsersMatchingGeoFilters(
  filters: AnalyticsFilters,
): BatchMessageRecipient[] {
  const nameByEmail = new Map(
    getAllUsers().map((u) => [u.email.toLowerCase(), u] as const),
  )

  return getAllAccounts()
    .filter((a) => !isAdminEmail(a.email))
    .filter((a) => !a.banned)
    .filter((a) => accountMatchesFilters(a, filters))
    .map((a) => {
      const user = nameByEmail.get(a.email.toLowerCase())
      const geo = resolveAccountGeo(a)
      return {
        email: a.email,
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        city: geo.city || '—',
        province: geo.province || '—',
        tier: a.tier,
        verificationStatus: a.verificationStatus ?? 'unverified',
        suspended: isAccountSuspended(a),
      }
    })
    .sort((a, b) => a.email.localeCompare(b.email))
}

export function sendBatchMessage(input: {
  userEmails: string[]
  subject: string
  body: string
  deliveryChannels?: DeliveryChannel[]
  batchLabel?: string
  fromEmail?: string
}): BatchSendSummary {
  const batchId = generateId('batch')
  const batchLabel = input.batchLabel ?? 'Batch'
  const channels = input.deliveryChannels ?? []
  let sent = 0
  let skippedBanned = 0
  let emailOk = 0
  let smsOk = 0
  let smsFailed = 0
  let inAppOk = 0
  let suspendedIncluded = 0

  for (const email of input.userEmails) {
    const account = ensureAccount(email)
    if (account.banned) {
      skippedBanned += 1
      continue
    }
    if (isAccountSuspended(account)) suspendedIncluded += 1

    const msg = sendAdminMessage({
      toEmail: email,
      subject: input.subject,
      body: input.body,
      fromEmail: input.fromEmail,
      deliveryChannels: channels,
      batchId,
      batchLabel,
    })

    sent += 1
    if (msg.deliveryStatus?.email === 'sent') emailOk += 1
    if (msg.deliveryStatus?.sms === 'sent') smsOk += 1
    if (msg.deliveryStatus?.sms === 'failed') smsFailed += 1
    if (msg.deliveryStatus?.in_app === 'sent') inAppOk += 1
  }

  logActivity({
    type: 'message_delivery',
    label: `Batch sent to ${sent} users (${batchLabel})`,
    meta: {
      batchId,
      batchLabel,
      sent: String(sent),
      subject: input.subject.trim(),
    },
  })

  return {
    sent,
    skippedBanned,
    emailOk,
    smsOk,
    smsFailed,
    inAppOk,
    batchId,
    batchLabel,
    suspendedIncluded,
  }
}

export function sendAdminMessage(input: {
  toEmail: string
  subject: string
  body: string
  fromEmail?: string
  deliveryChannels?: DeliveryChannel[]
  batchId?: string
  batchLabel?: string
  notificationMeta?: { feedbackId?: string; ticketNumber?: string; orgId?: string; type?: UserNotificationType }
}): AdminMessage {
  const admin = input.fromEmail ?? getCurrentUser()?.email ?? PLATFORM_ADMIN.email
  const resolved = resolveAdminMessageRecipientEmail(input.toEmail)
  const toEmail = resolved.email
  const messages = readMessages()
  const threadId = threadKey(admin, toEmail)
  const channels = input.deliveryChannels ?? []
  const notificationMeta = {
    ...input.notificationMeta,
    orgId: input.notificationMeta?.orgId ?? resolved.orgId,
  }
  let msg: AdminMessage = {
    id: generateId('msg'),
    threadId,
    fromEmail: admin,
    toEmail,
    subject: input.subject.trim(),
    body: input.body.trim(),
    timestamp: new Date().toISOString(),
    read: true,
    direction: 'outbound',
    batchId: input.batchId,
    batchLabel: input.batchLabel,
  }

  if (channels.length > 0) {
    msg = runDelivery(msg, channels, notificationMeta)
  }

  messages.push(msg)
  saveMessages(messages)
  return msg
}

export function sendPokeTemplate(
  toEmail: string,
  templateId: (typeof POKE_TEMPLATES)[number]['id'],
  deliveryChannels?: DeliveryChannel[],
): AdminMessage | null {
  const template = POKE_TEMPLATES.find((t) => t.id === templateId)
  if (!template) return null
  return sendAdminMessage({
    toEmail,
    subject: template.subject,
    body: template.body,
    deliveryChannels: deliveryChannels ?? ['in_app'],
  })
}

/** User-originated message into the admin message center inbox. */
export function receiveInboundAdminMessage(input: {
  fromEmail: string
  subject: string
  body: string
  ticketNumber?: string
}): AdminMessage {
  const messages = readMessages()
  const admin = PLATFORM_ADMIN.email
  const fromEmail = input.fromEmail.trim().toLowerCase()
  const threadId = threadKey(admin, fromEmail)
  const msg: AdminMessage = {
    id: generateId('msg'),
    threadId,
    fromEmail,
    toEmail: admin,
    subject: input.subject.trim(),
    body: input.body.trim(),
    timestamp: new Date().toISOString(),
    read: false,
    direction: 'inbound',
    ticketNumber: input.ticketNumber,
  }
  messages.push(msg)
  saveMessages(messages)
  return msg
}

export function markThreadRead(threadId: string): void {
  const messages = readMessages()
  let changed = false
  for (const msg of messages) {
    if (msg.threadId === threadId && !msg.read && msg.direction === 'inbound') {
      msg.read = true
      changed = true
    }
  }
  if (changed) saveMessages(messages)
}

export function getRecipientDeliveryHints(email: string): {
  hasEmail: boolean
  phone?: string
  phoneVerified: boolean
} {
  const account = ensureAccount(email)
  return {
    hasEmail: Boolean(email),
    phone: account.phone,
    phoneVerified: account.verificationStatus === 'phone_verified',
  }
}

export function seedDemoMessages(): void {
  if (readMessages().length > 0) return

  const demo: AdminMessage[] = [
    {
      id: generateId('msg'),
      threadId: threadKey(PLATFORM_ADMIN.email, 'demo@tudu.ca'),
      fromEmail: 'demo@tudu.ca',
      toEmail: PLATFORM_ADMIN.email,
      subject: 'Question about verification',
      body: 'Hi — how long does phone verification take? I want to post a garage sale.',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      read: false,
      direction: 'inbound',
    },
    {
      id: generateId('msg'),
      threadId: threadKey(PLATFORM_ADMIN.email, 'jamie@example.com'),
      fromEmail: 'jamie@example.com',
      toEmail: PLATFORM_ADMIN.email,
      subject: 'Feedback on discover',
      body: 'Love the swipe deck! Any plans for Regina events?',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true,
      direction: 'inbound',
    },
  ]

  saveMessages(demo)
}
