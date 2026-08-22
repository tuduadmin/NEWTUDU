import {
  getAccount,
  getHostAccount,
  getHostEventById,
  getHostEvents,
  type HostEvent,
  type Organization,
  type UserAccount,
} from './account'
import { findDiscoverEventByTargetId, type DiscoverEvent } from '../data/discoverEvents'
import { sendAdminMessage } from './adminMessages'
import { DEMO_USER, getAllUsers, getCurrentUser, PLATFORM_ADMIN } from './auth'
import type { DeliveryChannel } from './userNotifications'
import {
  allocateSupportTicketNumber,
  feedbackCategoryForReport,
  feedbackCategoryForType,
  getSupportTicketSequence,
  isSafetyReportReason,
  parseSupportTicketNumber,
  syncSupportTicketCounter,
} from './supportTicketIds'

const FEEDBACK_KEY = 'tudu-admin-feedback'
const RESOLVE_TEMPLATE_KEY = 'tudu-feedback-resolve-template'

export const DEFAULT_FEEDBACK_RESOLVE_TEMPLATE =
  'Hi {name}, your report has been reviewed and resolved by the TUDU team. Thank you for helping keep our community safe.'

export const FEEDBACK_RESOLVED_SUBJECT = 'Your report was resolved'

/** Max event/feedback reports a reporter can file in a rolling 24h window. */
export const MAX_REPORTS_PER_DAY = 5
export const MAX_FEEDBACK_PER_DAY = 10

/** Minimum time between submissions from the same reporter. */
export const REPORT_SUBMIT_COOLDOWN_MS = 2 * 60 * 1000
export const FEEDBACK_SUBMIT_COOLDOWN_MS = 30 * 1000

/** After reporting an event, the same reporter cannot file another on that event for this long. */
export const SAME_EVENT_REPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000

/** Open reports from distinct users on one event before Control Room is alerted. */
export const EVENT_REPORT_ESCALATION_THRESHOLD = 3

export const EVENT_REPORT_ESCALATION_CHANGED_EVENT = 'tudu-event-report-escalation-changed'

const ESCALATIONS_KEY = 'tudu-admin-event-report-escalations'

const DAY_MS = 24 * 60 * 60 * 1000

export type FeedbackReportLimitReason =
  | 'cooldown'
  | 'daily_limit'
  | 'duplicate_open'
  | 'event_cooldown'

export interface EventReportEscalation {
  id: string
  targetEventId: string
  eventTitle?: string
  /** Open report count when the alert fired. */
  reportCount: number
  /** Distinct reporters with open reports when the alert fired. */
  reporterCount: number
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
}

export type FeedbackStatus = 'open' | 'resolved'

/** Human-readable queue label for admin UI and exports. */
export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  return status === 'open' ? 'Still open' : 'Resolved'
}

export interface FeedbackReport {
  id: string
  /** Trackable reference — e.g. RPT-000042 or FBK-000018 */
  ticketNumber: string
  type: 'report' | 'feedback'
  reason: string
  message: string
  reporterEmail?: string
  /** Reported user email or identifier. */
  targetUserId?: string
  targetEventId?: string
  eventTitle?: string
  /** Personal host email when known. */
  hostEmail?: string
  /** Org / host account id when the report targets an organization host. */
  hostAccountId?: string
  /** @deprecated use hostAccountId */
  orgId?: string
  deviceInfo?: string
  status: FeedbackStatus
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  resolutionMessage?: string
}

export type FeedbackHostLink =
  | {
      kind: 'user'
      email: string
      name: string
      account: UserAccount | null
    }
  | {
      kind: 'org'
      orgId: string
      org: Organization
    }

export function resolveFeedbackEvent(item: FeedbackReport): HostEvent | undefined {
  if (!item.targetEventId) return undefined
  return getHostEventById(item.targetEventId)
}

export function resolveFeedbackDiscoverEvent(item: FeedbackReport): DiscoverEvent | undefined {
  if (!item.targetEventId) return undefined
  return findDiscoverEventByTargetId(item.targetEventId)
}

