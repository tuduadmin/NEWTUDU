import type { BudgetId, TimeframeId } from '../data/categories'

export type UserPreferences = {
  screenName: string
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

const PREFS_KEY = 'tudu_user_preferences'

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

export function getPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<UserPreferences>) }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const merged = { ...getPreferences(), ...prefs }
  localStorage.setItem(PREFS_KEY, JSON.stringify(merged))
  return merged
}

export function updateInterests(interests: string[]): void {
  savePreferences({ interests })
}

export function updateBudget(budget: BudgetId): void {
  savePreferences({ budget })
}

export function updateTravelDistance(km: number): void {
  savePreferences({ travelDistanceKm: km })
}

export function updateTimeframe(timeframe: TimeframeId): void {
  savePreferences({ timeframe })
}

export function completeOnboarding(): void {
  savePreferences({ onboardingComplete: true })
}

export function isOnboardingComplete(): boolean {
  return getPreferences().onboardingComplete
}
