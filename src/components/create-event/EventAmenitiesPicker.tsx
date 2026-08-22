import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { ADDITIONAL_AMENITIES, PRIMARY_AMENITIES } from '../../data/eventCategories'
import { AmenityIconDisplay } from '../../lib/amenityIcons'
import { FieldHelper, FieldLabel } from './CreateEventLayout'

type EventAmenitiesPickerProps = {
  amenities: string[]
  onChange: (amenities: string[]) => void
  /** When true, omits the built-in heading — use when the parent section already has a title. */
  embedded?: boolean
}

export default function EventAmenitiesPicker({
  amenities,
  onChange,
  embedded = false,
}: EventAmenitiesPickerProps) {
  const [showAdditional, setShowAdditional] = useState(false)

  function toggleAmenity(id: string) {
    if (amenities.includes(id)) {
      onChange(amenities.filter((a) => a !== id))
    } else {
      onChange([...amenities, id])
    }
  }

  return (
    <div className={embedded ? '' : 'mt-5'}>
      {!embedded && (
        <>
          <FieldLabel>What&apos;s included?</FieldLabel>
          <FieldHelper className="mb-2">
            Optional — help guests know what to expect at your event
          </FieldHelper>
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        {PRIMARY_AMENITIES.map((amenity) => (
          <AmenityCheckbox
            key={amenity.id}
            label={amenity.label}
            icon={<AmenityIconDisplay id={amenity.id} className={amenities.includes(amenity.id) ? 'shrink-0 text-electric-blue' : undefined} />}
            checked={amenities.includes(amenity.id)}
            onChange={() => toggleAmenity(amenity.id)}
          />
        ))}
      </div>

      <div className="mt-2 rounded-[14px] border border-brown/10 bg-cream-dark/50">
        <button
          type="button"
          onClick={() => setShowAdditional((v) => !v)}
          className="flex min-h-11 w-full items-center justify-between px-3 py-2.5 text-left"
        >
          <p className="text-sm font-bold text-brown">More options</p>
          {showAdditional ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showAdditional && (
          <div className="space-y-3 border-t border-brown/10 px-3 pb-3 pt-2">
            {Object.entries(ADDITIONAL_AMENITIES).map(([group, items]) => (
              <div key={group}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brown-muted">{group}</p>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((amenity) => (
                    <AmenityCheckbox
                      key={amenity.id}
                      label={amenity.label}
                      icon={<AmenityIconDisplay id={amenity.id} className={amenities.includes(amenity.id) ? 'shrink-0 text-electric-blue' : undefined} />}
                      checked={amenities.includes(amenity.id)}
                      onChange={() => toggleAmenity(amenity.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AmenityCheckbox({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-[14px] border px-3 py-2.5 transition ${
        checked ? 'border-electric-blue/40 bg-electric-blue/10' : 'border-brown/10 bg-white'
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-brown">
        {icon}
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-electric-blue" />
    </label>
  )
}
