import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import AdminOrgRejectDialog, {
  type OrgRejectPayload,
} from './AdminOrgRejectDialog'
import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
  AdminDrawer,
  AdminFilterBar,
  AdminInput,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from './AdminUI'
import { buildAdminSeedEventCreatePath } from '../../lib/adminSeed'
import AdminAccountSubscriptionSection from './AdminAccountSubscriptionSection'
import AdminMerchControls from './AdminMerchControls'
import { getHostMerchSettingsFromOrg, type HostMerchSettings } from '../../lib/hostMerch'
import { rejectOrganizationWithNotification } from '../../lib/adminOrganizations'
import { logActivity } from '../../lib/adminAnalytics'
import {
  banOrganization,
  clearOrgBan,
  clearOrgSuspension,
  formatSuspendUntil,
  getSuspendDurationLabel,
  sendModerationMessage,
  SUSPEND_DURATION_OPTIONS,
  suspendOrganization,
} from '../../lib/adminModeration'
import { DEFAULT_COUNTRIES } from '../../lib/analyticsGeo'
import {
  ACCOUNTS_CHANGED_EVENT,
  getAccount,
  getOrganizations,
  getOrganizationApprovalStatus,
  getOrganizationCountry,
  getOrganizationOwnerEmail,
  getOrgMembers,
  getConsumerAccountStatus,
  isOrganizationBanned,
  isOrganizationSuspended,
  setAccountTierByEmail,
  updateOrganization,
  updateOrganizationApproval,
  USER_TIER_OPTIONS,
  type Organization,
  type OrgApprovalStatus,
  type SuspendDuration,
  type UserTier,
} from '../../lib/account'
import { formatCityLabel } from '../../lib/location'
import { getHiddenGemCountForOrg } from '../../lib/hiddenGems'
import {
  approveOrgVerification,
  formatVerificationAttemptShort,
  getOrgVerificationRequestForOrg,
  ORG_VERIFICATION_CHANGED_EVENT,
  rejectOrgVerification,
  syncRequestStatusFromOrg,
} from '../../lib/orgVerificationRequests'

const VERIFICATION_ATTEMPT_CLASS =
  'text-xs admin-tabular text-[var(--admin-text-muted)]'

function getOrgOwnerTier(org: Organization): UserTier {
  const ownerEmail = getOrganizationOwnerEmail(org)
  return getAccount(ownerEmail)?.tier ?? 'free'
}

type OrgConfirmAction =
  | { type: 'suspend'; orgId: string; orgName: string; duration: SuspendDuration }
  | { type: 'unsuspend'; orgId: string; orgName: string }
  | { type: 'ban'; orgId: string; orgName: string }
  | { type: 'unban'; orgId: string; orgName: string }