export function resolveFeedbackHost(item: FeedbackReport): FeedbackHostLink | null {
  const orgId = item.hostAccountId ?? item.orgId
  if (orgId) {
    const org = getHostAccount(orgId)
    if (org) return { kind: 'org', orgId, org }
  }

  const email = item.hostEmail ?? item.targetUserId
  if (email?.includes('@')) {
    const user = getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
    const account = getAccount(email)
    const name = user ? `${user.firstName} ${user.lastName}` : email
    return { kind: 'user', email, name, account }
  }

  const event = resolveFeedbackEvent(item)
  if (event?.hostAccountId) {
    const org = getHostAccount(event.hostAccountId)
    if (org) return { kind: 'org', orgId: event.hostAccountId, org }
  }
  if (event?.createdBy) {
    const user = getAllUsers().find(
      (u) => u.email.toLowerCase() === event.createdBy.toLowerCase(),
    )
    const account = getAccount(event.createdBy)
    const name =
      event.displayName ?? (user ? `${user.firstName} ${user.lastName}` : event.createdBy)
    return { kind: 'user', email: event.createdBy, name, account }
  }

  return null
}

function ensureFeedbackTicketNumbers(items: FeedbackReport[]): FeedbackReport[] {
  const sorted = [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  const numberedById = new Map<string, FeedbackReport>()
  for (const item of sorted) {
    if (item.ticketNumber) {
      syncSupportTicketCounter(feedbackTicketCategory(item), item.ticketNumber)
      numberedById.set(item.id, item)
      continue
    }
    numberedById.set(item.id, {
      ...item,
      ticketNumber: allocateSupportTicketNumber(feedbackCategoryForReport(item.type, item.reason)),
    })
  }
  return items.map((item) => numberedById.get(item.id) ?? item)
}

function migrateSafetyTicketNumbers(items: FeedbackReport[]): FeedbackReport[] {
  let changed = false
  const next = items.map((item) => {
    if (item.type !== 'report' || !isSafetyReportReason(item.reason)) return item
    if (parseSupportTicketNumber(item.ticketNumber)?.category === 'safety') return item
    changed = true
    return {
      ...item,
      ticketNumber: allocateSupportTicketNumber('safety'),
    }
  })
  if (changed) saveItems(next)
  return next
}

function readItems(): FeedbackReport[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY)
    const items = raw ? (JSON.parse(raw) as FeedbackReport[]) : []
    if (items.length === 0) return items

    const migratedSafety = migrateSafetyTicketNumbers(items)
    const needsNumbers = migratedSafety.some((item) => !item.ticketNumber)
    if (!needsNumbers) {
      for (const item of migratedSafety) {
        syncSupportTicketCounter(feedbackTicketCategory(item), item.ticketNumber)
      }
      return migratedSafety
    }

    const migrated = ensureFeedbackTicketNumbers(migratedSafety)
    saveItems(migrated)
    return migrated
  } catch {
    return []
  }
}

function saveItems(items: FeedbackReport[]): void {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items))
}

function readEscalations(): EventReportEscalation[] {
  try {
    const raw = localStorage.getItem(ESCALATIONS_KEY)
    return raw ? (JSON.parse(raw) as EventReportEscalation[]) : []
  } catch {
    return []
  }
}

function saveEscalations(items: EventReportEscalation[]): void {
  localStorage.setItem(ESCALATIONS_KEY, JSON.stringify(items))
}

function dispatchEscalationChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_REPORT_ESCALATION_CHANGED_EVENT))
  }
}

export function getOpenEventReports(
  targetEventId: string,
  items: FeedbackReport[] = readItems(),
): FeedbackReport[] {
  return items.filter(
    (item) =>
      item.type === 'report' &&
      item.status === 'open' &&
      item.targetEventId === targetEventId,
  )
}

