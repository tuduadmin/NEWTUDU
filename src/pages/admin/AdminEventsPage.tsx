import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AdminBadge,
  AdminButton,
  AdminDrawer,
  AdminFilterBar,
  AdminInput,
  AdminManageButton,
  AdminPageHeader,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import { getEventMetrics } from '../../lib/adminAnalytics'
import { getDistantSavesForEvent } from '../../lib/distantSaves'
import { formatCityLabel } from '../../lib/location'
import {
  deleteHostEvent,
  getHostEventById,
  getHostEvents,
  getHostAccount,
  publishHostEvent,
  approveSeedEvent,
  getSeedApprovalStatus,
  getSeedQueueStage,
  isSeedEventInDiscoverDeck,
  rejectSeedEvent,
  type HostEvent,
  type HostEventStatus,
  type SeedApprovalStatus,
} from '../../lib/account'
import { SeedApprovalBadge } from '../../components/admin/SeedApprovalBadge'
import AdminEventModerationPanel from '../../components/admin/AdminEventModerationPanel'
import { getEventModeration, getDiscoverOnlyModerationRecords, getEventModerationRecords, recordMatchesModerationFilter, EVENT_MODERATION_CHANGED_EVENT, type EventModerationFilter } from '../../lib/adminEventModeration'
import AdminDiscoverPreviewLink from '../../components/admin/AdminDiscoverPreviewLink'
import { findDiscoverEventByTargetId, getDiscoverEventDeepLink } from '../../data/discoverEvents'
import SharePublishModal from '../../components/SharePublishModal'
import { isHostEventPublished } from '../../lib/hostEventSchedule'

type StatusFilter = 'all' | HostEventStatus
type SeedFilter = 'all' | SeedApprovalStatus | 'not_seeded'

function parseModerationFilter(raw: string | null): EventModerationFilter {
  if (raw === 'flagged' || raw === 'suspended' || raw === 'blocked' || raw === 'any') return raw
  return 'all'
}

type AdminEventsPageProps = {
  embedded?: boolean
}

