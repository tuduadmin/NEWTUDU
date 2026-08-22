import { notifyHostProfilesCleared } from './hostProfileStore'
import type { PersonalHostSocialLinks } from './personalHostProfile'

export type OrgHostProfile = {
  logoUrl?: string
  bio?: string
  /** Up to 6 swipeable photos on the public org profile. */
  galleryImages?: string[]
  social: PersonalHostSocialLinks
  address?: string
  phone?: string
  email?: string
  city?: string
}

const PROFILES_KEY = 'tudu_org_host_profiles'

function readProfiles(): Record<string, OrgHostProfile> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, OrgHostProfile>) : {}
  } catch {
    return {}
  }
}

function writeProfiles(profiles: Record<string, OrgHostProfile>): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22)
    throw new Error(
      isQuota
        ? 'Profile is too large to save — try smaller photos.'
        : 'Could not save organization profile.',
    )
  }
}

function defaultProfile(): OrgHostProfile {
  return {
    bio: '',
    social: {},
  }
}

export function getOrgHostProfile(orgId: string): OrgHostProfile {
  const profiles = readProfiles()
  const existing = profiles[orgId]
  if (existing) {
    return {
      ...defaultProfile(),
      ...existing,
      social: { ...existing.social },
    }
  }
  return defaultProfile()
}

export function saveOrgHostProfile(orgId: string, profile: OrgHostProfile): OrgHostProfile {
  const profiles = readProfiles()
  const existing = profiles[orgId]
  const saved: OrgHostProfile = {
    ...defaultProfile(),
    ...existing,
    ...profile,
    social: { ...existing?.social, ...profile.social },
  }
  profiles[orgId] = saved
  writeProfiles(profiles)
  notifyHostProfilesCleared()
  return saved
}
