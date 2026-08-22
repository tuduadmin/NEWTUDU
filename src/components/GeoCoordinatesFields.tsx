import { MapPin } from 'lucide-react'
import { appFieldClass } from '../lib/formFieldClasses'
import { formatCoordinateInput, parseCoordinateInput } from '../lib/geoCoordinates'

type GeoCoordinatesFieldsProps = {
  lat?: number
  lng?: number
  onChange: (coords: { lat?: number; lng?: number }) => void
  variant?: 'light' | 'dark'
  /** Show as optional pin for trails, lakes, viewpoints without street address. */
  natureHint?: boolean
}

export default function GeoCoordinatesFields({
  lat,
  lng,
  onChange,
  variant = 'light',
  natureHint = false,
}: GeoCoordinatesFieldsProps) {
  const inputClass = variant === 'dark' ? 'admin-input' : appFieldClass
  const labelClass =
    variant === 'dark'
      ? 'admin-label mb-1 block'
      : 'mb-1 block text-sm font-medium text-brown'
  const hintClass =
    variant === 'dark'
      ? 'mt-1 text-[11px] text-[var(--admin-text-dim)]'
      : 'mt-1 text-[11px] text-brown-muted'

  function patchLat(value: string) {
    onChange({ lat: parseCoordinateInput(value), lng })
  }

  function patchLng(value: string) {
    onChange({ lat, lng: parseCoordinateInput(value) })
  }

  return (
    <fieldset className="space-y-3">
      <legend className={labelClass}>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={14} aria-hidden />
          GPS coordinates{' '}
          <span className="font-normal text-brown-muted">(optional)</span>
        </span>
      </legend>

      {natureHint && (
        <p className={hintClass}>
          For trails, lakes, and viewpoints without a street address — paste lat/long from Google Maps
          (right-click a spot → copy coordinates).
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="geo-lat" className={labelClass}>
            Latitude
          </label>
          <input
            id="geo-lat"
            inputMode="decimal"
            value={formatCoordinateInput(lat)}
            onChange={(e) => patchLat(e.target.value)}
            placeholder="51.4678"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="geo-lng" className={labelClass}>
            Longitude
          </label>
          <input
            id="geo-lng"
            inputMode="decimal"
            value={formatCoordinateInput(lng)}
            onChange={(e) => patchLng(e.target.value)}
            placeholder="-109.1569"
            className={inputClass}
          />
        </div>
      </div>
    </fieldset>
  )
}
