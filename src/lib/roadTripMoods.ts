export type RoadTripMoodId = 'scenic' | 'food' | 'must-see' | 'outdoor'

export type RoadTripMood = {
  id: RoadTripMoodId
  label: string
  /** Short copy for plan/surprise prefill hint */
  hint: string
}

export const ROAD_TRIP_MOODS: RoadTripMood[] = [
  {
    id: 'scenic',
    label: 'Scenic Routes',
    hint: 'Prioritize viewpoints, drives, and photo-worthy stops.',
  },
  {
    id: 'food',
    label: 'Great Food',
    hint: 'Build a route around restaurants, markets, and local eats.',
  },
  {
    id: 'must-see',
    label: 'Must See',
    hint: 'Hit landmarks, attractions, and can’t-miss stops.',
  },
  {
    id: 'outdoor',
    label: 'Outdoor Adventure',
    hint: 'Trails, parks, lakes, and fresh-air detours.',
  },
]

export function getRoadTripMood(id: string | null | undefined): RoadTripMood | undefined {
  if (!id) return undefined
  return ROAD_TRIP_MOODS.find((m) => m.id === id)
}
