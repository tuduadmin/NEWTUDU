import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AdminBadge,
  AdminDrawer,
  AdminFilterBar,
  AdminKpi,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  getSecurityEvents,
  getSecurityStats,
  type SecurityEvent,
  type SecurityEventType,
  type SecuritySeverity,
} from '../../lib/adminSecurity'

const EVENT_LABELS: Record<SecurityEventType, string> = {
  failed_login: 'Failed login',
  ban: 'Account ban',
  suspicious: 'Suspicious activity',
  api_key: 'API key',
}

export default function AdminSecurityPage() {
  const [severityFilter, setSeverityFilter] = useState<'all' | SecuritySeverity>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | SecurityEventType>('all')
  const [selected, setSelected] = useState<SecurityEvent | null>(null)

  const stats = useMemo(() => getSecurityStats(), [])

  const rows = useMemo(() => {
    let list = getSecurityEvents()
    if (severityFilter !== 'all') list = list.filter((e) => e.severity === severityFilter)
    if (typeFilter !== 'all') list = list.filter((e) => e.eventType === typeFilter)
    return list
  }, [severityFilter, typeFilter])

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Security"
        subtitle="Auth logs, suspicious activity, account locks, and API key stubs."
      />

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong className="text-[var(--admin-text)]">Phase 1:</strong> Demo security events in{' '}
          <code className="text-[var(--admin-text-dim)]">tudu-admin-security-events</code>. Account
          bans link to{' '}
          <Link to="/admin/people?view=users" className="text-[var(--admin-accent)] no-underline hover:underline">
            Users
          </Link>
          .{' '}
          <strong className="text-[var(--admin-text)]">Phase 2:</strong> Supabase auth logs, rate-limit
          alerts, and managed API keys with rotation.
        </p>
      </AdminPanel>

      <AdminKpiGrid>
        <AdminKpi label="Events logged" value={stats.total} accent="neutral" />
        <AdminKpi label="High / critical" value={stats.critical} accent="rose" />
        <AdminKpi label="Last 24 hours" value={stats.last24h} accent="amber" />
      </AdminKpiGrid>

      <AdminFilterBar>
        <AdminSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
        >
          <option value="all">All event types</option>
          <option value="failed_login">Failed login</option>
          <option value="suspicious">Suspicious</option>
          <option value="ban">Ban</option>
          <option value="api_key">API key</option>
        </AdminSelect>
        <AdminSelect
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
        >
          <option value="all">All severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminTable columns={['Ticket', 'Event', 'User', 'Severity', 'Timestamp', '']}>
        {rows.map((row) => (
          <tr key={row.id} className="cursor-pointer" onClick={() => setSelected(row)}>
            <td className="admin-tabular text-xs font-medium text-[var(--admin-accent)]">
              {row.ticketNumber}
            </td>
            <td>
              <AdminBadge tone={row.eventType === 'ban' ? 'rose' : 'neutral'}>
                {EVENT_LABELS[row.eventType]}
              </AdminBadge>
            </td>
            <td>
              <p className="font-medium">{row.user}</p>
              {row.details && (
                <p className="max-w-xs truncate text-[11px] text-[var(--admin-text-dim)]">
                  {row.details}
                </p>
              )}
            </td>
            <td>
              <SeverityBadge severity={row.severity} />
            </td>
            <td className="admin-tabular text-[var(--admin-text-muted)]">
              {new Date(row.timestamp).toLocaleString()}
            </td>
            <td>
              <button
                type="button"
                className="admin-btn admin-btn-ghost text-[10px]"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(row)
                }}
              >
                Details
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminDrawer
        open={!!selected}
        title="Security event"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <dl className="space-y-3 text-xs">
            <DetailRow label="Ticket" value={selected.ticketNumber} />
            <DetailRow label="Type" value={EVENT_LABELS[selected.eventType]} />
            <DetailRow label="User" value={selected.user} />
            <DetailRow label="Severity" value={selected.severity} />
            <DetailRow label="Timestamp" value={new Date(selected.timestamp).toLocaleString()} />
            <DetailRow label="Details" value={selected.details ?? '—'} />
            {selected.eventType === 'ban' && (
              <p className="pt-2 text-[var(--admin-text-muted)]">
                Manage platform bans on{' '}
                <Link to="/admin/people?view=users" className="text-[var(--admin-accent)]">
                  Users →
                </Link>
              </p>
            )}
          </dl>
        )}
      </AdminDrawer>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: SecuritySeverity }) {
  const tone =
    severity === 'critical' || severity === 'high'
      ? 'rose'
      : severity === 'medium'
        ? 'amber'
        : 'neutral'
  return <AdminBadge tone={tone}>{severity}</AdminBadge>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="admin-label">{label}</dt>
      <dd className="mt-0.5 text-[var(--admin-text)]">{value}</dd>
    </div>
  )
}
