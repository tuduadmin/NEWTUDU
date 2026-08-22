import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AdminBadge,
  AdminButton,
  AdminDrawer,
  AdminPanel,
  AdminRowMenu,
  AdminTable,
} from './AdminUI'
import { getEventMetrics } from '../../lib/adminAnalytics'
import {
  getHostEventById,
  getHostEventsForOrg,
  publishHostEvent,
  unpublishHostEvent,
  updateHostEventStatus,
  approveSeedEvent,
  rejectSeedEvent,
  type HostEvent,
  type HostEventStatus,
} from '../../lib/account'
import { SeedApprovalBadge, seedApprovalMenuItems } from './SeedApprovalBadge'
import SharePublishModal from '../SharePublishModal'
import {
  formatHostEventDateTime,
  getOrgEventListTab,
  isHostEventPublished,
  orgEventTabs,
  ORG_EVENT_TAB_LABELS,
  type OrgEventTab,
} from '../../lib/hostEventSchedule'

type AdminOrgEventsSectionProps = {
  orgId: string
  refreshKey?: number
}

function publishOrgEvent(event: HostEvent): HostEvent | null {
  if (event.visibility === 'public') {
    const result = publishHostEvent(event.id, { adminBypass: true })
    return result.ok ? (result.event ?? null) : null
  }
  const tab = getOrgEventListTab({ ...event, status: 'upcoming' })
  const result = updateHostEventStatus(event.id, tab === 'live' ? 'live' : 'upcoming')
  return result.ok ? (result.event ?? null) : null
}

