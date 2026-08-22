import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  formatRelativeTime,
  logActivity,
} from '../../lib/adminAnalytics'
import {
  ACCOUNTS_CHANGED_EVENT,
  getAccount,
  getHostEventById,
  getHostEventsForUser,
  getTierBadgeTone,
  getTierLabel,
  setAccountTierByEmail,
  setAccountVerificationByEmail,
  saveAccount,
  USER_TIER_OPTIONS,
  type UserAccount,
  type UserTier,
  type VerificationStatus,
} from '../../lib/account'
import { getAllUsers, PLATFORM_ADMIN, type StoredUser } from '../../lib/auth'
import {
  getBucketListsForUser,
  resolveEventsFromAnySource,
} from '../../lib/bucketLists'
import { getChecklistResponsesForUser } from '../../lib/checklist'
import {
  GENDER_OPTIONS,
  getAccountAgeDisplay,
  getGenderLabel,
  type GenderOption,
} from '../../lib/demographics'
import { formatCityLabel } from '../../lib/location'
import { getRoadTripsForUser } from '../../lib/roadTrips'
import { getSavedEventIdsForUser } from '../../lib/savedEvents'
import { resolveEventFromAnySource } from '../../lib/bucketLists'
import { buildAdminSeedEventCreatePath } from '../../lib/adminSeed'
import AdminMerchControls from '../../components/admin/AdminMerchControls'
import { getHostMerchSettingsFromAccount, type HostMerchSettings } from '../../lib/hostMerch'

type TabId =
  | 'profile'
  | 'events'
  | 'saved'
  | 'tickets'
  | 'bucket-lists'
  | 'road-trips'

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'events', label: 'Events created' },
  { id: 'saved', label: 'Saved events' },
  { id: 'tickets', label: 'Tickets / RSVPs' },
  { id: 'bucket-lists', label: 'Bucket lists' },
  { id: 'road-trips', label: 'Road trips' },
]

