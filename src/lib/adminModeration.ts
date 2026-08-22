import { sendAdminMessage } from './adminMessages'
import {
  getAccount,
  getOrganization,
  getOrganizationOwnerEmail,
  saveAccount,
  updateOrganization,
  type Organization,
  type SuspendDuration,
  type UserAccount,
} from './account'
import { getAllUsers } from './auth'

const TEMPLATES_KEY = 'tudu-admin-moderation-templates'

export type ModerationTemplateId =
  | 'suspendTermsViolation'
  | 'banTermination'
  | 'orgSuspendTermsViolation'
  | 'orgBanTermination'

export type ModerationTemplates = {
  suspendTermsViolation: string
  banTermination: string
  orgSuspendTermsViolation: string
  orgBanTermination: string
}

export const DEFAULT_MODERATION_TEMPLATES: ModerationTemplates = {
  suspendTermsViolation:
    'Your TUDU account has been suspended for {{duration}} for violating our Terms of Service. Suspension ends {{until}}. Contact support if you believe this is an error.',
  banTermination:
    'Your TUDU account has been terminated for violating our Terms of Service. Your data will be retained for one year pending review. This email address has been flagged and cannot be used to create a new account during this period.',
  orgSuspendTermsViolation:
    'Your organization "{{orgName}}" has been suspended for {{duration}} for violating our Terms of Service. Suspension ends {{until}}. Public events and publishing are disabled until then. Contact support if you believe this is an error.',
  orgBanTermination:
    'Your organization "{{orgName}}" has been terminated for violating our Terms of Service. Your data will be retained for one year pending review. The owner account ({{ownerEmail}}) has been flagged and sign-in is blocked.',
}

export const MODERATION_TEMPLATE_SUBJECTS: Record<ModerationTemplateId, string> = {
  suspendTermsViolation: 'TUDU account suspended',
  banTermination: 'TUDU account terminated',
  orgSuspendTermsViolation: 'TUDU organization suspended',
  orgBanTermination: 'TUDU organization terminated',
}

export const SUSPEND_DURATION_OPTIONS: { id: SuspendDuration; label: string }[] = [
  { id: '24h', label: '24 hours' },
  { id: '3d', label: '3 days' },
  { id: '1w', label: '1 week' },
  { id: '1mo', label: '1 month' },
]

function readTemplates(): ModerationTemplates {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    if (!raw) return { ...DEFAULT_MODERATION_TEMPLATES }
    const parsed = JSON.parse(raw) as Partial<ModerationTemplates>
    return {
      suspendTermsViolation:
        parsed.suspendTermsViolation?.trim() || DEFAULT_MODERATION_TEMPLATES.suspendTermsViolation,
      banTermination:
        parsed.banTermination?.trim() || DEFAULT_MODERATION_TEMPLATES.banTermination,
      orgSuspendTermsViolation:
        parsed.orgSuspendTermsViolation?.trim() ||
        DEFAULT_MODERATION_TEMPLATES.orgSuspendTermsViolation,
      orgBanTermination:
        parsed.orgBanTermination?.trim() || DEFAULT_MODERATION_TEMPLATES.orgBanTermination,
    }
  } catch {
    return { ...DEFAULT_MODERATION_TEMPLATES }
  }
}

export function getModerationTemplates(): ModerationTemplates {
  return readTemplates()
}

export function saveModerationTemplates(templates: ModerationTemplates): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export function renderModerationTemplate(
  template: string,
  vars: {
    name?: string
    email?: string
    duration?: string
    until?: string
    orgName?: string
    ownerEmail?: string
  },
): string {
  return template
    .replace(/\{\{name\}\}/g, vars.name ?? '')
    .replace(/\{\{email\}\}/g, vars.email ?? '')
    .replace(/\{\{duration\}\}/g, vars.duration ?? '')
    .replace(/\{\{until\}\}/g, vars.until ?? '')
    .replace(/\{\{orgName\}\}/g, vars.orgName ?? '')
    .replace(/\{\{ownerEmail\}\}/g, vars.ownerEmail ?? '')
}

function resolveUserName(email: string): string {
  const user = getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return email
  return `${user.firstName} ${user.lastName}`.trim() || email
}

export function sendModerationMessage(input: {
  toEmail: string
  templateId: ModerationTemplateId
  duration?: string
  until?: string
  orgName?: string
}): void {
  const templates = getModerationTemplates()
  const body = renderModerationTemplate(templates[input.templateId], {
    name: resolveUserName(input.toEmail),
    email: input.toEmail,
    duration: input.duration,
    until: input.until,
    orgName: input.orgName,
    ownerEmail: input.toEmail,
  })
  sendAdminMessage({
    toEmail: input.toEmail,
    subject: MODERATION_TEMPLATE_SUBJECTS[input.templateId],
    body,
    deliveryChannels: ['in_app', 'email'],
  })
}

