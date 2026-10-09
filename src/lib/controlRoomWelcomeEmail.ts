import { sendAdminMessage } from './adminMessages'
import { getControlRoomSignInPath } from './controlRoomRoutes'

export function controlRoomSignInUrl(origin?: string): string {
  const path = getControlRoomSignInPath()
  if (origin) return `${origin.replace(/\/$/, '')}${path}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }
  return path
}

export function buildControlRoomWelcomeEmail(input: {
  firstName: string
  email: string
  password: string
  department: string
  signInUrl?: string
}): { subject: string; body: string } {
  const signInUrl = input.signInUrl ?? controlRoomSignInUrl()
  const subject = 'Your TUDU Control Room login'
  const body = [
    `Hi ${input.firstName.trim()},`,
    '',
    'You have been added to the TUDU Control Room team.',
    '',
    'Sign in here:',
    signInUrl,
    '',
    `Email: ${input.email}`,
    `Temporary password: ${input.password}`,
    '',
    'Keep this password private. Change it after your first sign-in when password updates are available.',
    '',
    '— TUDU Platform',
  ].join('\n')

  return { subject, body }
}

/** Phase 1: records outbound message + email stub (see Control Room → Messages). */
export function sendControlRoomWelcomeEmail(
  input: {
    firstName: string
    email: string
    password: string
    department: string
    signInUrl?: string
  },
  fromEmail: string,
): void {
  const { subject, body } = buildControlRoomWelcomeEmail(input)
  sendAdminMessage({
    toEmail: input.email,
    subject,
    body,
    fromEmail,
    deliveryChannels: ['email', 'in_app'],
    notificationMeta: { type: 'admin_message' },
  })
}
