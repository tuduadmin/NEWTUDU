import { useEffect, useMemo, useState } from 'react'
import AdminFeedbackDetailDrawer, {
  type FeedbackDrawerView,
} from '../../components/admin/AdminFeedbackDetailDrawer'
import AdminFeedbackResolveDialog, {
  type FeedbackResolvePayload,
} from '../../components/admin/AdminFeedbackResolveDialog'
import {
  AdminBadge,
  AdminFilterBar,
  AdminPageHeader,
  AdminManageButton,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  deleteFeedback,
  getFeedbackItems,
  getFeedbackStatusLabel,
  isEventReportEscalated,
  isSafetyFeedbackReport,
  resolveFeedback,
  EVENT_REPORT_ESCALATION_CHANGED_EVENT,
  type FeedbackReport,
} from '../../lib/adminFeedback'
import { getSafetyReportSequence } from '../../lib/supportTicketIds'
import { getEventModeration, EVENT_MODERATION_CHANGED_EVENT } from '../../lib/adminEventModeration'

type AdminFeedbackPageProps = {
  embedded?: boolean
  /** When set, locks the queue to open or resolved items only. */
  queue?: 'open' | 'resolved'
  onReplyToEmail?: (email: string) => void
  /** Show only reports tied to events with 3+ open reports. */
  escalatedOnly?: boolean
  /** Limit to reports for a single event id. */
  eventIdFilter?: string
}

export default function AdminFeedbackPage({
  embedded = false,
  queue,
  onReplyToEmail,
  escalatedOnly = false,
  eventIdFilter,
}: AdminFeedbackPageProps) {
  const [refresh, setRefresh] = useState(0)
  const [typeFilter, setTypeFilter] = useState<'all' | 'report' | 'feedback' | 'safety'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>(() =>
    queue ?? 'all',
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerView, setDrawerView] = useState<FeedbackDrawerView>('feedback')
  const [resolveTarget, setResolveTarget] = useState<FeedbackReport | null>(null)

  const items = useMemo(() => {
    let list = getFeedbackItems()
    if (typeFilter === 'safety') {
      list = list.filter((f) => isSafetyFeedbackReport(f))
    } else if (typeFilter !== 'all') {
      list = list.filter((f) => f.type === typeFilter && !isSafetyFeedbackReport(f))
    }
    const status = queue ?? statusFilter
    if (status !== 'all') list = list.filter((f) => f.status === status)
    if (eventIdFilter) {
      list = list.filter((f) => f.targetEventId === eventIdFilter)
    }
    if (escalatedOnly) {
      list = list.filter(
        (f) => f.type === 'report' && f.targetEventId && isEventReportEscalated(f.targetEventId),
      )
    }
    return list
  }, [typeFilter, statusFilter, queue, refresh, escalatedOnly, eventIdFilter])

  const selectedItem = selectedId ? items.find((item) => item.id === selectedId) ?? null : null

  useEffect(() => {
    function onFeedbackChanged() {
      setRefresh((r) => r + 1)
    }
    window.addEventListener('tudu-feedback-changed', onFeedbackChanged)
    window.addEventListener(EVENT_REPORT_ESCALATION_CHANGED_EVENT, onFeedbackChanged)
    window.addEventListener(EVENT_MODERATION_CHANGED_EVENT, onFeedbackChanged)
    window.addEventListener('storage', onFeedbackChanged)
    return () => {
      window.removeEventListener('tudu-feedback-changed', onFeedbackChanged)
      window.removeEventListener(EVENT_REPORT_ESCALATION_CHANGED_EVENT, onFeedbackChanged)
      window.removeEventListener(EVENT_MODERATION_CHANGED_EVENT, onFeedbackChanged)
      window.removeEventListener('storage', onFeedbackChanged)
    }
  }, [])

  function reload() {
    setRefresh((r) => r + 1)
  }

  function openDetail(id: string, view: FeedbackDrawerView = 'feedback') {
    setDrawerView(view)
    setSelectedId(id)
  }

  function replyToItem(item: FeedbackReport) {
    const email = item.reporterEmail ?? item.hostEmail
    if (!email) return
    if (onReplyToEmail) {
      onReplyToEmail(email)
      return
    }
    window.location.href = `/admin/support?tab=send&to=${encodeURIComponent(email)}`
  }

  function openResolve(item: FeedbackReport) {
    setResolveTarget(item)
  }

  function confirmResolve(payload: FeedbackResolvePayload) {
    if (!resolveTarget) return
    resolveFeedback(resolveTarget.id, {
      resolutionMessage: payload.resolutionMessage,
      sendInApp: payload.sendInApp,
      sendEmail: payload.sendEmail,
    })
    setResolveTarget(null)
    reload()
  }

  return (
    <div className={embedded ? undefined : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <AdminPageHeader
          title="Feedback & Reports"
          subtitle="User reports and general feedback from local storage."
        />
      )}

      <AdminFilterBar>
        <AdminSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
          <option value="all">All types</option>
          <option value="safety">Safety</option>
          <option value="report">Reports</option>
          <option value="feedback">Feedback</option>
        </AdminSelect>
        {!queue && (
          <AdminSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="open">Still open</option>
            <option value="resolved">Resolved</option>
          </AdminSelect>
        )}
      </AdminFilterBar>

      <AdminTable
        columns={['Ticket', 'Type', 'Reason', 'Message', 'Reporter', 'Target', 'Status', '']}
      >
        {items.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-10 text-center text-sm text-[var(--admin-text-dim)]">
              {queue === 'open'
                ? 'No still-open tickets yet. User submissions from Report event and Send feedback appear here.'
                : 'No resolved tickets yet.'}
            </td>
          </tr>
        ) : (
          items.map((item) => (
          <FeedbackRow
            key={item.id}
            item={item}
            onOpen={() => openDetail(item.id)}
          />
        ))
        )}
      </AdminTable>

      <AdminFeedbackDetailDrawer
        item={selectedItem}
        open={!!selectedItem}
        initialView={drawerView}
        onClose={() => setSelectedId(null)}
        onResolve={() => {
          if (selectedItem) openResolve(selectedItem)
        }}
        onDelete={() => {
          if (!selectedItem) return
          deleteFeedback(selectedItem.id)
          setSelectedId(null)
          reload()
        }}
        onReply={() => {
          if (selectedItem) replyToItem(selectedItem)
        }}
        onModerationChanged={reload}
      />

      <AdminFeedbackResolveDialog
        item={resolveTarget}
        open={!!resolveTarget}
        onConfirm={confirmResolve}
        onCancel={() => setResolveTarget(null)}
      />
    </div>
  )
}

