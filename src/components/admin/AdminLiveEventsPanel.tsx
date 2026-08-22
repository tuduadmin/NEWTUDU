import { useMemo, useState } from 'react'
import {
  AdminBadge,
  AdminButton,
  AdminFilterBar,
  AdminKpi,
  AdminKpiGrid,
  AdminPanel,
  AdminTable,
} from './AdminUI'
import { getEventMetrics } from '../../lib/adminAnalytics'
import { eventMatchesFilters, type AnalyticsFilters } from '../../lib/analyticsGeo'
import { getHostAccount, type HostEvent } from '../../lib/account'
import { getAllUsers } from '../../lib/auth'
import {
  formatHostEventDateTime,
  getEventStartDate,
  getLiveHostEvents,
} from '../../lib/hostEventSchedule'

type HostTypeFilter = 'all' | 'personal' | 'organization'

function isOrgEvent(event: HostEvent): boolean {
  return Boolean(event.hostAccountId)
}

function hostLabel(event: HostEvent): string {
  if (event.hostAccountId) {
    return getHostAccount(event.hostAccountId)?.name ?? 'Organization'
  }
  if (event.displayName?.trim()) return event.displayName.trim()
  const user = getAllUsers().find(
    (u) => u.email.toLowerCase() === event.createdBy.toLowerCase(),
  )
  if (user) return `${user.firstName} ${user.lastName}`.trim()
  return event.createdBy
}

function liveSinceLabel(event: HostEvent): string {
  const start = getEventStartDate(event)
  if (!start) return formatHostEventDateTime(event)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  if (diffMs < 0) return formatHostEventDateTime(event)
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins}m ago · ${formatHostEventDateTime(event)}`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago · ${formatHostEventDateTime(event)}`
  return formatHostEventDateTime(event)
}

type AdminLiveEventsPanelProps = {
  refreshKey?: number
  filters?: AnalyticsFilters
}

export default function AdminLiveEventsPanel({ refreshKey = 0, filters = {} }: AdminLiveEventsPanelProps) {
  const [hostFilter, setHostFilter] = useState<HostTypeFilter>('all')

  const liveEvents = useMemo(() => {
    void refreshKey
    return getLiveHostEvents().sort((a, b) => {
      const aStart = getEventStartDate(a)?.getTime() ?? 0
      const bStart = getEventStartDate(b)?.getTime() ?? 0
      return bStart - aStart
    })
  }, [refreshKey])

  const filteredEvents = useMemo(() => {
    let list = liveEvents
    if (hostFilter === 'personal') {
      list = list.filter((event) => !isOrgEvent(event))
    } else if (hostFilter === 'organization') {
      list = list.filter((event) => isOrgEvent(event))
    }
    return list.filter((event) => eventMatchesFilters(event, filters))
  }, [liveEvents, hostFilter, filters])

  const geoFilteredLive = useMemo(
    () => liveEvents.filter((event) => eventMatchesFilters(event, filters)),
    [liveEvents, filters],
  )

  const personalCount = geoFilteredLive.filter((event) => !isOrgEvent(event)).length
  const orgCount = geoFilteredLive.filter((event) => isOrgEvent(event)).length

  return (
    <>
      <div className="mb-4">
        <AdminKpiGrid>
          <AdminKpi label="Live events now" value={geoFilteredLive.length} accent="emerald" />
          <AdminKpi label="Personal" value={personalCount} accent="cyan" />
          <AdminKpi label="Organization" value={orgCount} accent="amber" />
        </AdminKpiGrid>
      </div>

      <AdminFilterBar>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-text-dim)]">
          Host type
        </span>
        {(
          [
            ['all', 'All'],
            ['personal', 'Personal'],
            ['organization', 'Organization'],
          ] as const
        ).map(([value, label]) => (
          <AdminButton
            key={value}
            variant={hostFilter === value ? 'primary' : 'secondary'}
            onClick={() => setHostFilter(value)}
          >
            {label}
          </AdminButton>
        ))}
      </AdminFilterBar>

      <AdminPanel>
        {filteredEvents.length === 0 ? (
          <p className="text-xs text-[var(--admin-text-dim)]">
            No live events right now
            {hostFilter !== 'all' ? ` for ${hostFilter} hosts` : ''}.
          </p>
        ) : (
          <AdminTable
            columns={['Event', 'Host', 'Type', 'Live since', 'Visibility', 'Views']}
          >
            {filteredEvents.map((event) => {
              const metrics = getEventMetrics(event.id)
              const org = isOrgEvent(event)
              return (
                <tr key={event.id}>
                  <td>
                    <p className="font-medium text-[var(--admin-text)]">{event.title}</p>
                    {event.city && (
                      <p className="text-[11px] text-[var(--admin-text-dim)]">{event.city}</p>
                    )}
                  </td>
                  <td>{hostLabel(event)}</td>
                  <td>
                    <AdminBadge tone={org ? 'amber' : 'cyan'}>
                      {org ? 'Organization' : 'Personal'}
                    </AdminBadge>
                  </td>
                  <td className="text-xs text-[var(--admin-text-muted)]">
                    {liveSinceLabel(event)}
                  </td>
                  <td>
                    <AdminBadge tone={event.visibility === 'public' ? 'emerald' : 'neutral'}>
                      {event.visibility}
                    </AdminBadge>
                  </td>
                  <td className="admin-tabular">{metrics.views}</td>
                </tr>
              )
            })}
          </AdminTable>
        )}
      </AdminPanel>
    </>
  )
}
