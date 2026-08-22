import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AdminBadge,
  AdminButton,
  AdminDrawer,
} from './AdminUI'
import AdminDiscoverPreviewLink from './AdminDiscoverPreviewLink'
import AdminEventModerationPanel from './AdminEventModerationPanel'
import { getEventMetrics } from '../../lib/adminAnalytics'
import {
  getEventModeration,
  EVENT_MODERATION_CHANGED_EVENT,
} from '../../lib/adminEventModeration'
import {
  findDiscoverEventByTargetId,
  getDiscoverEventDeepLink,
  type DiscoverEvent,
} from '../../data/discoverEvents'
import {
  getHostAccount,
  getOrganizationApprovalStatus,
  getTierBadgeTone,
  getTierLabel,
  type HostEvent,
  type HostEventStatus,
} from '../../lib/account'
import {
  resolveFeedbackDiscoverEvent,
  resolveFeedbackEvent,
  resolveFeedbackHost,
  getFeedbackStatusLabel,
  isSafetyFeedbackReport,
  type FeedbackHostLink,
  type FeedbackReport,
} from '../../lib/adminFeedback'
import { formatCityLabel } from '../../lib/location'
import { formatHostEventDateTime } from '../../lib/hostEventSchedule'

type DrawerView = 'feedback' | 'event' | 'host'

export type FeedbackDrawerView = DrawerView

type AdminFeedbackDetailDrawerProps = {
  item: FeedbackReport | null
  open: boolean
  initialView?: DrawerView
  onClose: () => void
  onResolve: () => void
  onDelete: () => void
  onReply: () => void
  onModerationChanged?: () => void
}

