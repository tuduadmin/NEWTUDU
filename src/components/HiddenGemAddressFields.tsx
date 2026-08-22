import { appFieldClass } from '../lib/formFieldClasses'
import { DEFAULT_COUNTRIES } from '../lib/analyticsGeo'
import {
  DEFAULT_HIDDEN_GEM_COUNTRY,
  type HiddenGemLocation,
} from '../lib/hiddenGems'
import GeoCoordinatesFields from './GeoCoordinatesFields'

type HiddenGemAddressFieldsProps = {
  value: HiddenGemLocation
  onChange: (location: HiddenGemLocation) => void
  variant?: 'light' | 'dark'
}

export default function HiddenGemAddressFields({
  value,
  onChange,
  variant = 'light',
}: HiddenGemAddressFieldsProps) {
  const inputClass = variant === 'dark' ? 'admin-input' : appFieldClass

  const labelClass =
    variant === 'dark'
      ? 'admin-label mb-1 block'
      : 'mb-1 block text-sm font-medium text-brown'

  const sectionLabelClass =
    variant === 'dark'
      ? 'admin-label mb-3 block'
      : 'mb-3 block font-display text-sm font-bold text-brown'

  function patch(partial: Partial<HiddenGemLocation>) {
    onChange({ ...value, ...partial })
  }

  return (
    <fieldset className="space-y-3">
      <legend className={sectionLabelClass}>Address</legend>

      <div>
        <label htmlFor="hg-street1" className={labelClass}>
          Street address <span className="text-orange">*</span>
        </label>
        <input
          id="hg-street1"
          name="street-address"
          autoComplete="address-line1"
          value={value.street1}
          onChange={(e) => patch({ street1: e.target.value })}
          placeholder="902 5th Street West"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="hg-street2" className={labelClass}>
          Suite / unit <span className="font-normal text-brown-muted">(optional)</span>
        </label>
        <input
          id="hg-street2"
          name="address-line2"
          autoComplete="address-line2"
          value={value.street2 ?? ''}
          onChange={(e) => patch({ street2: e.target.value })}
          placeholder="Suite 100"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="hg-city" className={labelClass}>
            City <span className="text-orange">*</span>
          </label>
          <input
            id="hg-city"
            name="city"
            autoComplete="address-level2"
            value={value.city}
            onChange={(e) => patch({ city: e.target.value })}
            placeholder="Kindersley"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="hg-region" className={labelClass}>
            Province / state
          </label>
          <input
            id="hg-region"
            name="region"
            autoComplete="address-level1"
            value={value.region}
            onChange={(e) => patch({ region: e.target.value })}
            placeholder="SK"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="hg-postal" className={labelClass}>
            Postal code
          </label>
          <input
            id="hg-postal"
            name="postal-code"
            autoComplete="postal-code"
            value={value.postalCode}
            onChange={(e) => patch({ postalCode: e.target.value })}
            placeholder="S0L 1S0"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="hg-country" className={labelClass}>
            Country
          </label>
          <select
            id="hg-country"
            name="country"
            autoComplete="country-name"
            value={value.country || DEFAULT_HIDDEN_GEM_COUNTRY}
            onChange={(e) => patch({ country: e.target.value })}
            className={inputClass}
          >
            {DEFAULT_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>

      <GeoCoordinatesFields
        variant={variant}
        natureHint
        lat={value.lat}
        lng={value.lng}
        onChange={({ lat, lng }) => patch({ lat, lng })}
      />
    </fieldset>
  )
}
