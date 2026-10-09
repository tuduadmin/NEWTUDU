/** @deprecated Use modeHeroBranding — kept for older imports. */
import {
  clearModeHeroBranding,
  clearSharedModeHeroOnDevServer,
  fileToModeHeroDataUrl,
  getModeHeroBranding,
  getModeHeroUrl,
  getSharedModeHeroBranding,
  MODE_HERO_DEFAULTS,
  publishModeHeroFileToDevServer,
  publishModeHeroFromDataUrl,
  refreshSharedModeHeroes,
  saveModeHeroBranding,
  MODE_HERO_CHANGED_EVENT,
  getModeHeroRevision,
} from './modeHeroBranding'

export type RoadTripBranding = import('./modeHeroBranding').ModeHeroBranding

export const ROAD_TRIP_BRANDING_STORAGE_KEY = 'tudu-mode-hero-road-trip-v1'
export const ROAD_TRIP_BRANDING_CHANGED_EVENT = MODE_HERO_CHANGED_EVENT
export const DEFAULT_ROAD_TRIP_HERO = MODE_HERO_DEFAULTS['road-trip']
export const ROAD_TRIP_SHARED_CONFIG_PATH = '/config/mode-heroes.json'

export const getRoadTripBranding = () => getModeHeroBranding('road-trip')
export const getSharedRoadTripBranding = () => getSharedModeHeroBranding('road-trip')
export const getRoadTripBrandingRevision = () => getModeHeroRevision('road-trip')
export const getRoadTripHeroUrl = () => getModeHeroUrl('road-trip')
export const refreshSharedRoadTripBranding = refreshSharedModeHeroes
export const publishRoadTripHeroFileToDevServer = (
  file: File,
  label?: string,
) => publishModeHeroFileToDevServer('road-trip', file, label)
export const publishRoadTripHeroFromDataUrl = (dataUrl: string, label?: string) =>
  publishModeHeroFromDataUrl('road-trip', dataUrl, label)
export const clearSharedRoadTripHeroOnDevServer = () =>
  clearSharedModeHeroOnDevServer('road-trip')
export const saveRoadTripBranding = (input: { heroImageUrl: string; label?: string }) =>
  saveModeHeroBranding('road-trip', input)
export const clearRoadTripBranding = () => clearModeHeroBranding('road-trip')
export const fileToRoadTripHeroDataUrl = fileToModeHeroDataUrl