export default function AdminFeedbackDetailDrawer({
  item,
  open,
  initialView = 'feedback',
  onClose,
  onResolve,
  onDelete,
  onReply,
  onModerationChanged,
}: AdminFeedbackDetailDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState<DrawerView>(initialView)
  const adminReturnTo = `${location.pathname}${location.search}`

  const linkedEvent = useMemo(
    () => (item ? resolveFeedbackEvent(item) : undefined),
    [item],
  )
  const linkedDiscoverEvent = useMemo(
    () => (item && !linkedEvent ? resolveFeedbackDiscoverEvent(item) : undefined),
    [item, linkedEvent],
  )
  const linkedHost = useMemo(() => (item ? resolveFeedbackHost(item) : null), [item])
  const eventMetrics = useMemo(() => {
    if (linkedEvent) return getEventMetrics(linkedEvent.id)
    if (linkedDiscoverEvent) {
      return getEventMetrics(linkedDiscoverEvent.hostEventId ?? linkedDiscoverEvent.id)
    }
    return null
  }, [linkedEvent, linkedDiscoverEvent])

  useEffect(() => {
    if (open) setView(initialView)
  }, [open, item?.id, initialView])

  useEffect(() => {
    if (!open) return
    function refreshModeration() {
      onModerationChanged?.()
    }
    window.addEventListener(EVENT_MODERATION_CHANGED_EVENT, refreshModeration)
    return () => window.removeEventListener(EVENT_MODERATION_CHANGED_EVENT, refreshModeration)
  }, [open, onModerationChanged])

  if (!item) return null

  const isSafety = isSafetyFeedbackReport(item)
  const queueLabel = isSafety ? 'Safety' : item.type === 'report' ? 'Report' : 'Feedback'

  const title =
    view === 'event'
      ? linkedEvent?.title ?? linkedDiscoverEvent?.title ?? 'Linked event'
      : view === 'host'
        ? linkedHost?.kind === 'org'
          ? linkedHost.org.name
          : linkedHost?.name ?? 'Linked host'
        : `${item.ticketNumber} · ${queueLabel} — ${item.reason}`

  return (
    <AdminDrawer
      open={open}
      title={title}
      onClose={onClose}
      centered
      wide={view !== 'feedback'}
      footer={
        view === 'feedback' ? (
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="primary" onClick={onReply}>
              Reply
            </AdminButton>
            {item.status === 'open' && (
              <AdminButton variant="secondary" onClick={onResolve}>
                Resolve
              </AdminButton>
            )}
            <AdminButton
              variant="danger"
              onClick={() => {
                if (window.confirm('Delete this feedback item?')) {
                  onDelete()
                  onClose()
                }
              }}
            >
              Delete
            </AdminButton>
          </div>
        ) : view === 'event' && linkedEvent ? (
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => setView('feedback')}>
              Back to feedback
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={() =>
                navigate(`/admin/events?eventId=${encodeURIComponent(linkedEvent.id)}`)
              }
            >
              Open in events registry
            </AdminButton>
          </div>
        ) : view === 'event' && linkedDiscoverEvent ? (
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton variant="secondary" onClick={() => setView('feedback')}>
              Back to feedback
            </AdminButton>
            <AdminDiscoverPreviewLink
              href={getDiscoverEventDeepLink(linkedDiscoverEvent, { adminReturnTo })}
            />
          </div>
        ) : view === 'host' && linkedHost ? (
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => setView('feedback')}>
              Back to feedback
            </AdminButton>
            {linkedHost.kind === 'org' ? (
              <AdminButton
                variant="primary"
                onClick={() =>
                  navigate(`/admin/organizations/${encodeURIComponent(linkedHost.orgId)}`)
                }
              >
                Open org overview
              </AdminButton>
            ) : (
              <AdminButton variant="primary" onClick={() => navigate('/admin/people?view=users')}>
                Open in user base
              </AdminButton>
            )}
          </div>
        ) : undefined
      }
    >
      {view === 'feedback' && (
        <FeedbackDetailBody
          item={item}
          linkedEvent={linkedEvent}
          linkedDiscoverEvent={linkedDiscoverEvent}
          linkedHost={linkedHost}
          onViewEvent={() => setView('event')}
          onViewHost={() => setView('host')}
          onModerationChanged={onModerationChanged}
        />
      )}
      {view === 'event' && linkedEvent && eventMetrics && (
        <LinkedEventDetail
          event={linkedEvent}
          metrics={eventMetrics}
          adminReturnTo={adminReturnTo}
        />
      )}
      {view === 'event' && linkedDiscoverEvent && eventMetrics && (
        <LinkedDiscoverEventDetail
          event={linkedDiscoverEvent}
          metrics={eventMetrics}
          adminReturnTo={adminReturnTo}
        />
      )}
      {view === 'host' && linkedHost && <LinkedHostDetail host={linkedHost} />}
    </AdminDrawer>
  )
}

