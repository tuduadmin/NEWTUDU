import { useEffect, useState } from 'react'
import {
  getLandingRolloutFlags,
  LANDING_ROLLOUT_CHANGED_EVENT,
  type LandingRolloutFlags,
} from '../lib/adminSettings'

export function useLandingFeatureFlags(): LandingRolloutFlags {
  const [flags, setFlags] = useState<LandingRolloutFlags>(() => getLandingRolloutFlags())

  useEffect(() => {
    function refresh() {
      setFlags(getLandingRolloutFlags())
    }

    window.addEventListener(LANDING_ROLLOUT_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)

    return () => {
      window.removeEventListener(LANDING_ROLLOUT_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return flags
}
