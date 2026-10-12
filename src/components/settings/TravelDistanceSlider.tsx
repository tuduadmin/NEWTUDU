import type { CSSProperties } from 'react'
import {
  TRAVEL_DISTANCE_MAX_KM,
  TRAVEL_DISTANCE_MIN_KM,
  TRAVEL_DISTANCE_STEP_KM,
  travelDistanceUnit,
} from '../../lib/travelDistanceUi'

type TravelDistanceSliderProps = {
  value: number
  onChange: (km: number) => void
  className?: string
  showBounds?: boolean
  boundsClassName?: string
}

export default function TravelDistanceSlider({
  value,
  onChange,
  className = '',
  showBounds = true,
  boundsClassName = 'text-brown-muted',
}: TravelDistanceSliderProps) {
  const pct = travelDistanceUnit(value)
  const pctStyle = { '--travel-distance-pct': pct } as CSSProperties

  return (
    <div className={className} style={pctStyle}>
      <div className="travel-distance-control relative h-7 w-full">
        <div className="travel-distance-track absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full" aria-hidden />
        <div className="travel-distance-fill absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full" aria-hidden />
        <div className="travel-distance-thumb pointer-events-none absolute top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2" aria-hidden />
        <input
          type="range"
          min={TRAVEL_DISTANCE_MIN_KM}
          max={TRAVEL_DISTANCE_MAX_KM}
          step={TRAVEL_DISTANCE_STEP_KM}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuemin={TRAVEL_DISTANCE_MIN_KM}
          aria-valuemax={TRAVEL_DISTANCE_MAX_KM}
          aria-valuenow={value}
          aria-label="Travel distance in kilometers"
          className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      {showBounds ? (
        <div className={`mt-1.5 flex justify-between text-xs ${boundsClassName}`}>
          <span>{TRAVEL_DISTANCE_MIN_KM} km</span>
          <span>{TRAVEL_DISTANCE_MAX_KM} km</span>
        </div>
      ) : null}
    </div>
  )
}
