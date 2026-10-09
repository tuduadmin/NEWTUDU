import { EASTER_EGGS_CHANGED_EVENT, EASTER_EGGS_KEY } from './easterEggs'
import { seedDemoAccount, seedDemoOrgWithAdmin, seedDemoPendingOrg } from './account'
import { DEMO_USER, ORG_ADMIN_USER, PLATFORM_ADMIN } from './demoAccounts'
import {
  seedAdminUser,
  seedDemoUser,
  seedOrgAdminUser,
  signOut,
  type StoredUser,
} from './auth'
import {
  LEGACY_PREFS_KEY,
  PREFS_KEY_PREFIX,
  collectUserPreferenceKeys,
  seedDemoUserPreferences,
} from './preferences'
import { HOST_CONTEXT_KEY, resetHostContextToPersonal } from './hostContext'
import { notifyHostProfilesCleared } from './hostProfileStore'

export {
  HOST_PROFILES_CLEARED_EVENT,
  notifyHostProfilesCleared,
  getHostProfileStoreRevision,
  subscribeHostProfileStore,
} from './hostProfileStore'

export const PERSONAL_HOST_PROFILE_KEY = 'tudu_personal_host_profiles'
export const ORG_HOST_PROFILE_KEY = 'tudu_org_host_profiles'
export const HOST_SLIDESHOWS_KEY = 'tudu_host_slideshows'
const ORGS_KEY = 'tudu_organizations'
const USERS_KEY = 'tudu_users'
const ACCOUNTS_KEY = 'tudu_accounts'

/** Host profile/branding keys cleared by {@link clearHostProfiles}. Does not remove org records or events. */
export const HOST_PROFILE_STORAGE_KEYS = [
  PERSONAL_HOST_PROFILE_KEY,
  ORG_HOST_PROFILE_KEY,
  HOST_SLIDESHOWS_KEY,
  HOST_CONTEXT_KEY,
] as const

/** Storage keys whose records are reset (not removed) by host profile clear actions. */
export const HOST_PROFILE_RESET_RECORD_KEYS = [USERS_KEY, ACCOUNTS_KEY, ORGS_KEY] as const

/** localStorage keys that affect host profile UI — watched for cross-tab sync. */
export const HOST_PROFILE_WATCH_KEYS = new Set<string>([
  ...HOST_PROFILE_STORAGE_KEYS,
  ...HOST_PROFILE_RESET_RECORD_KEYS,
  EASTER_EGGS_KEY,
])

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key && HOST_PROFILE_WATCH_KEYS.has(event.key)) {
      notifyHostProfilesCleared()
    }
  })
  window.addEventListener(EASTER_EGGS_CHANGED_EVENT, () => {
    notifyHostProfilesCleared()
  })
}

/** Profile-related localStorage keys cleared by {@link clearAllProfiles}. */
export const PROFILE_STORAGE_KEYS = [
  USERS_KEY,
  ACCOUNTS_KEY,
  LEGACY_PREFS_KEY,
  PREFS_KEY_PREFIX,
  PERSONAL_HOST_PROFILE_KEY,
  ORG_HOST_PROFILE_KEY,
  HOST_SLIDESHOWS_KEY,
  'tudu_travel_pass',
  'tudu_travel_city',
  'tudu_gps_city',
  HOST_CONTEXT_KEY,
] as const

const SETTINGS_PREFIX = 'tudu-settings-'

const ESSENTIAL_USER_DEFAULTS: Record<
  string,
  Pick<StoredUser, 'firstName' | 'lastName' | 'password'>
> = {
  [DEMO_USER.email.toLowerCase()]: {
    firstName: DEMO_USER.firstName,
    lastName: DEMO_USER.lastName,
    password: DEMO_USER.password,
  },
  [PLATFORM_ADMIN.email.toLowerCase()]: {
    firstName: PLATFORM_ADMIN.firstName,
    lastName: PLATFORM_ADMIN.lastName,
    password: PLATFORM_ADMIN.password,
  },
}

export type ClearProfilesResult = {
  removedUserCount: number
  removedAccountCount: number
  clearedKeys: string[]
  keptEmails: string[]
}

export type ClearHostProfilesResult = {
  clearedKeys: string[]
  resetPostingAsCount: number
  clearedSlideshowKeys: number
  resetUserNameCount: number
  resetOrgProfileCount: number
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function isEssentialEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return (
    normalized === DEMO_USER.email.toLowerCase() ||
    normalized === PLATFORM_ADMIN.email.toLowerCase()
  )
}