export default function AdminEventsPage({ embedded = false }: AdminEventsPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const hostFilter = params.get('host') ?? ''
  const orgFilter = params.get('org') ?? ''
  const eventIdParam = params.get('eventId') ?? ''
  const discoverEventParam = params.get('discoverEvent') ?? ''
  const moderationFilter = parseModerationFilter(params.get('moderation'))
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [seedFilter, setSeedFilter] = useState<SeedFilter>('all')
  const [sort, setSort] = useState<'created' | 'views' | 'title'>('created')
  const [selectedId, setSelectedId] = useState<string | null>(eventIdParam || null)
  const [selectedDiscoverId, setSelectedDiscoverId] = useState<string | null>(
    discoverEventParam || null,
  )
  const [shareEvent, setShareEvent] = useState<HostEvent | null>(null)
  const [sharePublishedJustNow, setSharePublishedJustNow] = useState(false)

  useEffect(() => {
    if (eventIdParam) {
      setSelectedId(eventIdParam)
      setSelectedDiscoverId(null)
    }
  }, [eventIdParam])

  useEffect(() => {
    if (discoverEventParam) {
      setSelectedDiscoverId(discoverEventParam)
      setSelectedId(null)
    }
  }, [discoverEventParam])

  useEffect(() => {
    function onModerationChanged() {
      reload()
    }
    window.addEventListener(EVENT_MODERATION_CHANGED_EVENT, onModerationChanged)
    return () => window.removeEventListener(EVENT_MODERATION_CHANGED_EVENT, onModerationChanged)
  }, [])

  const events = useMemo(() => {
    let list = getHostEvents()

    if (hostFilter) {
      list = list.filter((e) => e.createdBy.toLowerCase() === hostFilter.toLowerCase())
    }

    if (orgFilter) {
      list = list.filter((e) => e.hostAccountId === orgFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.createdBy.toLowerCase().includes(q) ||
          (getHostAccount(e.hostAccountId ?? '')?.name.toLowerCase().includes(q) ?? false),
      )
    }

    if (statusFilter !== 'all') {
      list = list.filter((e) => e.status === statusFilter)
    }

    if (seedFilter === 'pending') {
      list = list.filter((e) => e.seededByAdmin && getSeedApprovalStatus(e) === 'pending')
    } else if (seedFilter === 'approved') {
      list = list.filter((e) => e.seededByAdmin && getSeedApprovalStatus(e) === 'approved')
    } else if (seedFilter === 'rejected') {
      list = list.filter((e) => e.seededByAdmin && getSeedApprovalStatus(e) === 'rejected')
    } else if (seedFilter === 'not_seeded') {
      list = list.filter((e) => !e.seededByAdmin)
    } else {
      // Default registry: host-created events + accepted seeds only (queue stays on Seed events tab)
      list = list.filter(
        (e) => !e.seededByAdmin || getSeedQueueStage(e) === 'accepted',
      )
    }

    if (moderationFilter !== 'all') {
      list = list.filter((event) => {
        const moderation = getEventModeration(event.id)
        if (!moderation) return false
        return recordMatchesModerationFilter(moderation, moderationFilter)
      })
    }

    list.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'views') {
        return getEventMetrics(b.id).views - getEventMetrics(a.id).views
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [hostFilter, orgFilter, search, statusFilter, seedFilter, sort, moderationFilter, refresh])

  const discoverModerationRows = useMemo(() => {
    void refresh
    let rows = getDiscoverOnlyModerationRecords()
    if (moderationFilter !== 'all') {
      rows = rows.filter((record) => recordMatchesModerationFilter(record, moderationFilter))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (record) =>
          (record.eventTitle ?? '').toLowerCase().includes(q) ||
          record.targetEventId.toLowerCase().includes(q) ||
          (record.discoverEventId ?? '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [moderationFilter, search, refresh])

  const moderatedHostCount = useMemo(() => {
    void refresh
    return getEventModerationRecords().filter((record) => Boolean(record.hostEventId)).length
  }, [refresh])

  const selected = selectedId ? getHostEventById(selectedId) : null
  const selectedDiscoverRecord = selectedDiscoverId
    ? discoverModerationRows.find(
        (record) =>
          record.targetEventId === selectedDiscoverId ||
          record.discoverEventId === selectedDiscoverId,
      ) ??
      getDiscoverOnlyModerationRecords().find(
        (record) =>
          record.targetEventId === selectedDiscoverId ||
          record.discoverEventId === selectedDiscoverId,
      ) ??
      null
    : null
  const selectedDiscoverEvent = selectedDiscoverRecord
    ? findDiscoverEventByTargetId(
        selectedDiscoverRecord.discoverEventId ?? selectedDiscoverRecord.targetEventId,
      )
    : undefined
  const selectedMetrics = selected ? getEventMetrics(selected.id) : null
  const distantSaves = selected ? getDistantSavesForEvent(selected.id) : []

  function reload() {
    setRefresh((r) => r + 1)
  }

  function handlePublish(eventId: string) {
    const result = publishHostEvent(eventId, { adminBypass: true })
    reload()
    if (result.ok && result.event) {
      setSharePublishedJustNow(true)
      setShareEvent(result.event)
    }
  }

  function openShare(event: HostEvent, publishedJustNow = false) {
    setSharePublishedJustNow(publishedJustNow)
    setShareEvent(event)
  }

  function rsvpCount(event: HostEvent): number {
    return (event.ticketTiers ?? []).reduce((s, t) => s + (t.sold ?? 0), 0)
  }

  function hostLabel(event: HostEvent): string {
    if (event.hostAccountId) {
      return getHostAccount(event.hostAccountId)?.name ?? 'Organization'
    }
    return event.displayName ?? event.createdBy
  }

  return (
    <div className={embedded ? undefined : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <AdminPageHeader
          title="Events Registry"
          subtitle={`${getHostEvents().length} host events · ${getDiscoverOnlyModerationRecords().length} discover card${getDiscoverOnlyModerationRecords().length === 1 ? '' : 's'} in moderation queue`}
        />
      )}

      {moderationFilter !== 'all' && (
        <p className="mb-3 text-xs text-[var(--admin-text-muted)]">
          Showing moderation filter: <strong className="text-[var(--admin-text)]">{moderationFilter}</strong>
          {' · '}
          <Link to="/admin/content" className="text-[var(--admin-accent)] no-underline hover:underline">
            Clear filter
          </Link>
        </p>
      )}

      <AdminFilterBar>
        <AdminInput
          placeholder="Search title or host…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="live">Published / live</option>
          <option value="upcoming">Upcoming</option>
          <option value="draft">Draft</option>
          <option value="past">Past / cancelled</option>
        </AdminSelect>
        <AdminSelect
          value={seedFilter}
          onChange={(e) => setSeedFilter(e.target.value as SeedFilter)}
        >
          <option value="all">All events</option>
          <option value="pending">Seeded · pending approval</option>
          <option value="approved">Seeded · approved</option>
          <option value="rejected">Seeded · rejected</option>
          <option value="not_seeded">Not seeded</option>
        </AdminSelect>
        <AdminSelect value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="created">Newest</option>
          <option value="views">Most views</option>
          <option value="title">Title A–Z</option>
        </AdminSelect>
        <AdminSelect
          value={moderationFilter}
          onChange={(e) => {
            const next = new URLSearchParams(params)
            const value = e.target.value as EventModerationFilter
            if (value === 'all') next.delete('moderation')
            else next.set('moderation', value)
            navigate(`/admin/content?${next.toString()}`, { replace: true })
          }}
        >
          <option value="all">All moderation</option>
          <option value="any">Any flagged action</option>
          <option value="flagged">Flagged only</option>
          <option value="suspended">Suspended only</option>
          <option value="blocked">Blocked only</option>
        </AdminSelect>
        {hostFilter && (
          <AdminBadge tone="cyan">Host: {hostFilter}</AdminBadge>
        )}
        {orgFilter && (
          <AdminBadge tone="cyan">
            Org: {getHostAccount(orgFilter)?.name ?? orgFilter}
          </AdminBadge>
        )}
      </AdminFilterBar>

      {discoverModerationRows.length > 0 && (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
            Discover cards (not in host registry)
          </p>
          <AdminTable
            columns={['Title', 'Card id', 'Moderation', 'Updated', 'Views']}
          >
            {discoverModerationRows.map((record) => {
              const card = findDiscoverEventByTargetId(
                record.discoverEventId ?? record.targetEventId,
              )
              const metricsId = record.discoverEventId ?? record.targetEventId
              const metrics = getEventMetrics(metricsId)
              return (
                <tr
                  key={record.targetEventId}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedDiscoverId(record.discoverEventId ?? record.targetEventId)
                    setSelectedId(null)
                  }}
                >
                  <td>
                    <p className="font-medium">{record.eventTitle ?? card?.title ?? 'Untitled event'}</p>
                    {card?.city && (
                      <p className="text-xs text-[var(--admin-text-dim)]">{card.city}</p>
                    )}
                  </td>
                  <td className="font-mono text-xs text-[var(--admin-text-dim)]">
                    {record.discoverEventId ?? record.targetEventId}
                  </td>
                  <td>
                    <AdminBadge
                      tone={
                        record.status === 'blocked'
                          ? 'rose'
                          : record.status === 'suspended'
                            ? 'amber'
                            : 'cyan'
                      }
                    >
                      {record.status}
                    </AdminBadge>
                  </td>
                  <td className="admin-tabular text-xs text-[var(--admin-text-muted)]">
                    {new Date(record.updatedAt).toLocaleString()}
                  </td>
                  <td className="admin-tabular text-xs text-[var(--admin-text-dim)]">
                    {metrics.views} views
                  </td>
                </tr>
              )
            })}
          </AdminTable>
        </>
      )}

      {moderationFilter !== 'all' && discoverModerationRows.length === 0 && events.length === 0 && (
        <p className="mb-4 rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-4 py-6 text-center text-sm text-[var(--admin-text-muted)]">
          No events match this moderation filter.
        </p>
      )}

      {(moderationFilter === 'all' || events.length > 0 || moderatedHostCount > 0) && (
        <>
          {discoverModerationRows.length > 0 && (
            <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
              Host registry events
            </p>
          )}
      <AdminTable
        columns={['Title', 'Host', 'Status', 'Visibility', 'Views', 'Saves', 'RSVPs', 'Created', '']}
      >
        {events.map((event) => {
          const metrics = getEventMetrics(event.id)
          const moderation = getEventModeration(event.id)
          return (
            <tr
              key={event.id}
              className="cursor-pointer"
              onClick={() => {
                setSelectedId(event.id)
                setSelectedDiscoverId(null)
              }}
            >
              <td>
                <p className="font-medium">{event.title}</p>
                <SeedApprovalBadge event={event} />
                {moderation && (
                  <span className="ml-1 inline-flex">
                    <AdminBadge tone="rose">{moderation.status}</AdminBadge>
                  </span>
                )}
              </td>
              <td className="text-[var(--admin-text-muted)]">{hostLabel(event)}</td>
              <td>
                <StatusBadge status={event.status} />
              </td>
              <td>
                <AdminBadge tone="neutral">{event.visibility}</AdminBadge>
              </td>
              <td className="admin-tabular">{metrics.views}</td>
              <td className="admin-tabular">{metrics.saves}</td>
              <td className="admin-tabular">{rsvpCount(event)}</td>
              <td className="admin-tabular text-[var(--admin-text-muted)]">
                {new Date(event.createdAt).toLocaleDateString()}
              </td>
              <td className="text-right" onClick={(e) => e.stopPropagation()}>
                <AdminManageButton
                  onClick={() => {
                    setSelectedId(event.id)
                    setSelectedDiscoverId(null)
                  }}
                />
              </td>
            </tr>
          )
        })}
      </AdminTable>
        </>
      )}

      <AdminDrawer
        open={!!selectedDiscoverRecord}
        title={selectedDiscoverRecord?.eventTitle ?? selectedDiscoverEvent?.title ?? 'Discover card'}
        onClose={() => setSelectedDiscoverId(null)}
        centered
      >
        {selectedDiscoverRecord && (
          <div className="space-y-6 text-sm">
            <div className="flex flex-wrap gap-2">
              <AdminBadge tone="neutral">Discover card</AdminBadge>
              <AdminBadge tone="cyan">{selectedDiscoverRecord.status}</AdminBadge>
            </div>
            <div>
              <p className="admin-label">Card id</p>
              <p className="font-mono text-xs">
                {selectedDiscoverRecord.discoverEventId ?? selectedDiscoverRecord.targetEventId}
              </p>
            </div>
            {selectedDiscoverEvent && (
              <>
                <div>
                  <p className="admin-label">Location</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">
                    {[selectedDiscoverEvent.venueName, selectedDiscoverEvent.city]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {selectedDiscoverEvent.description && (
                  <div>
                    <p className="admin-label">Description</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      {selectedDiscoverEvent.description}
                    </p>
                  </div>
                )}
                <AdminDiscoverPreviewLink
                  href={getDiscoverEventDeepLink(selectedDiscoverEvent, {
                    adminReturnTo: `${window.location.pathname}${window.location.search}`,
                  })}
                  variant="secondary"
                />
              </>
            )}
            <AdminEventModerationPanel
              targetEventId={
                selectedDiscoverRecord.discoverEventId ?? selectedDiscoverRecord.targetEventId
              }
              eventTitle={selectedDiscoverRecord.eventTitle ?? selectedDiscoverEvent?.title}
              linkedFeedbackId={selectedDiscoverRecord.linkedFeedbackIds?.[0]}
              onChanged={reload}
            />
          </div>
        )}
      </AdminDrawer>

      <AdminDrawer
        open={!!selected}
        title={selected?.title ?? 'Event detail'}
        onClose={() => setSelectedId(null)}
        centered
        wide
        footer={
          selected && (
            <div className="flex flex-wrap gap-3">
              {selected.visibility === 'public' && (
                <Link
                  to="/discover"
                  className="admin-btn admin-btn-secondary no-underline"
                >
                  View page
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
              {selected.status !== 'live' && selected.visibility === 'public' && (
                <AdminButton variant="secondary" onClick={() => handlePublish(selected.id)}>
                  Publish live
                </AdminButton>
              )}
              <AdminButton
                variant="primary"
                onClick={() => navigate('/admin/content?view=seed-events')}
              >
                Edit info
              </AdminButton>
              <AdminButton
                variant="danger"
                onClick={() => {
                  if (selected && window.confirm('Delete event?')) {
                    deleteHostEvent(selected.id)
                    setSelectedId(null)
                    reload()
                  }
                }}
              >
                Delete event
              </AdminButton>
            </div>
          )
        }
      >
        {selected && selectedMetrics && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Views" value={selectedMetrics.views} />
              <Metric label="Saves" value={selectedMetrics.saves} />
              <Metric label="RSVPs" value={rsvpCount(selected)} />
            </div>
            <div>
              <p className="admin-label">Host</p>
              <p>{hostLabel(selected)}</p>
              <p className="text-xs text-[var(--admin-text-muted)]">{selected.createdBy}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selected.status} />
              <AdminBadge tone="neutral">{selected.visibility}</AdminBadge>
              <SeedApprovalBadge event={selected} />
            </div>
            {selected.seededByAdmin && getSeedApprovalStatus(selected) === 'pending' && (
              <div className="flex flex-wrap gap-2">
                <AdminButton
                  variant="primary"
                  onClick={() => {
                    const result = approveSeedEvent(selected.id)
                    reload()
                    if (result.ok && result.event && isSeedEventInDiscoverDeck(result.event)) {
                      openShare(result.event, true)
                    }
                  }}
                >
                  Approve seed
                </AdminButton>
                <AdminButton
                  variant="danger"
                  onClick={() => {
                    if (window.confirm('Reject this seed event?')) {
                      rejectSeedEvent(selected.id)
                      reload()
                    }
                  }}
                >
                  Reject seed
                </AdminButton>
              </div>
            )}
            {selected.description && (
              <div>
                <p className="admin-label">Description</p>
                <p className="text-xs text-[var(--admin-text-muted)]">{selected.description}</p>
              </div>
            )}
            <div>
              <p className="admin-label">Created</p>
              <p className="admin-tabular text-xs">
                {new Date(selected.createdAt).toLocaleString()}
              </p>
            </div>

            <AdminEventModerationPanel
              targetEventId={selected.id}
              eventTitle={selected.title}
              hostEventId={selected.id}
              onChanged={reload}
            />

            {selected.promoCode && (
              <div>
                <p className="admin-label">Promo code</p>
                <p className="font-mono text-xs text-[var(--admin-accent)]">{selected.promoCode}</p>
              </div>
            )}

            <div>
              <p className="admin-label">Saves from outside area ({distantSaves.length})</p>
              {distantSaves.length === 0 ? (
                <p className="text-xs text-[var(--admin-text-dim)]">
                  No distant bucket-list saves yet. Saves are recorded when a user&apos;s home city differs from the event city.
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {distantSaves.slice(0, 10).map((save) => (
                    <li
                      key={save.id}
                      className="flex justify-between border-b border-[var(--admin-border-subtle)] py-1 text-xs last:border-0"
                    >
                      <span>
                        {formatCityLabel(save.saverCity)} → {formatCityLabel(save.eventCity)}
                      </span>
                      <span className="text-[var(--admin-text-dim)]">{save.userEmail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
    </div>
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