export default function AdminOrganizationsPanel({
  initialStatusFilter = 'all',
}: {
  initialStatusFilter?: 'all' | OrgApprovalStatus
}) {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrgApprovalStatus>(initialStatusFilter)
  const [tierFilter, setTierFilter] = useState<UserTier | 'all'>('all')
  const [countryFilter, setCountryFilter] = useState<'all' | string>('all')
  const [rejectTarget, setRejectTarget] = useState<Organization | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)
  const [orgConfirmAction, setOrgConfirmAction] = useState<OrgConfirmAction | null>(null)

  useEffect(() => {
    setStatusFilter(initialStatusFilter)
  }, [initialStatusFilter])

  useEffect(() => {
    function reloadFromEvent() {
      setRefresh((r) => r + 1)
    }
    window.addEventListener(ORG_VERIFICATION_CHANGED_EVENT, reloadFromEvent)
    window.addEventListener(ACCOUNTS_CHANGED_EVENT, reloadFromEvent)
    window.addEventListener('storage', reloadFromEvent)
    return () => {
      window.removeEventListener(ORG_VERIFICATION_CHANGED_EVENT, reloadFromEvent)
      window.removeEventListener(ACCOUNTS_CHANGED_EVENT, reloadFromEvent)
      window.removeEventListener('storage', reloadFromEvent)
    }
  }, [])

  const orgs = useMemo(() => {
    const seen = new Set<string>()
    let list = getOrganizations().filter((org) => {
      if (seen.has(org.id)) return false
      seen.add(org.id)
      return true
    })
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((o) => {
        const ownerEmail = (o.primaryAdminEmail ?? o.createdBy).toLowerCase()
        return (
          o.name.toLowerCase().includes(q) ||
          ownerEmail.includes(q) ||
          o.category.toLowerCase().includes(q)
        )
      })
    }
    if (countryFilter !== 'all') {
      list = list.filter((o) => getOrganizationCountry(o) === countryFilter)
    }
    if (statusFilter !== 'all') {
      list = list.filter((o) => getOrganizationApprovalStatus(o) === statusFilter)
    }
    if (tierFilter !== 'all') {
      list = list.filter((o) => getOrgOwnerTier(o) === tierFilter)
    }
    return list.sort((a, b) => {
      const reqA = getOrgVerificationRequestForOrg(a.id)
      const reqB = getOrgVerificationRequestForOrg(b.id)
      if (reqA && reqB) return reqA.requestNumber - reqB.requestNumber
      if (reqA) return -1
      if (reqB) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [search, countryFilter, statusFilter, tierFilter, refresh])

  const selectedOrg = selectedOrgId
    ? getOrganizations().find((o) => o.id === selectedOrgId) ?? null
    : null
  const selectedStatus = selectedOrg ? getOrganizationApprovalStatus(selectedOrg) : null
  const selectedRequest = selectedOrg ? getOrgVerificationRequestForOrg(selectedOrg.id) : null
  const selectedGemCount = selectedOrg ? getHiddenGemCountForOrg(selectedOrg.id) : 0
  const selectedMemberCount = selectedOrg ? getOrgMembers(selectedOrg.id).length : 0
  const ownerAccount = selectedOrg ? getAccount(selectedOrg.primaryAdminEmail ?? selectedOrg.createdBy) : null

  function reload() {
    setRefresh((r) => r + 1)
  }

  function openManage(orgId: string) {
    setSelectedOrgId(orgId)
  }

  function updateOrgCountry(country: string) {
    if (!selectedOrg) return
    updateOrganization(selectedOrg.id, { country })
    reload()
  }

  function updateOrgMerch(partial: Partial<HostMerchSettings>) {
    if (!selectedOrg) return
    updateOrganization(selectedOrg.id, partial)
    reload()
  }

  function updateOwnerTier(tier: UserTier) {
    if (!selectedOrg) return
    const ownerEmail = getOrganizationOwnerEmail(selectedOrg)
    setAccountTierByEmail(ownerEmail, tier)
    reload()
  }

  function approve(orgId: string) {
    approveOrgVerification(orgId)
    setConfirmApproveId(null)
    reload()
  }

  function openReject(org: Organization) {
    setRejectTarget(org)
  }

  function confirmReject(payload: OrgRejectPayload) {
    if (!rejectTarget) return
    rejectOrganizationWithNotification(rejectTarget.id, payload)
    rejectOrgVerification(rejectTarget.id)
    setRejectTarget(null)
    reload()
  }

  function markApproved(orgId: string) {
    updateOrganizationApproval(orgId, 'approved')
    syncRequestStatusFromOrg(orgId, 'approved')
    reload()
  }

  function markRejected(org: Organization) {
    openReject(org)
  }

  function handleOrgConfirmAction() {
    if (!orgConfirmAction) return

    const org = getOrganizations().find((o) => o.id === orgConfirmAction.orgId)
    const ownerEmail = org ? getOrganizationOwnerEmail(org) : ''

    if (orgConfirmAction.type === 'suspend') {
      const updated = suspendOrganization(orgConfirmAction.orgId, orgConfirmAction.duration)
      if (updated?.suspendedUntil) {
        sendModerationMessage({
          toEmail: ownerEmail,
          templateId: 'orgSuspendTermsViolation',
          duration: getSuspendDurationLabel(orgConfirmAction.duration),
          until: formatSuspendUntil(updated.suspendedUntil),
          orgName: orgConfirmAction.orgName,
        })
      }
      logActivity({
        type: 'org_suspend',
        label: `Suspended org ${orgConfirmAction.orgName} for ${getSuspendDurationLabel(orgConfirmAction.duration)}`,
        meta: {
          orgId: orgConfirmAction.orgId,
          duration: orgConfirmAction.duration,
          until: updated?.suspendedUntil ?? '',
        },
      })
    }

    if (orgConfirmAction.type === 'unsuspend') {
      clearOrgSuspension(orgConfirmAction.orgId)
      logActivity({
        type: 'org_suspend',
        label: `Unsuspended org ${orgConfirmAction.orgName}`,
        meta: { orgId: orgConfirmAction.orgId },
      })
    }

    if (orgConfirmAction.type === 'ban') {
      banOrganization(orgConfirmAction.orgId)
      sendModerationMessage({
        toEmail: ownerEmail,
        templateId: 'orgBanTermination',
        orgName: orgConfirmAction.orgName,
      })
      logActivity({
        type: 'org_ban',
        label: `Banned org ${orgConfirmAction.orgName}`,
        meta: { orgId: orgConfirmAction.orgId },
      })
    }

    if (orgConfirmAction.type === 'unban') {
      clearOrgBan(orgConfirmAction.orgId)
      logActivity({
        type: 'org_ban',
        label: `Unbanned org ${orgConfirmAction.orgName}`,
        meta: { orgId: orgConfirmAction.orgId },
      })
    }

    setOrgConfirmAction(null)
    reload()
  }

  function orgConfirmDialogProps() {
    if (!orgConfirmAction) {
      return { title: '', message: '', confirmLabel: '', variant: 'primary' as const }
    }

    if (orgConfirmAction.type === 'suspend') {
      const durationLabel = getSuspendDurationLabel(orgConfirmAction.duration)
      return {
        title: 'Suspend organization',
        message: `${orgConfirmAction.orgName} will be suspended for ${durationLabel} for violating Terms of Service. The org cannot publish public events and the owner account will also be suspended. An automated message will be sent to the owner.`,
        confirmLabel: `Suspend for ${durationLabel}`,
        variant: 'danger' as const,
      }
    }

    if (orgConfirmAction.type === 'unsuspend') {
      return {
        title: 'Unsuspend organization',
        message: `Restore publishing privileges for ${orgConfirmAction.orgName} and unsuspend the owner account?`,
        confirmLabel: 'Unsuspend',
        variant: 'primary' as const,
      }
    }

    if (orgConfirmAction.type === 'ban') {
      return {
        title: 'Ban organization',
        message: `${orgConfirmAction.orgName} will be terminated platform-wide. The owner account will be banned and their email flagged. Org data is retained for one year pending review. An automated termination message will be sent.`,
        confirmLabel: 'Ban organization',
        variant: 'danger' as const,
      }
    }

    return {
      title: 'Unban organization',
      message: `Allow ${orgConfirmAction.orgName} and its owner to sign in again? Ban history is retained in org metadata.`,
      confirmLabel: 'Unban organization',
      variant: 'primary' as const,
    }
  }

  const orgDialog = orgConfirmDialogProps()

  return (
    <>
      <AdminFilterBar>
        <AdminInput
          placeholder="Search name, owner email, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          aria-label="Filter by approval status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </AdminSelect>
        <AdminSelect
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as UserTier | 'all')}
          aria-label="Filter by host tier"
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
        <span className="ml-auto text-xs text-[var(--admin-text-dim)]">
          {orgs.length} {orgs.length === 1 ? 'organization' : 'organizations'}
        </span>
      </AdminFilterBar>

      <AdminTable columns={['Organization', 'Tier', 'Country', 'Status', 'Attempt', '']}>
        {orgs.map((org) => {
          const status = getOrganizationApprovalStatus(org)
          const request = getOrgVerificationRequestForOrg(org.id)
          const ownerEmail = getOrganizationOwnerEmail(org)
          const ownerAccount = getAccount(ownerEmail)
          const ownerStatus = ownerAccount
            ? getConsumerAccountStatus(ownerAccount)
            : { label: 'Unverified', tone: 'neutral' as const }
          return (
            <tr key={org.id}>
              <td>
                <button
                  type="button"
                  className="text-left font-medium text-[var(--admin-text)] hover:text-[var(--admin-accent)]"
                  onClick={() => openManage(org.id)}
                >
                  {org.name}
                </button>
                <p className="text-[10px] text-[var(--admin-text-dim)]">{org.category}</p>
              </td>
              <td>
                <AdminBadge tone={ownerStatus.tone}>{ownerStatus.label}</AdminBadge>
              </td>
              <td className="text-xs text-[var(--admin-text-muted)]">
                {getOrganizationCountry(org)}
              </td>
              <td>
                <OrgStatusBadges org={org} approvalStatus={status} />
              </td>
              <td className="admin-tabular">
                {request ? (
                  <span className={VERIFICATION_ATTEMPT_CLASS}>
                    {formatVerificationAttemptShort(request.requestNumber)}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--admin-text-dim)]">—</span>
                )}
              </td>
              <td className="text-right">
                <AdminButton
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  onClick={() => openManage(org.id)}
                >
                  Manage
                </AdminButton>
              </td>
            </tr>
          )
        })}
      </AdminTable>

      {orgs.length === 0 && (
        <p className="mt-4 text-sm text-[var(--admin-text-dim)]">No organizations match this filter.</p>
      )}

      <OrgManageDrawer
        org={selectedOrg}
        status={selectedStatus}
        request={selectedRequest}
        gemCount={selectedGemCount}
        memberCount={selectedMemberCount}
        ownerCity={ownerAccount ? formatCityLabel(ownerAccount.homeCity) : '—'}
        ownerAccount={ownerAccount}
        onOwnerTierChange={updateOwnerTier}
        onClose={() => setSelectedOrgId(null)}
        onCountryChange={updateOrgCountry}
        onApprove={() => selectedOrg && setConfirmApproveId(selectedOrg.id)}
        onReject={() => selectedOrg && openReject(selectedOrg)}
        onOpenOrg={() => selectedOrg && navigate(`/admin/organizations/${selectedOrg.id}`)}
        onTeam={() => selectedOrg && navigate(`/admin/organizations/${selectedOrg.id}/team`)}
        onHiddenGems={() =>
          selectedOrg && navigate(`/admin/organizations/${selectedOrg.id}/hidden-gems`)
        }
        onMarkApproved={() => selectedOrg && markApproved(selectedOrg.id)}
        onMarkRejected={() => selectedOrg && markRejected(selectedOrg)}
        onConfirmAction={setOrgConfirmAction}
        onMerchUpdate={updateOrgMerch}
      />

      <AdminConfirmDialog
        open={!!confirmApproveId}
        title="Approve organization"
        message="Approve this verification request? The org can publish public events after approval."
        confirmLabel="Approve"
        variant="primary"
        onConfirm={() => confirmApproveId && approve(confirmApproveId)}
        onCancel={() => setConfirmApproveId(null)}
      />

      <AdminConfirmDialog
        open={!!orgConfirmAction}
        title={orgDialog.title}
        message={orgDialog.message}
        confirmLabel={orgDialog.confirmLabel}
        variant={orgDialog.variant}
        onConfirm={handleOrgConfirmAction}
        onCancel={() => setOrgConfirmAction(null)}
      />

      <AdminOrgRejectDialog
        org={rejectTarget}
        open={!!rejectTarget}
        onConfirm={confirmReject}
        onCancel={() => setRejectTarget(null)}
      />
    </>
  )
}

