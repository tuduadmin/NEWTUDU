import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AdminBadge,
  AdminButton,
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
  ADMIN_EMPLOYEES_CHANGED_EVENT,
  getEmployees,
  getEmployeeStats,
  updateEmployeeStatus,
  type AdminEmployee,
  type EmployeeRole,
  type EmployeeStatus,
} from '../../lib/adminEmployees'
import { getCurrentUser, isPlatformAdmin } from '../../lib/auth'
import { createControlRoomEmployee } from '../../lib/controlRoomEmployees'
import { isPlatformOwner } from '../../lib/controlRoomAccess'
import { controlRoomSignInUrl } from '../../lib/controlRoomWelcomeEmail'
import { getControlRoomSignInPath } from '../../lib/controlRoomRoutes'

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
  const canCreateEmployees = isPlatformAdmin()

  useEffect(() => {
    function reload() {
      setRefresh((r) => r + 1)
    }
    window.addEventListener(ADMIN_EMPLOYEES_CHANGED_EVENT, reload)
    return () => window.removeEventListener(ADMIN_EMPLOYEES_CHANGED_EVENT, reload)
  }, [])

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

      {canCreateEmployees && (
        <AddEmployeePanel
          onCreated={() => setRefresh((r) => r + 1)}
        />
      )}

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Staff sign-in is <strong className="text-[var(--admin-text)]">not linked</strong> from the public
          site. Share the private URL only by email:{' '}
          <code className="text-[var(--admin-text-dim)]">{controlRoomSignInUrl()}</code> (path{' '}
          <code className="text-[var(--admin-text-dim)]">{getControlRoomSignInPath()}</code>). Set{' '}
          <code className="text-[var(--admin-text-dim)]">VITE_CONTROL_ROOM_SIGN_IN_PATH</code> in production
          to a non-obvious path so <code className="text-[var(--admin-text-dim)]">/admin/signin</code> is not
          used. New hires get that link in their welcome email (Phase 1: stub — Support → Messages).
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

function AddEmployeePanel({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<EmployeeRole>('support')
  const [department, setDepartment] = useState('')
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setRole('support')
    setDepartment('')
    setSendWelcomeEmail(true)
    setError('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const ownerEmail = getCurrentUser()?.email
    if (!ownerEmail) {
      setError('You must be signed in as the platform owner.')
      return
    }

    const result = createControlRoomEmployee(
      {
        firstName,
        lastName,
        email,
        password,
        role,
        department,
        sendWelcomeEmail,
        signInUrl: controlRoomSignInUrl(),
      },
      ownerEmail,
    )
    if (!result.ok) {
      setError(result.error ?? 'Could not create employee.')
      return
    }

    resetForm()
    const signIn = controlRoomSignInUrl()
    if (result.welcomeEmailSent) {
      setSuccess(
        `${result.employee?.name ?? 'Employee'} was added. Welcome email queued to ${email.trim().toLowerCase()} with sign-in link (${signIn}) and temporary password.`,
      )
    } else {
      setSuccess(`${result.employee?.name ?? 'Employee'} was added. Share sign-in manually: ${signIn}`)
    }
    onCreated()
  }

  if (!open) {
    return (
      <AdminPanel className="mb-4">
        <AdminButton type="button" variant="primary" onClick={() => setOpen(true)}>
          Add Control Room employee
        </AdminButton>
      </AdminPanel>
    )
  }

  return (
    <AdminPanel className="mb-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">New employee account</h2>
        <AdminButton
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false)
            resetForm()
            setSuccess('')
          }}
        >
          Cancel
        </AdminButton>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className="admin-label">First name</span>
          <AdminInput
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="admin-label">Last name</span>
          <AdminInput
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="admin-label">Work email</span>
          <AdminInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="admin-label">Initial password</span>
          <AdminInput
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full"
          />
          <p className="mt-1 text-[10px] text-[var(--admin-text-dim)]">At least 8 characters.</p>
        </label>
        <label className="block sm:col-span-1">
          <span className="admin-label">Role</span>
          <AdminSelect
            value={role}
            onChange={(e) => setRole(e.target.value as EmployeeRole)}
            className="mt-1 w-full"
          >
            <option value="admin">Admin</option>
            <option value="support">Customer Support</option>
            <option value="moderator">Moderator</option>
          </AdminSelect>
        </label>
        <label className="block sm:col-span-1">
          <span className="admin-label">Department</span>
          <AdminInput
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Support"
            required
            className="mt-1 w-full"
          />
        </label>
        <label className="flex cursor-pointer items-start gap-2 sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={sendWelcomeEmail}
            onChange={(e) => setSendWelcomeEmail(e.target.checked)}
          />
          <span className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
            Email initial login to their work address (sign-in URL, email, and temporary password). In
            production this will use your transactional email provider; today it is logged in Control
            Room → Support → Messages.
          </span>
        </label>
        {error && (
          <p className="sm:col-span-2 text-xs text-[var(--admin-danger)]" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="sm:col-span-2 text-xs text-[var(--admin-accent)]" role="status">
            {success}
          </p>
        )}
        <div className="sm:col-span-2">
          <AdminButton type="submit" variant="primary">
            {sendWelcomeEmail ? 'Create account & send login email' : 'Create account & add to roster'}
          </AdminButton>
        </div>
      </form>
    </AdminPanel>
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
            ...(employee.status !== 'on_leave' && !isPlatformOwner(employee.email)
              ? [{ label: 'Mark on leave', onClick: () => { updateEmployeeStatus(employee.id, 'on_leave'); onStatusChange() } }]
              : []),
            ...(employee.status !== 'inactive' && !isPlatformOwner(employee.email)
              ? [{ label: 'Mark inactive', onClick: () => { updateEmployeeStatus(employee.id, 'inactive'); onStatusChange() }, danger: true }]
              : []),
          ]}
        />
      </td>
    </tr>
  )
}
