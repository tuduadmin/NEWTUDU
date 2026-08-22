import {
  HIDDEN_GEM_CARD_VISIBLE_COUNT,
  normalizeAmenityIds,
} from '../lib/amenities'
import {
  AmenityCardBadge,
  AmenityCardIcon,
  AMENITY_PREVIEW_BADGE_INTERACTIVE_CLASS,
} from '../lib/amenityIcons'

type HiddenGemAmenityRowProps = {
  amenityIds: string[]
  /** Opens detail panel when the overflow chip is tapped. */
  onOverflowClick?: () => void
  /** Horizontal row (default) or vertical column for Hidden Gem cards. */
  layout?: 'row' | 'column'
  className?: string
}

export default function HiddenGemAmenityRow({
  amenityIds,
  onOverflowClick,
  layout = 'row',
  className = '',
}: HiddenGemAmenityRowProps) {
  const ids = normalizeAmenityIds(amenityIds)
  if (ids.length === 0) return null

  const visible = ids.slice(0, HIDDEN_GEM_CARD_VISIBLE_COUNT)
  const overflow = ids.length - HIDDEN_GEM_CARD_VISIBLE_COUNT
  const isColumn = layout === 'column'

  return (
    <div
      className={`${isColumn ? 'flex flex-col gap-1.5' : 'mt-3 flex items-center gap-1.5'} ${className}`}
      aria-label={`${ids.length} amenities`}
    >
      {visible.map((id) => (
        <AmenityCardBadge key={id} title={id}>
          <AmenityCardIcon id={id} />
        </AmenityCardBadge>
      ))}
      {overflow > 0 &&
        (onOverflowClick ? (
          <button
            type="button"
            onClick={onOverflowClick}
            className={`${AMENITY_PREVIEW_BADGE_INTERACTIVE_CLASS} text-[10px] font-bold text-white`}
            aria-label={`${overflow} more amenities`}
          >
            +{overflow}
          </button>
        ) : (
          <AmenityCardBadge className="text-[10px] font-bold text-white">+{overflow}</AmenityCardBadge>
        ))}
    </div>
  )
}
