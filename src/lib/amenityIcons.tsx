import { CakeIcon } from '@heroicons/react/24/solid'
import {
  AMENITY_FALLBACK_OUTLINE,
  AMENITY_FALLBACK_SOLID,
  AMENITY_OUTLINE_ICON_MAP,
  AMENITY_SOLID_ICON_MAP,
  getAmenityIconEntry,
  isReactIconsAmenityEntry,
} from '../data/amenityIconRegistry'

export type AmenityIconVariant = 'outline' | 'solid'

/** Same treatment as create-event `EventAmenitiesPicker` (Lucide outline on orange). */
export const AMENITY_PICKER_ICON_SIZE = 16
export const AMENITY_PICKER_ICON_CLASS = 'shrink-0 text-orange'

export function AmenityIconDisplay({
  id,
  className = AMENITY_PICKER_ICON_CLASS,
}: {
  id: string
  className?: string
}) {
  return (
    <AmenityIconById
      id={id}
      size={AMENITY_PICKER_ICON_SIZE}
      iconVariant="outline"
      className={className}
    />
  )
}

export function AmenityIconById({
  id,
  size = 14,
  iconVariant = 'outline',
  className,
}: {
  id: string
  size?: number
  iconVariant?: AmenityIconVariant
  className?: string
}) {
  const classNames = className ?? 'shrink-0'
  const entry = getAmenityIconEntry(id)

  if (entry && isReactIconsAmenityEntry(entry)) {
    const Icon = entry.icon
    return <Icon size={size} aria-hidden className={classNames} />
  }

  if (iconVariant === 'solid') {
    const Icon = AMENITY_SOLID_ICON_MAP[id] ?? AMENITY_FALLBACK_SOLID
    return <Icon width={size} height={size} aria-hidden className={classNames} />
  }
  const Icon = AMENITY_OUTLINE_ICON_MAP[id] ?? AMENITY_FALLBACK_OUTLINE
  return <Icon size={size} aria-hidden className={classNames} />
}

const PREVIEW_VISIBLE_COUNT = 3

/** Cover-card amenity badges — white icon on medium blue with white ring */
export const AMENITY_PREVIEW_BADGE_CLASS =
  'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sky-700 shadow-sm'
export const AMENITY_PREVIEW_BADGE_INTERACTIVE_CLASS =
  `${AMENITY_PREVIEW_BADGE_CLASS} transition hover:bg-sky-800`
export const AMENITY_PREVIEW_ICON_CLASS = 'shrink-0 text-white'

export function AmenityCardIcon({ id, size = AMENITY_PICKER_ICON_SIZE }: { id: string; size?: number }) {
  return (
    <AmenityIconById
      id={id}
      size={size}
      iconVariant="outline"
      className={AMENITY_PREVIEW_ICON_CLASS}
    />
  )
}

export function AmenityCardBadge({
  children,
  className = '',
  interactive = false,
  ...props
}: React.ComponentPropsWithoutRef<'span'> & {
  children: React.ReactNode
  interactive?: boolean
}) {
  return (
    <span
      className={`${interactive ? AMENITY_PREVIEW_BADGE_INTERACTIVE_CLASS : AMENITY_PREVIEW_BADGE_CLASS} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export function AmenityPreviewStrip({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null

  const visible = amenities.slice(0, PREVIEW_VISIBLE_COUNT)
  const extra = amenities.length - PREVIEW_VISIBLE_COUNT

  return (
    <div
      className="absolute left-2 top-3 z-10 flex flex-col gap-1.5"
      aria-label={`${amenities.length} amenities`}
    >
      {visible.map((id) => (
        <AmenityCardBadge key={id} title={id}>
          <AmenityCardIcon id={id} />
        </AmenityCardBadge>
      ))}
      {extra > 0 && (
        <AmenityCardBadge className="text-[10px] font-bold text-white">+{extra}</AmenityCardBadge>
      )}
    </div>
  )
}

/** Re-export for consumers that need the fallback solid icon name */
export { CakeIcon as AmenityFallbackSolidIcon }
