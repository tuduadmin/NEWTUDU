import { DEMO_USER, ORG_ADMIN_USER, PLATFORM_ADMIN } from './demoAccounts'

export { DEMO_USER, ORG_ADMIN_USER, PLATFORM_ADMIN } from './demoAccounts'

import { ensureAccount, isEmailFlagged, saveAccount, touchLastActive } from './account'
import { logActivity } from './adminAnalytics'
import { initializeNewUserPreferences, isOnboardingComplete } from './preferences'

export interface StoredUser {
  email: string
  password: string
  firstName: string
  lastName: string
  dob?: string
  hearAbout?: string
  notify?: boolean
  /** ISO timestamp set on sign-up. */
  joinedAt?: string
}

const USERS_KEY = 'tudu_users'
const SESSION_KEY = 'tudu_session'
export const AUTH_SESSION_CHANGED_EVENT = 'tudu-auth-session-changed'
/** Saved email for "Remember me" — persists after sign-out; password is never stored. */
export const REMEMBER_EMAIL_KEY = 'tudu_remember_email'

/**
 * Session is stored in localStorage (`tudu_session`), so it already survives browser restarts.
 * "Remember me" only controls whether the email field is pre-filled on the sign-in page.
 */

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const parsed = raw ? (JSON.parse(raw) as StoredUser[]) : []
    const deduped = dedupeUsers(parsed)
    if (deduped.length !== parsed.length) {
      localStorage.setItem(USERS_KEY, JSON.stringify(deduped))
    }
    return deduped
  } catch {
    return []
  }
}

function dedupeUsers(users: StoredUser[]): StoredUser[] {
  const byEmail = new Map<string, StoredUser>()
  for (const user of users) {
    const key = user.email.trim().toLowerCase()
    if (!key) continue
    const existing = byEmail.get(key)
    byEmail.set(key, existing ? { ...existing, ...user, email: key } : { ...user, email: key })
  }
  return Array.from(byEmail.values())
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(dedupeUsers(users)))
}

/** Remove duplicate sign-up rows (mixed-case emails) from localStorage. */
export function repairStoredUsers(): void {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return
    const repaired = dedupeUsers(JSON.parse(raw) as StoredUser[])
    localStorage.setItem(USERS_KEY, JSON.stringify(repaired))
  } catch {
    /* ignore */
  }
}

function setSession(email: string): void {
  localStorage.setItem(SESSION_KEY, email)
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

function upsertKnownUser(source: typeof DEMO_USER): void {
  const users = getUsers()
  const idx = users.findIndex((u) => u.email.toLowerCase() === source.email.toLowerCase())
  const record: StoredUser = {
    email: source.email,
    password: source.password,
    firstName: source.firstName,
    lastName: source.lastName,
  }
  if (idx === -1) {
    users.push(record)
  } else {
    users[idx] = { ...users[idx], ...record }
  }
  saveUsers(users)
}

function ensureDemoAccountCanSignIn(): void {
  const account = ensureAccount(DEMO_USER.email)
  if (account.banned || account.emailFlagged || account.suspended) {
    saveAccount({
      ...account,
      banned: false,
      bannedAt: undefined,
      banReviewDueAt: undefined,
      emailFlagged: false,
      suspended: false,
      suspendedAt: undefined,
      suspendedUntil: undefined,
      suspendDuration: undefined,
    })
  }
}

/** Reset demo/org demo login credentials — safe to run on every app load. */
export function repairKnownDemoUsers(): void {
  upsertKnownUser(DEMO_USER)
  upsertKnownUser(ORG_ADMIN_USER)
  ensureDemoAccountCanSignIn()
  ensureAccount(ORG_ADMIN_USER.email)
}

export function seedOrgAdminUser(): void {
  upsertKnownUser(ORG_ADMIN_USER)
  ensureAccount(ORG_ADMIN_USER.email)
}

export function seedDemoUser(): void {
  repairKnownDemoUsers()
}

export function seedAdminUser(): void {
  const users = getUsers()
  const idx = users.findIndex(
    (u) => u.email.toLowerCase() === PLATFORM_ADMIN.email.toLowerCase(),
  )
  const adminRecord: StoredUser = {
    email: PLATFORM_ADMIN.email,
    password: PLATFORM_ADMIN.password,
    firstName: PLATFORM_ADMIN.firstName,
    lastName: PLATFORM_ADMIN.lastName,
  }
  if (idx === -1) {
    users.push(adminRecord)
  } else {
    users[idx] = { ...users[idx], ...adminRecord }
  }
  saveUsers(users)

  const account = ensureAccount(PLATFORM_ADMIN.email)
  if (account.banned || account.emailFlagged || account.suspended) {
    saveAccount({
      ...account,
      banned: false,
      bannedAt: undefined,
      banReviewDueAt: undefined,
      emailFlagged: false,
      suspended: false,
      suspendedAt: undefined,
      suspendedUntil: undefined,
      suspendDuration: undefined,
    })
  }
}

export function isPlatformAdmin(email?: string | null): boolean {
  const sessionEmail =
    typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null
  const resolved = email ?? getCurrentUser()?.email ?? sessionEmail
  return resolved?.toLowerCase() === PLATFORM_ADMIN.email.toLowerCase()
}

export function getAllUsers(): StoredUser[] {
  return getUsers()
}

export function signUp(userData: StoredUser): boolean {
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return false
  }
  if (isEmailFlagged(userData.email)) {
    return false
  }
  const joinedAt = new Date().toISOString()
  users.push({ ...userData, joinedAt })
  saveUsers(users)
  setSession(userData.email)
  ensureAccount(userData.email)
  initializeNewUserPreferences(userData.email)
  logActivity({
    type: 'signup',
    label: 'New user registered',
    meta: { email: userData.email },
  })
  return true
}

