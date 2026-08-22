import {
  getTierConfig as readTierConfig,
  resetTierConfig as resetTierConfigStore,
  saveTierConfig as persistTierConfig,
  type TierConfig,
} from './tierConfig'

const FEATURE_FLAGS_KEY = 'tudu-admin-feature-flags'
export const FEATURE_FLAGS_CHANGED_EVENT = 'tudu-admin-feature-flags-changed'

export interface FeatureFlags {
  discoverEnabled: boolean
  roadTripEnabled: boolean
  bucketListEnabled: boolean
  orgCreationEnabled: boolean
  seedContentEnabled: boolean
  messagingEnabled: boolean
  boostsEnabled: boolean
  travelPassEnabled: boolean
  extraEventsShopEnabled: boolean
  hiddenGemsShopEnabled: boolean
  /** Host profile Shop Merch button — platform master switch for Event Marketplace. */
  hostMerchEnabled: boolean
  /** Private invite-only event group chat — one thread per private event. */
  privateEventChatEnabled: boolean
}

/** Bump when default flag policy changes (fresh browsers pick up DEFAULT_FLAGS). */
export const FEATURE_FLAGS_DEFAULT_VERSION = 2

export type { TierConfig }

const DEFAULT_FLAGS: FeatureFlags = {
  discoverEnabled: true,
  roadTripEnabled: true,
  bucketListEnabled: true,
  orgCreationEnabled: true,
  seedContentEnabled: true,
  messagingEnabled: true,
  boostsEnabled: true,
  travelPassEnabled: true,
  extraEventsShopEnabled: true,
  hiddenGemsShopEnabled: true,
  hostMerchEnabled: true,
  privateEventChatEnabled: true,
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getFeatureFlags(): FeatureFlags {
  const version = readJson<number>(`${FEATURE_FLAGS_KEY}-version`, 0)
  if (version < FEATURE_FLAGS_DEFAULT_VERSION) {
    return setAllFeatureFlags(true)
  }
  return readJson(FEATURE_FLAGS_KEY, DEFAULT_FLAGS)
}

export function saveFeatureFlags(flags: FeatureFlags): void {
  writeJson(FEATURE_FLAGS_KEY, flags)
  writeJson(`${FEATURE_FLAGS_KEY}-version`, FEATURE_FLAGS_DEFAULT_VERSION)
  window.dispatchEvent(new Event(FEATURE_FLAGS_CHANGED_EVENT))
}

/** Turn every platform feature flag on or off (rollout page + programmatic). */
export function setAllFeatureFlags(enabled: boolean): FeatureFlags {
  const flags: FeatureFlags = {
    discoverEnabled: enabled,
    roadTripEnabled: enabled,
    bucketListEnabled: enabled,
    orgCreationEnabled: enabled,
    seedContentEnabled: enabled,
    messagingEnabled: enabled,
    boostsEnabled: enabled,
    travelPassEnabled: enabled,
    extraEventsShopEnabled: enabled,
    hiddenGemsShopEnabled: enabled,
    hostMerchEnabled: enabled,
    privateEventChatEnabled: enabled,
  }
  saveFeatureFlags(flags)
  return flags
}

export function getTierConfig(): TierConfig {
  return readTierConfig()
}

export function saveTierConfig(config: TierConfig): void {
  persistTierConfig(config)
}

export function resetTierConfig(): TierConfig {
  return resetTierConfigStore()
}

/* ── Landing page rollout (admin → marketing page) ── */

export type LandingRolloutFlags = {
  landingBucketList: boolean
  landingRoadTrip: boolean
  landingTuduCrew: boolean
  landingHiddenGems: boolean
  landingAttractions: boolean
}

const LANDING_ROLLOUT_KEY = 'tudu-admin-landing-rollout'
export const LANDING_ROLLOUT_CHANGED_EVENT = 'tudu-admin-landing-rollout-changed'

/** @deprecated Use LANDING_ROLLOUT_CHANGED_EVENT */
export const LANDING_FEATURE_FLAGS_CHANGED_EVENT = LANDING_ROLLOUT_CHANGED_EVENT

const LEGACY_LANDING_ROLLOUT_KEYS = ['tudu-admin-landing-flags', 'tudu-feature-flags'] as const

const DEFAULT_LANDING_ROLLOUT: LandingRolloutFlags = {
  landingBucketList: true,
  landingRoadTrip: true,
  landingTuduCrew: true,
  landingHiddenGems: true,
  landingAttractions: true,
}

function normalizeLandingRollout(stored: Partial<LandingRolloutFlags>): LandingRolloutFlags {
  return {
    landingBucketList:
      typeof stored.landingBucketList === 'boolean'
        ? stored.landingBucketList
        : DEFAULT_LANDING_ROLLOUT.landingBucketList,
    landingRoadTrip:
      typeof stored.landingRoadTrip === 'boolean'
        ? stored.landingRoadTrip
        : DEFAULT_LANDING_ROLLOUT.landingRoadTrip,
    landingTuduCrew:
      typeof stored.landingTuduCrew === 'boolean'
        ? stored.landingTuduCrew
        : DEFAULT_LANDING_ROLLOUT.landingTuduCrew,
    landingHiddenGems:
      typeof stored.landingHiddenGems === 'boolean'
        ? stored.landingHiddenGems
        : DEFAULT_LANDING_ROLLOUT.landingHiddenGems,
    landingAttractions:
      typeof stored.landingAttractions === 'boolean'
        ? stored.landingAttractions
        : DEFAULT_LANDING_ROLLOUT.landingAttractions,
  }
}

function readLegacyLandingRollout(): Partial<LandingRolloutFlags> | null {
  if (typeof localStorage === 'undefined') return null
  for (const key of LEGACY_LANDING_ROLLOUT_KEYS) {
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      return JSON.parse(raw) as Partial<LandingRolloutFlags>
    } catch {
      continue
    }
  }
  return null
}

function readLandingRolloutFromStorage(): LandingRolloutFlags | null {
  if (typeof localStorage === 'undefined') return null

  const raw = localStorage.getItem(LANDING_ROLLOUT_KEY)
  if (raw) {
    try {
      return normalizeLandingRollout(JSON.parse(raw) as Partial<LandingRolloutFlags>)
    } catch {
      /* try legacy */
    }
  }

  const legacy = readLegacyLandingRollout()
  if (!legacy) return null
  const normalized = normalizeLandingRollout(legacy)
  writeJson(LANDING_ROLLOUT_KEY, normalized)
  return normalized
}

export function getLandingRolloutFlags(): LandingRolloutFlags {
  const stored = readLandingRolloutFromStorage()
  return stored ?? { ...DEFAULT_LANDING_ROLLOUT }
}

export function saveLandingRolloutFlags(flags: LandingRolloutFlags): void {
  const normalized = normalizeLandingRollout(flags)

  if (typeof localStorage !== 'undefined') {
    const json = JSON.stringify(normalized)
    localStorage.setItem(LANDING_ROLLOUT_KEY, json)
    for (const key of LEGACY_LANDING_ROLLOUT_KEYS) {
      localStorage.setItem(key, json)
    }
  }

  window.dispatchEvent(new Event(LANDING_ROLLOUT_CHANGED_EVENT))
}

export function setAllLandingRolloutFlags(enabled: boolean): LandingRolloutFlags {
  const flags: LandingRolloutFlags = {
    landingBucketList: enabled,
    landingRoadTrip: enabled,
    landingTuduCrew: enabled,
    landingHiddenGems: enabled,
    landingAttractions: enabled,
  }
  saveLandingRolloutFlags(flags)
  return flags
}