function defaultStoredUser(
  source: typeof DEMO_USER | typeof PLATFORM_ADMIN | typeof ORG_ADMIN_USER,
): StoredUser {
  return {
    email: source.email,
    password: source.password,
    firstName: source.firstName,
    lastName: source.lastName,
    username: source.username,
  }
}

function collectSettingsKeys(): string[] {
  return Object.keys(localStorage).filter((key) => key.startsWith(SETTINGS_PREFIX))
}

/** Restore demo/admin display names used by /host when personal host profiles are cleared. */
function resetEssentialUserNames(): number {
  const users = readJson<StoredUser[]>(USERS_KEY, [])
  let resetUserNameCount = 0
  const updated = users.map((user) => {
    const defaults = ESSENTIAL_USER_DEFAULTS[user.email.toLowerCase()]
    if (!defaults) return user

    const changed =
      user.firstName !== defaults.firstName ||
      user.lastName !== defaults.lastName ||
      user.password !== defaults.password

    if (!changed) return user

    resetUserNameCount += 1
    return {
      ...user,
      firstName: defaults.firstName,
      lastName: defaults.lastName,
      password: defaults.password,
    }
  })

  if (resetUserNameCount > 0) {
    localStorage.setItem(USERS_KEY, JSON.stringify(updated))
  }
  return resetUserNameCount
}

/** Reset postingAs and activeOrgId so Event Manager returns to personal mode. */
function resetAccountHostContext(forcePersonal = false): number {
  const accounts = readJson<
    { postingAs?: string; activeOrgId?: string }[]
  >(ACCOUNTS_KEY, [])
  let resetPostingAsCount = 0
  const updated = accounts.map((account) => {
    const nextPostingAs = forcePersonal
      ? 'personal'
      : account.postingAs && account.postingAs !== 'personal'
        ? 'personal'
        : account.postingAs
    const nextActiveOrgId =
      forcePersonal || account.activeOrgId ? undefined : account.activeOrgId
    const changed =
      nextPostingAs !== account.postingAs || nextActiveOrgId !== account.activeOrgId

    if (!changed) return account

    resetPostingAsCount += 1
    return {
      ...account,
      postingAs: nextPostingAs ?? 'personal',
      activeOrgId: nextActiveOrgId,
    }
  })

  if (resetPostingAsCount > 0) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated))
  }
  return resetPostingAsCount
}

/** Clear org bio/branding stored on the organization record (Edit Public Profile saves here too). */
function clearOrganizationProfileFields(): number {
  const orgs = readJson<{ profile?: string }[]>(ORGS_KEY, [])
  let resetOrgProfileCount = 0
  const updated = orgs.map((org) => {
    if (!org.profile) return org
    resetOrgProfileCount += 1
    const { profile: _removed, ...rest } = org
    return rest
  })

  if (resetOrgProfileCount > 0) {
    localStorage.setItem(ORGS_KEY, JSON.stringify(updated))
  }
  return resetOrgProfileCount
}

function clearSlideshowKeys(scope: 'all' | 'personal' | 'org'): number {
  const all = readJson<Record<string, unknown>>(HOST_SLIDESHOWS_KEY, {})
  const keys = Object.keys(all)
  if (keys.length === 0) return 0

  if (scope === 'all') {
    localStorage.removeItem(HOST_SLIDESHOWS_KEY)
    return keys.length
  }

  const next = { ...all }
  let clearedSlideshowKeys = 0
  for (const key of keys) {
    const isPersonal = key.startsWith('personal:')
    const shouldRemove = scope === 'personal' ? isPersonal : !isPersonal
    if (shouldRemove) {
      delete next[key]
      clearedSlideshowKeys += 1
    }
  }

  if (clearedSlideshowKeys === keys.length) {
    localStorage.removeItem(HOST_SLIDESHOWS_KEY)
  } else if (clearedSlideshowKeys > 0) {
    localStorage.setItem(HOST_SLIDESHOWS_KEY, JSON.stringify(next))
  }
  return clearedSlideshowKeys
}

function buildHostClearResult(
  clearedKeys: string[],
  scope: 'all' | 'personal' | 'org',
): ClearHostProfilesResult {
  const resetUserNameCount = scope === 'org' ? 0 : resetEssentialUserNames()
  const resetOrgProfileCount = scope === 'personal' ? 0 : clearOrganizationProfileFields()
  const resetPostingAsCount =
    scope === 'personal' ? 0 : resetAccountHostContext(scope === 'all')
  if (scope !== 'personal') {
    resetHostContextToPersonal()
  }

  const result: ClearHostProfilesResult = {
    clearedKeys,
    resetPostingAsCount,
    clearedSlideshowKeys: 0,
    resetUserNameCount,
    resetOrgProfileCount,
  }
  notifyHostProfilesCleared()
  return result
}

