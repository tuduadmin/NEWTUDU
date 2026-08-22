import { useMemo, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import type { MapPin as MapPinPoint, RoadTripMapView } from '../../lib/roadTripGeo'

type RoadTripMapHeroProps = {
  tripName?: string
  destination?: string
  pins: MapPinPoint[]
  stopCount: number
  mapView: RoadTripMapView
}

export default function RoadTripMapHero({
  tripName,
  destination,
  pins,
  stopCount,
  mapView,
}: RoadTripMapHeroProps) {
  const [mapFailed, setMapFailed] = useState(false)
  const failedCount = useMemo(() => ({ current: 0 }), [])
  const totalTiles = mapView.tiles.length

  function handleTileError() {
    failedCount.current += 1
    if (failedCount.current >= totalTiles) setMapFailed(true)
  }

  return (
    <section className="relative mx-2 overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm">
      <div className="relative aspect-square w-full overflow-hidden bg-[#dce8d4]">
        {!mapFailed ? (
          <div
            className="absolute inset-0 grid h-full w-full"
            style={{
              gridTemplateColumns: `repeat(${mapView.gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${mapView.gridSize}, minmax(0, 1fr))`,
            }}
          >
            {mapView.tiles.map((tile) => (
              <img
                key={`${tile.x}-${tile.y}`}
                src={tile.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={handleTileError}
              />
            ))}
          </div>
        ) : (
          <MapFallbackTerrain />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {pins.length > 1 && (
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={pins.map((pin) => `${pin.x},${pin.y}`).join(' ')}
              fill="none"
              stroke="rgba(249, 115, 22, 0.9)"
              strokeWidth="2"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {pins.map((pin) => (
          <div
            key={pin.id}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-tudu text-[11px] font-bold text-white shadow-md ring-2 ring-white">
              {pin.order}
            </span>
          </div>
        ))}

        {pins.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="rounded-[14px] bg-black/45 px-4 py-3 backdrop-blur-sm">
              <MapPin size={24} className="mx-auto text-orange" />
              <p className="mt-2 text-sm font-semibold text-white">Add stops to see your route</p>
              <p className="mt-1 text-xs text-white/75">Map updates as you build your trip</p>
            </div>
          </div>
        )}

        <p className="pointer-events-none absolute bottom-1 right-2 text-[9px] text-white/80 drop-shadow">
          © OpenStreetMap
        </p>
      </div>

      <div className="border-t border-app-subtle px-3 py-2.5">
        <p className="font-display text-base font-bold text-brown">
          {tripName ?? 'Road Trip'}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brown-muted">
          <Navigation size={12} className="shrink-0 text-orange" />
          {destination ?? 'Pick a trip below'}
          {stopCount > 0 && (
            <span className="text-brown-muted/70">
              · {stopCount} stop{stopCount === 1 ? '' : 's'}
            </span>
          )}
        </p>
      </div>
    </section>
  )
}

function MapFallbackTerrain() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#8fbf7a] via-[#c8d9a8] to-[#e8dcc0]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />
      <div className="absolute bottom-[18%] left-[8%] h-[22%] w-[28%] rounded-full bg-[#7eb8d4]/55 blur-sm" aria-hidden />
      <div className="absolute right-[12%] top-[24%] h-[18%] w-[20%] rounded-full bg-[#7eb8d4]/45 blur-sm" aria-hidden />
    </>
  )
}
