import { useMemo, useState } from 'react'
import {
  AdminBadge,
  AdminConfirmDialog,
  AdminFilterBar,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminRowMenu,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import { logActivity } from '../../lib/adminAnalytics'
import {
  adminRemoveMemberFromOrg,
  getOrganization,
  getOrganizations,
  getOrgMembers,
  ORG_ROLES,
  transferOwnership,
  type OrgRole,
} from '../../lib/account'
import { getAllUsers, PLATFORM_ADMIN } from '../../lib/auth'

export default function AdminTeamAccessPage() {
  const [refresh, setRefresh] = useState(0)
  const [orgFilter, setOrgFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<{
    orgId: string
    orgName: string
    memberEmail: string
    memberRole: OrgRole
  } | null>(null)
  const [transferStub, setTransferStub] = useState<{
    orgId: string
    orgName: string
    fromEmail: string
  } | null>(null)

  const orgs = useMemo(() => getOrganizations(), [refresh])

  const rows = useMemo(() => {
    const members = getOrgMembers()
    let list = members.map((m) => {
      const org = getOrganization(m.orgId)
      const user = getAllUsers().find((u) => u.email.toLowerCase() === m.email.toLowerCase())
      return {
        ...m,
        orgName: org?.name ?? m.orgId,
        userName: user ? `${user.firstName} ${user.lastName}`.trim() : m.email,
      }
    })

    if (orgFilter !== 'all') {
      list = list.filter((m) => m.orgId === orgFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.email.toLowerCase().includes(q) ||
          m.orgName.toLowerCase().includes(q) ||
          m.userName.toLowerCase().includes(q),
      )
    }

    return list.sort((a, b) => a.orgName.localeCompare(b.orgName))
  }, [orgFilter, search, refresh])

  function reload() {
    setRefresh((r) => r + 1)
  }

  function handleRemove() {
    if (!confirm) return
    const admin = PLATFORM_ADMIN.email
    const result = adminRemoveMemberFromOrg(confirm.orgId, confirm.memberEmail, admin)
    if (result.ok) {
      logActivity({
        type: 'access_change',
        label: `Removed ${confirm.memberEmail} from ${confirm.orgName}`,
        meta: {
          orgId: confirm.orgId,
          memberEmail: confirm.memberEmail,
          action: 'org_remove',
        },
      })
    }
    setConfirm(null)
    reload()
  }

  function handleTransferStub() {
    if (!transferStub) return
    const admins = getOrgMembers(transferStub.orgId).filter((m) => m.role === 'admin')
    const target = admins[0]
    if (target) {
      transferOwnership(transferStub.orgId, transferStub.fromEmail, target.email)
      logActivity({
        type: 'access_change',
        label: `Ownership transfer stub: ${transferStub.orgName} → ${target.email}`,
        meta: { orgId: transferStub.orgId, action: 'ownership_transfer_stub' },
      })
    }
    setTransferStub(null)
    reload()
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Team & Access"
        subtitle="Org memberships, roles, and access changes. Removing a user from an org keeps their personal account."
      />

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong className="text-[var(--admin-text)]">Org removal</strong> revokes host access for that
          organization only — the user keeps their TUDU account and personal events.{' '}
          <strong className="text-[var(--admin-text)]">Platform ban</strong> is managed on the Users page.
        </p>
      </AdminPanel>

      <AdminFilterBar>
        <AdminInput
          placeholder="Search user or org…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <AdminSelect
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          aria-label="Filter by organization"
        >
          <option value="all">All organizations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </AdminSelect>
      </AdminFilterBar>

      <AdminTable columns={['User', 'Organization', 'Role', 'Joined', '']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-medium">{row.userName}</p>
              <p className="text-[11px] text-[var(--admin-text-dim)]">{row.email}</p>
            </td>
            <td>
              <p>{row.orgName}</p>
              <p className="text-[10px] text-[var(--admin-text-dim)]">{row.orgId}</p>
            </td>
            <td>
              <RoleBadge role={row.role} />
              {row.isBackupAdmin && <AdminBadge tone="cyan">Backup</AdminBadge>}
            </td>
            <td className="admin-tabular text-[var(--admin-text-muted)]">
              {new Date(row.joinedAt).toLocaleDateString()}
            </td>
            <td>
              <AdminRowMenu
                items={[
                  ...(row.role === 'owner'
                    ? [
                        {
                          label: 'Transfer ownership (stub)',
                          onClick: () =>
                            setTransferStub({
                              orgId: row.orgId,
                              orgName: row.orgName,
                              fromEmail: row.email,
                            }),
                        },
                      ]
                    : []),
                  {
                    label: 'Remove from org',
                    onClick: () =>
                      setConfirm({
                        orgId: row.orgId,
                        orgName: row.orgName,
                        memberEmail: row.email,
                        memberRole: row.role,
                      }),
                    danger: true,
                  },
                ]}
              />
            </td>
          </tr>
        ))}
      </AdminTable>

      {rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--admin-text-dim)]">No team memberships found.</p>
      )}

      <AdminConfirmDialog
        open={!!confirm}
        title="Remove from organization"
        message={
          confirm
            ? `Remove ${confirm.memberEmail} from ${confirm.orgName}? They will lose host access to this org but keep their personal TUDU account.`
            : ''
        }
        confirmLabel="Remove from org"
        onConfirm={handleRemove}
        onCancel={() => setConfirm(null)}
      />

      <AdminConfirmDialog
        open={!!transferStub}
        title="Transfer ownership (demo stub)"
        message={
          transferStub
            ? `Demo stub: transfer ownership of ${transferStub.orgName} to the first Admin on the team. Production would use a formal handoff flow.`
            : ''
        }
        confirmLabel="Run stub transfer"
        variant="primary"
        onConfirm={handleTransferStub}
        onCancel={() => setTransferStub(null)}
      />
    </div>
  )
}

function RoleBadge({ role }: { role: OrgRole }) {
  const label = ORG_ROLES.find((r) => r.id === role)?.label ?? role
  const tone =
    role === 'owner' ? 'emerald' : role === 'admin' ? 'cyan' : role === 'staff' ? 'amber' : 'neutral'
  return <AdminBadge tone={tone}>{label}</AdminBadge>
}
