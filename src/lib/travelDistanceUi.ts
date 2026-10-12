export const TRAVEL_DISTANCE_MIN_KM = 5
export const TRAVEL_DISTANCE_MAX_KM = 200
export const TRAVEL_DISTANCE_STEP_KM = 5

/** 0–100 fill along the slider track. */
export function travelDistanceFillPercent(km: number): number {
  const clamped = Math.min(
    TRAVEL_DISTANCE_MAX_KM,
    Math.max(TRAVEL_DISTANCE_MIN_KM, km),
  )
  return (
    ((clamped - TRAVEL_DISTANCE_MIN_KM) /
      (TRAVEL_DISTANCE_MAX_KM - TRAVEL_DISTANCE_MIN_KM)) *
    100
  )
}

/** 0–1 for CSS `--travel-distance-pct` (theme accent mix + fill width). */
export function travelDistanceUnit(km: number): number {
  return travelDistanceFillPercent(km) / 100
}
