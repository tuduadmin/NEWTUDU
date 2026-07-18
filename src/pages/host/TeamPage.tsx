import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown, Mail, Shield, Trash2, UserPlus, Users } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import {
  ORG_ROLES,
  acceptInvite,
  designateBackupAdmin,
  getCurrentAccount,
  getMemberRole,
  getOrgInvites,
  getOrgMembers,
  getPendingInvitesForEmail,
  getPrimaryOrgForUser,
  inviteTeamMember,
  removeMember,
  transferOwnership,
  type OrgRole,
} from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'

export default function TeamPage() {
  const user = getCurrentUser()
  const account = getCurrentAccount()
  const org = user ? getPrimaryOrgForUser(user.email) : null
  const myRole = org && user ? getMemberRole(org.id, user.email) : null
  const isOwner = myRole === 'owner'

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('staff')
  const [backupEmail, setBackupEmail] = useState('')
  const [transferEmail, setTransferEmail] = useState('')
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

  if (!user) {
    return (
      <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
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
      setError('Create a Host Account first.')
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
    setMessage('Invite accepted — you are now a team member.')
    setRefreshKey((k) => k + 1)
  }

  function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')
    if (!org || !transferEmail.trim()) return

    const result = transferOwnership(org.id, user!.email, transferEmail.trim())
    if (!result.ok) {
      setError(result.error ?? 'Could not transfer ownership.')
      return
    }
    setTransferEmail('')
    setMessage('Ownership transferred successfully.')
    setRefreshKey((k) => k + 1)
  }

  function handleDesignateBackup(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')
    if (!org || !backupEmail.trim()) return

    const result = designateBackupAdmin(org.id, backupEmail.trim(), user!.email)
    if (!result.ok) {
      setError(result.error ?? 'Could not designate backup admin.')
      return
    }
    setBackupEmail('')
    setMessage('Backup admin updated — invite sent if they are not yet a member.')
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

  const roleLabel = (role: OrgRole) => ORG_ROLES.find((r) => r.id === role)?.label ?? role

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <Link
          to="/host"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-brown"
        >
          <ArrowLeft size={16} />
          Back to Event Manager
        </Link>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Team</h1>
        <p className="mt-1 text-sm text-brown-muted">
          {org
            ? `${org.name} · Primary Owner + required Backup Admin`
            : 'Create a Host Account to manage your team.'}
        </p>

        {!org && (
          <div className="mt-5 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-5 text-center shadow-sm">
            <Users size={32} className="mx-auto text-brown-muted" />
            <p className="mt-3 text-sm text-brown-muted">No Host Account yet.</p>
            <Link
              to="/host/create-org"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-orange py-3 font-display text-sm font-bold text-white no-underline"
            >
              Create Host Account
            </Link>
          </div>
        )}

        {org && (
          <>
            <section className="mt-5 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-brown">
                <Users size={18} className="text-orange" />
                Members ({members.length})
              </h2>
              <ul className="mt-3 space-y-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-brown/10 bg-cream/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium text-brown">{member.email}</span>
                      {member.isBackupAdmin && (
                        <span className="text-[10px] font-semibold text-purple">Backup Admin</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-bold uppercase text-orange">
                        {roleLabel(member.role)}
                      </span>
                      {isOwner && member.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemove(member.email)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-brown/10 text-brown-muted hover:border-maroon/30 hover:text-maroon"
                          aria-label={`Remove ${member.email}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {isOwner && (
              <>
                <section className="mt-4 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-brown">
                    <Crown size={18} className="text-orange" />
                    Transfer Ownership
                  </h2>
                  <p className="mt-1 text-xs text-brown-muted">
                    Transfer to an existing Admin. You will become an Admin after transfer.
                  </p>
                  <form onSubmit={handleTransfer} className="mt-3 flex gap-2">
                    <select
                      value={transferEmail}
                      onChange={(e) => setTransferEmail(e.target.value)}
                      className="min-w-0 flex-1 rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2 text-sm text-brown outline-none"
                    >
                      <option value="">Select Admin…</option>
                      {adminMembers.map((m) => (
                        <option key={m.id} value={m.email}>
                          {m.email}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!transferEmail}
                      className="shrink-0 rounded-full bg-orange px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Transfer
                    </button>
                  </form>
                </section>

                <section className="mt-4 rounded-[var(--radius-xl)] border border-purple/20 bg-purple/5 p-4 shadow-sm">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-brown">
                    <Shield size={18} className="text-purple" />
                    Designate Backup Admin
                  </h2>
                  <p className="mt-1 text-xs text-brown-muted">
                    Current: {org.backupAdminEmail || 'None'}. Cannot remove the sole backup admin without assigning a
                    replacement.
                  </p>
                  <form onSubmit={handleDesignateBackup} className="mt-3 space-y-2">
                    <input
                      type="email"
                      value={backupEmail}
                      onChange={(e) => setBackupEmail(e.target.value)}
                      placeholder="new-backup@example.com"
                      className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white px-3 py-2.5 text-sm text-brown outline-none"
                    />
                    <GradientButton type="submit" fullWidth disabled={!backupEmail.trim()}>
                      Update Backup Admin
                    </GradientButton>
                  </form>
                </section>
              </>
            )}

            <section className="mt-4 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-brown">
                <UserPlus size={18} className="text-orange" />
                Invite Member
              </h2>
              <form onSubmit={handleInvite} className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brown-muted">
                    <Mail size={14} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-brown-muted">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                    className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
                  >
                    {ORG_ROLES.filter((r) => r.id !== 'owner').map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                {error && <p className="text-sm font-semibold text-maroon">{error}</p>}
                {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
                <GradientButton type="submit" fullWidth>
                  Send Invite
                </GradientButton>
              </form>

              {pendingInvites.length > 0 && (
                <div className="mt-4 border-t border-brown/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brown-muted">Pending Invites</p>
                  <ul className="mt-2 space-y-1.5">
                    {pendingInvites.map((invite) => (
                      <li key={invite.id} className="text-sm text-brown-muted">
                        {invite.email} · {roleLabel(invite.role)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}

        {myPendingInvites.length > 0 && (
          <section className="mt-4 rounded-[var(--radius-xl)] border border-purple/20 bg-purple/5 p-4 shadow-sm">
            <h2 className="font-display text-base font-bold text-brown">Your Pending Invites</h2>
            <ul className="mt-3 space-y-2">
              {myPendingInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-brown/10 bg-white px-3 py-2.5"
                >
                  <span className="text-sm text-brown">Join as {roleLabel(invite.role)}</span>
                  <button
                    type="button"
                    onClick={() => handleAccept(invite.id)}
                    className="shrink-0 rounded-full bg-orange px-3 py-1 text-xs font-bold text-white"
                  >
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {account?.verificationStatus !== 'phone_verified' && (
          <p className="mt-4 text-center text-xs text-brown-muted">
            <Link to="/verify-phone" className="font-semibold text-orange no-underline">
              Verify your phone
            </Link>{' '}
            to unlock public events for {org?.name ?? 'your Host Account'}.
          </p>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
