import type { DiscoverEvent } from '../data/discoverEvents'
import { getCategoryById, type EventCategoryId } from '../data/eventCategories'
import type { HostEvent, HostEventFormData } from './account'
import { getAgeRestrictionLabel, getEventCostLabel } from './account'
import { getEventCoverGradientToken } from './eventCoverImage'
import { formatCardDateTime } from './eventSchedule'
import { formatStructuredAddress } from './structuredAddress'
import { getSyncedTicketSessions } from './ticketSessions'
import {
  resolveOrgHostDiscoverBorder,
  resolvePersonalHostDiscoverBorder,
} from './hostEventDiscoverStyle'

/** Maps create-event form state to a Discover deck card for live preview. */
export function createEventFormToDiscoverPreview(
  form: HostEventFormData,
  hostName: string,
  options?: {
    isVerified?: boolean
    hasHostAccount?: boolean
    hostAccountId?: string
    createdBy?: string
  },
): DiscoverEvent {
  const isVerified = options?.isVerified ?? false
  const hasHostAccount = options?.hasHostAccount ?? false
  const hostAccountId = options?.hostAccountId
  const createdBy = options?.createdBy ?? ''
  const primary = form.primaryCategory
    ? getCategoryById(form.primaryCategory as EventCategoryId)
    : null
  const secondary = form.secondaryCategory
    ? getCategoryById(form.secondaryCategory as EventCategoryId)
    : null

  const sessions = getSyncedTicketSessions(form)
  const previewHost = {
    ticketingMode: form.ticketingMode,
    ticketTiers: sessions.flatMap((s) => s.tiers),
    capacity: form.capacity,
    waitlistEnabled: form.waitlistEnabled,
    externalTicketUrl: form.externalTicketUrl.trim() || undefined,
  } as HostEvent

  const costLabel = getEventCostLabel(previewHost)
  const locationLine = [form.venueName, form.city].filter(Boolean).join(', ')

  return {
    id: 'create-event-preview',
    title: form.title.trim() || 'Untitled event',
    city: form.city.trim() || 'City',
    image: form.coverImage.trim() || getEventCoverGradientToken('sunset-warm'),
    badges: [],
    borderColor: !isVerified
      ? 'grey'
      : hasHostAccount && hostAccountId
        ? resolveOrgHostDiscoverBorder(hostAccountId)
        : createdBy
          ? resolvePersonalHostDiscoverBorder(createdBy)
          : 'grey',
    amenityIds: form.amenities,
    dateTag: 'Upcoming',
    dateTime: formatCardDateTime(form) ?? undefined,
    cost: costLabel,
    isRsvp: costLabel === 'RSVP',
    isWaitlist: costLabel === 'WAITLIST',
    ageRange: form.ageRestriction ? getAgeRestrictionLabel(form.ageRestriction) : undefined,
    locationDetail: formatStructuredAddress(form) || locationLine || undefined,
    hostLabel: hostName,
    hostAvatarInitial: hostName.charAt(0).toUpperCase(),
    categories: [
      ...(primary ? [{ label: primary.label, color: 'teal' as const, icon: 'party' as const }] : []),
      ...(secondary ? [{ label: secondary.label, color: 'purple' as const, icon: 'party' as const }] : []),
    ],
  }
}
