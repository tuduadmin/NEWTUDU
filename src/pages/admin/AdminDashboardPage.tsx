import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import {
  ChevronRight,
  Layers,
  MessageSquare,
  Users,
} from 'lucide-react'
import AdminDashboardNotifications from '../../components/admin/AdminDashboardNotifications'
import {
  AdminBadge,
  AdminPageHeader,
} from '../../components/admin/AdminUI'
import {
  getAnalytics,
  seedDemoAnalytics,
} from '../../lib/adminAnalytics'
import { seedDemoFeedback } from '../../lib/adminFeedback'
import { ADMIN_MESSAGES_CHANGED_EVENT, seedDemoMessages } from '../../lib/adminMessages'
import { getPendingOrgVerificationCount, ORG_VERIFICATION_CHANGED_EVENT } from '../../lib/orgVerificationRequests'
import { getSupportQueueTotal } from '../../lib/adminSupportQueue'
import { getHostEvents } from '../../lib/account'

seedDemoAnalytics()
seedDemoFeedback()
seedDemoMessages()

const QUICK_TASKS: {
  to: string
  title: string
  description: string
  icon: typeof Users
  badge: (analytics: ReturnType<typeof getAnalytics>) => string | null
}[] = [
  {
    to: '/admin/people?view=orgs',
    title: 'People',
    description: 'Users, orgs, and verification queue',
    icon: Users,
    badge: () => {
      const n = getPendingOrgVerificationCount()
      return n > 0 ? `${n} pending org` : null
    },
  },
  {
    to: '/admin/content',
    title: 'Content',
    description: 'Events, seeds, attractions, lists, and road trips',
    icon: Layers,
    badge: () => {
      const n = getHostEvents().filter(
        (e) => e.seededByAdmin && (e.seedApprovalStatus ?? 'pending') === 'pending',
      ).length
      return n > 0 ? `${n} seed pending` : null
    },
  },
  {
    to: '/admin/support',
    title: 'Customer Support',
    description: 'Feedback, reports, compose, and outbound threads',
    icon: MessageSquare,
    badge: () => {
      const total = getSupportQueueTotal()
      return total > 0 ? String(total) : null
    },
  },
]

export default function AdminDashboardPage() {
  const [params] = useSearchParams()
  const [queueRefresh, setQueueRefresh] = useState(0)

  useEffect(() => {
    function refreshQueues() {
      setQueueRefresh((n) => n + 1)
    }

    window.addEventListener(ORG_VERIFICATION_CHANGED_EVENT, refreshQueues)
    window.addEventListener('tudu-feedback-changed', refreshQueues)
    window.addEventListener(ADMIN_MESSAGES_CHANGED_EVENT, refreshQueues)
    window.addEventListener('storage', refreshQueues)
    return () => {
      window.removeEventListener(ORG_VERIFICATION_CHANGED_EVENT, refreshQueues)
      window.removeEventListener('tudu-feedback-changed', refreshQueues)
      window.removeEventListener(ADMIN_MESSAGES_CHANGED_EVENT, refreshQueues)
      window.removeEventListener('storage', refreshQueues)
    }
  }, [])

  if (params.get('view') === 'analytics') {
    const tab = params.get('tab')
    return (
      <Navigate
        to={tab ? `/admin/analytics?tab=${encodeURIComponent(tab)}` : '/admin/analytics'}
        replace
      />
    )
  }

  const pendingOrgVerifications = useMemo(() => {
    void queueRefresh
    return getPendingOrgVerificationCount()
  }, [queueRefresh])

  const supportQueueTotal = useMemo(() => {
    void queueRefresh
    return getSupportQueueTotal()
  }, [queueRefresh])

  const analytics = useMemo(() => getAnalytics(), [queueRefresh])

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Home"
        subtitle="Control room — daily ops and quick links to your queues."
        actions={<AdminDashboardNotifications />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_TASKS.map(({ to, title, description, icon: Icon, badge }) => {
          const badgeText = badge(analytics)
          const peoplePending = to.startsWith('/admin/people') ? pendingOrgVerifications : 0
          const supportPending = to.startsWith('/admin/support') ? supportQueueTotal : 0
          return (
            <Link key={to} to={to} className="admin-quick-card">
              <div className="flex items-start justify-between gap-2">
                <span className="admin-quick-card-icon">
                  <Icon size={18} />
                </span>
                <div className="flex items-center gap-1.5">
                  {peoplePending > 0 && (
                    <AdminBadge tone="amber">{peoplePending}</AdminBadge>
                  )}
                  {supportPending > 0 && (
                    <AdminBadge tone="cyan">{supportPending}</AdminBadge>
                  )}
                  <ChevronRight size={16} className="text-[var(--admin-text-dim)]" />
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--admin-text)]">{title}</p>
              <p className="text-xs text-[var(--admin-text-muted)]">{description}</p>
              {badgeText && !supportPending && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-accent)]">
                  {badgeText}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
