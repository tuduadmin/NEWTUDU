import { ADMIN_THEME_STORAGE_KEY } from './adminTheme'
import { SIDEBAR_ORDER_KEY } from './adminSidebarNav'
import { DEMO_USER, ORG_ADMIN_USER, PLATFORM_ADMIN } from './demoAccounts'
import { REMEMBER_EMAIL_KEY, signOut } from './auth'
import { CREATE_EVENT_DRAFT_KEY } from './createEventDraft'
import { clearAllProfiles, type ClearProfilesResult } from './profileReset'
import { purgeRemovedDemoEventsFromLocalStorage } from './removedDemoEvents'

const DEMO_ORG_SEED_ID = 'org_demo_kindersley'

const ESSENTIAL_EMAILS = new Set(
  [DEMO_USER.email, PLATFORM_ADMIN.email, ORG_ADMIN_USER.email].map((e) => e.toLowerCase()),
)

/** Exact consumer keys cleared in addition to pattern-based cleanup. */
const CONSUMER_EXACT_KEYS = new Set([
  'tudu_session',
  REMEMBER_EMAIL_KEY,
  'tudu_user_tickets_v1',
  'tudu_host_events',
  CREATE_EVENT_DRAFT_KEY,
  'tudu_create_event_session',
  'tudu_recent_venues',
  'tudu_saved_events',
  'tudu_user_saved_events',
  'tudu-liked-events',
  'tudu-follows',
  'tudu-share-lists',
  'tudu-user-notifications',
  'tudu_bucket_lists',
  'tudu_road_trips',
  'tudu_event_saves',
  'tudu_hidden_gem_engagement',
  'tudu_hidden_gem_promo_pushes',
  'tudu_checklist_claims',
  'tudu_checklist_responses',
  'tudu_org_access_audit',
  'tudu_host_analytics_v1',
  'tudu_demo_host_analytics_v1',
  'tudu-ticket-transactions',
  'tudu_completed_story_likes',
  'tudu-keyword-stats',
  'tudu-hidden-gems',
  'tudu-org-verification-requests',
  'tudu-org-verification-counter',
  'tudu-org-verification-per-org-v1',
  'tudu-anon-discover-seen',
  'tudu-app-theme',
  'primaryLocation',
  'tudu_travel_pass',
  'tudu_travel_city',
  'tudu_gps_city',
  'tudu-date-night-city',
  'tudu-date-night-plan',
  'tudu-host-context',
  'tudu_personal_host_profiles',
  'tudu_org_host_profiles',
  'tudu_host_slideshows',
])

/** Human-readable summary for confirm dialogs (Settings / dev reset). */
export const SIGNUP_TEST_RESET_SUMMARY = [
  'Sign you out and clear the saved session',
  'Remove your account and all other non-demo local users',
  'Wipe preferences (interests, legal name, onboarding progress)',
  'Clear tickets, saved events, notifications, share lists, and bucket lists',
  'Remove host profiles, host events, and create-event drafts',
  'Reset My Tudu settings (notifications, privacy, payments demo data)',
] as const

export const SIGNUP_TEST_RESET_PRESERVED = [
  'Platform admin panel data (tudu-admin-*)',
  'Admin theme (tudu_admin_theme) and sidebar order',
  'Cookie consent choice',
] as const

