import { useCallback, useEffect, useState } from 'react'
import { ACTIVITY_LOG_CHANGED_EVENT } from './adminAnalytics'
import { ACCOUNTS_CHANGED_EVENT } from './account'
import { AFFILIATE_CLICKS_CHANGED_EVENT } from './affiliatePartners'
import { CHART_PREFERENCES_CHANGED_EVENT } from './adminChartPreferences'
import { MARKETING_CAMPAIGNS_CHANGED_EVENT } from './adminMarketingCampaigns'
import { EVENT_REPORT_ESCALATION_CHANGED_EVENT } from './adminFeedback'
import { ORG_VERIFICATION_CHANGED_EVENT } from './orgVerificationRequests'
import { TICKET_TRANSACTIONS_CHANGED_EVENT } from './ticketTransactions'

/** Events that mean Control Room demo data changed in this tab. */
export const ADMIN_LIVE_DATA_EVENTS = [
  ACTIVITY_LOG_CHANGED_EVENT,
  MARKETING_CAMPAIGNS_CHANGED_EVENT,
  CHART_PREFERENCES_CHANGED_EVENT,
  'tudu-feedback-changed',
  TICKET_TRANSACTIONS_CHANGED_EVENT,
  AFFILIATE_CLICKS_CHANGED_EVENT,
  'tudu-affiliate-config-changed',
  ACCOUNTS_CHANGED_EVENT,
  'tudu-organizations-changed',
  ORG_VERIFICATION_CHANGED_EVENT,
  EVENT_REPORT_ESCALATION_CHANGED_EVENT,
  'storage',
] as const

export function useAdminLiveRefresh(
  eventNames: readonly string[] = ADMIN_LIVE_DATA_EVENTS,
): { refreshKey: number; refresh: () => void } {
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1)
  }, [])

  useEffect(() => {
    for (const name of eventNames) {
      window.addEventListener(name, refresh)
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      for (const name of eventNames) {
        window.removeEventListener(name, refresh)
      }
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [eventNames, refresh])

  return { refreshKey, refresh }
}