export function applyTimedSuspension(
  email: string,
  duration: SuspendDuration,
): UserAccount | null {
  const account = getAccount(email)
  if (!account) return null

  const now = new Date()
  const suspendedAt = now.toISOString()
  const suspendedUntil = getSuspendUntilFromDuration(duration, now)

  return saveAccount({
    ...account,
    suspended: true,
    suspendedAt,
    suspendedUntil,
    suspendDuration: duration,
  })
}

export function clearSuspension(email: string): UserAccount | null {
  const account = getAccount(email)
  if (!account) return null
  return saveAccount({
    ...account,
    suspended: false,
    suspendedAt: undefined,
    suspendedUntil: undefined,
    suspendDuration: undefined,
  })
}

export function applyAccountBan(email: string): UserAccount | null {
  const account = getAccount(email)
  if (!account) return null

  const bannedAt = new Date().toISOString()
  const banReviewUntil = new Date(new Date(bannedAt).getTime())
  banReviewUntil.setFullYear(banReviewUntil.getFullYear() + 1)

  return saveAccount({
    ...account,
    banned: true,
    bannedAt,
    banReviewUntil: banReviewUntil.toISOString(),
    emailFlagged: true,
    suspended: false,
    suspendedAt: undefined,
    suspendedUntil: undefined,
    suspendDuration: undefined,
  })
}

export function clearAccountBan(email: string): UserAccount | null {
  const account = getAccount(email)
  if (!account) return null
  return saveAccount({
    ...account,
    banned: false,
    emailFlagged: false,
  })
}

export function suspendOrganization(
  orgId: string,
  duration: SuspendDuration,
): Organization | null {
  const org = getOrganization(orgId)
  if (!org) return null

  const now = new Date()
  const suspendedAt = now.toISOString()
  const suspendedUntil = getSuspendUntilFromDuration(duration, now)
  const ownerEmail = getOrganizationOwnerEmail(org)

  applyTimedSuspension(ownerEmail, duration)

  return updateOrganization(orgId, {
    suspended: true,
    suspendedAt,
    suspendedUntil,
    suspendDuration: duration,
  })
}

export function clearOrgSuspension(orgId: string): Organization | null {
  const org = getOrganization(orgId)
  if (!org) return null

  const ownerEmail = getOrganizationOwnerEmail(org)
  clearSuspension(ownerEmail)

  return updateOrganization(orgId, {
    suspended: false,
    suspendedAt: undefined,
    suspendedUntil: undefined,
    suspendDuration: undefined,
  })
}

export function banOrganization(orgId: string): Organization | null {
  const org = getOrganization(orgId)
  if (!org) return null

  const ownerEmail = getOrganizationOwnerEmail(org)
  applyAccountBan(ownerEmail)

  const bannedAt = new Date().toISOString()
  const banReviewUntil = new Date(new Date(bannedAt).getTime())
  banReviewUntil.setFullYear(banReviewUntil.getFullYear() + 1)

  return updateOrganization(orgId, {
    banned: true,
    bannedAt,
    banReviewUntil: banReviewUntil.toISOString(),
    suspended: false,
    suspendedAt: undefined,
    suspendedUntil: undefined,
    suspendDuration: undefined,
  })
}

export function clearOrgBan(orgId: string): Organization | null {
  const org = getOrganization(orgId)
  if (!org) return null

  const ownerEmail = getOrganizationOwnerEmail(org)
  clearAccountBan(ownerEmail)

  return updateOrganization(orgId, {
    banned: false,
    bannedAt: undefined,
    banReviewUntil: undefined,
  })
}

export function getSuspendUntilFromDuration(duration: SuspendDuration, from = new Date()): string {
  const d = new Date(from)
  switch (duration) {
    case '24h':
      d.setHours(d.getHours() + 24)
      break
    case '3d':
      d.setDate(d.getDate() + 3)
      break
    case '1w':
      d.setDate(d.getDate() + 7)
      break
    case '1mo':
      d.setMonth(d.getMonth() + 1)
      break
  }
  return d.toISOString()
}

export function getSuspendDurationLabel(duration: SuspendDuration): string {
  return SUSPEND_DURATION_OPTIONS.find((o) => o.id === duration)?.label ?? duration
}

export function formatSuspendUntil(until?: string): string {
  if (!until) return ''
  return new Date(until).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