function FeedbackDetailBody({
  item,
  linkedEvent,
  linkedDiscoverEvent,
  linkedHost,
  onViewEvent,
  onViewHost,
  onModerationChanged,
}: {
  item: FeedbackReport
  linkedEvent?: HostEvent
  linkedDiscoverEvent?: DiscoverEvent
  linkedHost: FeedbackHostLink | null
  onViewEvent: () => void
  onViewHost: () => void
  onModerationChanged?: () => void
}) {
  const canViewEvent = Boolean(linkedEvent || linkedDiscoverEvent)
  const eventTitle =
    linkedEvent?.title ?? linkedDiscoverEvent?.title ?? item.eventTitle ?? item.targetEventId ?? 'Unknown event'
  const moderationTargetId =
    item.targetEventId ??
    linkedEvent?.id ??
    linkedDiscoverEvent?.hostEventId ??
    linkedDiscoverEvent?.id
  const moderation = moderationTargetId ? getEventModeration(moderationTargetId) : null

  const isSafety = isSafetyFeedbackReport(item)

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="admin-label">Ticket</p>
        <p className="admin-tabular font-medium text-[var(--admin-accent)]">{item.ticketNumber}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <AdminBadge tone={isSafety ? 'rose' : item.type === 'report' ? 'rose' : 'cyan'}>
          {isSafety ? 'Safety' : item.type}
        </AdminBadge>
        <AdminBadge tone={item.status === 'open' ? 'amber' : 'emerald'}>
          {getFeedbackStatusLabel(item.status)}
        </AdminBadge>
        {moderation && (
          <AdminBadge
            tone={
              moderation.status === 'blocked'
                ? 'rose'
                : moderation.status === 'suspended'
                  ? 'amber'
                  : 'cyan'
            }
          >
            {moderation.status}
          </AdminBadge>
        )}
      </div>

      <div>
        <p className="admin-label">Reason</p>
        <p>{item.reason}</p>
      </div>

      <div>
        <p className="admin-label">Message</p>
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">{item.message}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="admin-label">Reporter</p>
          <p className="text-xs">{item.reporterEmail ?? '—'}</p>
        </div>
        <div>
          <p className="admin-label">Submitted</p>
          <p className="admin-tabular text-xs">{new Date(item.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div>
        <p className="admin-label">Device</p>
        <p className="text-xs text-[var(--admin-text-dim)]">{item.deviceInfo ?? '—'}</p>
      </div>

      {(linkedEvent || linkedDiscoverEvent || item.eventTitle || item.targetEventId) && (
        <LinkedSummaryCard
          label="Linked event"
          title={eventTitle}
          meta={
            linkedEvent
              ? [
                  formatHostEventDateTime(linkedEvent),
                  [linkedEvent.city, linkedEvent.province].filter(Boolean).join(', ') || '—',
                  linkedEvent.status,
                  linkedEvent.primaryCategory ?? 'Uncategorized',
                ].join(' · ')
              : linkedDiscoverEvent
                ? [
                    linkedDiscoverEvent.dateTime ?? linkedDiscoverEvent.dateTag ?? 'Schedule TBD',
                    linkedDiscoverEvent.city,
                    linkedDiscoverEvent.hostLabel ?? 'Discover card',
                    'Not in host registry',
                  ].join(' · ')
                : item.targetEventId
                  ? 'Event not found in registry or discover deck'
                  : undefined
          }
          actionLabel={canViewEvent ? 'View event' : undefined}
          onAction={canViewEvent ? onViewEvent : undefined}
        />
      )}

      {item.type === 'report' && moderationTargetId && (
        <AdminEventModerationPanel
          targetEventId={moderationTargetId}
          eventTitle={eventTitle}
          hostEventId={linkedEvent?.id ?? linkedDiscoverEvent?.hostEventId ?? item.targetEventId}
          linkedFeedbackId={item.id}
          compact
          onChanged={onModerationChanged}
        />
      )}

      {linkedHost && (
        <LinkedSummaryCard
          label={linkedHost.kind === 'org' ? 'Linked host (organization)' : 'Linked host (user)'}
          title={linkedHost.kind === 'org' ? linkedHost.org.name : linkedHost.name}
          meta={
            linkedHost.kind === 'org'
              ? [
                  linkedHost.org.category,
                  getOrganizationApprovalStatus(linkedHost.org),
                  linkedHost.org.createdBy,
                ].join(' · ')
              : [
                  linkedHost.email,
                  linkedHost.account?.tier ?? 'free',
                  linkedHost.account?.homeCity
                    ? formatCityLabel(linkedHost.account.homeCity)
                    : 'No account record',
                ].join(' · ')
          }
          actionLabel="View host"
          onAction={onViewHost}
        />
      )}

      {item.targetUserId && !linkedHost && (
        <LinkedSummaryCard
          label="Reported user"
          title={item.targetUserId}
          meta="User record not resolved"
        />
      )}

      {item.status === 'resolved' && (
        <div className="admin-panel space-y-2 p-3">
          <p className="admin-label">Resolution</p>
          {item.resolvedAt && (
            <p className="text-xs text-[var(--admin-text-muted)]">
              {new Date(item.resolvedAt).toLocaleString()}
              {item.resolvedBy ? ` · by ${item.resolvedBy}` : ''}
            </p>
          )}
          {item.resolutionMessage ? (
            <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
              {item.resolutionMessage}
            </p>
          ) : (
            <p className="text-xs text-[var(--admin-text-dim)]">Closed without a message sent.</p>
          )}
        </div>
      )}
    </div>
  )
}

function LinkedSummaryCard({
  label,
  title,
  meta,
  actionLabel,
  onAction,
}: {
  label: string
  title: string
  meta?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="admin-panel space-y-2 p-3">
      <p className="admin-label">{label}</p>
      <p className="font-medium">{title}</p>
      {meta && <p className="text-xs text-[var(--admin-text-muted)]">{meta}</p>}
      {actionLabel && onAction && (
        <AdminButton variant="secondary" className="mt-1" onClick={onAction}>
          {actionLabel}
        </AdminButton>
      )}
    </div>
  )
}

function LinkedDiscoverEventDetail({
  event,
  metrics,
  adminReturnTo,
}: {
  event: DiscoverEvent
  metrics: { views: number; saves: number }
  adminReturnTo: string
}) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-[var(--admin-text-muted)]">
        Summary for triage — use Preview on Discover to see the live card in a new tab.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Views" value={metrics.views} />
        <Metric label="Saves" value={metrics.saves} />
      </div>

      <div className="flex flex-wrap gap-2">
        {event.badges.map((badge) => (
          <AdminBadge key={badge} tone="cyan">
            {badge}
          </AdminBadge>
        ))}
        <AdminBadge tone="neutral">Discover card</AdminBadge>
      </div>

      {(event.dateTime || event.dateTag) && (
        <div>
          <p className="admin-label">Schedule</p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            {[event.dateTime, event.dateTag].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      <div>
        <p className="admin-label">Location</p>
        <p className="text-xs text-[var(--admin-text-muted)]">
          {[event.venueName, event.locationDetail, event.city].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>

      {event.hostLabel && (
        <div>
          <p className="admin-label">Host label</p>
          <p>{event.hostLabel}</p>
        </div>
      )}

      {event.description && (
        <div>
          <p className="admin-label">Description</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{event.description}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-3">
        <AdminDiscoverPreviewLink
          href={getDiscoverEventDeepLink(event, { adminReturnTo })}
          variant="secondary"
        />
      </div>
    </div>
  )
}

function LinkedEventDetail({
  event,
  metrics,
  adminReturnTo,
}: {
  event: HostEvent
  metrics: { views: number; saves: number }
  adminReturnTo: string
}) {
  const hostName = event.hostAccountId
    ? getHostAccount(event.hostAccountId)?.name ?? 'Organization'
    : event.displayName ?? event.createdBy
  const discoverCard = findDiscoverEventByTargetId(event.id)

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Views" value={metrics.views} />
        <Metric label="Saves" value={metrics.saves} />
        <Metric label="RSVPs" value={rsvpCount(event)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <EventStatusBadge status={event.status} />
        <AdminBadge tone="neutral">{event.visibility}</AdminBadge>
        {event.primaryCategory && <AdminBadge tone="cyan">{event.primaryCategory}</AdminBadge>}
      </div>

      <div>
        <p className="admin-label">Schedule</p>
        <p className="text-xs text-[var(--admin-text-muted)]">{formatHostEventDateTime(event)}</p>
      </div>

      <div>
        <p className="admin-label">Location</p>
        <p className="text-xs text-[var(--admin-text-muted)]">
          {[event.venueName, [event.city, event.province].filter(Boolean).join(', ')]
            .filter(Boolean)
            .join(' · ') || '—'}
        </p>
      </div>

      <div>
        <p className="admin-label">Host</p>
        <p>{hostName}</p>
        <p className="text-xs text-[var(--admin-text-muted)]">{event.createdBy}</p>
      </div>

      {event.description && (
        <div>
          <p className="admin-label">Description</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{event.description}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-3">
        {event.visibility === 'public' && discoverCard && (
          <AdminDiscoverPreviewLink
            href={getDiscoverEventDeepLink(discoverCard, { adminReturnTo })}
            variant="secondary"
          />
        )}
        {event.visibility === 'private' && event.shareToken && (
          <Link
            to={`/e/${event.shareToken}`}
            className="admin-btn admin-btn-secondary no-underline"
          >
            View private link
          </Link>
        )}
      </div>
    </div>
  )
}

function LinkedHostDetail({ host }: { host: FeedbackHostLink }) {
  const navigate = useNavigate()

  if (host.kind === 'org') {
    return (
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-accent-dim)] text-lg font-semibold text-[var(--admin-accent)]">
            {host.org.logoInitial}
          </div>
          <div>
            <p className="font-medium">{host.org.name}</p>
            <p className="text-xs text-[var(--admin-text-muted)]">{host.org.category}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <AdminBadge tone="cyan">Organization</AdminBadge>
          <AdminBadge tone={getOrganizationApprovalStatus(host.org) === 'pending' ? 'amber' : getOrganizationApprovalStatus(host.org) === 'rejected' ? 'rose' : 'emerald'}>
            {getOrganizationApprovalStatus(host.org)}
          </AdminBadge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="admin-label">Created by</p>
            <p className="text-xs">{host.org.createdBy}</p>
          </div>
          <div>
            <p className="admin-label">Backup admin</p>
            <p className="text-xs">{host.org.backupAdminEmail}</p>
          </div>
        </div>

        {host.org.profile && (
          <div>
            <p className="admin-label">Profile</p>
            <p className="text-xs text-[var(--admin-text-muted)]">{host.org.profile}</p>
          </div>
        )}

        <AdminButton
          variant="secondary"
          onClick={() =>
            navigate(`/admin/events?org=${encodeURIComponent(host.orgId)}`)
          }
        >
          View org events
        </AdminButton>
      </div>
    )
  }

  const account = host.account

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="admin-label">Account</p>
        <p className="font-medium">{host.name}</p>
        <p className="text-xs text-[var(--admin-text-muted)]">{host.email}</p>
      </div>

      {account && (
        <>
          <div className="flex flex-wrap gap-2">
            {account.banned && <AdminBadge tone="rose">Banned</AdminBadge>}
            {account.suspended && !account.banned && <AdminBadge tone="amber">Suspended</AdminBadge>}
            {!account.banned && !account.suspended && <AdminBadge tone="emerald">Active</AdminBadge>}
            <AdminBadge tone={getTierBadgeTone(account.tier)}>{getTierLabel(account.tier)}</AdminBadge>
            <AdminBadge tone="neutral">{account.verificationStatus ?? 'unverified'}</AdminBadge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="admin-label">City</p>
              <p className="text-xs">{formatCityLabel(account.homeCity)}</p>
            </div>
            <div>
              <p className="admin-label">Public events</p>
              <p className="text-xs">{account.publicEventCount ?? 0}</p>
            </div>
          </div>
        </>
      )}

      <AdminButton
        variant="secondary"
        onClick={() => navigate(`/admin/events?host=${encodeURIComponent(host.email)}`)}
      >
        View host events
      </AdminButton>
    </div>
  )
}

function EventStatusBadge({ status }: { status: HostEventStatus }) {
  const tone =
    status === 'live'
      ? 'emerald'
      : status === 'upcoming'
        ? 'cyan'
        : status === 'draft'
          ? 'neutral'
          : 'amber'
  return <AdminBadge tone={tone}>{status}</AdminBadge>
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-panel p-2 text-center">
      <p className="admin-label">{label}</p>
      <p className="admin-kpi-value text-[var(--admin-accent)]">{value}</p>
    </div>
  )
}

function rsvpCount(event: HostEvent): number {
  return (event.ticketTiers ?? []).reduce((s, t) => s + (t.sold ?? 0), 0)
}
