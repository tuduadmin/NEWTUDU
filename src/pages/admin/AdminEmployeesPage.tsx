import { useMemo, useState } from 'react'
import {
  AdminBadge,
  AdminFilterBar,
  AdminInput,
  AdminKpi,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPanel,
  AdminRowMenu,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  getEmployees,
  getEmployeeStats,
  updateEmployeeStatus,
  type AdminEmployee,
  type EmployeeRole,
  type EmployeeStatus,
} from '../../lib/adminEmployees'

const ROLE_LABELS: Record<EmployeeRole, string> = {
  admin: 'Admin',
  support: 'Customer Support',
  moderator: 'Moderator',
}

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On leave',
}

export default function AdminEmployeesPage() {
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | EmployeeRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeStatus>('all')

  const stats = useMemo(() => getEmployeeStats(), [refresh])

  const rows = useMemo(() => {
    let list = getEmployees()
    if (roleFilter !== 'all') list = list.filter((e) => e.role === roleFilter)
    if (statusFilter !== 'all') list = list.filter((e) => e.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q),
      )
    }
    return list
  }, [roleFilter, statusFilter, search, refresh])

  function reload() {
    setRefresh((r) => r + 1)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Employees"
        subtitle="Internal TUDU / platform team roster, roles, and departments."
      />

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong className="text-[var(--admin-text)]">Phase 1:</strong> Demo roster in localStorage (
          <code className="text-[var(--admin-text-dim)]">tudu-admin-employees</code>). View and update
          status only.{' '}
          <strong className="text-[var(--admin-text)]">Phase 2:</strong> Supabase HR sync, SSO role
          mapping, and audit trail for access changes.
        </p>
      </AdminPanel>

      <AdminKpiGrid>
        <AdminKpi label="Team members" value={stats.total} accent="cyan" />
        <AdminKpi label="Active" value={stats.active} accent="emerald" />
        <AdminKpi label="Departments" value={stats.departments} accent="neutral" />
      </AdminKpiGrid>

      <AdminFilterBar>
        <AdminInput
          placeholder="Search name, email, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <AdminSelect
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="support">Customer Support</option>
          <option value="moderator">Moderator</option>
        </AdminSelect>
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="inactive">Inactive</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminTable columns={['Name', 'Role', 'Department', 'Status', 'Joined', '']}>
        {rows.map((row) => (
          <EmployeeRow key={row.id} employee={row} onStatusChange={reload} />
        ))}
      </AdminTable>

      {rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--admin-text-dim)]">No employees match filters.</p>
      )}
    </div>
  )
}

function EmployeeRow({
  employee,
  onStatusChange,
}: {
  employee: AdminEmployee
  onStatusChange: () => void
}) {
  const statusTone =
    employee.status === 'active' ? 'emerald' : employee.status === 'on_leave' ? 'amber' : 'neutral'
  const roleTone =
    employee.role === 'admin' ? 'cyan' : employee.role === 'moderator' ? 'rose' : 'neutral'

  return (
    <tr>
      <td>
        <p className="font-medium">{employee.name}</p>
        <p className="text-[11px] text-[var(--admin-text-dim)]">{employee.email}</p>
      </td>
      <td>
        <AdminBadge tone={roleTone}>{ROLE_LABELS[employee.role]}</AdminBadge>
      </td>
      <td>{employee.department}</td>
      <td>
        <AdminBadge tone={statusTone}>{STATUS_LABELS[employee.status]}</AdminBadge>
      </td>
      <td className="admin-tabular text-[var(--admin-text-muted)]">
        {new Date(employee.joinedAt).toLocaleDateString()}
      </td>
      <td>
        <AdminRowMenu
          items={[
            ...(employee.status !== 'active'
              ? [{ label: 'Mark active', onClick: () => { updateEmployeeStatus(employee.id, 'active'); onStatusChange() } }]
              : []),
            ...(employee.status !== 'on_leave'
              ? [{ label: 'Mark on leave', onClick: () => { updateEmployeeStatus(employee.id, 'on_leave'); onStatusChange() } }]
              : []),
            ...(employee.status !== 'inactive'
              ? [{ label: 'Mark inactive', onClick: () => { updateEmployeeStatus(employee.id, 'inactive'); onStatusChange() }, danger: true }]
              : []),
          ]}
        />
      </td>
    </tr>
  )
}
