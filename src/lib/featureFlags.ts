/** Landing rollout flags — persisted in adminSettings (`tudu-admin-landing-rollout`). */
export type { LandingRolloutFlags as LandingFeatureFlags } from './adminSettings'
export {
  getLandingRolloutFlags as getLandingFeatureFlags,
  saveLandingRolloutFlags as saveLandingFeatureFlags,
  setAllLandingRolloutFlags as setAllLandingFeatureFlags,
  setAllFeatureFlags,
  LANDING_ROLLOUT_CHANGED_EVENT as LANDING_FEATURE_FLAGS_CHANGED_EVENT,
} from './adminSettings'

export const LANDING_FEATURE_FLAGS_KEY = 'tudu-admin-landing-rollout'

export const LANDING_FLAG_LABELS: {
  key: keyof import('./adminSettings').LandingRolloutFlags
  label: string
  description: string
}[] = [
  {
    key: 'landingBucketList',
    label: 'Show Bucket List on landing',
    description: 'More Ways to Explore — Bucket List section',
  },
  {
    key: 'landingRoadTrip',
    label: 'Show Road Trip on landing',
    description: 'More Ways to Explore — Road Trip section',
  },
  {
    key: 'landingTuduCrew',
    label: 'Show TUDU Crew on landing',
    description: 'More Ways to Explore — Crew recruitment promo',
  },
  {
    key: 'landingHiddenGems',
    label: 'Show Hidden Gem deck preview',
    description: 'What\'s happening — restaurant sample with gold border, below Trusted Host event',
  },
  {
    key: 'landingAttractions',
    label: 'Show Attractions deck preview',
    description: 'What\'s happening — trail sample with partner-pink border, below Hidden Gem',
  },
]