/** Clears personal host profile customizations (avatar, bio, social, slideshow). Keeps user accounts and events. */
export function clearPersonalHostProfiles(): ClearHostProfilesResult {
  localStorage.removeItem(PERSONAL_HOST_PROFILE_KEY)
  const clearedSlideshowKeys = clearSlideshowKeys('personal')
  const result = buildHostClearResult([PERSONAL_HOST_PROFILE_KEY], 'personal')
  return { ...result, clearedSlideshowKeys }
}

/** Clears org host profile customizations (logo, bio, social, slideshow). Keeps org records, members, and events. */
export function clearOrgHostProfiles(): ClearHostProfilesResult {
  localStorage.removeItem(ORG_HOST_PROFILE_KEY)
  const clearedSlideshowKeys = clearSlideshowKeys('org')
  const hadOrgContext = (() => {
    const raw = localStorage.getItem(HOST_CONTEXT_KEY)
    return raw !== null && raw !== 'personal'
  })()
  const clearedKeys = [ORG_HOST_PROFILE_KEY]
  if (hadOrgContext) clearedKeys.push(HOST_CONTEXT_KEY)
  const result = buildHostClearResult(clearedKeys, 'org')
  return { ...result, clearedSlideshowKeys }
}

/**
 * Clears personal and org host profile/branding data.
 * Resets Event Manager context to personal, demo/admin display names, org bios,
 * and postingAs/activeOrgId on all accounts.
 * Does not remove users, organizations, memberships, or events.
 */
export function clearHostProfiles(): ClearHostProfilesResult {
  localStorage.removeItem(PERSONAL_HOST_PROFILE_KEY)
  localStorage.removeItem(ORG_HOST_PROFILE_KEY)
  const clearedSlideshowKeys = clearSlideshowKeys('all')
  const result = buildHostClearResult([...HOST_PROFILE_STORAGE_KEYS], 'all')
  return { ...result, clearedSlideshowKeys }
}

/**
 * Reset all user profiles to a clean demo state.
 * Keeps admin@tudu.ca and demo@tudu.ca with default credentials, clears custom
 * profile data, and re-seeds essential accounts so the app still boots.
 */
export function clearAllProfiles(): ClearProfilesResult {
  const users = readJson<StoredUser[]>(USERS_KEY, [])
  const accounts = readJson<{ email: string }[]>('tudu_accounts', [])

  const removedUserCount = users.filter((u) => !isEssentialEmail(u.email)).length
  const removedAccountCount = accounts.filter((a) => !isEssentialEmail(a.email)).length

  const sessionEmail = localStorage.getItem('tudu_session')
  if (sessionEmail && !isEssentialEmail(sessionEmail)) {
    signOut()
  }

  localStorage.removeItem(LEGACY_PREFS_KEY)
  collectUserPreferenceKeys().forEach((key) => {
    if (key !== LEGACY_PREFS_KEY) localStorage.removeItem(key)
  })
  localStorage.removeItem(PERSONAL_HOST_PROFILE_KEY)
  localStorage.removeItem(ORG_HOST_PROFILE_KEY)
  localStorage.removeItem(HOST_SLIDESHOWS_KEY)
  localStorage.removeItem('tudu_travel_pass')
  localStorage.removeItem('tudu_travel_city')
  localStorage.removeItem('tudu_gps_city')
  localStorage.removeItem(HOST_CONTEXT_KEY)

  const settingsKeys = collectSettingsKeys()
  settingsKeys.forEach((key) => localStorage.removeItem(key))

  const essentialUsers = [
    defaultStoredUser(DEMO_USER),
    defaultStoredUser(PLATFORM_ADMIN),
    defaultStoredUser(ORG_ADMIN_USER),
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(essentialUsers))

  // Drop all account records; startup seeds recreate fresh defaults for admin + demo.
  localStorage.removeItem(ACCOUNTS_KEY)

  seedDemoUser()
  seedAdminUser()
  seedOrgAdminUser()
  seedDemoAccount()
  seedDemoOrgWithAdmin()
  seedDemoPendingOrg()
  seedDemoUserPreferences()

  return {
    removedUserCount,
    removedAccountCount,
    clearedKeys: [...PROFILE_STORAGE_KEYS, ...settingsKeys, ...collectUserPreferenceKeys()],
    keptEmails: [DEMO_USER.email, PLATFORM_ADMIN.email, ORG_ADMIN_USER.email],
  }
}
