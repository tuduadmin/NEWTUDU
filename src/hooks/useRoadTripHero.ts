import { useEffect, useSyncExternalStore } from 'react'
import {
  getModeHeroRevision,
  getModeHeroUrl,
  getSharedModeHeroBranding,
  refreshSharedModeHeroes,
  subscribeModeHero,
  type ModeHeroId,
} from '../lib/modeHeroBranding'

const MODE: ModeHeroId = 'road-trip'

export function useRoadTripHero() {
  useEffect(() => {
    void refreshSharedModeHeroes()
    if (!import.meta.env.DEV) return
    const id = window.setInterval(() => {
      void refreshSharedModeHeroes()
    }, 15_000)
    return () => window.clearInterval(id)
  }, [])

  const url = useSyncExternalStore(
    (onChange) => subscribeModeHero(onChange, MODE),
    () => getModeHeroUrl(MODE),
    () => getModeHeroUrl(MODE),
  )
  const revision = useSyncExternalStore(
    (onChange) => subscribeModeHero(onChange, MODE),
    () => getModeHeroRevision(MODE),
    () => getModeHeroRevision(MODE),
  )
  const isShared = getSharedModeHeroBranding(MODE) != null

  return { url, revision, isShared }
}
