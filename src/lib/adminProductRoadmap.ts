import type { FeatureFlags } from './adminSettings'
import {
  PRIVATE_EVENT_CHAT_DEFAULT_RETENTION_DAYS,
  PRIVATE_EVENT_CHAT_OPENS_HOURS_BEFORE,
} from './privateEventChat'

export type PlannedFeatureStatus = 'filed' | 'in_progress' | 'beta' | 'shipped'

export type PlannedProductFeature = {
  id: string
  title: string
  status: PlannedFeatureStatus
  /** e.g. "v2", "Later" */
  targetVersion: string
  summary: string
  inScope: string[]
  outOfScope: string[]
  retention?: string
  featureFlagKey?: keyof FeatureFlags
  storageKey?: string
}

export const PLANNED_PRODUCT_FEATURES: PlannedProductFeature[] = [
  {
    id: 'private-event-chat',
    title: 'Private event chat',
    status: 'shipped',
    targetVersion: 'v1 beta',
    summary:
      'One group thread per private invite-only event — guests and host coordinate before and after the event. Not available on public Discover posts.',
    inScope: [
      'Private events only (`visibility: private`)',
      'Single event thread (not user-to-user DMs)',
      'Invitees / RSVP guests + host can post',
      'Host delete message + mute guest',
      'Read-only when event ends',
      `Auto-delete ${PRIVATE_EVENT_CHAT_DEFAULT_RETENTION_DAYS} days after event (default, host-configurable later)`,
      `Optional: open chat ${PRIVATE_EVENT_CHAT_OPENS_HOURS_BEFORE}h before start`,
    ],
    outOfScope: [
      'Public event comments or messaging',
      'Discover deck threads',
      'Permanent chat history (unless host export added later)',
      'Anonymous posting',
    ],
    retention: `Locked at event end → hidden from UI → purged after ${PRIVATE_EVENT_CHAT_DEFAULT_RETENTION_DAYS} days.`,
    featureFlagKey: 'privateEventChatEnabled',
    storageKey: 'tudu-private-event-chat',
  },
]

export function getPlannedProductFeature(id: string): PlannedProductFeature | undefined {
  return PLANNED_PRODUCT_FEATURES.find((f) => f.id === id)
}

export const PLANNED_FEATURE_STATUS_LABELS: Record<PlannedFeatureStatus, string> = {
  filed: 'Filed — not built',
  in_progress: 'In progress',
  beta: 'Beta',
  shipped: 'Shipped',
}
