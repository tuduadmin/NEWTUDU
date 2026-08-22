import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
  AdminDrawer,
  AdminFilterBar,
  AdminInput,
  AdminSelect,
  AdminTable,
} from './AdminUI'
import {
  formatRelativeTime,
  isInactiveUser,
  logActivity,
} from '../../lib/adminAnalytics'
import {
  applyAccountBan,
  applyTimedSuspension,
  clearAccountBan,
  clearSuspension,
  formatSuspendUntil,
  getSuspendDurationLabel,
  sendModerationMessage,
  SUSPEND_DURATION_OPTIONS,
} from '../../lib/adminModeration'
import { DEFAULT_COUNTRIES } from '../../lib/analyticsGeo'
import {
  ACCOUNTS_CHANGED_EVENT,
  getAccount,
  getConsumerAccountStatus,
  getHostEventsForUser,
  isAccountSuspended,
  setAccountTierByEmail,
  setAccountVerificationByEmail,
  saveAccount,
  USER_TIER_OPTIONS,
  type SuspendDuration,
  type UserAccount,
  type UserTier,
  type VerificationStatus,
} from '../../lib/account'
import {
  GENDER_OPTIONS,
  getAccountAgeDisplay,
  getGenderLabel,
  type GenderOption,
} from '../../lib/demographics'
import { formatCityLabel } from '../../lib/location'
import { buildAdminSeedEventCreatePath } from '../../lib/adminSeed'
import { getAllUsers, PLATFORM_ADMIN, signIn } from '../../lib/auth'
import AdminMerchControls from './AdminMerchControls'
import { getHostMerchSettingsFromAccount } from '../../lib/hostMerch'

type SortKey = 'join' | 'active' | 'name'
type StatusFilter = 'all' | 'active' | 'suspended' | 'banned'

type ConfirmAction =
  | { type: 'suspend'; email: string; name: string; duration: SuspendDuration }
  | { type: 'unsuspend'; email: string; name: string }
  | { type: 'ban'; email: string; name: string }
  | { type: 'unban'; email: string; name: string }

function displayCountry(account: UserAccount): string {
  return account.country?.trim() || 'Canada'
}

