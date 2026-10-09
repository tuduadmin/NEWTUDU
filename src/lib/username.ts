/** Unique @username rules — expand reserved list later as needed. */

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20

/** Small v1 reserved list (system + brand). Not exhaustive — policy dive later. */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'api',
  'billing',
  'help',
  'mail',
  'moderator',
  'mod',
  'null',
  'official',
  'root',
  'security',
  'staff',
  'support',
  'system',
  'tudu',
  'tuduadmin',
  'tuduca',
  'undefined',
  'verified',
  'www',
])

const USERNAME_PATTERN = /^[a-z][a-z0-9_]*[a-z0-9]$|^[a-z]$/

export type UsernameIssue = 'empty' | 'too_short' | 'too_long' | 'invalid' | 'reserved'

export type UsernameCheckResult =
  | { ok: true; username: string }
  | { ok: false; issue: UsernameIssue; message: string }

/** Strip @, trim, lowercase. */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase()
}

export function isUsernameReserved(username: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(username))
}

export function validateUsername(raw: string): UsernameCheckResult {
  const username = normalizeUsername(raw)

  if (!username) {
    return { ok: false, issue: 'empty', message: 'Please choose a username.' }
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      ok: false,
      issue: 'too_short',
      message: `Username must be at least ${USERNAME_MIN_LENGTH} characters.`,
    }
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      issue: 'too_long',
      message: `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`,
    }
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      issue: 'invalid',
      message:
        'Use letters, numbers, and underscores only. Must start with a letter and not end with an underscore.',
    }
  }
  if (isUsernameReserved(username)) {
    return {
      ok: false,
      issue: 'reserved',
      message: 'That username is reserved. Please choose another.',
    }
  }

  return { ok: true, username }
}

/** Build a starter username from email local-part (may still need de-dupe). */
export function suggestUsernameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'user'
  let base = normalizeUsername(local.replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_'))
  base = base.replace(/^_+|_+$/g, '')
  if (!base || !/^[a-z]/.test(base)) {
    base = `user${base.replace(/[^a-z0-9]/g, '')}`
  }
  if (base.length < USERNAME_MIN_LENGTH) {
    base = `${base}${'0'.repeat(USERNAME_MIN_LENGTH - base.length)}`
  }
  if (base.length > USERNAME_MAX_LENGTH) {
    base = base.slice(0, USERNAME_MAX_LENGTH).replace(/_+$/, '')
  }
  const validated = validateUsername(base)
  if (validated.ok) return validated.username
  return `user${Date.now().toString(36).slice(-6)}`
}

/** Append numeric suffix until normalized candidate passes format (caller checks taken). */
export function withUsernameSuffix(base: string, suffix: number): string {
  const stem = normalizeUsername(base).slice(0, Math.max(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH - 3))
  const candidate = `${stem}${suffix}`
  const validated = validateUsername(candidate)
  return validated.ok ? validated.username : suggestUsernameFromEmail(`${stem}@tudu.local`)
}

export function formatUsernameLabel(username: string): string {
  const normalized = normalizeUsername(username)
  return normalized ? `@${normalized}` : ''
}
