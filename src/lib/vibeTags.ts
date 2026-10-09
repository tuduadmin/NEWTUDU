import type { VibeTag } from '../types/bucketList'

/** All bucket list vibe options — single source for create flows and badges. */
export const BUCKET_LIST_VIBE_TAGS: readonly VibeTag[] = [
  'Adventurous',
  'Exploring',
  'Outdoors',
  'Chill',
  'Romantic',
  'Family',
  'Foodie',
  'Culture',
  'Nightlife',
  'Wild',
  'Local',
  'Hidden Gems',
  'Wellness',
  'Historic',
  'Luxury',
  'Budget',
  'Weekend',
  'Road Trip',
] as const

export function isVibeTag(value: string): value is VibeTag {
  return (BUCKET_LIST_VIBE_TAGS as readonly string[]).includes(value)
}
