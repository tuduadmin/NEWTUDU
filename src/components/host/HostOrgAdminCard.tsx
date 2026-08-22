import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Mail } from 'lucide-react'
import type { Organization, OrgApprovalStatus } from '../../lib/account'
import { getOrganizationApprovalStatus } from '../../lib/account'
import { getOrgVerificationRequestForOrg, formatVerificationAttemptShort } from '../../lib/orgVerificationRequests'
import { getUserNotificationsForOrg } from '../../lib/userNotifications'

type HostOrgAdminCardProps = {
  org: Organization
  userEmail: string
}

function verificationStatusLabel(status: OrgApprovalStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending review'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Not approved'
  }
}

function verificationStatusClass(status: OrgApprovalStatus): string {
  switch (status) {
    case 'pending':
      return 'text-orange'
    case 'approved':
      return 'text-success'
    case 'rejected':
      return 'text-maroon'
  }
}

export default function HostOrgAdminCard({ org, userEmail }: HostOrgAdminCardProps) {
  const approvalStatus = getOrganizationApprovalStatus(org)
  const verificationRequest = getOrgVerificationRequestForOrg(org.id)
  const attemptNumber =
    verificationRequest?.requestNumber ??
    org.verificationAttemptNumber ??
    org.verificationRequestNumber

  const orgNotifications = useMemo(
    () => getUserNotificationsForOrg(userEmail, org.id),
    [userEmail, org.id],
  )

  const unreadCount = orgNotifications.filter((n) => !n.read).length
  const latestNotification = orgNotifications[0]
  const messageCount = orgNotifications.length

  const notificationsUrl = `/my-tudu/notifications?org=${encodeURIComponent(org.id)}&returnTo=${encodeURIComponent('/host')}`

  return (
    <section className="mt-3 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-purple/10 text-purple">
          <Building2 size={16} />
        </span>
        <h2 className="font-display text-sm font-bold text-brown">Organization</h2>
      </div>

      <ul className="mt-3 space-y-2 text-xs">
        <li className="flex items-center justify-between gap-2">
          <span className="text-brown-muted">
            {attemptNumber != null ? (
              <>
                Verification {formatVerificationAttemptShort(attemptNumber)}
                <span className="mx-1.5 text-brown/20">|</span>
              </>
            ) : (
              <>Verification status</>
            )}
            <span className={`font-semibold ${verificationStatusClass(approvalStatus)}`}>
              {verificationStatusLabel(approvalStatus)}
            </span>
          </span>
        </li>

        <li className="flex items-start gap-2">
          <Mail size={14} className="mt-0.5 shrink-0 text-brown-muted" />
          <div className="min-w-0 flex-1">
            {messageCount === 0 ? (
              <span className="text-brown-muted">No messages from TUDU</span>
            ) : (
              <>
                <span className="font-semibold text-brown">
                  {messageCount === 1
                    ? '1 message from TUDU'
                    : `${messageCount} messages from TUDU`}
                  {unreadCount > 0 && (
                    <span className="ml-1.5 rounded-[14px] bg-orange/15 px-1.5 py-0.5 text-[10px] font-bold text-orange">
                      {unreadCount} new
                    </span>
                  )}
                </span>
                {latestNotification && (
                  <p className="mt-0.5 truncate text-brown-muted">{latestNotification.subject}</p>
                )}
              </>
            )}
          </div>
        </li>
      </ul>

      <Link
        to={notificationsUrl}
        className="mt-3 flex items-center justify-end gap-0.5 text-xs font-semibold text-orange no-underline transition hover:brightness-110"
      >
        View all
        <ChevronRight size={14} />
      </Link>
    </section>
  )
}