function FeedbackRow({
  item,
  onOpen,
}: {
  item: FeedbackReport
  onOpen: () => void
}) {
  const moderation = item.targetEventId ? getEventModeration(item.targetEventId) : null

  const isSafety = isSafetyFeedbackReport(item)

  return (
    <tr className="cursor-pointer" onClick={onOpen}>
      <td className="admin-tabular text-xs font-medium text-[var(--admin-accent)]">
        <div>{item.ticketNumber}</div>
        {isSafety && getSafetyReportSequence(item.ticketNumber) != null && (
          <div className="mt-0.5 text-[10px] font-normal text-[var(--admin-text-dim)]">
            Safety report #{getSafetyReportSequence(item.ticketNumber)}
          </div>
        )}
      </td>
      <td>
        <AdminBadge tone={isSafety ? 'rose' : item.type === 'report' ? 'rose' : 'cyan'}>
          {isSafety ? 'Safety' : item.type}
        </AdminBadge>
      </td>
      <td className="text-[var(--admin-text-muted)]">{item.reason}</td>
      <td className="max-w-[200px] truncate">{item.message}</td>
      <td className="text-xs text-[var(--admin-text-dim)]">{item.reporterEmail ?? '—'}</td>
      <td className="text-xs">
        {item.eventTitle && <p>{item.eventTitle}</p>}
        {item.targetEventId && isEventReportEscalated(item.targetEventId) && (
          <AdminBadge tone="amber">3+ reports</AdminBadge>
        )}
        {moderation && <AdminBadge tone="rose">{moderation.status}</AdminBadge>}
        {item.targetUserId && <p className="text-[var(--admin-text-dim)]">{item.targetUserId}</p>}
        {item.hostEmail && <p className="text-[var(--admin-text-dim)]">Host: {item.hostEmail}</p>}
      </td>
      <td>
        <AdminBadge tone={item.status === 'open' ? 'amber' : 'emerald'}>
          {getFeedbackStatusLabel(item.status)}
        </AdminBadge>
      </td>
      <td className="text-right" onClick={(e) => e.stopPropagation()}>
        <AdminManageButton onClick={onOpen} />
      </td>
    </tr>
  )
}
