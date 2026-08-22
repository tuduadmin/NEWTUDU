import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AdminBadge,
  AdminFilterBar,
  AdminKpi,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  getRewardEntries,
  getRewardStats,
  KUDOS_PER_BOOST,
  type RewardStatus,
  type RewardType,
} from '../../lib/adminRewards'

const TYPE_LABELS: Record<RewardType, string> = {
  boost: 'Event boost',
  merch: 'Merch',
  kudos: 'Kudos',
}

const STATUS_LABELS: Record<RewardStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function AdminRewardsPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | RewardType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | RewardStatus>('all')

  const stats = useMemo(() => getRewardStats(), [])

  const rows = useMemo(() => {
    let list = getRewardEntries()
    if (typeFilter !== 'all') list = list.filter((r) => r.rewardType === typeFilter)
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    return list
  }, [typeFilter, statusFilter])

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="TUDU Rewards"
        subtitle="Kudos/points ledger, redemptions, and boost tie-in."
      />

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong className="text-[var(--admin-text)]">Phase 1:</strong> Rewards ledger in{' '}
          <code className="text-[var(--admin-text-dim)]">tudu-admin-rewards</code>.{' '}
          <strong className="text-[var(--admin-accent)]">{KUDOS_PER_BOOST} kudos = 1 boost</strong>{' '}
          (host page stub — see{' '}
          <Link to="/host" className="text-[var(--admin-accent)] no-underline hover:underline">
            Event Manager
          </Link>
          ).{' '}
          <strong className="text-[var(--admin-text)]">Phase 2:</strong> Real-time kudos ledger synced
          with{' '}
          <code className="text-[var(--admin-text-dim)]">src/lib/kudos.ts</code> and boost purchases
          from{' '}
          <Link to="/admin/tiers" className="text-[var(--admin-accent)] no-underline hover:underline">
            Tiers
          </Link>
          .
        </p>
      </AdminPanel>

      <AdminKpiGrid>
        <AdminKpi label="Total redemptions" value={stats.totalRedemptions} accent="cyan" />
        <AdminKpi label="Pending" value={stats.pending} accent="amber" />
        <AdminKpi label="Kudos issued" value={stats.kudosIssued.toLocaleString()} accent="emerald" />
      </AdminKpiGrid>

      <AdminFilterBar>
        <AdminSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
        >
          <option value="all">All reward types</option>
          <option value="kudos">Kudos</option>
          <option value="boost">Boost</option>
          <option value="merch">Merch</option>
        </AdminSelect>
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminTable columns={['User', 'Type', 'Amount', 'Status', 'Date', 'Notes']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.userEmail}</td>
            <td>
              <TypeBadge type={row.rewardType} />
            </td>
            <td className="admin-tabular">
              {row.rewardType === 'kudos' ? `${row.amount} kudos` : row.amount}
            </td>
            <td>
              <StatusBadge status={row.status} />
            </td>
            <td className="admin-tabular text-[var(--admin-text-muted)]">
              {new Date(row.date).toLocaleDateString()}
            </td>
            <td className="max-w-[200px] truncate text-[11px] text-[var(--admin-text-dim)]">
              {row.notes ?? '—'}
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPanel className="mt-4">
        <p className="text-xs text-[var(--admin-text-muted)]">
          Related:{' '}
          <Link to="/admin/miles" className="text-[var(--admin-accent)]">
            TUDU Miles economy →
          </Link>{' '}
          ·{' '}
          <Link to="/admin/support" className="text-[var(--admin-accent)]">
            Safety feedback →
          </Link>
        </p>
      </AdminPanel>
    </div>
  )
}

function TypeBadge({ type }: { type: RewardType }) {
  const tone = type === 'boost' ? 'cyan' : type === 'kudos' ? 'emerald' : 'amber'
  return <AdminBadge tone={tone}>{TYPE_LABELS[type]}</AdminBadge>
}

function StatusBadge({ status }: { status: RewardStatus }) {
  const tone =
    status === 'completed' ? 'emerald' : status === 'pending' ? 'amber' : 'neutral'
  return <AdminBadge tone={tone}>{STATUS_LABELS[status]}</AdminBadge>
}
