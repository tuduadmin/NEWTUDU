import { ROAD_TRIP_DETOUR_KM_OPTIONS } from '../../lib/roadTripRoute'

type RoadTripStopSettingsProps = {
  detourKm: number
  maxStops: number
  currentStopCount: number
  onDetourChange: (km: number) => void
  onMaxStopsChange: (count: number) => void
  /** Hide live trip count (e.g. on settings defaults page). */
  showStopCount?: boolean
}

const MAX_STOP_OPTIONS = [4, 6, 8, 10, 12, 15]

export default function RoadTripStopSettings({
  detourKm,
  maxStops,
  currentStopCount,
  onDetourChange,
  onMaxStopsChange,
  showStopCount = true,
}: RoadTripStopSettingsProps) {
  return (
    <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
        Route preferences
      </p>

      <div className="mt-3">
        <label htmlFor="detour-km" className="text-xs font-semibold text-brown">
          How far off route? ({detourKm} km)
        </label>
        <p className="mt-0.5 text-[11px] text-brown-muted">
          Only show events within {detourKm} km of your planned city route.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ROAD_TRIP_DETOUR_KM_OPTIONS.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onDetourChange(km)}
              className={`rounded-[14px] border px-2.5 py-1 text-[11px] font-bold transition ${
                detourKm === km
                  ? 'border-orange bg-orange/10 text-orange'
                  : 'border-app-subtle bg-cream/50 text-brown-muted hover:border-orange/25'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="max-stops" className="text-xs font-semibold text-brown">
          How many stops?
          {showStopCount && (
            <span className="text-brown-muted">
              {' '}
              ({currentStopCount}/{maxStops})
            </span>
          )}
          {!showStopCount && <span className="text-brown-muted"> (default {maxStops})</span>}
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MAX_STOP_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onMaxStopsChange(count)}
              className={`rounded-[14px] border px-2.5 py-1 text-[11px] font-bold transition ${
                maxStops === count
                  ? 'border-teal-600 bg-teal-600/10 text-teal-700'
                  : 'border-app-subtle bg-cream/50 text-brown-muted hover:border-teal-600/25'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
