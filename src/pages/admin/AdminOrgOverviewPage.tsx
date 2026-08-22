import { useParams } from 'react-router-dom'
import {
  getOrganization,
  getOrganizationApprovalStatus,
  getOrgMembers,
  getOrgDepartments,
  getHostEventsForOrg,
  updateOrganization,
} from '../../lib/account'
import { rejectOrganizationWithNotification } from '../../lib/adminOrganizations'
import { getHiddenGemCountForOrg } from '../../lib/hiddenGems'
import {
  approveOrgVerification,
  formatVerificationAttemptShort,
  getOrgVerificationRequestForOrg,
  rejectOrgVerification,
} from '../../lib/orgVerificationRequests'
import AdminOrgRejectDialog, {
  type OrgRejectPayload,
} from '../../components/admin/AdminOrgRejectDialog'
import {
  AdminBadge,
  AdminKpi,
  AdminKpiGrid,
  AdminPanel,
  AdminRowMenu,
} from '../../components/admin/AdminUI'
import AdminOrgEventsSection from '../../components/admin/AdminOrgEventsSection'
import AdminOrgDepartmentsSection from '../../components/admin/AdminOrgDepartmentsSection'
import AdminMerchControls from '../../components/admin/AdminMerchControls'
import { getHostMerchSettingsFromOrg, type HostMerchSettings } from '../../lib/hostMerch'
import { useMemo, useState } from 'react'

export default function AdminOrgOverviewPage() {
  const { orgId = '' } = useParams()
  const [refresh, setRefresh] = useState(0)
  const [rejectOpen, setRejectOpen] = useState(false)
  const org = useMemo(() => {
    void refresh
    return getOrganization(orgId)
  }, [orgId, refresh])
  const eventCount = useMemo(() => {
    void refresh
    return getHostEventsForOrg(orgId).length
  }, [orgId, refresh])

  if (!org) return null

  const members = getOrgMembers(orgId)
  const departments = getOrgDepartments(orgId)
  const gemCount = getHiddenGemCountForOrg(orgId)
  const status = getOrganizationApprovalStatus(org)
  const verificationRequest = getOrgVerificationRequestForOrg(orgId)

  function reload() {
    setRefresh((r) => r + 1)
  }

  function approve() {
    approveOrgVerification(orgId)
    reload()
  }

  function confirmReject(payload: OrgRejectPayload) {
    rejectOrganizationWithNotification(orgId, payload)
    rejectOrgVerification(orgId)
    setRejectOpen(false)
    reload()
  }

  function handleMerchUpdate(partial: Partial<HostMerchSettings>) {
    updateOrganization(orgId, partial)
    reload()
  }

  return (
    <div className="space-y-4">
      <AdminKpiGrid>
        <AdminKpi label="Team members" value={members.length} />
        <AdminKpi label="Departments" value={departments.length} accent="neutral" />
        <AdminKpi label="Hidden gems" value={gemCount} accent="amber" />
        <AdminKpi label="Event posts" value={eventCount} accent="cyan" />
        <AdminKpi
          label="Approval"
          value={status}
          accent={status === 'approved' ? 'emerald' : status === 'pending' ? 'amber' : 'rose'}
        />
        <AdminKpi
          label="Created"
          value={new Date(org.createdAt).toLocaleDateString()}
          accent="neutral"
        />
      </AdminKpiGrid>

      <AdminPanel>
        <p className="admin-label mb-2">Organization details</p>
        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <Detail label="Owner" value={org.createdBy} />
          <Detail label="Primary admin" value={org.primaryAdminEmail || org.createdBy} />
          <Detail label="Backup admin" value={org.backupAdminEmail || '—'} />
          <Detail label="Public contact" value={org.contactEmail || '—'} />
          <Detail label="Category" value={org.category} />
          <Detail label="Logo initial" value={org.logoInitial} />
          {verificationRequest && (
            <Detail
              label="Verification attempt"
              value={formatVerificationAttemptShort(verificationRequest.requestNumber)}
            />
          )}
        </dl>
        {org.profile && (
          <p className="mt-3 text-xs leading-relaxed text-[var(--admin-text-muted)]">{org.profile}</p>
        )}
      </AdminPanel>

      {status === 'rejected' && org.rejectionReason && (
        <AdminPanel>
          <p className="admin-label mb-2">Rejection details</p>
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            {org.rejectedAt && (
              <Detail label="Rejected" value={new Date(org.rejectedAt).toLocaleString()} />
            )}
            {org.rejectedBy && <Detail label="Rejected by" value={org.rejectedBy} />}
            <div className="sm:col-span-2">
              <dt className="text-[var(--admin-text-dim)]">Reason</dt>
              <dd className="font-medium text-[var(--admin-text)]">{org.rejectionReason}</dd>
            </div>
            {org.rejectionMessage && (
              <div className="sm:col-span-2">
                <dt className="text-[var(--admin-text-dim)]">Message sent to owner</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-white/[0.02] p-2 text-[var(--admin-text-muted)]">
                  {org.rejectionMessage}
                </dd>
              </div>
            )}
          </dl>
        </AdminPanel>
      )}

      <AdminPanel>
        <div className="flex items-center justify-between gap-2">
          <p className="admin-label">Approval actions</p>
          <AdminRowMenu
            items={[
              ...(status === 'pending'
                ? [
                    { label: 'Approve', onClick: approve },
                    { label: 'Reject', onClick: () => setRejectOpen(true), danger: true },
                  ]
                : []),
              ...(status !== 'approved'
                ? [{ label: 'Mark approved', onClick: approve }]
                : []),
              ...(status !== 'rejected'
                ? [{ label: 'Mark rejected', onClick: () => setRejectOpen(true), danger: true }]
                : []),
            ]}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
          Current status:{' '}
          <AdminBadge tone={status === 'approved' ? 'emerald' : status === 'pending' ? 'amber' : 'rose'}>
            {status}
          </AdminBadge>
          {verificationRequest?.status === 'pending' && (
            <span className="ml-2 text-[var(--admin-text-dim)]">
              · Queue {formatVerificationAttemptShort(verificationRequest.requestNumber)}
            </span>
          )}
        </p>
      </AdminPanel>

      <AdminMerchControls
        profileLabel={org.name}
        hostKey={{ type: 'org', id: orgId }}
        settings={getHostMerchSettingsFromOrg(org)}
        onUpdate={handleMerchUpdate}
      />

      <AdminOrgDepartmentsSection orgId={orgId} refreshKey={refresh} />

      <AdminOrgEventsSection orgId={orgId} refreshKey={refresh} />

      <AdminOrgRejectDialog
        org={org}
        open={rejectOpen}
        onConfirm={confirmReject}
        onCancel={() => setRejectOpen(false)}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--admin-text-dim)]">{label}</dt>
      <dd className="font-medium text-[var(--admin-text)]">{value}</dd>
    </div>
  )
}
