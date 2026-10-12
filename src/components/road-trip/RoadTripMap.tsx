import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl/maplibre'
import maplibreWorkerUrl from '../../lib/maplibreWorkerUrl'
import { Home, MapPin, Navigation } from 'lucide-react'
import type { DiscoverEvent } from '../../data/discoverEvents'
import { getRoadTripMapStyle } from '../../lib/maplibreStyle'
import {
  ROAD_TRIP_MAP_DEFAULT_VIEW,
  roadTripMapBounds,
  type RoadTripMapStop,
} from '../../lib/roadTripMapModel'
import 'maplibre-gl/dist/maplibre-gl.css'

type RoadTripMapProps = {
  stops: RoadTripMapStop[]
  /** Full trip route in Google Maps */
  directionsUrl?: string | null
  variant?: 'light' | 'dark'
  className?: string
  onEventSelect?: (event: DiscoverEvent) => void
}

const ROUTE_SOURCE_ID = 'road-trip-route'

export default function RoadTripMap({
  stops,
  directionsUrl = null,
  variant = 'light',
  className = '',
  onEventSelect,
}: RoadTripMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [mapReady, setMapReady] = useState(false)
  const isDark = variant === 'dark'
  const mapStyle = useMemo(() => getRoadTripMapStyle(), [])

  const routeGeoJson = useMemo(() => {
    if (stops.length < 2) return null
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: stops.map((s) => [s.lng, s.lat] as [number, number]),
      },
    }
  }, [stops])

  const fitToStops = useCallback(() => {
    const map = mapRef.current?.getMap()
    const bounds = roadTripMapBounds(stops)
    if (!map || !bounds) return
    map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 600 })
  }, [stops])

  useEffect(() => {
    if (!mapReady) return
    if (stops.length === 0) return
    fitToStops()
  }, [mapReady, stops, fitToStops])

  function handleMarkerClick(stop: RoadTripMapStop) {
    if (stop.kind === 'event' && stop.event && onEventSelect) {
      onEventSelect(stop.event)
    }
  }

  return (
    <section
      className={`relative overflow-hidden rounded-[14px] border shadow-sm ${
        isDark ? 'border-white/10 bg-midnight-elevated' : 'border-app-subtle bg-app-elevated'
      } ${className}`}
    >
      <div className={`relative w-full ${isDark ? 'h-[min(52vh,420px)]' : 'aspect-[4/3] sm:aspect-square'}`}>
        <Map
          ref={mapRef}
          workerUrl={maplibreWorkerUrl}
          mapStyle={mapStyle}
          initialViewState={ROAD_TRIP_MAP_DEFAULT_VIEW}
          onLoad={() => setMapReady(true)}
          style={{ width: '100%', height: '100%' }}
          attributionControl={{ compact: true }}
          scrollZoom
          dragRotate={false}
          pitchWithRotate={false}
          touchPitch={false}
        >
          <NavigationControl position="top-right" showCompass={false} visualizePitch={false} />

          {routeGeoJson && (
            <Source id={ROUTE_SOURCE_ID} type="geojson" data={routeGeoJson}>
              <Layer
                id={`${ROUTE_SOURCE_ID}-line`}
                type="line"
                paint={{
                  'line-color': '#f97316',
                  'line-width': 3,
                  'line-opacity': 0.85,
                  'line-dasharray': [2, 1.5],
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </Source>
          )}

          {stops.map((stop) => (
            <Marker
              key={stop.id}
              longitude={stop.lng}
              latitude={stop.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                handleMarkerClick(stop)
              }}
            >
              {stop.kind === 'home' ? (
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-brown text-white shadow-lg ring-2 ring-brown/30"
                  aria-label={`Home base: ${stop.label}`}
                  title={`Home: ${stop.label}`}
                >
                  <Home size={18} strokeWidth={2.5} aria-hidden />
                </button>
              ) : stop.kind === 'event' && stop.imageUrl ? (
                <button
                  type="button"
                  className="group relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-brown shadow-lg ring-2 ring-orange/80 transition hover:scale-105 hover:ring-orange"
                  aria-label={`${stop.order}. ${stop.label}`}
                >
                  <img
                    src={stop.imageUrl}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                    draggable={false}
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-tudu px-1 text-[10px] font-bold text-white shadow">
                    {stop.order}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-orange text-xs font-bold text-white shadow-lg ring-2 ring-orange/40"
                  aria-label={`${stop.order}. ${stop.label}`}
                >
                  {stop.order}
                </button>
              )}
            </Marker>
          ))}
        </Map>

        {stops.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 px-6 text-center">
            <div className="rounded-[14px] bg-black/50 px-4 py-3 backdrop-blur-sm">
              <MapPin size={22} className="mx-auto text-orange" />
              <p className="mt-2 text-sm font-semibold text-white">Add stops to see your route</p>
              <p className="mt-1 text-xs text-white/75">Pan and zoom anywhere — pins appear as you build</p>
            </div>
          </div>
        )}
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5 ${
          isDark ? 'border-white/10' : 'border-app-subtle'
        }`}
      >
        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-brown-muted'}`}>
          {stops.length === 0
            ? 'Drag the map to explore · zoom with scroll or +/−'
            : `${stops.length} point${stops.length === 1 ? '' : 's'} · tap a photo pin for event details`}
        </p>
        <div className="flex flex-wrap gap-2">
          {stops.length > 0 && (
            <button
              type="button"
              onClick={fitToStops}
              className={`rounded-[10px] border px-2.5 py-1.5 text-[11px] font-bold ${
                isDark
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-app-subtle text-brown hover:border-orange/30'
              }`}
            >
              Fit route
            </button>
          )}
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-[10px] border border-orange/40 bg-orange/10 px-2.5 py-1.5 text-[11px] font-bold text-orange no-underline hover:bg-orange/15"
            >
              <Navigation size={12} aria-hidden />
              Google Maps (from home)
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