export default function AdminUsersPanel() {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<UserTier | 'all'>('all')
  const [countryFilter, setCountryFilter] = useState<'all' | string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('active')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const users = useMemo(() => {
    const seen = new Set<string>()
    let list = getAllUsers().filter(
      (u) => u.email.toLowerCase() !== PLATFORM_ADMIN.email.toLowerCase(),
    )

    list = list.filter((u) => {
      const key = u.email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q),
      )
    }

    list = list.filter((u) => {
      const account = getAccount(u.email)
      if (!account) return false
      if (tierFilter !== 'all' && account.tier !== tierFilter) return false
      if (countryFilter !== 'all' && displayCountry(account) !== countryFilter) return false
      if (statusFilter === 'banned' && !account.banned) return false
      if (statusFilter === 'suspended' && (!isAccountSuspended(account) || account.banned)) {
        return false
      }
      if (statusFilter === 'active' && (account.banned || isAccountSuspended(account))) {
        return false
      }
      return true
    })

    list.sort((a, b) => {
      const accA = getAccount(a.email)!
      const accB = getAccount(b.email)!
      if (sort === 'name') {
        return `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
      }
      if (sort === 'join') {
        return new Date(b.joinedAt ?? 0).getTime() - new Date(a.joinedAt ?? 0).getTime()
      }
      return new Date(accB.lastActiveAt ?? 0).getTime() - new Date(accA.lastActiveAt ?? 0).getTime()
    })

    return list
  }, [search, tierFilter, countryFilter, statusFilter, sort, refresh])

  const selectedUser = selectedEmail ? getAllUsers().find((u) => u.email === selectedEmail) : null
  const selectedAccount = selectedEmail ? getAccount(selectedEmail) : null

  function refreshData() {
    setRefresh((r) => r + 1)
  }

  useEffect(() => {
    function refresh() {
      refreshData()
    }
    window.addEventListener(ACCOUNTS_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(ACCOUNTS_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  function openManage(email: string) {
    setSelectedEmail(email)
  }

  function signInAsSelectedUser() {
    if (!selectedUser) return
    const result = signIn(selectedUser.email, selectedUser.password)
    if (!result.ok) {
      window.alert(result.error ?? 'Could not sign in as this user.')
      return
    }
    setSelectedEmail(null)
    navigate('/host')
  }

  function updateAccountField(partial: Partial<UserAccount>) {
    if (!selectedAccount || !selectedEmail) return
    if (partial.tier != null) {
      setAccountTierByEmail(selectedEmail, partial.tier)
    } else if (partial.verificationStatus != null) {
      setAccountVerificationByEmail(selectedEmail, partial.verificationStatus)
    } else {
      saveAccount({ ...selectedAccount, ...partial })
    }
    refreshData()
  }

  function handleConfirmAction() {
    if (!confirmAction) return

    if (confirmAction.type === 'suspend') {
      const updated = applyTimedSuspension(confirmAction.email, confirmAction.duration)
      if (updated?.suspendedUntil) {
        sendModerationMessage({
          toEmail: confirmAction.email,
          templateId: 'suspendTermsViolation',
          duration: getSuspendDurationLabel(confirmAction.duration),
          until: formatSuspendUntil(updated.suspendedUntil),
        })
      }
      logActivity({
        type: 'user_suspend',
        label: `Suspended ${confirmAction.email} for ${getSuspendDurationLabel(confirmAction.duration)}`,
        meta: {
          email: confirmAction.email,
          duration: confirmAction.duration,
          until: updated?.suspendedUntil ?? '',
        },
      })
    }

    if (confirmAction.type === 'unsuspend') {
      clearSuspension(confirmAction.email)
      logActivity({
        type: 'user_suspend',
        label: `Unsuspended ${confirmAction.email}`,
        meta: { email: confirmAction.email },
      })
    }

    if (confirmAction.type === 'ban') {
      applyAccountBan(confirmAction.email)
      sendModerationMessage({
        toEmail: confirmAction.email,
        templateId: 'banTermination',
      })
      logActivity({
        type: 'user_ban',
        label: `Banned ${confirmAction.email}`,
        meta: { email: confirmAction.email },
      })
    }

    if (confirmAction.type === 'unban') {
      clearAccountBan(confirmAction.email)
      logActivity({
        type: 'user_ban',
        label: `Unbanned ${confirmAction.email}`,
        meta: { email: confirmAction.email },
      })
    }

    setConfirmAction(null)
    refreshData()
  }

  function confirmDialogProps() {
    if (!confirmAction) {
      return { title: '', message: '', confirmLabel: '', variant: 'primary' as const }
    }

    if (confirmAction.type === 'suspend') {
      const durationLabel = getSuspendDurationLabel(confirmAction.duration)
      return {
        title: 'Suspend account',
        message: `${confirmAction.name} will be suspended for ${durationLabel} for violating Terms of Service. They cannot create or post events but can still browse. An automated message will be sent.`,
        confirmLabel: `Suspend for ${durationLabel}`,
        variant: 'danger' as const,
      }
    }

    if (confirmAction.type === 'unsuspend') {
      return {
        title: 'Unsuspend account',
        message: `Restore posting privileges for ${confirmAction.name}?`,
        confirmLabel: 'Unsuspend',
        variant: 'primary' as const,
      }
    }

    if (confirmAction.type === 'ban') {
      return {
        title: 'Ban account',
        message: `${confirmAction.name} will be terminated platform-wide. Their data is retained for one year pending review. This email will be flagged and sign-in blocked. An automated termination message will be sent.`,
        confirmLabel: 'Ban account',
        variant: 'danger' as const,
      }
    }

    return {
      title: 'Unban account',
      message: `Allow ${confirmAction.name} to sign in again and clear the email flag? Ban history is retained in account metadata.`,
      confirmLabel: 'Unban account',
      variant: 'primary' as const,
    }
  }

  const dialog = confirmDialogProps()

  return (
    <>
      <AdminFilterBar>
        <AdminInput
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <AdminSelect
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as UserTier | 'all')}
          aria-label="Filter by tier"
        >
          <option value="all">All tiers</option>
          {USER_TIER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          aria-label="Filter by country"
        >
          <option value="all">All countries</option>
          {DEFAULT_COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter by account status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </AdminSelect>
        <AdminSelect value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
          <option value="active">Last active</option>
          <option value="join">Recent join</option>
          <option value="name">Name</option>
        </AdminSelect>
        <span className="ml-auto text-xs text-[var(--admin-text-dim)]">
          {users.length} {users.length === 1 ? 'user' : 'users'}
        </span>
      </AdminFilterBar>

      <AdminTable columns={['Name', 'Email', 'Tier', 'Last active', 'Events', 'Status', '']}>
        {users.map((user) => {
          const account = getAccount(user.email)!
          const inactive = isInactiveUser(account.lastActiveAt)
          const eventCount = getHostEventsForUser(user.email).length

          return (
            <tr key={user.email.toLowerCase()} className={inactive ? 'row-inactive' : undefined}>
              <td>
                <button
                  type="button"
                  className="text-left font-medium text-[var(--admin-text)] hover:text-[var(--admin-accent)]"
                  onClick={() => openManage(user.email)}
                >
                  {user.firstName} {user.lastName}
                </button>
              </td>
              <td className="text-xs text-[var(--admin-text-muted)]">{user.email}</td>
              <td>
                {(() => {
                  const status = getConsumerAccountStatus(account)
                  return <AdminBadge tone={status.tone}>{status.label}</AdminBadge>
                })()}
              </td>
              <td className="text-xs text-[var(--admin-text-muted)]">
                {formatRelativeTime(account.lastActiveAt)}
              </td>
              <td className="text-xs text-[var(--admin-text-muted)]">{eventCount}</td>
              <td>
                <UserStatusBadges account={account} />
              </td>
              <td className="text-right">
                <AdminButton
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  onClick={() => openManage(user.email)}
                >
                  Manage
                </AdminButton>
              </td>
            </tr>
          )
        })}
      </AdminTable>

      {users.length === 0 && (
        <p className="mt-4 text-sm text-[var(--admin-text-dim)]">No users match these filters.</p>
      )}

      <AdminDrawer
        open={!!selectedUser && !!selectedAccount}
        title="Manage user"
        onClose={() => setSelectedEmail(null)}
        centered
        wide
        footer={
          selectedUser && selectedAccount && (
            <div className="flex flex-wrap gap-2">
              <AdminButton
                variant="secondary"
                onClick={signInAsSelectedUser}
              >
                Sign in as user → /host
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() =>
                  navigate(`/admin/support?tab=send&to=${encodeURIComponent(selectedUser.email)}`)
                }
              >
                Message
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() =>
                  navigate(`/admin/users/${encodeURIComponent(selectedUser.email)}`)
                }
              >
                Full activity
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() =>
                  navigate(`/admin/events?host=${encodeURIComponent(selectedUser.email)}`)
                }
              >
                View events
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() =>
                  navigate(buildAdminSeedEventCreatePath({ userEmail: selectedUser.email }))
                }
              >
                Seed event
              </AdminButton>
            </div>
          )
        }
      >
        {selectedUser && selectedAccount && (
          <div className="space-y-5 text-sm">
            <section>
              <p className="admin-label mb-2">Overview</p>
              <p className="font-medium">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-xs text-[var(--admin-text-muted)]">{selectedUser.email}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(() => {
                  const status = getConsumerAccountStatus(selectedAccount)
                  return <AdminBadge tone={status.tone}>{status.label}</AdminBadge>
                })()}
                <UserStatusBadges account={selectedAccount} />
              </div>
              <p className="mt-2 text-[11px] text-[var(--admin-text-dim)]">
                Last active {formatRelativeTime(selectedAccount.lastActiveAt)} ·{' '}
                {getHostEventsForUser(selectedUser.email).length} events
              </p>
            </section>

            <section>
              <p className="admin-label mb-2">Location</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="admin-label">Country</span>
                  <AdminSelect
                    className="mt-1"
                    value={displayCountry(selectedAccount)}
                    onChange={(e) => updateAccountField({ country: e.target.value })}
                  >
                    {DEFAULT_COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </AdminSelect>
                </label>
                <div>
                  <p className="admin-label">City</p>
                  <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                    {formatCityLabel(selectedAccount.homeCity)}
                    {selectedAccount.homeRegion && (
                      <span className="text-[var(--admin-text-dim)]">
                        {' '}
                        · {selectedAccount.homeRegion}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <p className="admin-label mb-2">Account</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="admin-label">Tier</span>
                  <AdminSelect
                    className="mt-1"
                    value={selectedAccount.tier}
                    onChange={(e) =>
                      updateAccountField({ tier: e.target.value as UserTier })
                    }
                  >
                    {USER_TIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </AdminSelect>
                </label>
                <label className="block">
                  <span className="admin-label">Phone verification</span>
                  <AdminSelect
                    className="mt-1"
                    value={selectedAccount.verificationStatus ?? 'unverified'}
                    onChange={(e) =>
                      updateAccountField({
                        verificationStatus: e.target.value as VerificationStatus,
                      })
                    }
                  >
                    <option value="unverified">Unverified</option>
                    <option value="phone_verified">Phone verified</option>
                  </AdminSelect>
                </label>
                <label className="block">
                  <span className="admin-label">Gender</span>
                  <AdminSelect
                    className="mt-1"
                    value={selectedAccount.gender ?? ''}
                    onChange={(e) =>
                      updateAccountField({ gender: e.target.value as GenderOption })
                    }
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value || 'empty'} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </AdminSelect>
                </label>
              </div>
              <p className="mt-2 text-[11px] text-[var(--admin-text-dim)]">
                Age / bracket: {getAccountAgeDisplay(selectedAccount, selectedUser)} ·{' '}
                {getGenderLabel(selectedAccount.gender)}
              </p>
            </section>

            <AdminMerchControls
              profileLabel={selectedUser.email}
              hostKey={{ type: 'user', email: selectedUser.email }}
              settings={getHostMerchSettingsFromAccount(selectedAccount)}
              onUpdate={updateAccountField}
              embedded
            />

            <section className="border-t border-[var(--admin-border)] pt-4">
              <p className="admin-label mb-2">Moderation</p>

              {selectedAccount.banned ? (
                <div className="mb-3 rounded-[var(--admin-radius)] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-[var(--admin-text-muted)]">
                  <p className="font-medium text-rose-300">Account terminated</p>
                  {selectedAccount.bannedAt && (
                    <p className="mt-1">
                      Banned {new Date(selectedAccount.bannedAt).toLocaleString()}
                    </p>
                  )}
                  {selectedAccount.banReviewUntil && (
                    <p>Data retained until {formatSuspendUntil(selectedAccount.banReviewUntil)}</p>
                  )}
                  {selectedAccount.emailFlagged && (
                    <p className="mt-1 text-rose-200">Email flagged — sign-in blocked</p>
                  )}
                </div>
              ) : isAccountSuspended(selectedAccount) ? (
                <div className="mb-3 rounded-[var(--admin-radius)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-[var(--admin-text-muted)]">
                  <p className="font-medium text-amber-200">Suspended</p>
                  {selectedAccount.suspendedUntil && (
                    <p className="mt-1">
                      Ends {formatSuspendUntil(selectedAccount.suspendedUntil)}
                      {selectedAccount.suspendDuration &&
                        ` (${getSuspendDurationLabel(selectedAccount.suspendDuration)})`}
                    </p>
                  )}
                </div>
              ) : null}

              {!selectedAccount.banned && (
                <div className="mb-3">
                  <p className="mb-2 text-[11px] text-[var(--admin-text-dim)]">
                    Suspend account (Terms of Service violation)
                  </p>
                  {isAccountSuspended(selectedAccount) ? (
                    <AdminButton
                      variant="secondary"
                      onClick={() =>
                        setConfirmAction({
                          type: 'unsuspend',
                          email: selectedUser.email,
                          name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                        })
                      }
                    >
                      Unsuspend
                    </AdminButton>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {SUSPEND_DURATION_OPTIONS.map((opt) => (
                        <AdminButton
                          key={opt.id}
                          variant="secondary"
                          onClick={() =>
                            setConfirmAction({
                              type: 'suspend',
                              email: selectedUser.email,
                              name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                              duration: opt.id,
                            })
                          }
                        >
                          {opt.label}
                        </AdminButton>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <AdminButton
                  variant="danger"
                  onClick={() =>
                    setConfirmAction(
                      selectedAccount.banned
                        ? {
                            type: 'unban',
                            email: selectedUser.email,
                            name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                          }
                        : {
                            type: 'ban',
                            email: selectedUser.email,
                            name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                          },
                    )
                  }
                >
                  {selectedAccount.banned ? 'Unban account' : 'Ban account'}
                </AdminButton>
                <AdminButton variant="ghost" onClick={() => navigate('/admin/team-access')}>
                  Team & access
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  onClick={() => navigate('/admin/support?tab=send#moderation-templates')}
                >
                  Edit moderation messages
                </AdminButton>
              </div>
            </section>
          </div>
        )}
      </AdminDrawer>

      <AdminConfirmDialog
        open={!!confirmAction}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        variant={dialog.variant}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  )
}

function UserStatusBadges({ account }: { account: UserAccount }) {
  if (account.banned) {
    return <AdminBadge tone="rose">Banned</AdminBadge>
  }

  if (isAccountSuspended(account)) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <AdminBadge tone="amber">Suspended</AdminBadge>
        {account.suspendedUntil && (
          <span className="text-[10px] text-[var(--admin-text-dim)]">
            until {formatSuspendUntil(account.suspendedUntil)}
          </span>
        )}
      </div>
    )
  }

  return <AdminBadge tone="emerald">Active</AdminBadge>
}
