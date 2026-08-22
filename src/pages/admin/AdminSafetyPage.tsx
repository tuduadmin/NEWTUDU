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
  AdminRowMenu,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  getSafetyIncidents,
  getSafetyStats,
  updateSafetyStatus,
  type SafetyIncident,
  type SafetyIncidentStatus,
  type SafetyIncidentType,
} from '../../lib/adminSafety'

const TYPE_LABELS: Record<SafetyIncidentType, string> = {
  harassment: 'Harassment',
  unsafe_venue: 'Unsafe venue',
  content_violation: 'Content violation',
  underage: 'Underage concern',
  other: 'Other',
}

const STATUS_LABELS: Record<SafetyIncidentStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
}

export default function AdminSafetyPage() {
  const [refresh, setRefresh] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | SafetyIncidentStatus>('all')
  const [selected, setSelected] = useState<SafetyIncident | null>(null)

  const stats = useMemo(() => getSafetyStats(), [refresh])

  const rows = useMemo(() => {
    let list = getSafetyIncidents()
    if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter)
    return list
  }, [statusFilter, refresh])

  function reload() {
    setRefresh((r) => r + 1)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Safety"
        subtitle="Community safety reports, moderation policies, and incident log."
      />

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong className="text-[var(--admin-text)]">Phase 1:</strong> Incident log in{' '}
          <code className="text-[var(--admin-text-dim)]">tudu-admin-safety-incidents</code> with links
          to{' '}
          <Link to="/admin/support" className="text-[var(--admin-accent)] no-underline hover:underline">
            Feedback & Reports
          </Link>
          .{' '}
          <strong className="text-[var(--admin-text)]">Phase 2:</strong> Escalation workflows, policy
          engine, and moderator assignment queues.
        </p>
      </AdminPanel>

      <AdminKpiGrid>
        <AdminKpi label="Open" value={stats.open} accent="rose" />
        <AdminKpi label="Investigating" value={stats.investigating} accent="amber" />
        <AdminKpi label="Closed" value={stats.resolved} accent="emerald" />
      </AdminKpiGrid>

      <AdminFilterBar>
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminTable columns={['Type', 'Reporter', 'Description', 'Status', 'Reported', '']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <AdminBadge tone={row.incidentType === 'harassment' ? 'rose' : 'neutral'}>
                {TYPE_LABELS[row.incidentType]}
              </AdminBadge>
            </td>
            <td className="text-[var(--admin-text-muted)]">{row.reporter}</td>
            <td>
              <p className="max-w-xs truncate">{row.description}</p>
              {row.linkedFeedbackId && (
                <Link
                  to="/admin/support"
                  className="text-[10px] text-[var(--admin-accent)] no-underline hover:underline"
                >
                  View feedback →
                </Link>
              )}
            </td>
            <td>
              <StatusBadge status={row.status} />
            </td>
            <td className="admin-tabular text-[var(--admin-text-muted)]">
              {new Date(row.createdAt).toLocaleDateString()}
            </td>
            <td>
              <AdminRowMenu
                items={[
                  { label: 'View details', onClick: () => setSelected(row) },
                  ...(row.status !== 'investigating'
                    ? [{ label: 'Mark investigating', onClick: () => { updateSafetyStatus(row.id, 'investigating'); reload() } }]
                    : []),
                  ...(row.status !== 'resolved'
                    ? [{ label: 'Mark resolved', onClick: () => { updateSafetyStatus(row.id, 'resolved'); reload() } }]
                    : []),
                  ...(row.status !== 'dismissed'
                    ? [{ label: 'Dismiss', onClick: () => { updateSafetyStatus(row.id, 'dismissed'); reload() }, danger: true }]
                    : []),
                ]}
              />
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminDrawer open={!!selected} title="Safety incident" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-3 text-xs">
            <p>
              <span className="admin-label">Type</span>
              <br />
              {TYPE_LABELS[selected.incidentType]}
            </p>
            <p>
              <span className="admin-label">Reporter</span>
              <br />
              {selected.reporter}
            </p>
            <p>
              <span className="admin-label">Description</span>
              <br />
              {selected.description}
            </p>
            <p>
              <span className="admin-label">Status</span>
              <br />
              <StatusBadge status={selected.status} />
            </p>
            {selected.linkedFeedbackId && (
              <p>
                <Link to="/admin/support" className="text-[var(--admin-accent)]">
                  Open linked feedback →
                </Link>
              </p>
            )}
            {selected.linkedEventId && (
              <p className="text-[var(--admin-text-muted)]">
                Linked event: <code>{selected.linkedEventId}</code>
              </p>
            )}
          </div>
        )}
      </AdminDrawer>
    </div>
  )
}

function StatusBadge({ status }: { status: SafetyIncidentStatus }) {
  const tone =
    status === 'open' ? 'rose' : status === 'investigating' ? 'amber' : status === 'resolved' ? 'emerald' : 'neutral'
  return <AdminBadge tone={tone}>{STATUS_LABELS[status]}</AdminBadge>
}