type OrgManageDrawerProps = {
  org: Organization | null
  status: OrgApprovalStatus | null
  request: ReturnType<typeof getOrgVerificationRequestForOrg> | null
  gemCount: number
  memberCount: number
  ownerCity: string
  ownerAccount: ReturnType<typeof getAccount>
  onOwnerTierChange: (tier: UserTier) => void
  onClose: () => void
  onCountryChange: (country: string) => void
  onApprove: () => void
  onReject: () => void
  onOpenOrg: () => void
  onTeam: () => void
  onHiddenGems: () => void
  onMarkApproved: () => void
  onMarkRejected: () => void
  onConfirmAction: (action: OrgConfirmAction) => void
  onMerchUpdate: (partial: Partial<HostMerchSettings>) => void
}

function OrgManageDrawer({
  org,
  status,
  request,
  gemCount,
  memberCount,
  ownerCity,
  ownerAccount,
  onOwnerTierChange,
  onClose,
  onCountryChange,
  onApprove,
  onReject,
  onOpenOrg,
  onTeam,
  onHiddenGems,
  onMarkApproved,
  onMarkRejected,
  onConfirmAction,
  onMerchUpdate,
}: OrgManageDrawerProps) {
  const navigate = useNavigate()
  if (!org || !status) return null

  const country = getOrganizationCountry(org)
  const isPending = status === 'pending'

  return (
    <AdminDrawer
      open={!!org}
      title="Manage organization"
      onClose={onClose}
      centered
      wide
      footer={
        <div className="flex flex-wrap gap-2">
          <AdminButton
            variant="primary"
            onClick={() =>
              navigate(
                `/admin/support?tab=send&to=${encodeURIComponent(getOrganizationOwnerEmail(org))}`,
              )
            }
          >
            Message owner
          </AdminButton>
          <AdminButton variant="secondary" onClick={onOpenOrg}>
            Open org profile
          </AdminButton>
          <AdminButton variant="secondary" onClick={onTeam}>
            Team & access
          </AdminButton>
          {gemCount > 0 && (
            <AdminButton variant="secondary" onClick={onHiddenGems}>
              Hidden gems ({gemCount})
            </AdminButton>
          )}
          <AdminButton
            variant="secondary"
            onClick={() => navigate(buildAdminSeedEventCreatePath({ orgId: org.id }))}
          >
            Seed event
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-5 text-sm">
        {/* Overview — future tabs: verification history, TUDU BLACK org perks */}
        <section>
          <p className="admin-label mb-2">Overview</p>
          <p className="font-medium">{org.name}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{org.category}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(() => {
              const ownerEmail = getOrganizationOwnerEmail(org)
              const ownerAccount = getAccount(ownerEmail)
              const ownerStatus = ownerAccount
                ? getConsumerAccountStatus(ownerAccount)
                : { label: 'Unverified', tone: 'neutral' as const }
              return <AdminBadge tone={ownerStatus.tone}>{ownerStatus.label}</AdminBadge>
            })()}
            <StatusBadge status={status} />
            <OrgModerationBadges org={org} />
            {request && (
              <AdminBadge tone="neutral">
                Attempt {formatVerificationAttemptShort(request.requestNumber)}
              </AdminBadge>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[var(--admin-text-dim)]">
            Owner {org.primaryAdminEmail ?? org.createdBy} · {memberCount} members · Created{' '}
            {new Date(org.createdAt).toLocaleDateString()}
          </p>
        </section>

        <section>
          <p className="admin-label mb-2">Owner subscription</p>
          <p className="mb-2 text-xs text-[var(--admin-text-muted)]">
            Personal plan for {getOrganizationOwnerEmail(org)} — updates Event Manager under &ldquo;Your
            plan&rdquo;.
          </p>
          <label className="block max-w-xs">
            <span className="admin-label">Owner tier</span>
            <AdminSelect
              className="mt-1"
              value={ownerAccount?.tier ?? 'free'}
              onChange={(e) => onOwnerTierChange(e.target.value as UserTier)}
            >
              {USER_TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
          </label>
        </section>

        {ownerAccount && (
          <AdminAccountSubscriptionSection
            account={ownerAccount}
            subtitle="Owner account — founding rates apply to their Stripe subscription when live."
          />
        )}

        {/* Location — country field for future People page geo filters */}
        <section>
          <p className="admin-label mb-2">Location</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="admin-label">Country</span>
              <AdminSelect
                className="mt-1"
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
              >
                {DEFAULT_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </AdminSelect>
            </label>
            <div>
              <p className="admin-label">Owner city</p>
              <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{ownerCity}</p>
            </div>
          </div>
        </section>

        {/* Verification — expandable to dedicated tab later */}
        <section className="border-t border-[var(--admin-border)] pt-4">
          <p className="admin-label mb-2">Verification</p>
          {request && (
            <p className="mb-2 text-xs text-[var(--admin-text-muted)]">
              Submitted {new Date(request.submittedAt).toLocaleString()} by {request.submittedBy}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {isPending && (
              <>
                <AdminButton variant="primary" onClick={onApprove}>
                  Approve
                </AdminButton>
                <AdminButton variant="danger" onClick={onReject}>
                  Reject
                </AdminButton>
              </>
            )}
            {status !== 'approved' && !isPending && (
              <AdminButton variant="secondary" onClick={onMarkApproved}>
                Mark approved
              </AdminButton>
            )}
            {status !== 'rejected' && (
              <AdminButton variant="danger" onClick={onMarkRejected}>
                Mark rejected
              </AdminButton>
            )}
          </div>
          {org.rejectionReason && (
            <p className="mt-2 text-xs text-[var(--admin-danger)]">
              Last rejection: {org.rejectionReason}
            </p>
          )}
        </section>

        <AdminMerchControls
          profileLabel={org.name}
          hostKey={{ type: 'org', id: org.id }}
          settings={getHostMerchSettingsFromOrg(org)}
          onUpdate={onMerchUpdate}
          embedded
        />

        <section className="border-t border-[var(--admin-border)] pt-4">
          <p className="admin-label mb-2">Moderation</p>

          {org.banned ? (
            <div className="mb-3 rounded-[var(--admin-radius)] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-[var(--admin-text-muted)]">
              <p className="font-medium text-rose-300">Organization terminated</p>
              {org.bannedAt && (
                <p className="mt-1">Banned {new Date(org.bannedAt).toLocaleString()}</p>
              )}
              {org.banReviewUntil && (
                <p>Data retained until {formatSuspendUntil(org.banReviewUntil)}</p>
              )}
              <p className="mt-1 text-rose-200">
                Owner {getOrganizationOwnerEmail(org)} — sign-in blocked
              </p>
            </div>
          ) : isOrganizationSuspended(org) ? (
            <div className="mb-3 rounded-[var(--admin-radius)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-[var(--admin-text-muted)]">
              <p className="font-medium text-amber-200">Suspended</p>
              {org.suspendedUntil && (
                <p className="mt-1">
                  Ends {formatSuspendUntil(org.suspendedUntil)}
                  {org.suspendDuration &&
                    ` (${getSuspendDurationLabel(org.suspendDuration)})`}
                </p>
              )}
            </div>
          ) : null}

          {!org.banned && (
            <div className="mb-3">
              <p className="mb-2 text-[11px] text-[var(--admin-text-dim)]">
                Suspend organization (Terms of Service violation)
              </p>
              {isOrganizationSuspended(org) ? (
                <AdminButton
                  variant="secondary"
                  onClick={() =>
                    onConfirmAction({
                      type: 'unsuspend',
                      orgId: org.id,
                      orgName: org.name,
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
                        onConfirmAction({
                          type: 'suspend',
                          orgId: org.id,
                          orgName: org.name,
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
                onConfirmAction(
                  org.banned
                    ? { type: 'unban', orgId: org.id, orgName: org.name }
                    : { type: 'ban', orgId: org.id, orgName: org.name },
                )
              }
            >
              {org.banned ? 'Unban organization' : 'Ban organization'}
            </AdminButton>
            <AdminButton
              variant="ghost"
              onClick={() => navigate('/admin/support?tab=send#moderation-templates')}
            >
              Edit moderation messages
            </AdminButton>
          </div>
        </section>

        <section>
          <p className="admin-label mb-2">Links</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <Link
              to={`/admin/organizations/${org.id}`}
              className="text-[var(--admin-accent)] no-underline hover:underline"
            >
              Org overview
            </Link>
            <Link
              to={`/admin/organizations/${org.id}/team`}
              className="text-[var(--admin-accent)] no-underline hover:underline"
            >
              Team
            </Link>
            {org.backupAdminEmail && (
              <span className="text-[var(--admin-text-dim)]">
                Backup admin: {org.backupAdminEmail}
              </span>
            )}
          </div>
        </section>
      </div>
    </AdminDrawer>
  )
}

function StatusBadge({ status }: { status: OrgApprovalStatus }) {
  const tone =
    status === 'approved' ? 'emerald' : status === 'pending' ? 'amber' : 'rose'
  return <AdminBadge tone={tone}>{status}</AdminBadge>
}

function OrgModerationBadges({ org }: { org: Organization }) {
  if (isOrganizationBanned(org)) {
    return <AdminBadge tone="rose">Banned</AdminBadge>
  }
  if (isOrganizationSuspended(org)) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <AdminBadge tone="amber">Suspended</AdminBadge>
        {org.suspendedUntil && (
          <span className="text-[10px] text-[var(--admin-text-dim)]">
            until {formatSuspendUntil(org.suspendedUntil)}
          </span>
        )}
      </div>
    )
  }
  return null
}

function OrgStatusBadges({
  org,
  approvalStatus,
}: {
  org: Organization
  approvalStatus: OrgApprovalStatus
}) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <StatusBadge status={approvalStatus} />
      <OrgModerationBadges org={org} />
    </div>
  )
}
