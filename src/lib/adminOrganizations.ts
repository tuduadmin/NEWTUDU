import { getAllUsers, getCurrentUser, PLATFORM_ADMIN } from './auth'
import { rejectOrganization, type Organization } from './account'
import { sendAdminMessage } from './adminMessages'
import type { DeliveryChannel } from './userNotifications'

const REJECT_TEMPLATE_KEY = 'tudu-org-reject-template'

export const DEFAULT_ORG_REJECT_TEMPLATE =
  'Hi {orgName}, thank you for applying to TUDU. Unfortunately we cannot approve your organization at this time because: {reason}. You may reapply after addressing these items.'

export const ORG_REJECTED_SUBJECT = 'Your organization application was not approved'

export function getOrgRejectTemplate(): string {
  try {
    const saved = localStorage.getItem(REJECT_TEMPLATE_KEY)
    return saved?.trim() || DEFAULT_ORG_REJECT_TEMPLATE
  } catch {
    return DEFAULT_ORG_REJECT_TEMPLATE
  }
}

export function saveOrgRejectTemplate(template: string): void {
  localStorage.setItem(REJECT_TEMPLATE_KEY, template.trim())
}

export function applyOrgRejectTemplate(
  template: string,
  orgName: string,
  reason: string,
): string {
  return template.replace(/\{orgName\}/g, orgName).replace(/\{reason\}/g, reason)
}

export function orgRejectMessageToTemplate(message: string, orgName: string, reason: string): string {
  let template = message
  if (orgName) template = template.split(orgName).join('{orgName}')
  if (reason) template = template.split(reason).join('{reason}')
  return template
}

export function getOrgOwnerDisplayName(email: string): string {
  const user = getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (user?.firstName) return user.firstName
  return email.split('@')[0] ?? email
}

export type RejectOrganizationOptions = {
  rejectionReason: string
  rejectionMessage: string
  sendInApp?: boolean
  sendEmail?: boolean
  rejectedBy?: string
}

export function rejectOrganizationWithNotification(
  orgId: string,
  options: RejectOrganizationOptions,
): Organization | null {
  const rejectionReason = options.rejectionReason.trim()
  const rejectionMessage = options.rejectionMessage.trim()
  if (!rejectionReason || !rejectionMessage) return null

  const rejectedBy =
    options.rejectedBy ?? getCurrentUser()?.email ?? PLATFORM_ADMIN.email
  const org = rejectOrganization(orgId, {
    rejectionReason,
    rejectionMessage,
    rejectedBy,
  })
  if (!org) return null

  const ownerEmail = org.createdBy
  const sendInApp = options.sendInApp ?? true
  const sendEmail = options.sendEmail ?? false

  if (ownerEmail && (sendInApp || sendEmail)) {
    const channels: DeliveryChannel[] = []
    if (sendInApp) channels.push('in_app')
    if (sendEmail) channels.push('email')

    sendAdminMessage({
      toEmail: ownerEmail,
      subject: ORG_REJECTED_SUBJECT,
      body: rejectionMessage,
      fromEmail: rejectedBy,
      deliveryChannels: channels,
      notificationMeta: {
        orgId,
        type: 'org_rejected',
      },
    })
  }

  return org
}
