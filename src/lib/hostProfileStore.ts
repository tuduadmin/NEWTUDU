/** Host profile store sync — isolated from profileReset to avoid account ↔ profileReset import cycles. */

export const HOST_PROFILES_CLEARED_EVENT = 'tudu-host-profiles-cleared'

type HostProfileStoreListener = () => void

const hostProfileStoreListeners = new Set<HostProfileStoreListener>()
let hostProfileStoreRevision = 0

export function getHostProfileStoreRevision(): number {
  return hostProfileStoreRevision
}

export function subscribeHostProfileStore(listener: HostProfileStoreListener): () => void {
  hostProfileStoreListeners.add(listener)
  return () => hostProfileStoreListeners.delete(listener)
}

/** Notify mounted /host pages to re-read profile data from localStorage. */
export function notifyHostProfilesCleared(): void {
  hostProfileStoreRevision += 1
  hostProfileStoreListeners.forEach((listener) => listener())
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HOST_PROFILES_CLEARED_EVENT))
  }
}
