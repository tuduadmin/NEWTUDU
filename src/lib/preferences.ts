import type { BudgetId, TimeframeId } from '../data/categories'

export const DEMO_USER_EMAIL = 'demo@tudu.ca'
const SESSION_KEY = 'tudu_session'

export type UserPreferences = {
  screenName: string
  /**
   * Legal / full name for tickets, check-in, and RSVP holder records only.
   * Never shown on public host profile or discover.
   */
  legalName?: string
  /** My Tudu attendee profile photo — separate from personal host profile avatar. */
  avatarUrl?: string
  email: string
  dob: string
  phone: string
  phoneVerified: boolean
  location: string
  interests: string[]
  budget: BudgetId
  travelDistanceKm: number
  timeframe: TimeframeId
  onboardingComplete: boolean
}

/** Legacy single-key storage (pre per-user migration). */
export const LEGACY_PREFS_KEY = 'tudu_user_preferences'
export const PREFS_KEY_PREFIX = 'tudu_user_preferences-'

export const DEFAULT_PREFERENCES: UserPreferences = {
  screenName: 'Adrean palm',
  email: 'adrean.m.palm@gmail.com',
  dob: '',
  phone: '+1 3064604980',
  phoneVerified: true,
  location: 'Kindersley, SK',
  interests: ['food-drink'],
  budget: 'any',
  travelDistanceKm: 85,
  timeframe: 'today',
  onboardingComplete: false,
}

export const DEMO_USER_PREFERENCES: UserPreferences = {
  screenName: 'Demo User',
  email: DEMO_USER_EMAIL,
  dob: '',
  phone: '',
  phoneVerified: false,
  location: 'Kindersley, SK',
  interests: ['food-drink', 'music'],
  budget: 'any',
  travelDistanceKm: 85,
  timeframe: 'today',
  onboardingComplete: true,
}

function resolveEmail(email?: string): string | undefined {
  if (email) return email
  if (typeof localStorage === 'undefined') return undefined
  return localStorage.getItem(SESSION_KEY) ?? undefined
}

export function prefsKey(email?: string): string {
  const userEmail = resolveEmail(email)
  if (!userEmail) return LEGACY_PREFS_KEY
  return `${PREFS_KEY_PREFIX}${userEmail.toLowerCase()}`
}

/** Keys used by profile reset — legacy key plus every per-user preferences blob. */
export function collectUserPreferenceKeys(): string[] {
  if (typeof localStorage === 'undefined') return [LEGACY_PREFS_KEY]
  const keys = Object.keys(localStorage).filter(
    (key) => key === LEGACY_PREFS_KEY || key.startsWith(PREFS_KEY_PREFIX),
  )
  return keys.length > 0 ? keys : [LEGACY_PREFS_KEY]
}

function migrateLegacyPreferences(targetEmail: string): void {
  const legacyRaw = localStorage.getItem(LEGACY_PREFS_KEY)
  if (!legacyRaw) return

  const targetKey = prefsKey(targetEmail)
  if (!localStorage.getItem(targetKey)) {
    localStorage.setItem(targetKey, legacyRaw)
  }
  localStorage.removeItem(LEGACY_PREFS_KEY)
}

function freshUserPreferences(email: string): UserPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    email,
    screenName: '',
    dob: '',
    phone: '',
    phoneVerified: false,
    interests: [],
    onboardingComplete: false,
  }
}

export function getPreferences(email?: string): UserPreferences {
  const userEmail = resolveEmail(email)
  if (userEmail) {
    migrateLegacyPreferences(userEmail)
  }

  try {
    const raw = localStorage.getItem(prefsKey(email))
    if (!raw) {
      if (userEmail) return freshUserPreferences(userEmail)
      return { ...DEFAULT_PREFERENCES }
    }
    const parsed = JSON.parse(raw) as Partial<UserPreferences>
    const merged = { ...DEFAULT_PREFERENCES, ...parsed }
    if (userEmail) merged.email = userEmail
    return merged
  } catch {
    if (userEmail) return freshUserPreferences(userEmail)
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(prefs: Partial<UserPreferences>, email?: string): UserPreferences {
  const merged = { ...getPreferences(email), ...prefs }
  const userEmail = resolveEmail(email)
  if (userEmail) merged.email = userEmail
  localStorage.setItem(prefsKey(email), JSON.stringify(merged))
  return merged
}

/** Called after sign-up so a new account starts with onboarding required. */
export function initializeNewUserPreferences(email: string): UserPreferences {
  const prefs = freshUserPreferences(email)
  localStorage.setItem(prefsKey(email), JSON.stringify(prefs))
  return prefs
}

/** Ensures demo@tudu.ca skips onboarding after profile reset or first visit. */
export function seedDemoUserPreferences(): void {
  const email = DEMO_USER_EMAIL
  const key = prefsKey(email)
  const raw = localStorage.getItem(key)

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<UserPreferences>
      if (!parsed.onboardingComplete) {
        savePreferences({ onboardingComplete: true }, email)
      }
    } catch {
      localStorage.setItem(key, JSON.stringify(DEMO_USER_PREFERENCES))
    }
    return
  }

  localStorage.setItem(key, JSON.stringify(DEMO_USER_PREFERENCES))
}

export function updateInterests(interests: string[], email?: string): void {
  savePreferences({ interests }, email)
}

export function updateBudget(budget: BudgetId, email?: string): void {
  savePreferences({ budget }, email)
}

export function updateTravelDistance(km: number, email?: string): void {
  savePreferences({ travelDistanceKm: km }, email)
}

export function updateTimeframe(timeframe: TimeframeId, email?: string): void {
  savePreferences({ timeframe }, email)
}

export function completeOnboarding(email?: string): void {
  savePreferences({ onboardingComplete: true }, email)
}

export function isOnboardingComplete(email?: string): boolean {
  const userEmail = resolveEmail(email)
  if (!userEmail) return false
  return getPreferences(email).onboardingComplete
}
