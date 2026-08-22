import { useEffect, useState } from 'react'
import {
  getLandingRolloutCards,
  LANDING_ROLLOUT_CARDS_CHANGED_EVENT,
  type LandingDeckPreviewCopyConfig,
} from '../lib/landingRolloutCards'

export function useLandingRolloutCards(): LandingDeckPreviewCopyConfig {
  const [cards, setCards] = useState<LandingDeckPreviewCopyConfig>(() => getLandingRolloutCards())

  useEffect(() => {
    function refresh() {
      setCards(getLandingRolloutCards())
    }

    window.addEventListener(LANDING_ROLLOUT_CARDS_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') refresh()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener(LANDING_ROLLOUT_CARDS_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return cards
}
