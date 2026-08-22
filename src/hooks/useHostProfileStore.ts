import { useEffect, useSyncExternalStore } from 'react'
import {
  getHostProfileStoreRevision,
  notifyHostProfilesCleared,
  subscribeHostProfileStore,
} from '../lib/hostProfileStore'
import { FEATURE_FLAGS_CHANGED_EVENT } from '../lib/adminSettings'

/** Bumps when host profile/branding localStorage changes (same tab, other tab, or bfcache restore). */
export function useHostProfileStore(): number {
  const revision = useSyncExternalStore(
    subscribeHostProfileStore,
    getHostProfileStoreRevision,
    () => 0,
  )

  useEffect(() => {
    function onMerchOrFlagsChange() {
      notifyHostProfilesCleared()
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        notifyHostProfilesCleared()
      }
    }

    window.addEventListener(FEATURE_FLAGS_CHANGED_EVENT, onMerchOrFlagsChange)
    window.addEventListener('storage', onMerchOrFlagsChange)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener(FEATURE_FLAGS_CHANGED_EVENT, onMerchOrFlagsChange)
      window.removeEventListener('storage', onMerchOrFlagsChange)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  return revision
}
