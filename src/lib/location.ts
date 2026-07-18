import { getPreferences, savePreferences } from './preferences'

export type City = {
  name: string
  province: string
  lat: number
  lng: number
}

export const CITIES: City[] = [
  { name: 'Kindersley', province: 'SK', lat: 51.4678, lng: -109.1569 },
  { name: 'Saskatoon', province: 'SK', lat: 52.1332, lng: -106.67 },
  { name: 'Regina', province: 'SK', lat: 50.4452, lng: -104.6189 },
  { name: 'Maple Creek', province: 'SK', lat: 49.906, lng: -109.4807 },
  { name: 'Yorkton', province: 'SK', lat: 51.2139, lng: -102.4628 },
  { name: 'Moose Jaw', province: 'SK', lat: 50.3934, lng: -105.5519 },
  { name: 'Swift Current', province: 'SK', lat: 50.2881, lng: -107.7939 },
  { name: 'Guelph', province: 'ON', lat: 43.5448, lng: -80.2482 },
  { name: 'Calgary', province: 'AB', lat: 51.0447, lng: -114.0719 },
  { name: 'Winnipeg', province: 'MB', lat: 49.8954, lng: -97.1385 },
]

const PRIMARY_LOCATION_KEY = 'primaryLocation'
const TRAVEL_PASS_KEY = 'tudu_travel_pass'
const TRAVEL_CITY_KEY = 'tudu_travel_city'
const GPS_CITY_KEY = 'tudu_gps_city'

export const LOCATION_CHANGE_EVENT = 'tudu-location-change'

function emitLocationChange(): void {
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT))
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore quota errors in demo */
  }
}

export function formatCityLabel(cityOrLabel: string): string {
  return cityOrLabel.split(',')[0]?.trim() ?? cityOrLabel
}

export function formatCityFull(city: City): string {
  return `${city.name}, ${city.province}`
}

export function findCityByName(name: string): City | undefined {
  const normalized = name.trim().toLowerCase()
  return CITIES.find((city) => city.name.toLowerCase() === normalized)
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function closestCity(lat: number, lng: number): City {
  let best = CITIES[0]
  let bestDistance = Infinity

  for (const city of CITIES) {
    const distance = haversineKm(lat, lng, city.lat, city.lng)
    if (distance < bestDistance) {
      bestDistance = distance
      best = city
    }
  }

  return best
}

export function getHomeCity(): string {
  const stored = readStorage(PRIMARY_LOCATION_KEY)
  if (stored) return stored

  const prefsLocation = getPreferences().location
  if (prefsLocation) {
    writeStorage(PRIMARY_LOCATION_KEY, prefsLocation)
    return prefsLocation
  }

  return formatCityFull(CITIES[0])
}

export function setHomeCity(city: string): void {
  writeStorage(PRIMARY_LOCATION_KEY, city)
  savePreferences({ location: city })
  emitLocationChange()
}

export function hasTravelPass(): boolean {
  return readStorage(TRAVEL_PASS_KEY) === 'true'
}

export function setTravelPassEnabled(enabled: boolean): void {
  writeStorage(TRAVEL_PASS_KEY, enabled ? 'true' : 'false')
  if (!enabled) {
    localStorage.removeItem(TRAVEL_CITY_KEY)
  }
  emitLocationChange()
}

export function getTravelPassCity(): string | null {
  return readStorage(TRAVEL_CITY_KEY)
}

export function setTravelPassCity(city: string): boolean {
  if (!hasTravelPass()) return false
  writeStorage(TRAVEL_CITY_KEY, city)
  emitLocationChange()
  return true
}

export function getGpsCity(): string | null {
  return readStorage(GPS_CITY_KEY)
}

export function getCurrentCity(): string {
  if (hasTravelPass()) {
    const travelCity = getTravelPassCity()
    if (travelCity) return travelCity
    const gpsCity = getGpsCity()
    if (gpsCity) return gpsCity
  }

  return getHomeCity()
}

export function requestGpsCity(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const match = closestCity(position.coords.latitude, position.coords.longitude)
        const label = formatCityFull(match)
        writeStorage(GPS_CITY_KEY, label)

        if (hasTravelPass()) {
          setTravelPassCity(label)
        }

        emitLocationChange()
        resolve(label)
      },
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  })
}
