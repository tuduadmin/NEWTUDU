import { createElement, type ComponentType, type SVGProps } from 'react'
import type { IconType } from 'react-icons'
import { FaWifi } from 'react-icons/fa'
import {
  Accessibility,
  Baby,
  Bath,
  BedDouble,
  BriefcaseMedical,
  Bus,
  Caravan,
  CircleParking,
  CloudRain,
  Droplets,
  EvCharger,
  Martini,
  PawPrint,
  PlugZap,
  Shapes,
  Shield,
  Sun,
  Tent,
  Umbrella,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { ADDITIONAL_AMENITIES, PRIMARY_AMENITIES } from './eventCategories'

export type HeroiconSolid = ComponentType<SVGProps<SVGSVGElement>>

/** Lucide rendered with heavier stroke so solid cards match screenshot weight */
const LUCIDE_SOLID_STROKE = 2.5

export function lucideAsSolid(Icon: LucideIcon, solidIconId: string): HeroiconSolid {
  const Component = ({ width = 24, height = 24, className, ...rest }: SVGProps<SVGSVGElement>) =>
    createElement(Icon, {
      width,
      height,
      strokeWidth: LUCIDE_SOLID_STROKE,
      className,
      'aria-hidden': rest['aria-hidden'],
    })
  Component.displayName = solidIconId
  return Component as HeroiconSolid
}

type AmenityIconEntryLucideHero = {
  /** Solid glyph for cards & admin (Heroicons or Lucide-as-solid) */
  solid: HeroiconSolid
  /** Lucide outline — create-event picker */
  outline: LucideIcon
  /** Icon export name for admin/docs */
  solidIconId: string
  source: 'heroicons' | 'lucide'
}

type AmenityIconEntryReactIcons = {
  /** Same glyph for solid cards and orange outline picker */
  icon: IconType
  solidIconId: string
  /** Subpath on react-icons, e.g. `fa` → `react-icons/fa` */
  reactIconsImport: string
  /** Export name from react-icons.github.io, e.g. `FaWifi` */
  reactIconsName: string
  source: 'react-icons'
}

export type AmenityIconEntry = AmenityIconEntryLucideHero | AmenityIconEntryReactIcons

export function isReactIconsAmenityEntry(
  entry: AmenityIconEntry,
): entry is AmenityIconEntryReactIcons {
  return entry.source === 'react-icons'
}

/** Register a react-icons glyph (import the component at top of this file). */
export function reactIconsEntry(
  icon: IconType,
  reactIconsImport: string,
  reactIconsName: string,
): AmenityIconEntryReactIcons {
  return {
    source: 'react-icons',
    icon,
    solidIconId: reactIconsName,
    reactIconsImport,
    reactIconsName,
  }
}

/**
 * Canonical amenity icons. Keys must cover every id in PRIMARY_AMENITIES + ADDITIONAL_AMENITIES.
 * Change icons here; admin `/admin/categories-amenities` reflects this registry.
 */
export const AMENITY_ICON_REGISTRY = {
  'food-drink': {
    solid: lucideAsSolid(UtensilsCrossed, 'UtensilsCrossed'),
    outline: UtensilsCrossed,
    solidIconId: 'UtensilsCrossed',
    source: 'lucide',
  },
  alcohol: {
    solid: lucideAsSolid(Martini, 'Martini'),
    outline: Martini,
    solidIconId: 'Martini',
    source: 'lucide',
  },
  bathrooms: {
    solid: lucideAsSolid(Bath, 'Bath'),
    outline: Bath,
    solidIconId: 'Bath',
    source: 'lucide',
  },
  parking: {
    /** Lucide `CircleParking` — “P in circle” matches reference; Heroicons has no parking letter glyph */
    solid: lucideAsSolid(CircleParking, 'CircleParking'),
    outline: CircleParking,
    solidIconId: 'CircleParking',
    source: 'lucide',
  },
  wheelchair: {
    solid: lucideAsSolid(Accessibility, 'Accessibility'),
    outline: Accessibility,
    solidIconId: 'Accessibility',
    source: 'lucide',
  },
  wifi: reactIconsEntry(FaWifi, 'fa', 'FaWifi'),
  'kid-friendly': {
    solid: lucideAsSolid(Shapes, 'Shapes'),
    outline: Shapes,
    solidIconId: 'Shapes',
    source: 'lucide',
  },
  'baby-changing': {
    /** No stroller in Lucide/Heroicons; side-view baby reads closest to reference */
    solid: lucideAsSolid(Baby, 'Baby'),
    outline: Baby,
    solidIconId: 'Baby',
    source: 'lucide',
  },
  'pet-friendly': {
    solid: lucideAsSolid(PawPrint, 'PawPrint'),
    outline: PawPrint,
    solidIconId: 'PawPrint',
    source: 'lucide',
  },
  power: {
    solid: lucideAsSolid(PlugZap, 'PlugZap'),
    outline: PlugZap,
    solidIconId: 'PlugZap',
    source: 'lucide',
  },
  water: {
    solid: lucideAsSolid(Droplets, 'Droplets'),
    outline: Droplets,
    solidIconId: 'Droplets',
    source: 'lucide',
  },
  'ev-charging': {
    solid: lucideAsSolid(EvCharger, 'EvCharger'),
    outline: EvCharger,
    solidIconId: 'EvCharger',
    source: 'lucide',
  },
  security: {
    solid: lucideAsSolid(Shield, 'Shield'),
    outline: Shield,
    solidIconId: 'Shield',
    source: 'lucide',
  },
  medical: {
    solid: lucideAsSolid(BriefcaseMedical, 'BriefcaseMedical'),
    outline: BriefcaseMedical,
    solidIconId: 'BriefcaseMedical',
    source: 'lucide',
  },
  lodging: {
    solid: lucideAsSolid(BedDouble, 'BedDouble'),
    outline: BedDouble,
    solidIconId: 'BedDouble',
    source: 'lucide',
  },
  camping: {
    solid: lucideAsSolid(Tent, 'Tent'),
    outline: Tent,
    solidIconId: 'Tent',
    source: 'lucide',
  },
  'camper-trailers': {
    solid: lucideAsSolid(Caravan, 'Caravan'),
    outline: Caravan,
    solidIconId: 'Caravan',
    source: 'lucide',
  },
  'outdoor-seating': {
    solid: lucideAsSolid(Umbrella, 'Umbrella'),
    outline: Umbrella,
    solidIconId: 'Umbrella',
    source: 'lucide',
  },
  patio: {
    solid: lucideAsSolid(Sun, 'Sun'),
    outline: Sun,
    solidIconId: 'Sun',
    source: 'lucide',
  },
  'covered-area': {
    solid: lucideAsSolid(CloudRain, 'CloudRain'),
    outline: CloudRain,
    solidIconId: 'CloudRain',
    source: 'lucide',
  },
  transit: {
    solid: lucideAsSolid(Bus, 'Bus'),
    outline: Bus,
    solidIconId: 'Bus',
    source: 'lucide',
  },
} as const satisfies Record<string, AmenityIconEntry>

export type EventAmenityId = keyof typeof AMENITY_ICON_REGISTRY

const REQUIRED_AMENITY_IDS = [
  ...PRIMARY_AMENITIES.map((a) => a.id),
  ...Object.values(ADDITIONAL_AMENITIES).flatMap((group) => group.map((a) => a.id)),
] as const

function assertRegistryCoversAllAmenities(): void {
  const missing = REQUIRED_AMENITY_IDS.filter((id) => !(id in AMENITY_ICON_REGISTRY))
  if (missing.length > 0) {
    throw new Error(`AMENITY_ICON_REGISTRY missing entries for: ${missing.join(', ')}`)
  }
}

assertRegistryCoversAllAmenities()

export function getAmenityIconEntry(id: string): AmenityIconEntry | undefined {
  return AMENITY_ICON_REGISTRY[id as EventAmenityId]
}

export const AMENITY_SOLID_ICON_MAP: Record<string, HeroiconSolid> = Object.fromEntries(
  Object.entries(AMENITY_ICON_REGISTRY)
    .filter(([, entry]) => !isReactIconsAmenityEntry(entry))
    .map(([id, entry]) => [id, (entry as AmenityIconEntryLucideHero).solid]),
)

export const AMENITY_OUTLINE_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(AMENITY_ICON_REGISTRY)
    .filter(([, entry]) => !isReactIconsAmenityEntry(entry))
    .map(([id, entry]) => [id, (entry as AmenityIconEntryLucideHero).outline]),
)

