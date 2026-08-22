import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AdminBadge, AdminButton, AdminKpi, AdminKpiGrid, AdminPageHeader } from '../../components/admin/AdminUI'
import {
  acknowledgeEventReportEscalation,
  getActiveEventReportEscalations,
  getFeedbackQueueStats,
  EVENT_REPORT_ESCALATION_CHANGED_EVENT,
} from '../../lib/adminFeedback'
import { getUnreadCount } from '../../lib/adminMessages'
import AdminFeedbackPage from './AdminFeedbackPage'
import AdminMessagesPage from './AdminMessagesPage'

export type SupportTab = 'inbox' | 'resolved' | 'send' | 'threads'

const SUPPORT_TABS: { id: SupportTab; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'send', label: 'Send message' },
  { id: 'threads', label: 'Outbound threads' },
]

export function parseSupportTab(raw: string | null): SupportTab {
  if (raw === 'resolved') return 'resolved'
  if (raw === 'send') return 'send'
  if (raw === 'threads') return 'threads'
  return 'inbox'
}

function getSubtitle(tab: SupportTab): string {
  switch (tab) {
    case 'resolved':
      return 'Closed feedback and reports — resolution history and linked events.'
    case 'send':
      return 'Compose, batch broadcast, poke templates — in-app, email (Resend), and SMS (Twilio).'
    case 'threads':
      return 'Admin outreach threads — replies, archives, and delivery status.'
    default:
      return 'Still-open feedback, bug reports, and safety reports from users.'
  }
}