export function getOpenEventReportReporterCount(
  targetEventId: string,
  items: FeedbackReport[] = readItems(),
): number {
  const emails = new Set<string>()
  for (const item of getOpenEventReports(targetEventId, items)) {
    const email = normalizeReporterEmail(item.reporterEmail)
    if (email) emails.add(email)
  }
  return emails.size
}

export function getActiveEventReportEscalations(): EventReportEscalation[] {
  return readEscalations()
    .filter((item) => !item.acknowledgedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getUnacknowledgedEventReportEscalationCount(): number {
  return getActiveEventReportEscalations().length
}

export function isEventReportEscalated(targetEventId: string | undefined): boolean {
  if (!targetEventId) return false
  return getActiveEventReportEscalations().some((item) => item.targetEventId === targetEventId)
}

export function acknowledgeEventReportEscalation(
  targetEventId: string,
  acknowledgedBy?: string,
): boolean {
  const items = readEscalations()
  const idx = items.findIndex((item) => item.targetEventId === targetEventId && !item.acknowledgedAt)
  if (idx < 0) return false

  items[idx] = {
    ...items[idx],
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy: acknowledgedBy ?? getCurrentUser()?.email ?? PLATFORM_ADMIN.email,
  }
  saveEscalations(items)
  dispatchEscalationChanged()
  return true
}

function maybeEscalateEventReports(
  targetEventId: string,
  eventTitle: string | undefined,
  items: FeedbackReport[],
): EventReportEscalation | null {
  const openReports = getOpenEventReports(targetEventId, items)
  const reporterCount = getOpenEventReportReporterCount(targetEventId, items)
  if (reporterCount < EVENT_REPORT_ESCALATION_THRESHOLD) return null

  const escalations = readEscalations()
  const existing = escalations.find(
    (item) => item.targetEventId === targetEventId && !item.acknowledgedAt,
  )
  if (existing) {
    if (existing.reportCount !== openReports.length || existing.reporterCount !== reporterCount) {
      existing.reportCount = openReports.length
      existing.reporterCount = reporterCount
      saveEscalations(escalations)
      dispatchEscalationChanged()
    }
    return null
  }

  const title = eventTitle?.trim() || 'Untitled event'
  const escalation: EventReportEscalation = {
    id: generateId(),
    targetEventId,
    eventTitle: title,
    reportCount: openReports.length,
    reporterCount,
    createdAt: new Date().toISOString(),
  }
  escalations.unshift(escalation)
  saveEscalations(escalations)

  void import('./adminAnalytics').then(({ logActivity }) => {
    logActivity({
      type: 'event_report_escalation',
      label: `Event flagged: ${reporterCount} users reported "${title}"`,
      meta: {
        eventId: targetEventId,
        reportCount: String(openReports.length),
        reporterCount: String(reporterCount),
        escalationId: escalation.id,
      },
    })
  })

  dispatchEscalationChanged()
  return escalation
}

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getFeedbackItems(): FeedbackReport[] {
  return readItems().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function isSafetyFeedbackReport(
  item: Pick<FeedbackReport, 'type' | 'reason' | 'ticketNumber'>,
): boolean {
  const parsed = parseSupportTicketNumber(item.ticketNumber)
  if (parsed?.category === 'safety') return true
  return item.type === 'report' && isSafetyReportReason(item.reason)
}

function feedbackTicketCategory(
  item: Pick<FeedbackReport, 'type' | 'reason' | 'ticketNumber'>,
): ReturnType<typeof feedbackCategoryForReport> {
  const parsed = parseSupportTicketNumber(item.ticketNumber)
  if (parsed) return parsed.category
  return feedbackCategoryForReport(item.type, item.reason)
}

export function getFeedbackByTicketNumber(ticketNumber: string): FeedbackReport | undefined {
  const normalized = ticketNumber.trim().toUpperCase()
  return getFeedbackItems().find((item) => item.ticketNumber.toUpperCase() === normalized)
}

export type FeedbackQueueStats = {
  stillOpen: number
  stillOpenReports: number
  stillOpenSafety: number
  stillOpenFeedback: number
  totalSafety: number
  safetySequence: number
  resolved: number
  total: number
}

export function getFeedbackQueueStats(): FeedbackQueueStats {
  const items = readItems()
  const stillOpen = items.filter((item) => item.status === 'open')
  const safetyItems = items.filter((item) => isSafetyFeedbackReport(item))
  return {
    stillOpen: stillOpen.length,
    stillOpenReports: stillOpen.filter(
      (item) => item.type === 'report' && !isSafetyFeedbackReport(item),
    ).length,
    stillOpenSafety: stillOpen.filter((item) => isSafetyFeedbackReport(item)).length,
    stillOpenFeedback: stillOpen.filter((item) => item.type === 'feedback').length,
    totalSafety: safetyItems.length,
    safetySequence: getSupportTicketSequence('safety'),
    resolved: items.filter((item) => item.status === 'resolved').length,
    total: items.length,
  }
}

function normalizeReporterEmail(email: string | undefined): string | null {
  const trimmed = email?.trim().toLowerCase()
  return trimmed && trimmed.includes('@') ? trimmed : null
}

function formatRetryAfter(ms: number): string {
  const minutes = Math.ceil(ms / 60_000)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.ceil(ms / 3_600_000)
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

function reporterItems(items: FeedbackReport[], reporterEmail: string, type?: FeedbackReport['type']) {
  const email = normalizeReporterEmail(reporterEmail)
  if (!email) return []
  return items
    .filter(
      (item) =>
        normalizeReporterEmail(item.reporterEmail) === email &&
        (type == null || item.type === type),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function checkFeedbackReportLimit(input: {
  type: FeedbackReport['type']
  reporterEmail: string
  targetEventId?: string
  now?: number
}): { allowed: true } | { allowed: false; reason: FeedbackReportLimitReason; message: string; retryAfterMs?: number } {
  // Limits apply per reporter — multiple different users can report the same event.
  const reporterEmail = normalizeReporterEmail(input.reporterEmail)
  if (!reporterEmail) {
    return { allowed: false, reason: 'cooldown', message: 'Add a valid email to submit a report.' }
  }

  const now = input.now ?? Date.now()
  const items = readItems()
  const mine = reporterItems(items, reporterEmail, input.type)
  const cooldownMs =
    input.type === 'report' ? REPORT_SUBMIT_COOLDOWN_MS : FEEDBACK_SUBMIT_COOLDOWN_MS
  const dailyLimit = input.type === 'report' ? MAX_REPORTS_PER_DAY : MAX_FEEDBACK_PER_DAY
  const label = input.type === 'report' ? 'report' : 'message'

  const latest = mine[0]
  if (latest) {
    const elapsed = now - new Date(latest.createdAt).getTime()
    if (elapsed < cooldownMs) {
      const retryAfterMs = cooldownMs - elapsed
      return {
        allowed: false,
        reason: 'cooldown',
        message: `Please wait ${formatRetryAfter(retryAfterMs)} before submitting another ${label}.`,
        retryAfterMs,
      }
    }
  }

  const inLastDay = mine.filter((item) => now - new Date(item.createdAt).getTime() < DAY_MS)
  if (inLastDay.length >= dailyLimit) {
    const oldestInWindow = inLastDay.reduce((oldest, item) =>
      new Date(item.createdAt).getTime() < new Date(oldest.createdAt).getTime() ? item : oldest,
    )
    const retryAfterMs = DAY_MS - (now - new Date(oldestInWindow.createdAt).getTime())
    return {
      allowed: false,
      reason: 'daily_limit',
      message: `You've reached the daily limit (${dailyLimit} ${label}s). Try again in ${formatRetryAfter(retryAfterMs)} or contact support if this is urgent.`,
      retryAfterMs,
    }
  }

  if (input.type === 'report' && input.targetEventId) {
    const forEvent = mine.filter((item) => item.targetEventId === input.targetEventId)

    const openDuplicate = forEvent.find((item) => item.status === 'open')
    if (openDuplicate) {
      return {
        allowed: false,
        reason: 'duplicate_open',
        message:
          'You already have an open report for this event. We\'ll follow up when it\'s reviewed.',
      }
    }

    const recentForEvent = forEvent.find(
      (item) => now - new Date(item.createdAt).getTime() < SAME_EVENT_REPORT_COOLDOWN_MS,
    )
    if (recentForEvent) {
      const retryAfterMs =
        SAME_EVENT_REPORT_COOLDOWN_MS - (now - new Date(recentForEvent.createdAt).getTime())
      return {
        allowed: false,
        reason: 'event_cooldown',
        message: `You recently reported this event. You can submit again in ${formatRetryAfter(retryAfterMs)}, or contact support if something new came up.`,
        retryAfterMs,
      }
    }
  }

  return { allowed: true }
}

export type AddFeedbackReportResult =
  | { ok: true; report: FeedbackReport }
  | {
      ok: false
      error: string
      reason?: FeedbackReportLimitReason
      retryAfterMs?: number
    }

export function addFeedbackReport(
  input: Omit<FeedbackReport, 'id' | 'ticketNumber' | 'createdAt' | 'status'> & {
    status?: FeedbackStatus
  },
): AddFeedbackReportResult {
  const limit = checkFeedbackReportLimit({
    type: input.type,
    reporterEmail: input.reporterEmail ?? '',
    targetEventId: input.targetEventId,
  })
  if (!limit.allowed) {
    return {
      ok: false,
      error: limit.message,
      reason: limit.reason,
      retryAfterMs: limit.retryAfterMs,
    }
  }

  const items = readItems()
  const item: FeedbackReport = {
    ...input,
    id: generateId(),
    ticketNumber: allocateSupportTicketNumber(feedbackCategoryForReport(input.type, input.reason)),
    status: input.status ?? 'open',
    createdAt: new Date().toISOString(),
  }
  items.unshift(item)
  saveItems(items)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tudu-feedback-changed'))
  }

  if (input.type === 'report' && input.targetEventId) {
    maybeEscalateEventReports(input.targetEventId, input.eventTitle, items)
  }

  return { ok: true, report: item }
}

export function getReporterDisplayName(email: string): string {
  const user = getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (user?.firstName) return user.firstName
  return email.split('@')[0] ?? email
}

export function getFeedbackResolveTemplate(): string {
  try {
    const saved = localStorage.getItem(RESOLVE_TEMPLATE_KEY)
    return saved?.trim() || DEFAULT_FEEDBACK_RESOLVE_TEMPLATE
  } catch {
    return DEFAULT_FEEDBACK_RESOLVE_TEMPLATE
  }
}

export function saveFeedbackResolveTemplate(template: string): void {
  localStorage.setItem(RESOLVE_TEMPLATE_KEY, template.trim())
}

export function applyFeedbackResolveTemplate(template: string, reporterName: string): string {
  return template.replace(/\{name\}/g, reporterName)
}

export function feedbackMessageToTemplate(message: string, reporterName: string): string {
  if (!reporterName) return message
  return message.split(reporterName).join('{name}')
}

export type ResolveFeedbackOptions = {
  resolvedBy?: string
  resolutionMessage?: string
  sendInApp?: boolean
  sendEmail?: boolean
}

export function resolveFeedback(id: string, options: ResolveFeedbackOptions = {}): boolean {
  const items = readItems()
  const idx = items.findIndex((f) => f.id === id)
  if (idx < 0) return false

  const item = items[idx]
  if (item.status === 'resolved') return true

  const resolvedBy =
    options.resolvedBy ?? getCurrentUser()?.email ?? PLATFORM_ADMIN.email
  const resolutionMessage = options.resolutionMessage?.trim() ?? ''
  const sendInApp = options.sendInApp ?? false
  const sendEmail = options.sendEmail ?? false
  const resolvedAt = new Date().toISOString()

  items[idx] = {
    ...item,
    status: 'resolved',
    resolvedAt,
    resolvedBy,
    resolutionMessage: resolutionMessage || undefined,
  }
  saveItems(items)

  const reporterEmail = item.reporterEmail
  if (reporterEmail && resolutionMessage && (sendInApp || sendEmail)) {
    const channels: DeliveryChannel[] = []
    if (sendInApp) channels.push('in_app')
    if (sendEmail) channels.push('email')

    sendAdminMessage({
      toEmail: reporterEmail,
      subject: FEEDBACK_RESOLVED_SUBJECT,
      body: resolutionMessage,
      fromEmail: resolvedBy,
      deliveryChannels: channels,
      notificationMeta: {
        feedbackId: id,
        ticketNumber: item.ticketNumber,
        type: 'feedback_resolved',
      },
    })
  }

  return true
}

export function deleteFeedback(id: string): boolean {
  const items = readItems()
  const next = items.filter((f) => f.id !== id)
  if (next.length === items.length) return false
  saveItems(next)
  return true
}

function demoFeedbackSeedItems(): FeedbackReport[] {
  const events = getHostEvents()
  const linkedEvent = events.find((e) => e.visibility === 'public') ?? events[0]
  const orgEvent = events.find((e) => e.hostAccountId)

  return [
    {
      id: generateId(),
      ticketNumber: allocateSupportTicketNumber('report'),
      type: 'report',
      reason: 'Spam / misleading',
      message: 'Event title does not match the venue listed.',
      reporterEmail: 'user12@example.com',
      targetEventId: linkedEvent?.id,
      eventTitle: linkedEvent?.title ?? 'Mega Block Party',
      hostEmail: linkedEvent?.createdBy ?? DEMO_USER.email,
      hostAccountId: linkedEvent?.hostAccountId ?? undefined,
      deviceInfo: 'Chrome 124 · Windows 11 · Mobile viewport',
      status: 'open',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: generateId(),
      ticketNumber: allocateSupportTicketNumber('feedback'),
      type: 'feedback',
      reason: 'General feedback',
      message: 'Would love dark mode on the host dashboard.',
      reporterEmail: DEMO_USER.email,
      deviceInfo: 'Safari 17 · iOS 17',
      status: 'open',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: generateId(),
      ticketNumber: allocateSupportTicketNumber('safety'),
      type: 'report',
      reason: 'Harassment',
      message: 'User sent inappropriate messages via event comments.',
      reporterEmail: 'jamie@example.com',
      targetUserId: DEMO_USER.email,
      hostEmail: DEMO_USER.email,
      deviceInfo: 'Firefox 125 · macOS',
      status: 'resolved',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    ...(orgEvent
      ? [
          {
            id: generateId(),
            ticketNumber: allocateSupportTicketNumber('report'),
            type: 'report' as const,
            reason: 'Misleading org listing',
            message: 'Organization profile photo does not match the venue branding.',
            reporterEmail: 'reviewer@example.com',
            targetEventId: orgEvent.id,
            eventTitle: orgEvent.title,
            hostAccountId: orgEvent.hostAccountId ?? undefined,
            hostEmail: orgEvent.createdBy,
            deviceInfo: 'Chrome 124 · Android 14',
            status: 'open' as const,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ]
      : []),
  ]
}

function patchStaleDemoFeedbackLinks(items: FeedbackReport[]): FeedbackReport[] {
  const events = getHostEvents()
  const linkedEvent = events.find((e) => e.visibility === 'public') ?? events[0]
  if (!linkedEvent) return items

  let changed = false
  const next = items.map((item) => {
    if (item.targetEventId !== 'event_demo_1') return item
    changed = true
    return {
      ...item,
      targetEventId: linkedEvent.id,
      eventTitle: linkedEvent.title,
      hostEmail: linkedEvent.createdBy,
      hostAccountId: linkedEvent.hostAccountId ?? undefined,
    }
  })
  if (changed) saveItems(next)
  return next
}

export function seedDemoFeedback(): void {
  const existing = readItems()
  if (existing.length === 0) {
    saveItems(demoFeedbackSeedItems())
    return
  }
  patchStaleDemoFeedbackLinks(existing)
}
