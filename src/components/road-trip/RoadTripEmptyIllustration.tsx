const ROAD_TRIP_EMPTY_ART = '/landing/road-trip-empty-route.jpg'

/** Flat navy in the artwork JPEG */
export const ROAD_TRIP_EMPTY_ART_BG = '#0c1018'

/** Road Trip page shell (`bg-midnight`) */
export const ROAD_TRIP_EMPTY_FADE_TO = '#0b0f1a'

export default function RoadTripEmptyIllustration() {
  return (
    <div className="relative w-full" style={{ backgroundColor: ROAD_TRIP_EMPTY_ART_BG }}>
      <img
        src={ROAD_TRIP_EMPTY_ART}
        alt=""
        className="block h-auto w-full object-cover object-center"
        decoding="async"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 sm:h-16"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${ROAD_TRIP_EMPTY_FADE_TO} 100%)`,
        }}
      />
    </div>
  )
}
