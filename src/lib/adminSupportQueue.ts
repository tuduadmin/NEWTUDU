import { getFeedbackQueueStats } from './adminFeedback'
import { getUnreadCount } from './adminMessages'

/** Open feedback & report tickets in the Support inbox tab. */
export function getOpenSupportInboxCount(): number {
  return getFeedbackQueueStats().stillOpen
}

/** Combined Support queue: inbox tickets + unread outbound thread replies. */
export function getSupportQueueTotal(): number {
  return getOpenSupportInboxCount() + getUnreadCount()
}