type ConfirmAction =
  | { type: 'suspend'; suspend: boolean }
  | { type: 'ban'; ban: boolean }

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const email = decodeURIComponent(userId ?? '')
  const [tab, setTab] = useState<TabId>('profile')
  const [refresh, setRefresh] = useState(0)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const user = useMemo(
    () => getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()),
    [email, refresh],
  )
  const account = useMemo(() => getAccount(email), [email, refresh])

  const events = useMemo(() => getHostEventsForUser(email), [email, refresh])
  const savedIds = useMemo(() => getSavedEventIdsForUser(email), [email, refresh])
  const savedEvents = useMemo(
    () =>
      savedIds
        .map((id) => resolveEventFromAnySource(id))
        .filter((e): e is NonNullable<typeof e> => e != null),
    [savedIds],
  )
  const checklistResponses = useMemo(
    () => getChecklistResponsesForUser(email),
    [email, refresh],
  )
  const bucketLists = useMemo(() => getBucketListsForUser(email), [email, refresh])
  const roadTrips = useMemo(() => getRoadTripsForUser(email), [email, refresh])

  if (!user || !account) {
    return (
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader title="User not found" subtitle={`No account for ${email || 'unknown'}.`} />
        <AdminButton variant="secondary" onClick={() => navigate('/admin/people?view=users')}>
          ← Back to users
        </AdminButton>
      </div>
    )
  }

  if (user.email.toLowerCase() === PLATFORM_ADMIN.email.toLowerCase()) {
    return (
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader title="Platform admin" subtitle="Admin accounts are not managed here." />
        <AdminButton variant="secondary" onClick={() => navigate('/admin/people?view=users')}>
          ← Back to users
        </AdminButton>
      </div>
    )
  }

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

  function updateAccountField(partial: Partial<UserAccount>) {
    if (!account) return
    if (partial.tier != null) {
      setAccountTierByEmail(account.email, partial.tier)
    } else if (partial.verificationStatus != null) {
      setAccountVerificationByEmail(account.email, partial.verificationStatus)
    } else {
      saveAccount({ ...account, ...partial })
    }
    refreshData()
  }

  function handleConfirmAction() {
    if (!confirmAction || !account) return
    if (confirmAction.type === 'suspend') {
      saveAccount({ ...account, suspended: confirmAction.suspend })
      logActivity({
        type: 'user_suspend',
        label: confirmAction.suspend ? `Suspended ${email}` : `Unsuspended ${email}`,
        meta: { email },
      })
    }
    if (confirmAction.type === 'ban') {
      saveAccount({ ...account, banned: confirmAction.ban })
      logActivity({
        type: 'user_ban',
        label: confirmAction.ban ? `Banned ${email}` : `Unbanned ${email}`,
        meta: { email },
      })
    }
    setConfirmAction(null)
    refreshData()
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={`${user.firstName} ${user.lastName}`}
        subtitle={user.email}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to={buildAdminSeedEventCreatePath({ userEmail: user.email })}
              className="admin-btn admin-btn-secondary no-underline"
            >
              Seed event
            </Link>
            <AdminButton variant="secondary" onClick={() => navigate('/admin/people?view=users')}>
              ← All users
            </AdminButton>
          </div>
        }
      />

      <nav className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-medium transition ${
              tab === t.id
                ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'profile' && (
        <div className="space-y-4">
          <ProfileTab
            user={user}
            account={account}
            onUpdate={updateAccountField}
            onSuspend={() => setConfirmAction({ type: 'suspend', suspend: !account.suspended })}
            onBan={() => setConfirmAction({ type: 'ban', ban: !account.banned })}
          />
          <AdminMerchControls
            profileLabel={user.email}
            hostKey={{ type: 'user', email: user.email }}
            settings={getHostMerchSettingsFromAccount(account)}
            onUpdate={(partial) => updateAccountField(partial as Partial<UserAccount>)}
          />
        </div>
      )}

      {tab === 'events' && (
        <AdminPanel>
          {events.length === 0 ? (
            <p className="text-xs text-[var(--admin-text-dim)]">No events created.</p>
          ) : (
            <AdminTable columns={['Title', 'Status', 'Visibility', 'City', 'Created']}>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="font-medium">{event.title}</td>
                  <td>
                    <AdminBadge tone="cyan">{event.status}</AdminBadge>
                  </td>
                  <td>
                    <AdminBadge tone="neutral">{event.visibility}</AdminBadge>
                  </td>
                  <td className="text-xs text-[var(--admin-text-muted)]">{event.city ?? '—'}</td>
                  <td className="admin-tabular text-xs text-[var(--admin-text-muted)]">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
          <div className="mt-3">
            <Link
              to={`/admin/events?host=${encodeURIComponent(email)}`}
              className="text-xs text-[var(--admin-accent)] no-underline hover:underline"
            >
              Open in Events registry →
            </Link>
          </div>
        </AdminPanel>
      )}

      {tab === 'saved' && (
        <AdminPanel>
          {savedEvents.length === 0 ? (
            <p className="text-xs text-[var(--admin-text-dim)]">
              No saved events for this user. Saves are recorded when they bookmark cards on Discover.
            </p>
          ) : (
            <AdminTable columns={['Event', 'City', 'Card ID']}>
              {savedEvents.map((event) => (
                <tr key={event.id}>
                  <td className="font-medium">{event.title}</td>
                  <td className="text-xs text-[var(--admin-text-muted)]">{event.city}</td>
                  <td className="font-mono text-[10px] text-[var(--admin-text-dim)]">{event.id}</td>
                </tr>
              ))}
            </AdminTable>
          )}
        </AdminPanel>
      )}

      {tab === 'tickets' && (
        <AdminPanel>
          <p className="admin-label mb-2">Checklist / RSVP responses</p>
          {checklistResponses.length === 0 ? (
            <p className="text-xs text-[var(--admin-text-dim)]">
              No checklist responses yet. RSVPs increment event ticket sold counts in localStorage.
            </p>
          ) : (
            <AdminTable columns={['Event', 'Attendee', 'Completed', 'Skipped']}>
              {checklistResponses.map((r) => {
                const ev = getHostEventById(r.eventId)
                return (
                  <tr key={`${r.eventId}-${r.completedAt}`}>
                    <td className="font-medium">{ev?.title ?? r.eventId}</td>
                    <td className="text-xs">{r.attendeeName}</td>
                    <td className="admin-tabular text-xs text-[var(--admin-text-muted)]">
                      {new Date(r.completedAt).toLocaleString()}
                    </td>
                    <td>{r.skipped ? 'Yes' : 'No'}</td>
                  </tr>
                )
              })}
            </AdminTable>
          )}
        </AdminPanel>
      )}

      {tab === 'bucket-lists' && (
        <AdminPanel>
          {bucketLists.length === 0 ? (
            <p className="text-xs text-[var(--admin-text-dim)]">
              No bucket lists owned by this user.
            </p>
          ) : (
            <div className="space-y-4">
              {bucketLists.map((list) => {
                const items = resolveEventsFromAnySource(list.eventIds)
                return (
                  <div
                    key={list.id}
                    className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{list.name}</p>
                        <p className="text-[10px] text-[var(--admin-text-dim)]">
                          {list.eventIds.length} items ·{' '}
                          {list.isPrivate ? 'Private' : 'Public'} · created{' '}
                          {new Date(list.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to="/admin/bucket-lists"
                        className="text-[10px] text-[var(--admin-accent)] no-underline hover:underline"
                      >
                        Manage →
                      </Link>
                    </div>
                    {items.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {items.map((item) => (
                          <li key={item.id} className="text-xs text-[var(--admin-text-muted)]">
                            {item.title} · {item.city}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </AdminPanel>
      )}

      {tab === 'road-trips' && (
        <AdminPanel>
          {roadTrips.length === 0 ? (
            <p className="text-xs text-[var(--admin-text-dim)]">No road trips for this user.</p>
          ) : (
            <AdminTable columns={['Name', 'Destination', 'Status', 'Stops', 'Created']}>
              {roadTrips.map((trip) => (
                <tr key={trip.id}>
                  <td className="font-medium">{trip.name}</td>
                  <td className="text-xs text-[var(--admin-text-muted)]">
                    {trip.destination ?? '—'}
                  </td>
                  <td>
                    <AdminBadge tone="cyan">{trip.status ?? 'planning'}</AdminBadge>
                  </td>
                  <td className="admin-tabular">{trip.stopEventIds.length}</td>
                  <td className="admin-tabular text-xs text-[var(--admin-text-muted)]">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
          <div className="mt-3">
            <Link
              to="/admin/road-trip"
              className="text-xs text-[var(--admin-accent)] no-underline hover:underline"
            >
              Open Road Trip admin →
            </Link>
          </div>
        </AdminPanel>
      )}

      <AdminConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.type === 'suspend'
            ? confirmAction.suspend
              ? 'Suspend user'
              : 'Unsuspend user'
            : confirmAction?.ban
              ? 'Ban account'
              : 'Unban account'
        }
        message={
          confirmAction?.type === 'suspend'
            ? confirmAction.suspend
              ? `${user.firstName} will be unable to create or post events.`
              : `Restore posting for ${user.firstName}?`
            : confirmAction?.ban
              ? `${user.firstName} will be unable to sign in.`
              : `Allow ${user.firstName} to sign in again?`
        }
        confirmLabel={
          confirmAction?.type === 'suspend'
            ? confirmAction.suspend
              ? 'Suspend'
              : 'Unsuspend'
            : confirmAction?.ban
              ? 'Ban account'
              : 'Unban account'
        }
        variant={
          confirmAction &&
          (confirmAction.type === 'ban'
            ? confirmAction.ban
            : confirmAction.type === 'suspend'
              ? confirmAction.suspend
              : false)
            ? 'danger'
            : 'primary'
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

function ProfileTab({
  user,
  account,
  onUpdate,
  onSuspend,
  onBan,
}: {
  user: StoredUser
  account: UserAccount
  onUpdate: (partial: Partial<UserAccount>) => void
  onSuspend: () => void
  onBan: () => void
}) {
  return (
    <AdminPanel>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <p className="admin-label">Status</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {account.banned && <AdminBadge tone="rose">Banned</AdminBadge>}
              {account.suspended && !account.banned && (
                <AdminBadge tone="amber">Suspended</AdminBadge>
              )}
              {!account.banned && !account.suspended && (
                <AdminBadge tone="emerald">Active</AdminBadge>
              )}
              <AdminBadge tone={getTierBadgeTone(account.tier)}>
                {getTierLabel(account.tier)}
              </AdminBadge>
              <AdminBadge tone="neutral">{account.verificationStatus ?? 'unverified'}</AdminBadge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="admin-label">City</p>
              <p className="text-xs">{formatCityLabel(account.homeCity)}</p>
            </div>
            <div>
              <p className="admin-label">Last active</p>
              <p className="text-xs">{formatRelativeTime(account.lastActiveAt)}</p>
            </div>
            <div>
              <p className="admin-label">Age / bracket</p>
              <p className="text-xs">{getAccountAgeDisplay(account, user)}</p>
            </div>
            <div>
              <p className="admin-label">Joined</p>
              <p className="text-xs">
                {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="admin-label">Gender</span>
            <AdminSelect
              className="mt-1 w-full"
              value={account.gender ?? ''}
              onChange={(e) => onUpdate({ gender: e.target.value as GenderOption })}
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value || 'empty'} value={g.value}>
                  {g.label}
                </option>
              ))}
            </AdminSelect>
          </label>
          <label className="block">
            <span className="admin-label">Tier</span>
            <AdminSelect
              className="mt-1 w-full"
              value={account.tier}
              onChange={(e) => onUpdate({ tier: e.target.value as UserTier })}
            >
              {USER_TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
          </label>
          <label className="block">
            <span className="admin-label">Verification</span>
            <AdminSelect
              className="mt-1 w-full"
              value={account.verificationStatus ?? 'unverified'}
              onChange={(e) =>
                onUpdate({ verificationStatus: e.target.value as VerificationStatus })
              }
            >
              <option value="unverified">Unverified</option>
              <option value="phone_verified">Phone verified</option>
            </AdminSelect>
          </label>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Gender: {getGenderLabel(account.gender)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-4">
        <AdminButton variant="secondary" onClick={onSuspend}>
          {account.suspended ? 'Unsuspend posting' : 'Suspend posting'}
        </AdminButton>
        <AdminButton variant="danger" onClick={onBan}>
          {account.banned ? 'Unban account' : 'Ban account'}
        </AdminButton>
      </div>
    </AdminPanel>
  )
}