export function getRememberedEmail(): string | null {
  try {
    return localStorage.getItem(REMEMBER_EMAIL_KEY)
  } catch {
    return null
  }
}

export function setRememberMe(email: string, remember: boolean): void {
  if (remember && email.trim()) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim())
  } else {
    localStorage.removeItem(REMEMBER_EMAIL_KEY)
  }
}

export function findUserByEmail(email: string): StoredUser | null {
  return (
    getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null
  )
}

export function signIn(
  email: string,
  password: string,
  options?: { remember?: boolean },
): { ok: boolean; error?: string } {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  )
  if (!user) return { ok: false, error: 'Invalid email or password.' }

  const account = ensureAccount(user.email)
  if (account.banned || account.emailFlagged || isEmailFlagged(user.email)) {
    return {
      ok: false,
      error:
        'This account has been terminated. Contact support if you believe this is an error.',
    }
  }

  setSession(user.email)
  touchLastActive(user.email)
  setRememberMe(user.email, options?.remember ?? false)
  return { ok: true }
}

/** Clears session only; remembered email (if any) is kept for the next sign-in. */
export function signOut(): void {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

/** Email from the active session — use this instead of getCurrentUser()?.email for account lookup. */
export function getSessionEmail(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(SESSION_KEY) !== null
}

export function getCurrentUser(): StoredUser | null {
  const email = localStorage.getItem(SESSION_KEY)
  if (!email) return null
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
}

export function updateUserPassword(email: string, newPassword: string): boolean {
  const users = getUsers()
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())
  if (idx < 0) return false
  users[idx] = { ...users[idx], password: newPassword }
  saveUsers(users)
  return true
}

/** Split a full display name into first + last (matches sign-up). */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName = parts.slice(1).join(' ') || firstName
  return { firstName, lastName }
}

/** Login name from the user record (first + last). */
export function getLoginNameFromUser(email: string): string {
  const user = findUserByEmail(email)
  if (!user) return ''
  return `${user.firstName} ${user.lastName}`.trim()
}

/** Update login name on the user record. */
export function updateLoginName(email: string, fullName: string): boolean {
  const users = getUsers()
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())
  if (idx < 0) return false
  const { firstName, lastName } = splitFullName(fullName)
  users[idx] = { ...users[idx], firstName, lastName }
  saveUsers(users)
  return true
}

/** Phase 1: in-app reset when email matches a local account (no email delivery yet). */
export function resetPasswordByEmail(
  email: string,
  newPassword: string,
): { ok: boolean; error?: string } {
  const trimmed = email.trim()
  if (!trimmed) return { ok: false, error: 'Enter your email address.' }
  if (newPassword.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }
  if (!findUserByEmail(trimmed)) {
    return { ok: false, error: 'No account found with that email address.' }
  }
  if (!updateUserPassword(trimmed, newPassword)) {
    return { ok: false, error: 'Unable to reset password. Please try again.' }
  }
  return { ok: true }
}

export function getPostAuthPath(): string {
  if (isPlatformAdmin()) return '/admin'
  return isOnboardingComplete() ? '/discover' : '/onboarding/interests'
}

export function getDiscoverPath(): string {
  if (!isAuthenticated()) return '/signin'
  if (isPlatformAdmin()) return '/admin'
  return isOnboardingComplete() ? '/discover' : '/onboarding/interests'
}

export function getHostPath(): string {
  if (!isAuthenticated()) return '/signin'
  return '/host'
}