export type ResetLocalUserDataResult = ClearProfilesResult & {
  removedKeys: string[]
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/** Keys that must stay when resetting for consumer signup testing. */
export function isPreservedLocalStorageKey(key: string): boolean {
  if (key === ADMIN_THEME_STORAGE_KEY || key === SIDEBAR_ORDER_KEY) return true
  if (key.startsWith('tudu-admin-')) return true
  if (key === 'tudu_cookie_consent') return true
  if (key === 'tudu-legal-docs' || key === 'tudu-attractions' || key === 'tudu-secret-list') return true
  if (key === 'tudu_public_bucket_lists' || key === 'tudu_mock_completed_stories') return true
  if (key === 'tudu-feature-flags' || key === 'tudu-admin-landing-flags' || key === 'tudu-admin-landing-rollout') {
    return true
  }
  if (key === 'tudu_demo_events_v1') return true
  if (key === 'tudu_demo_ticket_sales_v1' || key === 'tudu_demo_geo_users_v1') return true
  if (key === 'tudu-feedback-resolve-template' || key === 'tudu-org-reject-template') return true
  if (key === 'nav-icon-picker-choice') return true
  return false
}

function isConsumerLocalStorageKey(key: string): boolean {
  if (isPreservedLocalStorageKey(key)) return false
  if (CONSUMER_EXACT_KEYS.has(key)) return true
  if (key.startsWith('tudu_user_preferences')) return true
  if (key.startsWith('tudu-settings-')) return true
  if (key.startsWith('tudu_user_tickets_demo_seeded:')) return true
  if (key.startsWith('tudu_') || (key.startsWith('tudu-') && !key.startsWith('tudu-admin-'))) {
    return true
  }
  return false
}

function pruneOrganizationRecords(): void {
  const orgs = readJson<{ id: string; createdBy?: string }[]>('tudu_organizations', [])
  const keptOrgs = orgs.filter(
    (org) =>
      org.id === DEMO_ORG_SEED_ID ||
      (org.createdBy && ESSENTIAL_EMAILS.has(org.createdBy.toLowerCase())),
  )
  if (keptOrgs.length === 0) {
    localStorage.removeItem('tudu_organizations')
  } else {
    localStorage.setItem('tudu_organizations', JSON.stringify(keptOrgs))
  }

  const members = readJson<{ orgId: string; email: string }[]>('tudu_org_members', [])
  const keptOrgIds = new Set(keptOrgs.map((o) => o.id))
  const keptMembers = members.filter(
    (m) => keptOrgIds.has(m.orgId) && ESSENTIAL_EMAILS.has(m.email.toLowerCase()),
  )
  if (keptMembers.length === 0) {
    localStorage.removeItem('tudu_org_members')
  } else {
    localStorage.setItem('tudu_org_members', JSON.stringify(keptMembers))
  }

  localStorage.removeItem('tudu_org_invites')
}

function removeConsumerLocalStorageKeys(): string[] {
  const removed: string[] = []
  for (const key of Object.keys(localStorage)) {
    if (!isConsumerLocalStorageKey(key)) continue
    if (key === 'tudu_users' || key === 'tudu_accounts') continue
    localStorage.removeItem(key)
    removed.push(key)
  }
  return removed
}

/**
 * Wipe locally stored consumer user data so you can run through sign-up again.
 * Keeps platform admin localStorage; re-seeds demo/admin accounts via {@link clearAllProfiles}.
 */
export function resetLocalUserDataForSignupTest(): ResetLocalUserDataResult {
  signOut()
  localStorage.removeItem(REMEMBER_EMAIL_KEY)

  const removedBeforeProfiles = removeConsumerLocalStorageKeys()
  pruneOrganizationRecords()

  const profileResult = clearAllProfiles()

  purgeRemovedDemoEventsFromLocalStorage()

  const removedKeys = [...new Set([...removedBeforeProfiles, ...profileResult.clearedKeys])].sort()

  return {
    ...profileResult,
    removedKeys,
  }
}

export function signupTestResetConfirmMessage(): string {
  const wiped = SIGNUP_TEST_RESET_SUMMARY.map((line) => `• ${line}`).join('\n')
  const kept = SIGNUP_TEST_RESET_PRESERVED.map((line) => `• ${line}`).join('\n')
  return (
    'Clear local data for a fresh sign-up test?\n\n' +
    'This will:\n' +
    wiped +
    '\n\nKept on this device:\n' +
    kept +
    '\n\nYou will be signed out and sent to Sign up.'
  )
}
