import { getFeatureFlags } from './adminSettings'
import { notifyHostProfilesCleared } from './hostProfileStore'
import { isMarketplaceEnabledForOrgPlan, type OrgPlanId } from './tierConfig'
import type { Organization, UserAccount } from './account'

/** Per-host merch shop settings stored on UserAccount or Organization. */
export type HostMerchSettings = {
  /** @deprecated Legacy opt-in flag — ignored for visibility when global merch is on. */
  merchShopEnabled?: boolean
  /** Admin shut off marketplace for this host while platform merch is on. */
  merchShutOff?: boolean
  /** Admin blocked shop after report or policy violation. */
  merchBlocked?: boolean
  merchBlockedReason?: string
  /** ISO timestamp when merch was reported (admin review queue). */
  merchReportedAt?: string
  /** Optional external shop URL; in-app shop TBD. */
  merchShopUrl?: string
}

export type HostMerchHostKey =
  | { type: 'org'; id: string }
  | { type: 'user'; email: string }

const MERCH_STORE_KEY = 'tudu_host_merch_settings'

/** Canonical merch settings keyed by org id or user email (survives org record rewrites). */
type MerchSettingsStore = Record<string, HostMerchSettings>

function readMerchStore(): MerchSettingsStore {
  try {
    const raw = localStorage.getItem(MERCH_STORE_KEY)
    return raw ? (JSON.parse(raw) as MerchSettingsStore) : {}
  } catch {
    return {}
  }
}

function writeMerchStore(store: MerchSettingsStore): void {
  try {
    localStorage.setItem(MERCH_STORE_KEY, JSON.stringify(store))
    notifyHostProfilesCleared()
  } catch {
    /* ignore quota errors in demo */
  }
}

function orgMerchStoreKey(orgId: string): string {
  return `org:${orgId}`
}

function userMerchStoreKey(email: string): string {
  return `user:${email.trim().toLowerCase()}`
}

function mergeMerchSettings(
  ...sources: Array<HostMerchSettings | null | undefined>
): HostMerchSettings {
  const merged: HostMerchSettings = {}
  for (const source of sources) {
    if (!source) continue
    if (source.merchShopEnabled !== undefined) merged.merchShopEnabled = source.merchShopEnabled
    if (source.merchShutOff !== undefined) merged.merchShutOff = source.merchShutOff
    if (source.merchBlocked !== undefined) merged.merchBlocked = source.merchBlocked
    if (source.merchBlockedReason !== undefined) {
      merged.merchBlockedReason = source.merchBlockedReason
    }
    if (source.merchReportedAt !== undefined) merged.merchReportedAt = source.merchReportedAt
    if (source.merchShopUrl !== undefined) merged.merchShopUrl = source.merchShopUrl
  }
  return merged
}

export function pickHostMerchSettings(
  source: HostMerchSettings | null | undefined,
): HostMerchSettings {
  if (!source) return {}
  return {
    merchShopEnabled: source.merchShopEnabled,
    merchShutOff: source.merchShutOff,
    merchBlocked: source.merchBlocked,
    merchBlockedReason: source.merchBlockedReason,
    merchReportedAt: source.merchReportedAt,
    merchShopUrl: source.merchShopUrl,
  }
}

export function persistOrgMerchSettings(
  orgId: string,
  partial: Partial<HostMerchSettings>,
): HostMerchSettings {
  const store = readMerchStore()
  const key = orgMerchStoreKey(orgId)
  const next = mergeMerchSettings(store[key], partial)
  store[key] = next
  writeMerchStore(store)
  return next
}

export function persistUserMerchSettings(
  email: string,
  partial: Partial<HostMerchSettings>,
): HostMerchSettings {
  const store = readMerchStore()
  const key = userMerchStoreKey(email)
  const next = mergeMerchSettings(store[key], partial)
  store[key] = next
  writeMerchStore(store)
  return next
}

function coerceFeatureFlagEnabled(value: unknown): boolean {
  return value === true || value === 'true'
}

/** Platform master switch — Settings → Host merch shop. */
export function isHostMerchGloballyEnabled(): boolean {
  return coerceFeatureFlagEnabled(getFeatureFlags().hostMerchEnabled)
}

/** True when this host is not individually shut off (ignores global flag). */
export function isHostMerchAllowedForHost(settings: HostMerchSettings): boolean {
  if (settings.merchBlocked) return false
  if (settings.merchShutOff === true) return false
  return true
}

/** True when marketplace should appear on this host's profile. */
export function isHostMerchVisible(settings: HostMerchSettings = {}): boolean {
  if (!isHostMerchGloballyEnabled()) return false
  return isHostMerchAllowedForHost(settings)
}

/** Org hosts — tier must include marketplace (Pioneer / Trusted Host) plus platform + host switches. */
export function isHostMerchVisibleForOrg(
  settings: HostMerchSettings = {},
  orgPlanId: OrgPlanId,
): boolean {
  if (!isMarketplaceEnabledForOrgPlan(orgPlanId)) return false
  return isHostMerchVisible(settings)
}

export function getHostMerchSettingsFromAccount(
  account: UserAccount | null | undefined,
): HostMerchSettings {
  if (!account) return {}
  const fromAccount = pickHostMerchSettings(account)
  const store = readMerchStore()[userMerchStoreKey(account.email)]
  if (!store && Object.keys(fromAccount).length > 0) {
    persistUserMerchSettings(account.email, fromAccount)
  }
  return mergeMerchSettings(fromAccount, store)
}

export function getHostMerchSettingsFromOrg(
  org: Organization | null | undefined,
): HostMerchSettings {
  if (!org) return {}
  const fromOrg = pickHostMerchSettings(org)
  const store = readMerchStore()[orgMerchStoreKey(org.id)]
  if (!store && Object.keys(fromOrg).length > 0) {
    persistOrgMerchSettings(org.id, fromOrg)
  }
  return mergeMerchSettings(fromOrg, store)
}

/** Persist merch settings and refresh mounted host/public profile views. */
export function applyHostMerchSettingsUpdate(
  onUpdate: (partial: Partial<HostMerchSettings>) => void,
  partial: Partial<HostMerchSettings>,
  hostKey?: HostMerchHostKey,
): void {
  if (hostKey?.type === 'org') {
    persistOrgMerchSettings(hostKey.id, partial)
  } else if (hostKey?.type === 'user') {
    persistUserMerchSettings(hostKey.email, partial)
  }
  onUpdate(partial)
  notifyHostProfilesCleared()
}
