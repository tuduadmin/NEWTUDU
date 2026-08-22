import type { UserAccount } from './account'
import { getEffectiveUserPerks } from './account'
import { resolveUserPlanId } from './tierConfig'
import type { DiscoverQuickPick } from '../data/discoverEvents'

export const QUICK_PICK_OVERRIDE_KEY = 'tudu-quick-pick-override'
export const QUICK_PICK_CHANGED_EVENT = 'tudu-quick-pick-changed'

export type QuickPickOverride = DiscoverQuickPick

const QUICK_PICK_LABELS: Record<QuickPickOverride, string> = {
  food: 'Food',
  entertainment: 'Entertainment',
  poi: 'Points of interest',
}

function readOverride(): QuickPickOverride | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(QUICK_PICK_OVERRIDE_KEY)
  if (raw === 'food' || raw === 'entertainment' || raw === 'poi') return raw
  return null
}

export function getQuickPickOverride(): QuickPickOverride | null {
  return readOverride()
}

export function getQuickPickLabel(pick: QuickPickOverride): string {
  return QUICK_PICK_LABELS[pick]
}

export function setQuickPickOverride(pick: QuickPickOverride | null): void {
  if (typeof localStorage === 'undefined') return
  if (pick === null) {
    localStorage.removeItem(QUICK_PICK_OVERRIDE_KEY)
  } else {
    localStorage.setItem(QUICK_PICK_OVERRIDE_KEY, pick)
  }
  window.dispatchEvent(new Event(QUICK_PICK_CHANGED_EVENT))
}

/** Single-select toggle — tap active pick again to clear. */
export function toggleQuickPickOverride(pick: QuickPickOverride): QuickPickOverride | null {
  const next = readOverride() === pick ? null : pick
  setQuickPickOverride(next)
  return next
}

export function clearQuickPickOverride(): void {
  setQuickPickOverride(null)
}

/** Quick Pick is an Explorer subscriber feature (incl. Trusted Host primary-owner perk). */
export function hasExplorerQuickPickAccess(account: UserAccount | null): boolean {
  if (!account) return false
  if (resolveUserPlanId(account.tier, account.verificationStatus) === 'explorer') return true
  return getEffectiveUserPerks(account).quickPickEnabled
}
