import type { Organization } from './account'
import { getOrganizationApprovalStatus } from './account'
import { getOrgVerificationRequestForOrg } from './orgVerificationRequests'

/** Org public-profile editor submit context — drives button label and action. */
export type OrgProfileSubmitState = 'draft' | 'pending' | 'approved' | 'rejected'

export function hasOrgSubmittedForVerification(org: Organization): boolean {
  if (org.verificationAttemptNumber != null) return true
  if (org.verificationRequestNumber != null) return true
  if (org.verificationSubmittedAt) return true
  const request = getOrgVerificationRequestForOrg(org.id)
  return request?.status === 'pending'
}

export function getOrgProfileSubmitState(org: Organization): OrgProfileSubmitState {
  const approvalStatus = getOrganizationApprovalStatus(org)
  if (approvalStatus === 'approved') return 'approved'
  if (approvalStatus === 'rejected') return 'rejected'
  if (hasOrgSubmittedForVerification(org)) return 'pending'
  return 'draft'
}

export function getOrgProfileSubmitButtonLabel(
  state: OrgProfileSubmitState,
  saved: boolean,
  verificationJustSubmitted = false,
): string {
  if (saved) {
    if (verificationJustSubmitted || state === 'draft' || state === 'rejected') {
      return 'Sent for verification'
    }
    return 'Saved'
  }
  switch (state) {
    case 'approved':
      return 'Save public profile'
    case 'pending':
      return 'Save profile'
    case 'draft':
    case 'rejected':
      return 'Send to verify'
  }
}

export function getOrgProfileSubmitHelperText(state: OrgProfileSubmitState): string | null {
  switch (state) {
    case 'pending':
      return 'Changes apply while your verification request is under review.'
    case 'draft':
    case 'rejected':
      return 'Your Host Account will be reviewed by TUDU before public events are unlocked.'
    case 'approved':
      return null
  }
}

export function shouldSubmitVerificationOnSave(state: OrgProfileSubmitState): boolean {
  return state === 'draft' || state === 'rejected'
}
