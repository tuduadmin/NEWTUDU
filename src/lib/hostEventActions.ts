import {
  canCreatePrivateEvent,
  canCreatePublicEvent,
  deleteHostEvent,
  ensureAccount,
  getHostEventById,
  getHostEvents,
  privateEventBlockMessage,
  publicEventBlockMessage,
  type HostEvent,
  type TicketSession,
  type TicketTier,
  updateHostEvent,
  updateHostEventStatus,
} from './account'

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateShareToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

function writeEvents(events: HostEvent[]): void {
  localStorage.setItem('tudu_host_events', JSON.stringify(events))
}

function resetTicketTiersForCopy(tiers: TicketTier[]): TicketTier[] {
  return tiers.map((tier) => ({
    ...tier,
    id: generateId('tier'),
    sold: 0,
  }))
}

function resetTicketSessionsForCopy(sessions: TicketSession[]): TicketSession[] {
  return sessions.map((session) => ({
    ...session,
    tiers: resetTicketTiersForCopy(session.tiers),
  }))
}

export function duplicateHostEvent(
  eventId: string,
  createdBy: string,
): { ok: boolean; event?: HostEvent; error?: string } {
  const source = getHostEventById(eventId)
  if (!source) return { ok: false, error: 'Event not found.' }

  const copy: HostEvent = {
    ...source,
    id: generateId('event'),
    title: `${source.title} (Copy)`,
    createdAt: new Date().toISOString(),
    createdBy,
    status: 'draft',
    shareToken: source.visibility === 'private' ? generateShareToken() : undefined,
    seededByAdmin: undefined,
    createdByAdminId: undefined,
    seedApprovalStatus: undefined,
    scheduledPublishAt: undefined,
    scheduledPublishNotifiedAt: undefined,
    expiresAt: undefined,
    ticketTiers: source.ticketTiers?.length
      ? resetTicketTiersForCopy(source.ticketTiers)
      : undefined,
    ticketSessions: source.ticketSessions?.length
      ? resetTicketSessionsForCopy(source.ticketSessions)
      : undefined,
  }

  const events = getHostEvents()
  events.push(copy)
  writeEvents(events)
  return { ok: true, event: copy }
}

export function deleteDraftHostEvent(eventId: string): { ok: boolean; error?: string } {
  const event = getHostEventById(eventId)
  if (!event) return { ok: false, error: 'Event not found.' }
  if (event.status !== 'draft') {
    return { ok: false, error: 'Only draft events can be deleted. Cancel live events instead.' }
  }
  return deleteHostEvent(eventId) ? { ok: true } : { ok: false, error: 'Could not delete event.' }
}

export function cancelHostEvent(eventId: string): { ok: boolean; error?: string } {
  const event = getHostEventById(eventId)
  if (!event) return { ok: false, error: 'Event not found.' }
  return updateHostEventStatus(eventId, 'past')
}

export function toggleHostEventVisibility(
  eventId: string,
  createdBy: string,
): { ok: boolean; error?: string } {
  const event = getHostEventById(eventId)
  if (!event) return { ok: false, error: 'Event not found.' }

  const nextVisibility = event.visibility === 'public' ? 'private' : 'public'

  if (nextVisibility === 'public') {
    const account = ensureAccount(createdBy)
    const check = canCreatePublicEvent(account, event.hostAccountId)
    if (!check.allowed) {
      if (check.reason) {
        return { ok: false, error: publicEventBlockMessage(check.reason) }
      }
      return { ok: false, error: publicEventBlockMessage('upgrade') }
    }
  } else {
    const account = ensureAccount(createdBy)
    const privateCheck = canCreatePrivateEvent(account, event.hostAccountId)
    if (!privateCheck.allowed) {
      return {
        ok: false,
        error: privateCheck.reason
          ? privateEventBlockMessage(privateCheck.reason, privateCheck.limit, account)
          : privateEventBlockMessage('limit', privateCheck.limit, account),
      }
    }
  }

  const result = updateHostEvent(eventId, {
    visibility: nextVisibility,
    shareToken:
      nextVisibility === 'private' ? (event.shareToken ?? generateShareToken()) : undefined,
  })

  return result.ok ? { ok: true } : { ok: false, error: result.error }
}

export function getEventViewPath(event: HostEvent): string {
  return `/host/event/${event.id}/view`
}
