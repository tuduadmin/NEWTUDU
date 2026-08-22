import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Crown, Shield, Trash2, UserPlus } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import { BackLink } from '../../components/NavActionButtons'
import {
  ORG_ROLES,
  acceptInvite,
  designateBackupAdmin,
  getMemberRole,
  getOrgInvites,
  getOrgMembers,
  getPendingInvitesForEmail,
  inviteTeamMember,
  removeMember,
  transferOwnership,
  updateMemberRole,
  type OrgRole,
} from '../../lib/account'
import { getAllUsers } from '../../lib/auth'
import { useHostContext } from '../../hooks/useHostContext'

export default function TeamPage() {
  const { activeOrg, hostAccounts, isPersonal, setHostContext, user } = useHostContext()
  const org = !isPersonal ? activeOrg : null
  const myRole = org && user ? getMemberRole(org.id, user.email) : null
  const isOwner = myRole === 'owner'

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('staff')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const members = useMemo(
    () => (org ? getOrgMembers(org.id) : []),
    [org, refreshKey],
  )
  const pendingInvites = useMemo(
    () => (org ? getOrgInvites(org.id).filter((i) => i.status === 'pending') : []),
    [org, refreshKey],
  )
  const myPendingInvites = useMemo(
    () => (user ? getPendingInvitesForEmail(user.email) : []),
    [user, refreshKey],
  )
  const adminMembers = members.filter((m) => m.role === 'admin')
  const backupMember = members.find((m) => m.isBackupAdmin)

  const memberRows = useMemo(() => {
    return members.map((member) => {
      const userRecord = getAllUsers().find((u) => u.email.toLowerCase() === member.email.toLowerCase())
      const name = userRecord ? `${userRecord.firstName} ${userRecord.lastName}`.trim() : 'â€”'
      return { ...member, name }
    })
  }, [members, refreshKey])

  if (!user) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-6 text-center">
          <p className="text-brown-muted">Sign in to manage your team.</p>
          <Link to="/signin" className="mt-4 inline-block font-semibold text-orange no-underline">
            Sign in
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!org) {
      setError('Switch to an organization to manage team members.')
      return
    }
    if (!inviteEmail.trim()) {
      setError('Enter an email address.')
      return
    }

    inviteTeamMember({
      orgId: org.id,
      email: inviteEmail,
      role: inviteRole,
      invitedBy: user!.email,
    })
    setInviteEmail('')
    setMessage(`Invite sent to ${inviteEmail.trim()}.`)
    setRefreshKey((k) => k + 1)
  }

  function handleAccept(inviteId: string) {
    setMessage('')
    setError('')
    const result = acceptInvite(inviteId, user!.email)
    if (!result.ok) {
      setError(result.error ?? 'Could not accept invite.')
      return
    }
    setMessage('Invite accepted â€” you are now a team member.')
    setRefreshKey((k) => k + 1)
  }

  function handleRoleChange(memberEmail: string, newRole: OrgRole) {
    setMessage('')
    setError('')
    if (!org) return

    const result = updateMemberRole(org.id, memberEmail, newRole, user!.email)
    if (!result.ok) {
      setError(result.error ?? 'Could not update role.')
      return
    }
    setMessage('Role updated.')
    setRefreshKey((k) => k + 1)
  }

  function handleRemove(memberEmail: string) {
    setMessage('')
    setError('')
    if (!org) return

    const result = removeMember(org.id, memberEmail, user!.email)
    if (!result.ok) {
      setError(result.error ?? 'Could not remove member.')
      return
    }
    setMessage(`Removed ${memberEmail} from the team.`)
    setRefreshKey((k) => k + 1)
  }

  function handleTransferStub() {
    setMessage('')
    setError('')
    if (!org || adminMembers.length === 0) {
      setError('Add an Admin before transferring ownership.')
      return
    }
    const target = adminMembers[0]
    const result = transferOwnership(org.id, user!.email, target.email)
    if (!result.ok) {
      setError(result.error ?? 'Could not transfer ownership.')
      return
    }
    setMessage(`Ownership transferred to ${target.email}.`)
    setRefreshKey((k) => k + 1)
  }

  const roleLabel = (role: OrgRole) => ORG_ROLES.find((r) => r.id === role)?.label ?? role
  const assignableRoles = ORG_ROLES.filter((r) => r.id !== 'owner')

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <BackLink to="/host" className="mb-3">
          Back to Event Manager
        </BackLink>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Team &amp; Admins</h1>

        {!org && (
          <div className="mt-5 rounded-[14px] border border-brown/10 bg-white p-5 text-center shadow-sm">
            <p className="text-sm text-brown-muted">
              {hostAccounts.length === 0
                ? 'Create an organization to manage team members.'
                : 'Switch to Organization mode in Event Manager to manage your team.'}
            </p>
            {hostAccounts.length === 0 ? (
              <Link
                to="/host/create-org"
                className="mt-4 inline-flex w-full items-center justify-center rounded-[14px] bg-orange py-3 font-display text-sm font-bold text-white no-underline"
              >
                Create organization
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setHostContext(hostAccounts[0].id)}
                className="mt-4 inline-flex w-full items-center justify-center rounded-[14px] bg-orange py-3 font-display text-sm font-bold text-white"
              >
                Switch to {hostAccounts[0].name}
              </button>
            )}
          </div>
        )}

        {org && (
          <>
            <p className="mt-1 font-display text-base font-bold text-brown">{org.name}</p>
            <Link
              to="/host/departments"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange no-underline"
            >
              <Building2 size={14} />
              Manage departments
            </Link>

            {/* Backup admin â€” prominent */}
            <section className="mt-4 rounded-[14px] border border-purple/25 bg-purple/5 p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <Shield size={18} className="mt-0.5 shrink-0 text-purple" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-brown">Backup Admin</p>
                  <p className="mt-0.5 text-xs text-brown-muted">
                    Required second admin for account recovery.
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brown">
                    {backupMember?.email ?? org.backupAdminEmail ?? 'Not assigned'}
                  </p>
                  {backupMember && (
                    <span className="mt-1 inline-block rounded-[14px] bg-purple/15 px-2 py-0.5 text-[10px] font-bold uppercase text-purple">
                      {roleLabel(backupMember.role)}
                    </span>
                  )}
                </div>
              </div>
              {isOwner && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = (e.currentTarget.elements.namedItem('backupEmail') as HTMLInputElement)
                    if (!input?.value.trim()) return
                    designateBackupAdmin(org.id, input.value.trim(), user!.email)
                    setMessage('Backup admin updated.')
                    setRefreshKey((k) => k + 1)
                    input.value = ''
                  }}
                  className="mt-3 flex gap-2"
                >
                  <input
                    name="backupEmail"
                    type="email"
                    placeholder="new-backup@example.com"
                    className="min-w-0 flex-1 rounded-[14px] border border-brown/15 bg-white px-3 py-2 text-sm text-brown outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-[14px] bg-purple px-3 py-2 text-xs font-bold text-white"
                  >
                    Update
                  </button>
                </form>
              )}
            </section>

            {/* Add member */}
            <section className="mt-4 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-brown">
                <UserPlus size={18} className="text-orange" />
                Add member
              </h2>
              <form onSubmit={handleInvite} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="min-w-0 flex-1 rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                  className="rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm font-semibold text-brown outline-none"
                >
                  {assignableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <GradientButton type="submit" className="shrink-0 px-5">
                  Add
                </GradientButton>
              </form>
            </section>

            {(error || message) && (
              <p className={`mt-3 text-sm font-semibold ${error ? 'text-maroon' : 'text-emerald-700'}`}>
                {error || message}
              </p>
            )}

            {/* Members table */}
            <section className="mt-4 overflow-hidden rounded-[14px] border border-brown/10 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-brown/10 bg-cream/50 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
                      <th className="px-3 py-2.5">Name</th>
                      <th className="px-3 py-2.5">Email</th>
                      <th className="px-3 py-2.5">Role</th>
                      {isOwner && <th className="px-3 py-2.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {memberRows.map((member) => (
                      <tr key={member.id} className="border-b border-brown/5 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-brown">{member.name}</td>
                        <td className="max-w-[120px] truncate px-3 py-2.5 text-brown-muted">{member.email}</td>
                        <td className="px-3 py-2.5">
                          {isOwner && member.role !== 'owner' ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.email, e.target.value as OrgRole)}
                              className="rounded-[14px] border border-brown/15 bg-white px-2 py-1 text-xs font-semibold text-brown outline-none"
                            >
                              {assignableRoles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="rounded-[14px] bg-orange/15 px-2 py-0.5 text-[10px] font-bold uppercase text-orange">
                              {roleLabel(member.role)}
                              {member.isBackupAdmin && ' Â· Backup'}
                            </span>
                          )}
                        </td>
                        {isOwner && (
                          <td className="px-3 py-2.5 text-right">
                            {member.role !== 'owner' && (
                              <button
                                type="button"
                                onClick={() => handleRemove(member.email)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brown/10 text-brown-muted hover:border-maroon/30 hover:text-maroon"
                                aria-label={`Remove ${member.email}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pendingInvites.length > 0 && (
                <div className="border-t border-brown/10 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Pending invites</p>
                  <ul className="mt-1.5 space-y-1">
                    {pendingInvites.map((invite) => (
                      <li key={invite.id} className="text-xs text-brown-muted">
                        {invite.email} Â· {roleLabel(invite.role)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {isOwner && (
              <section className="mt-4 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-brown">
                  <Crown size={18} className="text-orange" />
                  Transfer ownership
                </h2>
                <p className="mt-1 text-xs text-brown-muted">
                  Transfer to an existing Admin. You will become an Admin after transfer.
                </p>
                <button
                  type="button"
                  onClick={handleTransferStub}
                  disabled={adminMembers.length === 0}
                  className="mt-3 w-full rounded-[14px] border border-brown/15 bg-white py-2.5 text-sm font-semibold text-brown transition hover:border-orange/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Transfer ownership
                </button>
              </section>
            )}
          </>
        )}

        {myPendingInvites.length > 0 && (
          <section className="mt-4 rounded-[14px] border border-purple/20 bg-purple/5 p-4 shadow-sm">
            <h2 className="font-display text-base font-bold text-brown">Your pending invites</h2>
            <ul className="mt-3 space-y-2">
              {myPendingInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-2 rounded-[14px] border border-brown/10 bg-white px-3 py-2.5"
                >
                  <span className="text-sm text-brown">Join as {roleLabel(invite.role)}</span>
                  <button
                    type="button"
                    onClick={() => handleAccept(invite.id)}
                    className="shrink-0 rounded-[14px] bg-orange px-3 py-1 text-xs font-bold text-white"
                  >
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
