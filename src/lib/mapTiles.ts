/**
 * Road trip map raster tiles (Carto Voyager / OSM data).
 * Dev: same-origin proxy in vite.config avoids blocked direct tile requests.
 */

export function buildRoadTripMapTileUrl(z: number, x: number, y: number): string {
  const custom = import.meta.env.VITE_MAP_TILE_URL?.trim()
  if (custom) {
    const base = custom.replace(/\/$/, '')
    return `${base}/${z}/${x}/${y}.png`
  }
  if (import.meta.env.DEV) {
    return `/map-tiles/${z}/${x}/${y}.png`
  }
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`
}
