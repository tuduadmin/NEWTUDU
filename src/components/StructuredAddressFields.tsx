import { appFieldClass } from '../lib/formFieldClasses'
import { DEFAULT_COUNTRIES } from '../lib/analyticsGeo'
import type { StructuredAddress } from '../lib/structuredAddress'
import { FieldLabel } from './create-event/CreateEventLayout'

type StructuredAddressFieldsProps = {
  value: StructuredAddress
  onChange: (address: StructuredAddress) => void
  variant?: 'light' | 'dark'
  idPrefix?: string
}

export default function StructuredAddressFields({
  value,
  onChange,
  variant = 'light',
  idPrefix = 'addr',
}: StructuredAddressFieldsProps) {
  const inputClass =
    variant === 'dark' ? 'admin-input w-full' : `${appFieldClass} w-full`

  const darkLabelClass = 'admin-label mb-1 block'

  function patch(partial: Partial<StructuredAddress>) {
    onChange({ ...value, ...partial })
  }

  return (
    <fieldset className="space-y-3">
      <div>
        {variant === 'dark' ? (
          <label htmlFor={`${idPrefix}-street`} className={darkLabelClass}>
            Street address <span className="text-orange">*</span>
          </label>
        ) : (
          <FieldLabel htmlFor={`${idPrefix}-street`} required>
            Street address
          </FieldLabel>
        )}
        <input
          id={`${idPrefix}-street`}
          name="street-address"
          autoComplete="address-line1"
          value={value.streetAddress}
          onChange={(e) => patch({ streetAddress: e.target.value })}
          placeholder="902 5th Street West"
          required
          className={inputClass}
        />
      </div>

      <div>
        {variant === 'dark' ? (
          <label htmlFor={`${idPrefix}-suite`} className={darkLabelClass}>
            Suite / unit <span className="font-normal text-brown-muted">(optional)</span>
          </label>
        ) : (
          <FieldLabel htmlFor={`${idPrefix}-suite`}>
            Suite / unit <span className="font-normal text-brown-muted">(optional)</span>
          </FieldLabel>
        )}
        <input
          id={`${idPrefix}-suite`}
          name="address-line2"
          autoComplete="address-line2"
          value={value.streetSuite}
          onChange={(e) => patch({ streetSuite: e.target.value })}
          placeholder="Suite 100"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          {variant === 'dark' ? (
            <label htmlFor={`${idPrefix}-city`} className={darkLabelClass}>
              City <span className="text-orange">*</span>
            </label>
          ) : (
            <FieldLabel htmlFor={`${idPrefix}-city`} required>
              City
            </FieldLabel>
          )}
          <input
            id={`${idPrefix}-city`}
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
          {variant === 'dark' ? (
            <label htmlFor={`${idPrefix}-province`} className={darkLabelClass}>
              Province / state
            </label>
          ) : (
            <FieldLabel htmlFor={`${idPrefix}-province`}>Province / state</FieldLabel>
          )}
          <input
            id={`${idPrefix}-province`}
            name="region"
            autoComplete="address-level1"
            value={value.province}
            onChange={(e) => patch({ province: e.target.value })}
            placeholder="SK"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          {variant === 'dark' ? (
            <label htmlFor={`${idPrefix}-postal`} className={darkLabelClass}>
              Postal code
            </label>
          ) : (
            <FieldLabel htmlFor={`${idPrefix}-postal`}>Postal code</FieldLabel>
          )}
          <input
            id={`${idPrefix}-postal`}
            name="postal-code"
            autoComplete="postal-code"
            value={value.postalCode}
            onChange={(e) => patch({ postalCode: e.target.value })}
            placeholder="S0L 1S0"
            className={inputClass}
          />
        </div>
        <div>
          {variant === 'dark' ? (
            <label htmlFor={`${idPrefix}-country`} className={darkLabelClass}>
              Country
            </label>
          ) : (
            <FieldLabel htmlFor={`${idPrefix}-country`}>Country</FieldLabel>
          )}
          <select
            id={`${idPrefix}-country`}
            name="country"
            autoComplete="country-name"
            value={value.country || 'Canada'}
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
    </fieldset>
  )
}