export default function AdminOrgEventsSection({ orgId, refreshKey = 0 }: AdminOrgEventsSectionProps) {
  const [activeTab, setActiveTab] = useState<OrgEventTab>('upcoming')
  const [localRefresh, setLocalRefresh] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shareEvent, setShareEvent] = useState<HostEvent | null>(null)
  const [sharePublishedJustNow, setSharePublishedJustNow] = useState(false)

  const allEvents = useMemo(() => {
    void refreshKey
    void localRefresh
    return getHostEventsForOrg(orgId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [orgId, refreshKey, localRefresh])

  const tabCounts = useMemo(() => {
    const counts: Record<OrgEventTab, number> = {
      upcoming: 0,
      live: 0,
      past: 0,
      drafts: 0,
    }
    for (const event of allEvents) {
      counts[getOrgEventListTab(event)] += 1
    }
    return counts
  }, [allEvents])

  const filteredEvents = useMemo(
    () => allEvents.filter((event) => getOrgEventListTab(event) === activeTab),
    [allEvents, activeTab],
  )

  const selected = selectedId ? getHostEventById(selectedId) : null
  const selectedMetrics = selected ? getEventMetrics(selected.id) : null

  function reload() {
    setLocalRefresh((r) => r + 1)
  }

  function handlePublish(event: HostEvent) {
    const published = publishOrgEvent(event)
    reload()
    if (published) {
      setSharePublishedJustNow(true)
      setShareEvent(published)
    }
  }

  function openShare(event: HostEvent) {
    setSharePublishedJustNow(false)
    setShareEvent(event)
  }

  function rsvpCount(event: HostEvent): number {
    return (event.ticketTiers ?? []).reduce((s, t) => s + (t.sold ?? 0), 0)
  }

  return (
    <AdminPanel>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="admin-label">Event posts</p>
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
            {allEvents.length} event{allEvents.length === 1 ? '' : 's'} for this organization
          </p>
        </div>
        <Link
          to={`/admin/events?org=${encodeURIComponent(orgId)}`}
          className="text-xs text-[var(--admin-accent)] no-underline hover:underline"
        >
          Open in Events Registry →
        </Link>
      </div>

      <nav className="mb-3 flex flex-wrap gap-1 border-b border-[var(--admin-border)]">
        {orgEventTabs().map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative px-3 py-2 text-xs font-medium transition ${
              activeTab === tab
                ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
          >
            {ORG_EVENT_TAB_LABELS[tab]}
            <span className="ml-1.5 inline-flex min-w-[1.1rem] justify-center rounded-[var(--admin-radius)] bg-[var(--admin-border)] px-1 text-[10px] font-semibold text-[var(--admin-text-muted)]">
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </nav>

      {filteredEvents.length === 0 ? (
        <p className="py-6 text-center text-xs text-[var(--admin-text-dim)]">
          No {ORG_EVENT_TAB_LABELS[activeTab].toLowerCase()} events for this organization.
        </p>
      ) : (
        <AdminTable
          columns={['Title', 'Department', 'Status', 'Visibility', 'Date / time', 'Views', 'Saves', 'RSVPs', '']}
        >
          {filteredEvents.map((event) => {
            const metrics = getEventMetrics(event.id)
            return (
              <tr key={event.id}>
                <td>
                  <p className="font-medium">{event.title}</p>
                  <SeedApprovalBadge event={event} />
                </td>
                <td className="text-xs text-[var(--admin-text-muted)]">
                  {event.departmentName ?? 'General'}
                </td>
                <td>
                  <StatusBadge status={event.status} />
                </td>
                <td>
                  <AdminBadge tone="neutral">{event.visibility}</AdminBadge>
                </td>
                <td className="text-xs text-[var(--admin-text-muted)]">
                  {formatHostEventDateTime(event)}
                </td>
                <td className="admin-tabular">{metrics.views}</td>
                <td className="admin-tabular">{metrics.saves}</td>
                <td className="admin-tabular">{rsvpCount(event)}</td>
                <td>
                  <AdminRowMenu
                    items={[
                      { label: 'View', onClick: () => setSelectedId(event.id) },
                      ...seedApprovalMenuItems(
                        event,
                        () => {
                          approveSeedEvent(event.id)
                          reload()
                        },
                        () => {
                          if (window.confirm('Reject this seed event?')) {
                            rejectSeedEvent(event.id)
                            reload()
                          }
                        },
                      ),
                      {
                        label: 'Edit in registry',
                        onClick: () => {
                          window.location.href = `/admin/events?eventId=${encodeURIComponent(event.id)}`
                        },
                      },
                      ...(isHostEventPublished(event)
                        ? [
                            {
                              label: 'Unpublish',
                              onClick: () => {
                                unpublishHostEvent(event.id)
                                reload()
                              },
                            },
                          ]
                        : [
                            {
                              label: 'Publish',
                              onClick: () => handlePublish(event),
                            },
                          ]),
                    ]}
                  />
                </td>
              </tr>
            )
          })}
        </AdminTable>
      )}

      <AdminDrawer
        open={!!selected}
        title={selected?.title ?? 'Event detail'}
        onClose={() => setSelectedId(null)}
        footer={
          selected && (
            <div className="flex flex-wrap gap-2">
              {selected.visibility === 'public' && isHostEventPublished(selected) && (
                <Link to="/discover" className="admin-btn admin-btn-secondary no-underline">
                  View in deck
                </Link>
              )}
              {selected.visibility === 'private' && selected.shareToken && (
                <Link
                  to={`/e/${selected.shareToken}`}
                  className="admin-btn admin-btn-secondary no-underline"
                >
                  View private link
                </Link>
              )}
              {isHostEventPublished(selected) && (
                <AdminButton variant="secondary" onClick={() => openShare(selected)}>
                  Share
                </AdminButton>
              )}
              <Link
                to={`/admin/events?eventId=${encodeURIComponent(selected.id)}`}
                className="admin-btn admin-btn-primary no-underline"
              >
                Edit in registry
              </Link>
              {isHostEventPublished(selected) ? (
                <AdminButton
                  variant="secondary"
                  onClick={() => {
                    unpublishHostEvent(selected.id)
                    setSelectedId(null)
                    reload()
                  }}
                >
                  Unpublish
                </AdminButton>
              ) : (
                <AdminButton
                  variant="primary"
                  onClick={() => {
                    handlePublish(selected)
                  }}
                >
                  Publish
                </AdminButton>
              )}
            </div>
          )
        }
      >
        {selected && selectedMetrics && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Views" value={selectedMetrics.views} />
              <Metric label="Saves" value={selectedMetrics.saves} />
              <Metric label="RSVPs" value={rsvpCount(selected)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selected.status} />
              <AdminBadge tone="neutral">{selected.visibility}</AdminBadge>
              <AdminBadge tone="neutral">
                {ORG_EVENT_TAB_LABELS[getOrgEventListTab(selected)]}
              </AdminBadge>
            </div>
            <div>
              <p className="admin-label">Schedule</p>
              <p className="text-xs text-[var(--admin-text-muted)]">
                {formatHostEventDateTime(selected)}
              </p>
            </div>
            {selected.description && (
              <div>
                <p className="admin-label">Description</p>
                <p className="text-xs text-[var(--admin-text-muted)]">{selected.description}</p>
              </div>
            )}
          </div>
        )}
      </AdminDrawer>

      <SharePublishModal
        open={!!shareEvent}
        event={shareEvent}
        onClose={() => {
          setShareEvent(null)
          setSharePublishedJustNow(false)
        }}
        variant="admin"
        publishedJustNow={sharePublishedJustNow}
      />
    </AdminPanel>
  )
}

function StatusBadge({ status }: { status: HostEventStatus }) {
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
