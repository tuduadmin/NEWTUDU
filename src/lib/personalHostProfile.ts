import { findUserByEmail, getLoginNameFromUser, updateLoginName } from './auth'
import { getDefaultHostDisplayName } from './easterEggs'
import { notifyHostProfilesCleared } from './hostProfileStore'
import { getInitialsFromName } from './profileInitials'
import { getPreferences, savePreferences } from './preferences'

export type PersonalHostSocialLinks = {
  website?: string
  instagram?: string
  twitter?: string
  facebook?: string
  youtube?: string
  tiktok?: string
  twitch?: string
  kick?: string
}

export type HostContactInfo = {
  address?: string
  phone?: string
  email?: string
  city?: string
}

export type PersonalHostProfile = {
  displayName: string
  bio: string
  /** Single square-cropped profile photo for personal hosts. */
  avatarUrl?: string
  avatarInitial?: string
  /** @deprecated Personal profiles use avatarUrl only — migrated on read. */
  galleryImages?: string[]
  social: PersonalHostSocialLinks
  address?: string
  phone?: string
  email?: string
  city?: string
}

const PROFILES_KEY = 'tudu_personal_host_profiles'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readProfiles(): Record<string, PersonalHostProfile> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, PersonalHostProfile>) : {}
  } catch {
    return {}
  }
}

function writeProfiles(profiles: Record<string, PersonalHostProfile>): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22)
    throw new Error(
      isQuota
        ? 'Profile is too large to save — try smaller photos.'
        : 'Could not save personal profile.',
    )
  }
}

function defaultProfile(resolvedName: string): PersonalHostProfile {
  const name = resolvedName.trim() || 'Host'
  return {
    displayName: '',
    bio: '',
    avatarInitial: getInitialsFromName(name),
    social: {},
  }
}

/** User first+last name from tudu_users, or empty when none is set. */
export function getPersonalHostNameFallback(email: string): string {
  const user = findUserByEmail(email)
  if (user) {
    const name = `${user.firstName} ${user.lastName}`.trim()
    if (name) return name
  }
  return ''
}

/** Login name — single source for My Tudu and personal host profile display. */
export function resolvePersonalHostDisplayName(
  email: string,
  fallbackName?: string,
): string {
  const loginName = getLoginNameFromUser(email)
  if (loginName) return loginName

  const fallback =
    fallbackName?.trim() ||
    getPreferences(email).screenName.trim() ||
    getPersonalHostNameFallback(email)
  if (fallback) return fallback

  const easterEgg = getDefaultHostDisplayName()
  if (easterEgg) return easterEgg

  return 'Host'
}

/** Persist login name across user record, preferences, and host profile. */
export function saveLoginName(email: string, fullName: string): string {
  const trimmed = fullName.trim()
  updateLoginName(email, trimmed)
  savePreferences({ screenName: trimmed }, email)

  const profile = getPersonalHostProfile(email)
  if (profile.displayName.trim()) {
    savePersonalHostProfile(email, { ...profile, displayName: '' })
  }

  return trimmed
}

function resolvePersonalPhoto(profile: PersonalHostProfile): string | undefined {
  const avatar = profile.avatarUrl?.trim()
  if (avatar) return avatar
  const legacy = profile.galleryImages?.[0]?.trim()
  return legacy || undefined
}

export function getPersonalHostProfile(email: string, fallbackName?: string): PersonalHostProfile {
  const profiles = readProfiles()
  const resolvedName = resolvePersonalHostDisplayName(email, fallbackName)
  const existing = profiles[normalizeEmail(email)]
  if (existing) {
    const displayName = existing.displayName?.trim() ?? ''
    const avatarName = displayName || resolvedName
    const avatarUrl = resolvePersonalPhoto(existing)
    return {
      ...defaultProfile(resolvedName),
      ...existing,
      displayName,
      avatarUrl,
      avatarInitial: getInitialsFromName(avatarName),
      social: { ...existing.social },
      galleryImages: undefined,
    }
  }
  return defaultProfile(resolvedName)
}

export function savePersonalHostProfile(email: string, profile: PersonalHostProfile): PersonalHostProfile {
  const profiles = readProfiles()
  const key = normalizeEmail(email)
  const displayName = profile.displayName.trim()
  const avatarName = displayName || resolvePersonalHostDisplayName(email)
  const saved: PersonalHostProfile = {
    ...profile,
    displayName,
    avatarUrl: profile.avatarUrl?.trim() || undefined,
    avatarInitial: getInitialsFromName(avatarName),
    social: { ...profile.social },
    galleryImages: undefined,
  }
  profiles[key] = saved
  writeProfiles(profiles)
  notifyHostProfilesCleared()
  return saved
}
