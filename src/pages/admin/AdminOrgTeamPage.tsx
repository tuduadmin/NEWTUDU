import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  AdminBadge,
  AdminConfirmDialog,
  AdminInput,
  AdminPanel,
  AdminRowMenu,
  AdminTable,
} from '../../components/admin/AdminUI'
import { logActivity } from '../../lib/adminAnalytics'
import {
  adminRemoveMemberFromOrg,
  getOrganization,
  getOrgMembers,
  ORG_ROLES,
  transferOwnership,
  type OrgRole,
} from '../../lib/account'
import { getAllUsers, PLATFORM_ADMIN } from '../../lib/auth'

export default function AdminOrgTeamPage() {
  const { orgId = '' } = useParams()
  const org = getOrganization(orgId)
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<{
    memberEmail: string
    memberRole: OrgRole
  } | null>(null)
  const [transferStub, setTransferStub] = useState<{ fromEmail: string } | null>(null)

  const rows = useMemo(() => {
    let list = getOrgMembers(orgId).map((m) => {
      const user = getAllUsers().find((u) => u.email.toLowerCase() === m.email.toLowerCase())
      return {
        ...m,
        userName: user ? `${user.firstName} ${user.lastName}`.trim() : m.email,
      }
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.email.toLowerCase().includes(q) ||
          m.userName.toLowerCase().includes(q),
      )
    }

    return list.sort((a, b) => {
      const order: Record<OrgRole, number> = { owner: 0, admin: 1, staff: 2, viewer: 3 }
      return order[a.role] - order[b.role]
    })
  }, [orgId, search, refresh])

  if (!org) return null

  function reload() {
    setRefresh((r) => r + 1)
  }

  function handleRemove() {
    if (!confirm || !org) return
    const result = adminRemoveMemberFromOrg(orgId, confirm.memberEmail, PLATFORM_ADMIN.email)
    if (result.ok) {
      logActivity({
        type: 'access_change',
        label: `Removed ${confirm.memberEmail} from ${org.name}`,
        meta: { orgId, memberEmail: confirm.memberEmail, action: 'org_remove' },
      })
    }
    setConfirm(null)
    reload()
  }

  function handleTransferStub() {
    if (!transferStub || !org) return
    const admins = getOrgMembers(orgId).filter((m) => m.role === 'admin')
    const target = admins[0]
    if (target) {
      transferOwnership(orgId, transferStub.fromEmail, target.email)
      logActivity({
        type: 'access_change',
        label: `Ownership transfer stub: ${org.name} → ${target.email}`,
        meta: { orgId, action: 'ownership_transfer_stub' },
      })
    }
    setTransferStub(null)
    reload()
  }

  return (
    <div>
      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Team & access for <strong className="text-[var(--admin-text)]">{org.name}</strong>.
          Removing a member revokes host access for this org only — their personal account is kept.
        </p>
      </AdminPanel>

      <div className="mb-3">
        <AdminInput
          placeholder="Search team member…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <AdminTable columns={['User', 'Role', 'Joined', '']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-medium">{row.userName}</p>
              <p className="text-[11px] text-[var(--admin-text-dim)]">{row.email}</p>
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
                          onClick: () => setTransferStub({ fromEmail: row.email }),
                        },
                      ]
                    : []),
                  {
                    label: 'Remove from org',
                    onClick: () =>
                      setConfirm({ memberEmail: row.email, memberRole: row.role }),
                    danger: true,
                  },
                ]}
              />
            </td>
          </tr>
        ))}
      </AdminTable>

      {rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--admin-text-dim)]">No team members for this organization.</p>
      )}

      <AdminConfirmDialog
        open={!!confirm}
        title="Remove from organization"
        message={
          confirm
            ? `Remove ${confirm.memberEmail} from ${org.name}? They will lose host access to this org but keep their personal TUDU account.`
            : ''
        }
        confirmLabel="Remove from org"
        onConfirm={handleRemove}
        onCancel={() => setConfirm(null)}
      />

      <AdminConfirmDialog
        open={!!transferStub}
        title="Transfer ownership (demo stub)"
        message={`Demo stub: transfer ownership of ${org.name} to the first Admin on the team.`}
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
