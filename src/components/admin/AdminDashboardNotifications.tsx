import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { getHostEvents } from '../../lib/account'
import {
  EVENT_REPORT_ESCALATION_CHANGED_EVENT,
  getUnacknowledgedEventReportEscalationCount,
} from '../../lib/adminFeedback'
import { getOpenSupportInboxCount } from '../../lib/adminSupportQueue'
import { ADMIN_MESSAGES_CHANGED_EVENT, getUnreadCount } from '../../lib/adminMessages'
import {
  getPendingOrgVerificationCount,
  ORG_VERIFICATION_CHANGED_EVENT,
} from '../../lib/orgVerificationRequests'

type NotificationItem = {
  label: string
  to: string
  count: number
}

function getNotificationItems(): NotificationItem[] {
  const items: NotificationItem[] = []

  const orgPending = getPendingOrgVerificationCount()
  if (orgPending > 0) {
    items.push({
      label: 'Organizer verifications',
      to: '/admin/people?view=orgs&status=pending',
      count: orgPending,
    })
  }

  const seedPending = getHostEvents().filter(
    (e) => e.seededByAdmin && (e.seedApprovalStatus ?? 'pending') === 'pending',
  ).length
  if (seedPending > 0) {
    items.push({
      label: 'Seed events to review',
      to: '/admin/content?view=seed-events',
      count: seedPending,
    })
  }

  const openFeedback = getOpenSupportInboxCount()
  if (openFeedback > 0) {
    items.push({
      label: 'Open feedback & reports',
      to: '/admin/support',
      count: openFeedback,
    })
  }

  const escalatedEvents = getUnacknowledgedEventReportEscalationCount()
  if (escalatedEvents > 0) {
    items.push({
      label: 'Events with 3+ reports',
      to: '/admin/support?escalated=1',
      count: escalatedEvents,
    })
  }

  const unread = getUnreadCount()
  if (unread > 0) {
    items.push({
      label: 'Unread outreach threads',
      to: '/admin/support?tab=threads',
      count: unread,
    })
  }

  return items
}

export default function AdminDashboardNotifications() {
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1)
    }

    window.addEventListener(ORG_VERIFICATION_CHANGED_EVENT, refresh)
    window.addEventListener('tudu-feedback-changed', refresh)
    window.addEventListener(EVENT_REPORT_ESCALATION_CHANGED_EVENT, refresh)
    window.addEventListener(ADMIN_MESSAGES_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(ORG_VERIFICATION_CHANGED_EVENT, refresh)
      window.removeEventListener('tudu-feedback-changed', refresh)
      window.removeEventListener(EVENT_REPORT_ESCALATION_CHANGED_EVENT, refresh)
      window.removeEventListener(ADMIN_MESSAGES_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const items = useMemo(() => {
    void tick
    return getNotificationItems()
  }, [tick])

  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="admin-btn admin-btn-ghost relative px-2.5"
        aria-label={total > 0 ? `${total} notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] py-1 shadow-lg">
          {items.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[var(--admin-text-muted)]">All caught up.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs no-underline transition hover:bg-[var(--admin-surface-hover)]"
                  >
                    <span className="text-[var(--admin-text)]">{item.label}</span>
                    <span className="admin-badge admin-badge-amber">{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
