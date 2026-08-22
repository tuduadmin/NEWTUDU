import { useEffect, useState } from 'react'
import {
  FEATURE_FLAGS_CHANGED_EVENT,
  getFeatureFlags,
  type FeatureFlags,
} from '../lib/adminSettings'

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(() => getFeatureFlags())

  useEffect(() => {
    function refresh() {
      setFlags(getFeatureFlags())
    }

    window.addEventListener(FEATURE_FLAGS_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(FEATURE_FLAGS_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return flags
}