/** Default when amenity id is unknown */
export const AMENITY_FALLBACK_OUTLINE = UtensilsCrossed
export const AMENITY_FALLBACK_SOLID = lucideAsSolid(UtensilsCrossed, 'UtensilsCrossed')

/** Legacy discover deck chips (`food` | `parking` | `wheelchair`) → registry ids */
export const LEGACY_DISCOVER_AMENITY_IDS: Record<'food' | 'parking' | 'wheelchair', EventAmenityId> = {
  food: 'food-drink',
  parking: 'parking',
  wheelchair: 'wheelchair',
}

export function listRegistryAmenitiesForAdmin(): {
  id: string
  label: string
  group?: string
  solidIconId: string
  source: AmenityIconEntry['source']
  reactIconsImport?: string
  reactIconsName?: string
}[] {
  const adminFields = (entry: AmenityIconEntry) =>
    isReactIconsAmenityEntry(entry)
      ? {
          solidIconId: entry.solidIconId,
          source: entry.source,
          reactIconsImport: entry.reactIconsImport,
          reactIconsName: entry.reactIconsName,
        }
      : { solidIconId: entry.solidIconId, source: entry.source }

  const primary = PRIMARY_AMENITIES.map((a) => {
    const entry = AMENITY_ICON_REGISTRY[a.id]
    return { id: a.id, label: a.label, ...adminFields(entry) }
  })
  const additional = Object.entries(ADDITIONAL_AMENITIES).flatMap(([group, items]) =>
    items.map((a) => {
      const entry = AMENITY_ICON_REGISTRY[a.id]
      return { id: a.id, label: a.label, group, ...adminFields(entry) }
    }),
  )
  return [...primary, ...additional]
}
