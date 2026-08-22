import { AmenityIconById } from '../lib/amenityIcons'

export type AmenityDisplayItem = {
  id: string
  label: string
}

type AmenityDisplayGridProps = {
  items: AmenityDisplayItem[]
  className?: string
}

/**
 * View-only amenity chips for opened detail panels (scroll-down content).
 * Standard read-only display — NOT for deck card icon strips (AmenityPreviewStrip / HiddenGemAmenityRow).
 * Subtle read-only chip shells with vivid gradient icon wells — no toggle or hover interaction.
 */
export default function AmenityDisplayGrid({ items, className = '' }: AmenityDisplayGridProps) {
  if (items.length === 0) return null

  return (
    <div
      className={`detail-amenity-grid mt-3 grid grid-cols-2 ${className}`.trim()}
      role="list"
      aria-label={`${items.length} amenities`}
    >
      {items.map(({ id, label }) => (
        <div key={id} className="detail-amenity-chip" role="listitem">
          <span className="detail-amenity-chip__icon" aria-hidden>
            <AmenityIconById id={id} size={16} iconVariant="outline" className="size-4 shrink-0 text-current" />
          </span>
          <span className="detail-amenity-chip__label">{label}</span>
        </div>
      ))}
    </div>
  )
}
