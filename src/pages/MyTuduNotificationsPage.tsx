import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bell, Mail } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import { getCurrentUser } from '../lib/auth'
import { getOrganization } from '../lib/account'
import {
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from '../lib/userNotifications'

function isSafeReturnPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith('/') && !path.startsWith('//'))
}

function getNotificationsReturnUrl(searchParams: URLSearchParams): string {
  const candidate = searchParams.get('returnTo')
  if (isSafeReturnPath(candidate)) return candidate
  return '/my-tudu'
}

function getNotificationsReturnLabel(returnTo: string): string {
  switch (returnTo) {
    case '/host':
      return 'Back to Event Manager'
    default:
      return 'My Tudu'
  }
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function MyTuduNotificationsPage() {
  const user = getCurrentUser()
  const [searchParams] = useSearchParams()
  const orgFilter = searchParams.get('org')
  const returnTo = getNotificationsReturnUrl(searchParams)
  const returnLabel = getNotificationsReturnLabel(returnTo)
  const filteredOrg = orgFilter ? getOrganization(orgFilter) : null
  const [refresh, setRefresh] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const notifications = useMemo(() => {
    const all = user ? getUserNotifications(user.email) : []
    if (orgFilter) return all.filter((n) => n.orgId === orgFilter)
    return all
  }, [user, refresh, orgFilter])

  function handleOpen(notification: UserNotification) {
    if (expandedId === notification.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(notification.id)
    if (!notification.read) {
      markNotificationRead(notification.id, notification.userEmail)
      setRefresh((r) => r + 1)
    }
  }

  function handleMarkAllRead() {
    if (!user) return
    markAllNotificationsRead(user.email)
    setRefresh((r) => r + 1)
  }

  if (!user) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/my-tudu" />
        <main className="px-4 py-8 text-center">
          <p className="text-sm text-brown-muted">Sign in to view messages.</p>
          <Link to="/signin" className="mt-4 inline-block text-sm font-semibold text-orange">
            Sign in
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main className="space-y-4 px-4 pt-2">
        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            to={returnTo}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-orange"
          >
            <ArrowLeft size={16} />
            {returnLabel}
          </Link>
          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-orange"
            >
              Mark all read
            </button>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
            Messages
          </h1>
          <p className="mt-1 text-sm text-brown-muted">
            {filteredOrg
              ? `Messages about ${filteredOrg.name}`
              : 'Messages from TUDU'}
          </p>
        </div>

        <section className="space-y-2">
          {notifications.length === 0 ? (
            <div className="rounded-[14px] border border-brown/10 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-cream-dark text-brown-muted">
                <Bell size={24} strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-sm font-bold text-brown">All caught up</h2>
              <p className="mt-1 text-sm text-brown-muted">
                When TUDU sends you a message, it will show up here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const expanded = expandedId === notification.id
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpen(notification)}
                  className={`w-full rounded-[14px] border px-4 py-3 text-left shadow-sm transition ${
                    notification.read
                      ? 'border-brown/10 bg-white'
                      : 'border-orange/20 bg-orange/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-700">
                      <Mail size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            notification.read ? 'font-medium text-brown' : 'font-bold text-brown'
                          }`}
                        >
                          {notification.subject}
                        </p>
                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-brown-muted">
                        TUDU Â· {formatWhen(notification.timestamp)}
                      </p>
                      {expanded && (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brown-muted">
                          {notification.body}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
