import type { StyleSpecification } from 'maplibre-gl'

/** MapLibre style — MapTiler when keyed, otherwise free Carto Positron (global raster/vector). */
export function getRoadTripMapStyle(): string | StyleSpecification {
  const key = import.meta.env.VITE_MAPTILER_KEY?.trim()
  if (key) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(key)}`
  }
  return 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
}
