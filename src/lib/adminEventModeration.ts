import { getHostEventById, updateHostEventStatus } from './account'
import { getCurrentUser, PLATFORM_ADMIN } from './auth'

const STORAGE_KEY = 'tudu-admin-event-moderation'

export const EVENT_MODERATION_CHANGED_EVENT = 'tudu-event-moderation-changed'

export type EventModerationStatus = 'flagged' | 'suspended' | 'blocked'

export interface EventModerationRecord {
  targetEventId: string
  eventTitle?: string
  hostEventId?: string
  discoverEventId?: string
  status: EventModerationStatus
  reason?: string
  linkedFeedbackIds?: string[]
  updatedAt: string
  updatedBy?: string
}

export const EVENT_MODERATION_STATUS_LABELS: Record<EventModerationStatus, string> = {
  flagged: 'Flagged for review',
  suspended: 'Suspended — hidden from Discover',
  blocked: 'Blocked — hidden from Discover',
}

function readRecords(): EventModerationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as EventModerationRecord[]) : []
  } catch {
    return []
  }
}

function saveRecords(records: EventModerationRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_MODERATION_CHANGED_EVENT))
  }
}

export function resolveEventModerationIds(input: {
  targetEventId: string
  eventTitle?: string
  hostEventId?: string
}): {
  primaryId: string
  hostEventId?: string
  discoverEventId?: string
  eventTitle?: string
} {
  const targetEventId = input.targetEventId.trim()
  const hostFromInput = input.hostEventId?.trim()
  const hostEvent = getHostEventById(targetEventId) ?? (hostFromInput ? getHostEventById(hostFromInput) : undefined)
  const hostEventId = hostFromInput ?? hostEvent?.id
  const discoverEventId = hostEventId ? undefined : targetEventId
  const eventTitle = input.eventTitle?.trim() || hostEvent?.title || undefined

  return {
    primaryId: hostEventId ?? discoverEventId ?? targetEventId,
    hostEventId,
    discoverEventId,
    eventTitle,
  }
}

function recordIdsForLookup(record: EventModerationRecord): string[] {
  return [record.targetEventId, record.hostEventId, record.discoverEventId].filter(
    (id): id is string => Boolean(id),
  )
}

export function getEventModeration(targetEventId: string | undefined): EventModerationRecord | null {
  if (!targetEventId?.trim()) return null
  const ids = resolveEventModerationIds({ targetEventId })
  const lookup = new Set(
    [targetEventId, ids.primaryId, ids.hostEventId, ids.discoverEventId].filter(Boolean),
  )
  return (
    readRecords().find((record) => recordIdsForLookup(record).some((id) => lookup.has(id))) ?? null
  )
}

export function isEventHiddenFromDiscover(targetEventId: string | undefined): boolean {
  const record = getEventModeration(targetEventId)
  return record?.status === 'suspended' || record?.status === 'blocked'
}

export function getAdminEventRegistryUrl(input: {
  targetEventId?: string
  hostEventId?: string
}): string | null {
  if (!input.targetEventId && !input.hostEventId) return null
  const resolved = resolveEventModerationIds({
    targetEventId: input.targetEventId ?? input.hostEventId ?? '',
    hostEventId: input.hostEventId,
  })
  if (!resolved.hostEventId) return null
  return `/admin/content?eventId=${encodeURIComponent(resolved.hostEventId)}`
}

function unpublishHostEventIfNeeded(hostEventId: string | undefined): void {
  if (!hostEventId) return
  const event = getHostEventById(hostEventId)
  if (!event) return
  if (event.status === 'live' || event.status === 'upcoming') {
    updateHostEventStatus(hostEventId, 'past')
  }
}

export function setEventModerationStatus(input: {
  targetEventId: string
  eventTitle?: string
  hostEventId?: string
  status: EventModerationStatus
  reason?: string
  linkedFeedbackId?: string
  updatedBy?: string
}): EventModerationRecord {
  const resolved = resolveEventModerationIds(input)
  const records = readRecords()
  const lookup = new Set(
    [input.targetEventId, resolved.primaryId, resolved.hostEventId, resolved.discoverEventId].filter(
      Boolean,
    ),
  )
  const idx = records.findIndex((record) =>
    recordIdsForLookup(record).some((id) => lookup.has(id)),
  )

  const updatedBy = input.updatedBy ?? getCurrentUser()?.email ?? PLATFORM_ADMIN.email
  const linkedFeedbackIds = new Set<string>()
  if (idx >= 0) {
    for (const id of records[idx].linkedFeedbackIds ?? []) linkedFeedbackIds.add(id)
  }
  if (input.linkedFeedbackId) linkedFeedbackIds.add(input.linkedFeedbackId)

  const next: EventModerationRecord = {
    targetEventId: resolved.primaryId,
    eventTitle: resolved.eventTitle,
    hostEventId: resolved.hostEventId,
    discoverEventId: resolved.discoverEventId,
    status: input.status,
    reason: input.reason?.trim() || undefined,
    linkedFeedbackIds: linkedFeedbackIds.size > 0 ? [...linkedFeedbackIds] : undefined,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }

  if (idx >= 0) {
    records[idx] = next
  } else {
    records.unshift(next)
  }
  saveRecords(records)

  if (input.status === 'suspended' || input.status === 'blocked') {
    unpublishHostEventIfNeeded(resolved.hostEventId)
  }

  return next
}

export function clearEventModeration(targetEventId: string): boolean {
  const records = readRecords()
  const lookup = new Set(
    Object.values(resolveEventModerationIds({ targetEventId })).filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    ),
  )
  lookup.add(targetEventId)
  const next = records.filter(
    (record) => !recordIdsForLookup(record).some((id) => lookup.has(id)),
  )
  if (next.length === records.length) return false
  saveRecords(next)
  return true
}

export function getEventModerationRecords(): EventModerationRecord[] {
  return readRecords().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function getDiscoverOnlyModerationRecords(): EventModerationRecord[] {
  return getEventModerationRecords().filter((record) => {
    if (record.discoverEventId && !record.hostEventId) return true
    if (record.hostEventId && !getHostEventById(record.hostEventId)) return true
    return !record.hostEventId && !getHostEventById(record.targetEventId)
  })
}

export type EventModerationFilter = 'all' | EventModerationStatus | 'any'

export function recordMatchesModerationFilter(
  record: EventModerationRecord,
  filter: EventModerationFilter,
): boolean {
  if (filter === 'all') return true
  if (filter === 'any') return true
  return record.status === filter
}

export function getAdminEventModerationHubUrl(input: {
  targetEventId: string
  hostEventId?: string
  status?: EventModerationStatus
}): string {
  const registry = getAdminEventRegistryUrl(input)
  if (registry) {
    if (input.status) return `${registry}&moderation=${input.status}`
    return registry
  }
  const params = new URLSearchParams()
  params.set('moderation', input.status ?? 'any')
  params.set('discoverEvent', input.targetEventId)
  return `/admin/content?${params.toString()}`
}

export function getFlaggedEventModerationCount(): number {
  return readRecords().filter((record) => record.status === 'flagged').length
}

export function getHiddenEventModerationCount(): number {
  return readRecords().filter(
    (record) => record.status === 'suspended' || record.status === 'blocked',
  ).length
}
