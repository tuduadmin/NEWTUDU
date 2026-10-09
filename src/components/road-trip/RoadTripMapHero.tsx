import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Minus, Navigation, Plus, RotateCcw } from 'lucide-react'
import type { MapPin as MapPinPoint, RoadTripMapView } from '../../lib/roadTripGeo'

type RoadTripMapHeroProps = {
  tripName?: string
  destination?: string
  pins: MapPinPoint[]
  stopCount: number
  mapView: RoadTripMapView
  /** Google Maps directions URL (multi-stop route). */
  directionsUrl?: string | null
  /** Dark road-trip landing styling */
  variant?: 'default' | 'dark'
}

type MapTransform = { x: number; y: number; scale: number }

const MIN_SCALE = 0.12
const MAX_SCALE = 5
const ZOOM_STEP = 1.22
const TILE_PX = 256

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function fitTransform(viewportW: number, viewportH: number, mapW: number, mapH: number): MapTransform {
  if (viewportW <= 0 || viewportH <= 0) return { x: 0, y: 0, scale: 1 }
  const scale = clamp(Math.min(viewportW / mapW, viewportH / mapH) * 0.96, MIN_SCALE, MAX_SCALE)
  return {
    scale,
    x: (viewportW - mapW * scale) / 2,
    y: (viewportH - mapH * scale) / 2,
  }
}

function pinchDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function pinchCenter(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export default function RoadTripMapHero({
  tripName,
  destination,
  pins,
  stopCount,
  mapView,
  directionsUrl = null,
  variant = 'default',
}: RoadTripMapHeroProps) {
  const isDark = variant === 'dark'
  const [mapFailed, setMapFailed] = useState(false)
  const failedCount = useMemo(() => ({ current: 0 }), [])
  const totalTiles = mapView.tiles.length

  const mapW = mapView.mapWidth || mapView.gridSize * TILE_PX
  const mapH = mapView.mapHeight || mapView.gridSize * TILE_PX

  const viewportRef = useRef<HTMLDivElement>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const panStartRef = useRef<{ x: number; y: number; transform: MapTransform } | null>(null)
  const pinchStartRef = useRef<{
    distance: number
    center: { x: number; y: number }
    transform: MapTransform
  } | null>(null)

  const [transform, setTransform] = useState<MapTransform>({ x: 0, y: 0, scale: 1 })

  const mapViewKey = `${mapView.zoom}-${mapView.tiles.map((t) => `${t.x},${t.y}`).join('|')}`

  const applyFit = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setTransform(fitTransform(rect.width, rect.height, mapW, mapH))
  }, [mapH, mapW])

  useEffect(() => {
    applyFit()
  }, [mapViewKey, applyFit])

  useEffect(() => {
    const el = viewportRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => applyFit())
    ro.observe(el)
    return () => ro.disconnect()
  }, [applyFit])

  function zoomAt(focusX: number, focusY: number, nextScale: number) {
    setTransform((prev) => {
      const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
      const ratio = scale / prev.scale
      return {
        scale,
        x: focusX - (focusX - prev.x) * ratio,
        y: focusY - (focusY - prev.y) * ratio,
      }
    })
  }

  function handleTileError() {
    failedCount.current += 1
    if (failedCount.current >= totalTiles) setMapFailed(true)
  }

  function viewportPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = viewportRef.current!.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    viewportRef.current?.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 1) {
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        transform: { ...transform },
      }
      pinchStartRef.current = null
    } else if (pointersRef.current.size === 2) {
      panStartRef.current = null
      const pts = [...pointersRef.current.values()]
      pinchStartRef.current = {
        distance: pinchDistance(pts[0], pts[1]),
        center: pinchCenter(pts[0], pts[1]),
        transform: { ...transform },
      }
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()]
      const start = pinchStartRef.current
      if (!start || start.distance <= 0) return

      const center = pinchCenter(pts[0], pts[1])
      const dist = pinchDistance(pts[0], pts[1])
      const focus = viewportPoint(center.x, center.y)
      const nextScale = clamp(
        start.transform.scale * (dist / start.distance),
        MIN_SCALE,
        MAX_SCALE,
      )
      const ratio = nextScale / start.transform.scale
      const focusStart = viewportPoint(start.center.x, start.center.y)
      setTransform({
        scale: nextScale,
        x: focus.x - (focusStart.x - start.transform.x) * ratio,
        y: focus.y - (focusStart.y - start.transform.y) * ratio,
      })
      return
    }

    const panStart = panStartRef.current
    if (!panStart) return
    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y
    setTransform({
      ...panStart.transform,
      x: panStart.transform.x + dx,
      y: panStart.transform.y + dy,
    })
  }

  function endPointer(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size === 0) {
      panStartRef.current = null
      pinchStartRef.current = null
    } else if (pointersRef.current.size === 1) {
      pinchStartRef.current = null
      const remaining = [...pointersRef.current.entries()][0]
      panStartRef.current = {
        x: remaining[1].x,
        y: remaining[1].y,
        transform: { ...transform },
      }
    }
    try {
      viewportRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const focus = viewportPoint(e.clientX, e.clientY)
    const factor = Math.exp(-e.deltaY * 0.0015)
    zoomAt(focus.x, focus.y, transform.scale * factor)
  }

  function zoomFromControls(direction: 'in' | 'out') {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const focus = { x: rect.width / 2, y: rect.height / 2 }
    const factor = direction === 'in' ? ZOOM_STEP : 1 / ZOOM_STEP
    zoomAt(focus.x, focus.y, transform.scale * factor)
  }

  function stopMapGesture(e: React.SyntheticEvent) {
    e.stopPropagation()
  }

  return (
    <section
      className={`relative mx-2 overflow-hidden rounded-[14px] border shadow-sm ${
        isDark ? 'border-white/10 bg-midnight-elevated' : 'border-app-subtle bg-app-elevated'
      }`}
    >
      <div
        ref={viewportRef}
        className="relative aspect-[4/3] w-full touch-none overflow-hidden bg-[#dce8d4] sm:aspect-square"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={onWheel}
        role="application"
        aria-label="Road trip map. Drag to pan. Pinch or scroll to zoom."
      >
        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: mapW,
            height: mapH,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {!mapFailed ? (
            <div
              className="grid h-full w-full"
              style={{
                gridTemplateColumns: `repeat(${mapView.gridSize}, ${TILE_PX}px)`,
                gridTemplateRows: `repeat(${mapView.gridSize}, ${TILE_PX}px)`,
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
                  draggable={false}
                  onError={handleTileError}
                />
              ))}
            </div>
          ) : (
            <MapFallbackTerrain />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

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
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-tudu text-[11px] font-bold text-white shadow-md ring-2 ring-white">
                {pin.order}
              </span>
            </div>
          ))}
        </div>

        {pins.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="rounded-[14px] bg-black/45 px-4 py-3 backdrop-blur-sm">
              <MapPin size={24} className="mx-auto text-orange" />
              <p className="mt-2 text-sm font-semibold text-white">Add stops to see your route</p>
              <p className="mt-1 text-xs text-white/75">Map updates as you build your trip</p>
            </div>
          </div>
        )}

        <div className="absolute right-2 top-2 z-[2] flex flex-col gap-1">
          <button
            type="button"
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/25 bg-black/50 text-white shadow-md backdrop-blur-sm transition hover:bg-black/65"
            onPointerDown={stopMapGesture}
            onClick={(e) => {
              stopMapGesture(e)
              zoomFromControls('in')
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/25 bg-black/50 text-white shadow-md backdrop-blur-sm transition hover:bg-black/65"
            onPointerDown={stopMapGesture}
            onClick={(e) => {
              stopMapGesture(e)
              zoomFromControls('out')
            }}
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Reset map view"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/25 bg-black/50 text-white shadow-md backdrop-blur-sm transition hover:bg-black/65"
            onPointerDown={stopMapGesture}
            onClick={(e) => {
              stopMapGesture(e)
              applyFit()
            }}
          >
            <RotateCcw size={14} strokeWidth={2.5} />
          </button>
        </div>

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 left-2 z-[2] inline-flex items-center gap-1.5 rounded-[12px] border border-white/25 bg-black/55 px-3 py-2 text-xs font-bold text-white no-underline shadow-md backdrop-blur-sm transition hover:bg-black/70"
            onPointerDown={stopMapGesture}
            onClick={stopMapGesture}
          >
            <Navigation size={14} className="text-orange" aria-hidden />
            Get directions
          </a>
        )}

        <p className="pointer-events-none absolute bottom-1 right-2 z-[1] text-[9px] text-white/80 drop-shadow">
          © OpenStreetMap
        </p>
      </div>

      {!isDark && (
        <div className="border-t border-app-subtle px-3 py-2.5">
          <p className="font-display text-base font-bold text-brown">
            {tripName ?? 'Road Trip'}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-brown-muted">
            <span className="inline-flex items-center gap-1.5">
              <Navigation size={12} className="shrink-0 text-orange" />
              {destination ?? 'Pick a trip below'}
              {stopCount > 0 && (
                <span className="text-brown-muted/70">
                  · {stopCount} stop{stopCount === 1 ? '' : 's'}
                </span>
              )}
            </span>
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-orange no-underline hover:text-orange/85"
              >
                Open in Google Maps →
              </a>
            )}
          </p>
        </div>
      )}
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
