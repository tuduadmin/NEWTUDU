import { getAllAccounts, type UserAccount } from './account'
import { getAllUsers, type StoredUser } from './auth'
import { formatCityLabel } from './location'
import type { AnalyticsFilters } from './analyticsGeo'
import { accountMatchesFilters, isAdminEmail } from './analyticsGeo'

export type GenderOption =
  | 'male'
  | 'female'
  | 'non-binary'
  | 'prefer-not-to-say'
  | 'other'
  | ''

export const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say (hidden)' },
]

export type AgeBracket = 'under-18' | '18-24' | '25-34' | '35-44' | '45-54' | '55+' | 'unknown'

export const AGE_BRACKET_LABELS: Record<AgeBracket, string> = {
  'under-18': 'Under 18',
  '18-24': '18–24',
  '25-34': '25–34',
  '35-44': '35–44',
  '45-54': '45–54',
  '55+': '55+',
  unknown: 'Unknown',
}

export function birthYearFromDob(dob?: string): number | undefined {
  if (!dob) return undefined
  const year = new Date(dob).getFullYear()
  return Number.isFinite(year) && year > 1900 ? year : undefined
}

export function getAgeFromBirthYear(birthYear?: number): number | undefined {
  if (!birthYear) return undefined
  return new Date().getFullYear() - birthYear
}

export function getAgeBracket(birthYear?: number, dob?: string): AgeBracket {
  const year = birthYear ?? birthYearFromDob(dob)
  if (!year) return 'unknown'
  const age = getAgeFromBirthYear(year)
  if (age == null || age < 0) return 'unknown'
  if (age < 18) return 'under-18'
  if (age <= 24) return '18-24'
  if (age <= 34) return '25-34'
  if (age <= 44) return '35-44'
  if (age <= 54) return '45-54'
  return '55+'
}

export function getGenderLabel(gender?: GenderOption | string): string {
  if (!gender || gender === 'prefer-not-to-say') return '—'
  const match = GENDER_OPTIONS.find((g) => g.value === gender)
  return match?.label ?? gender
}

export function getAccountAgeDisplay(
  account: UserAccount,
  user?: StoredUser | null,
): string {
  const birthYear = account.birthYear ?? birthYearFromDob(user?.dob)
  const bracket = getAgeBracket(birthYear, user?.dob)
  if (bracket === 'unknown') return '—'
  const age = getAgeFromBirthYear(birthYear)
  if (age != null && age >= 0 && age <= 120) {
    return `${age} (${AGE_BRACKET_LABELS[bracket]})`
  }
  return AGE_BRACKET_LABELS[bracket]
}

export function getHomeRegionFromCity(homeCity: string): string {
  const parts = homeCity.split(',')
  if (parts.length >= 2) return parts.slice(1).join(',').trim()
  return ''
}

export type DemographicsBreakdown = {
  byCity: { city: string; count: number }[]
  byAgeBracket: { bracket: AgeBracket; label: string; count: number }[]
  byGender: { gender: string; label: string; count: number }[]
}

export function getDemographicsBreakdown(filters: AnalyticsFilters = {}): DemographicsBreakdown {
  const users = getAllUsers().filter((u) => !isAdminEmail(u.email))
  const accounts = getAllAccounts().filter(
    (a) => !isAdminEmail(a.email) && accountMatchesFilters(a, filters),
  )

  const cityCounts = new Map<string, number>()
  const ageCounts = new Map<AgeBracket, number>()
  const genderCounts = new Map<string, number>()

  for (const account of accounts) {
    const user = users.find((u) => u.email.toLowerCase() === account.email.toLowerCase())

    const city = formatCityLabel(account.homeCity) || 'Unknown'
    cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1)

    const bracket = getAgeBracket(account.birthYear, user?.dob)
    ageCounts.set(bracket, (ageCounts.get(bracket) ?? 0) + 1)

    const genderKey = account.gender || 'unknown'
    genderCounts.set(genderKey, (genderCounts.get(genderKey) ?? 0) + 1)
  }

  const byCity = [...cityCounts.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)

  const bracketOrder: AgeBracket[] = [
    'under-18',
    '18-24',
    '25-34',
    '35-44',
    '45-54',
    '55+',
    'unknown',
  ]
  const byAgeBracket = bracketOrder
    .filter((b) => (ageCounts.get(b) ?? 0) > 0)
    .map((bracket) => ({
      bracket,
      label: AGE_BRACKET_LABELS[bracket],
      count: ageCounts.get(bracket) ?? 0,
    }))

  const byGender = [...genderCounts.entries()]
    .map(([gender, count]) => ({
      gender,
      label: gender === 'unknown' ? 'Not provided' : getGenderLabel(gender),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return { byCity, byAgeBracket, byGender }
}