export default function AdminSupportPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = parseSupportTab(params.get('tab'))
  const escalatedOnly = params.get('escalated') === '1'
  const eventIdFilter = params.get('event') ?? undefined
  const [escalationRefresh, setEscalationRefresh] = useState(0)
  const [queueRefresh, setQueueRefresh] = useState(0)

  const activeEscalations = useMemo(() => {
    void escalationRefresh
    return getActiveEventReportEscalations()
  }, [escalationRefresh])

  const queueStats = useMemo(() => {
    void queueRefresh
    return getFeedbackQueueStats()
  }, [queueRefresh])

  const openFeedback = queueStats.stillOpen
  const unreadThreads = getUnreadCount()

  useEffect(() => {
    function refreshEscalations() {
      setEscalationRefresh((n) => n + 1)
    }
    function refreshQueue() {
      setQueueRefresh((n) => n + 1)
    }
    window.addEventListener(EVENT_REPORT_ESCALATION_CHANGED_EVENT, refreshEscalations)
    window.addEventListener('tudu-feedback-changed', refreshEscalations)
    window.addEventListener('tudu-feedback-changed', refreshQueue)
    window.addEventListener('storage', refreshEscalations)
    window.addEventListener('storage', refreshQueue)
    return () => {
      window.removeEventListener(EVENT_REPORT_ESCALATION_CHANGED_EVENT, refreshEscalations)
      window.removeEventListener('tudu-feedback-changed', refreshEscalations)
      window.removeEventListener('tudu-feedback-changed', refreshQueue)
      window.removeEventListener('storage', refreshEscalations)
      window.removeEventListener('storage', refreshQueue)
    }
  }, [])

  useEffect(() => {
    const to = params.get('to')
    const compose = params.get('compose')
    if ((to || compose === '1') && tab !== 'send') {
      const next = new URLSearchParams(params)
      next.set('tab', 'send')
      setParams(next, { replace: true })
    }
  }, [params, setParams, tab])

  function setTab(next: SupportTab) {
    const nextParams = new URLSearchParams(params)
    if (next === 'inbox') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', next)
    }
    if (next !== 'send') {
      nextParams.delete('compose')
      nextParams.delete('to')
    }
    nextParams.delete('thread')
    setParams(nextParams, { replace: true })
  }

  function replyToEmail(email: string) {
    const nextParams = new URLSearchParams()
    nextParams.set('tab', 'send')
    nextParams.set('to', email)
    navigate(`/admin/support?${nextParams.toString()}`)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Customer Support"
        subtitle={getSubtitle(tab)}
        actions={undefined}
      />

      <AdminKpiGrid>
        <AdminKpi label="Still open" value={queueStats.stillOpen} accent="amber" />
        <AdminKpi
          label="Total safety (SAF)"
          value={queueStats.totalSafety}
          accent="rose"
        />
        <AdminKpi label="Open safety" value={queueStats.stillOpenSafety} accent="rose" />
        <AdminKpi label="SAF counter" value={queueStats.safetySequence} accent="neutral" />
        <AdminKpi label="Open reports" value={queueStats.stillOpenReports} accent="neutral" />
        <AdminKpi label="Open feedback" value={queueStats.stillOpenFeedback} accent="cyan" />
        <AdminKpi label="Resolved" value={queueStats.resolved} accent="emerald" />
      </AdminKpiGrid>

      <nav
        className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]"
        aria-label="Customer Support view"
      >
        {SUPPORT_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
              tab === id
                ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
            aria-current={tab === id ? 'page' : undefined}
          >
            {label}
            {id === 'inbox' && openFeedback > 0 && (
              <AdminBadge tone="amber">{openFeedback}</AdminBadge>
            )}
            {id === 'inbox' && activeEscalations.length > 0 && (
              <AdminBadge tone="rose">{activeEscalations.length} flagged</AdminBadge>
            )}
            {id === 'threads' && unreadThreads > 0 && (
              <AdminBadge tone="cyan">{unreadThreads}</AdminBadge>
            )}
          </button>
        ))}
      </nav>

      {activeEscalations.length > 0 && tab === 'inbox' && (
        <div className="mb-4 space-y-2">
          {activeEscalations.map((escalation) => (
            <div
              key={escalation.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--admin-radius)] border border-amber-500/35 bg-amber-500/10 px-4 py-3"
              role="alert"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--admin-text)]">
                  Multiple users reported an event
                </p>
                <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
                  <span className="font-medium text-[var(--admin-text)]">
                    {escalation.eventTitle ?? 'Untitled event'}
                  </span>{' '}
                  — {escalation.reporterCount} users, {escalation.reportCount} open report
                  {escalation.reportCount === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdminButton
                  variant="ghost"
                  onClick={() => {
                    const nextParams = new URLSearchParams(params)
                    nextParams.set('event', escalation.targetEventId)
                    nextParams.delete('escalated')
                    setParams(nextParams, { replace: true })
                  }}
                >
                  Review reports
                </AdminButton>
                <AdminButton
                  variant="primary"
                  onClick={() => {
                    acknowledgeEventReportEscalation(escalation.targetEventId)
                    if (eventIdFilter === escalation.targetEventId) {
                      const nextParams = new URLSearchParams(params)
                      nextParams.delete('event')
                      setParams(nextParams, { replace: true })
                    }
                  }}
                >
                  Dismiss alert
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {escalatedOnly && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--admin-text-muted)]">
          <span>Showing events with 3+ open reports.</span>
          <Link
            to="/admin/support"
            className="font-semibold text-[var(--admin-accent)] no-underline hover:underline"
          >
            Clear filter
          </Link>
        </div>
      )}

      {eventIdFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--admin-text-muted)]">
          <span>Filtered to one event&apos;s reports.</span>
          <Link
            to="/admin/support"
            className="font-semibold text-[var(--admin-accent)] no-underline hover:underline"
          >
            Clear filter
          </Link>
        </div>
      )}

      {tab === 'inbox' && (
        <AdminFeedbackPage
          embedded
          queue="open"
          onReplyToEmail={replyToEmail}
          escalatedOnly={escalatedOnly}
          eventIdFilter={eventIdFilter}
        />
      )}
      {tab === 'resolved' && (
        <AdminFeedbackPage embedded queue="resolved" onReplyToEmail={replyToEmail} />
      )}
      {tab === 'send' && <AdminMessagesPage embedded panel="send" />}
      {tab === 'threads' && <AdminMessagesPage embedded panel="threads" />}
    </div>
  )
}
