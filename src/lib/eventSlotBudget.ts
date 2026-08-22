import type { EventVisibility, EventVisibilityChoice, HostEvent, HostEventFormData, UserAccount } from './account'
import { canCreatePublicEvent, getHostEvents } from './account'
import {
  expandOccurrenceDates,
  getEffectiveOccurrences,
  migrateScheduleFields,
} from './eventSchedule'
import { getTierBadgeForAccount, getTierPillClass } from './tierDisplay'
import { getUnverifiedPrivateEventLimit } from './tierConfig'

export type EventSlotBudget = {
  kind: 'private' | 'public'
  used: number
  limit: number
  draftDays: number
  projected: number
  isOver: boolean
  tierLabel: string
  tierPillClass: string
  showVerify: boolean
  canBuyMore: boolean
  extraSlots: number
}

const ACTIVE_SLOT_STATUSES = new Set(['draft', 'upcoming', 'live'])

export function countFormScheduleDays(form: HostEventFormData): number {
  const days = expandOccurrenceDates(getEffectiveOccurrences(form))
  return days.length
}

export function countHostEventScheduleDays(event: HostEvent): number {
  const migrated = migrateScheduleFields(event)
  const days = expandOccurrenceDates(
    getEffectiveOccurrences({ ...event, ...migrated }),
  )
  if (days.length > 0) return days.length
  return event.eventDate ? 1 : 0
}

function hostEventsUsingSlots(
  email: string,
  visibility: EventVisibility,
  hostAccountId: string | null,
  excludeEventId?: string,
): HostEvent[] {
  const normalized = email.toLowerCase()
  return getHostEvents().filter(
    (event) =>
      event.createdBy.toLowerCase() === normalized &&
      (event.hostAccountId ?? null) === hostAccountId &&
      event.visibility === visibility &&
      event.id !== excludeEventId &&
      ACTIVE_SLOT_STATUSES.has(event.status),
  )
}

function sumScheduleDays(events: HostEvent[]): number {
  return events.reduce((total, event) => total + countHostEventScheduleDays(event), 0)
}

/** Day-based slot budget for create-event (plan freely; enforce at publish). */
export function getEventSlotBudget(
  account: UserAccount,
  options: {
    visibility: EventVisibilityChoice
    hostAccountId?: string | null
    draftDays: number
    excludeEventId?: string
  },
): EventSlotBudget | null {
  const hostAccountId = options.hostAccountId ?? null
  const isVerified = account.verificationStatus === 'phone_verified'
  const badge = getTierBadgeForAccount(account.tier, account.verificationStatus)
  const hasPaidTier = account.tier === 'tier1' || account.tier === 'tier2'

  if (!isVerified && !hasPaidTier) {
    const limit = getUnverifiedPrivateEventLimit()
    const used = sumScheduleDays(
      hostEventsUsingSlots(account.email, 'private', null, options.excludeEventId),
    )
    const projected = used + options.draftDays
    return {
      kind: 'private',
      used,
      limit,
      draftDays: options.draftDays,
      projected,
      isOver: projected > limit,
      tierLabel: 'Unverified',
      tierPillClass: getTierPillClass('free'),
      showVerify: true,
      canBuyMore: false,
      extraSlots: 0,
    }
  }

  if (options.visibility !== 'public' && options.visibility !== 'private') {
    return null
  }

  if (options.visibility === 'private' && !hostAccountId) {
    return null
  }

  const publicCheck = canCreatePublicEvent(account, hostAccountId)
  const used = sumScheduleDays(
    hostEventsUsingSlots(account.email, 'public', hostAccountId, options.excludeEventId),
  )
  const projected = used + options.draftDays

  return {
    kind: 'public',
    used,
    limit: publicCheck.limit,
    draftDays: options.draftDays,
    projected,
    isOver: projected > publicCheck.limit,
    tierLabel: badge.label,
    tierPillClass: badge.pillClass,
    showVerify: false,
    canBuyMore: publicCheck.limit > 0,
    extraSlots: publicCheck.extraSlots,
  }
}

export function getEventSlotPublishBlock(
  form: HostEventFormData,
  account: UserAccount,
  hostAccountId: string | null | undefined,
  excludeEventId?: string,
): { budget: EventSlotBudget; message: string } | null {
  if (form.visibility !== 'public' && form.visibility !== 'private') return null

  const draftDays = countFormScheduleDays(form)
  const budget = getEventSlotBudget(account, {
    visibility: form.visibility,
    hostAccountId,
    draftDays,
    excludeEventId,
  })
  if (!budget || !budget.isOver) return null

  const dayWord = budget.draftDays === 1 ? 'day' : 'days'
  const slotsLabel = budget.kind === 'private' ? 'private slots' : 'public slots'

  return {
    budget,
    message: `This event uses ${budget.draftDays} schedule ${dayWord}, but you only have ${Math.max(0, budget.limit - budget.used)} ${slotsLabel} left (${budget.projected}/${budget.limit} total). Adjust your schedule, verify, or add slots before publishing.`,
  }
}
