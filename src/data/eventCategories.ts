import {
  BookOpenIcon,
  HandRaisedIcon,
  LightBulbIcon,
  MusicalNoteIcon,
  ShoppingCartIcon,
  StarIcon,
} from '@heroicons/react/24/solid'
import { createElement, type ComponentType, type SVGProps } from 'react'
import {
  CarFront,
  Gamepad2,
  HeartHandshake,
  HeartPulse,
  Martini,
  Mountain,
  Palette,
  PawPrint,
  Plane,
  UtensilsCrossed,
  Volleyball,
  type LucideIcon,
} from 'lucide-react'

const LUCIDE_SOLID_STROKE = 2.5

function lucideCategoryIcon(Icon: LucideIcon, displayName: string): ComponentType<SVGProps<SVGSVGElement>> {
  const Component = ({ width = 24, height = 24, className, ...rest }: SVGProps<SVGSVGElement>) =>
    createElement(Icon, {
      width,
      height,
      strokeWidth: LUCIDE_SOLID_STROKE,
      className,
      'aria-hidden': rest['aria-hidden'],
    })
  Component.displayName = displayName
  return Component
}

/** Filled peace symbol — no Heroicons/Lucide match for reference glyph */
function PeaceSymbolIcon({ width = 24, height = 24, className, ...rest }: SVGProps<SVGSVGElement>) {
  return createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      width,
      height,
      className,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.75,
      strokeLinecap: 'round',
      'aria-hidden': rest['aria-hidden'],
    },
    createElement('circle', { cx: 12, cy: 12, r: 9.25 }),
    createElement('path', { d: 'M12 12v7M12 12l-4.5-4.5M12 12l4.5-4.5' }),
  )
}

const CategoryUtensilsIcon = lucideCategoryIcon(UtensilsCrossed, 'UtensilsCrossed')
const CategoryPaletteIcon = lucideCategoryIcon(Palette, 'Palette')
const CategoryHeartPulseIcon = lucideCategoryIcon(HeartPulse, 'HeartPulse')
const CategoryHeartHandshakeIcon = lucideCategoryIcon(HeartHandshake, 'HeartHandshake')
const CategoryVolleyballIcon = lucideCategoryIcon(Volleyball, 'Volleyball')
const CategoryMountainIcon = lucideCategoryIcon(Mountain, 'Mountain')
const CategoryPawPrintIcon = lucideCategoryIcon(PawPrint, 'PawPrint')
const CategoryMartiniIcon = lucideCategoryIcon(Martini, 'Martini')
const CategoryGamepadIcon = lucideCategoryIcon(Gamepad2, 'Gamepad2')
const CategoryCarFrontIcon = lucideCategoryIcon(CarFront, 'CarFront')
const CategoryPlaneIcon = lucideCategoryIcon(Plane, 'Plane')

export type EventCategoryId =
  | 'music'
  | 'arts-culture'
  | 'lifestyle-wellness'
  | 'community-causes'
  | 'faith-spirituality'
  | 'sports-fitness'
  | 'outdoors-adventure'
  | 'food-drink'
  | 'family-kids'
  | 'pets-animals'
  | 'nightlife-social'
  | 'tech-gaming'
  | 'shopping-markets'
  | 'education-workshops'
  | 'business-science'
  | 'auto-motorsports'
  | 'aviation-aerospace'
  | 'festivals-special'

export type EventCategory = {
  id: EventCategoryId
  label: string
  /** Compact label for 2-column mobile category tiles */
  shortLabel: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  subcategories: string[]
}

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: 'music',
    label: 'Music',
    shortLabel: 'Music',
    icon: MusicalNoteIcon,
    subcategories: [
      'Concerts & Live Shows',
      'Music Festivals & Tours',
      'DJs, Dance & Electronic Events',
      'Open Mic & Local Talent Nights',
      'Album Releases & Listening Parties',
    ],
  },
  {
    id: 'arts-culture',
    label: 'Arts & Culture',
    shortLabel: 'Arts',
    icon: CategoryPaletteIcon,
    subcategories: [
      'Galleries & Exhibits',
      'Theatre & Performing Arts',
      'Film, Photography & Media',
      'Cultural Celebrations & Heritage Events',
      'Literature, Poetry & Creative Workshops',
    ],
  },
  {
    id: 'lifestyle-wellness',
    label: 'Lifestyle & Wellness',
    shortLabel: 'Wellness',
    icon: CategoryHeartPulseIcon,
    subcategories: ['Yoga & Meditation', 'Fitness Classes', 'Spa & Self-Care', 'Health & Nutrition'],
  },
  {
    id: 'community-causes',
    label: 'Community & Causes',
    shortLabel: 'Community',
    icon: CategoryHeartHandshakeIcon,
    subcategories: ['Fundraisers', 'Volunteer Events', 'Community Meetings', 'Charity Drives'],
  },
  {
    id: 'faith-spirituality',
    label: 'Faith & Spirituality',
    shortLabel: 'Faith',
    icon: PeaceSymbolIcon,
    subcategories: ['Worship Services', 'Retreats', 'Study Groups', 'Interfaith Events'],
  },
  {
    id: 'sports-fitness',
    label: 'Sports & Fitness',
    shortLabel: 'Sports',
    icon: CategoryVolleyballIcon,
    subcategories: ['Tournaments', 'Runs & Races', 'Team Sports', 'Fitness Challenges'],
  },
  {
    id: 'outdoors-adventure',
    label: 'Outdoors & Adventure',
    shortLabel: 'Outdoors',
    icon: CategoryMountainIcon,
    subcategories: ['Hiking & Camping', 'Water Sports', 'Wildlife & Nature', 'Adventure Tours'],
  },
  {
    id: 'food-drink',
    label: 'Food & Drink',
    shortLabel: 'Food',
    icon: CategoryUtensilsIcon,
    subcategories: ['Food Festivals', 'Tastings & Pairings', 'Pop-ups & Supper Clubs', 'Farm-to-Table'],
  },
  {
    id: 'family-kids',
    label: 'Family & Kids',
    shortLabel: 'Family',
    icon: HandRaisedIcon,
    subcategories: ['Kids Activities', 'Family Festivals', 'Storytime & Play', 'Parent Meetups'],
  },
  {
    id: 'pets-animals',
    label: 'Pets & Animals',
    shortLabel: 'Pets',
    icon: CategoryPawPrintIcon,
    subcategories: ['Pet Meetups', 'Adoption Events', 'Animal Shows', 'Pet Training'],
  },
  {
    id: 'nightlife-social',
    label: 'Nightlife & Social',
    shortLabel: 'Nightlife',
    icon: CategoryMartiniIcon,
    subcategories: ['Club Nights', 'Bar Events', 'Social Mixers', 'Karaoke & Trivia'],
  },
  {
    id: 'tech-gaming',
    label: 'Tech & Gaming',
    shortLabel: 'Gaming',
    icon: CategoryGamepadIcon,
    subcategories: ['Esports', 'LAN Parties', 'Tech Talks', 'Hackathons'],
  },
  {
    id: 'shopping-markets',
    label: 'Shopping & Markets',
    shortLabel: 'Markets',
    icon: ShoppingCartIcon,
    subcategories: ['Farmers Markets', 'Craft Fairs', 'Pop-up Shops', 'Vintage & Antiques'],
  },
  {
    id: 'education-workshops',
    label: 'Education & Workshops',
    shortLabel: 'Workshops',
    icon: BookOpenIcon,
    subcategories: ['Classes & Courses', 'Seminars', 'Skill Shares', 'Certification Prep'],
  },
  {
    id: 'business-science',
    label: 'Business, Science & Innovation',
    shortLabel: 'Business',
    icon: LightBulbIcon,
    subcategories: ['Networking', 'Conferences', 'Startup Events', 'Science Fairs'],
  },
  {
    id: 'auto-motorsports',
    label: 'Auto & Motor Sports',
    shortLabel: 'Auto',
    icon: CategoryCarFrontIcon,
    subcategories: ['Car Shows', 'Races', 'Motorcycle Events', 'Off-Road'],
  },
  {
    id: 'aviation-aerospace',
    label: 'Aviation & Aerospace',
    shortLabel: 'Aviation',
    icon: CategoryPlaneIcon,
    subcategories: ['Air Shows', 'Aviation Meetups', 'Space & STEM', 'Drone Events'],
  },
  {
    id: 'festivals-special',
    label: 'Festivals & Special Events',
    shortLabel: 'Festivals',
    icon: StarIcon,
    subcategories: ['Seasonal Festivals', 'Parades', 'Fireworks', 'Special Occasions'],
  },
]

export const PRIMARY_AMENITIES = [
  { id: 'food-drink', label: 'Food & Drink' },
  { id: 'alcohol', label: 'Alcohol Served' },
  { id: 'bathrooms', label: 'Bathrooms' },
  { id: 'parking', label: 'Parking Available' },
  { id: 'wheelchair', label: 'Wheelchair Accessible' },
  { id: 'wifi', label: 'Free Wi-Fi' },
] as const

export const ADDITIONAL_AMENITIES = {
  'Family & Accessibility': [
    { id: 'kid-friendly', label: 'Kid-Friendly Area' },
    { id: 'baby-changing', label: 'Baby Changing Station' },
    { id: 'pet-friendly', label: 'Pet Friendly' },
  ],
  'Services & Tech': [
    { id: 'power', label: 'Power Access' },
    { id: 'water', label: 'Water Access' },
    { id: 'ev-charging', label: 'EV Charging' },
    { id: 'security', label: 'Security On-site' },
    { id: 'medical', label: 'Medical Services' },
  ],
  'Accommodations & Venue': [
    { id: 'lodging', label: 'Lodging Nearby' },
    { id: 'camping', label: 'Camping' },
    { id: 'camper-trailers', label: 'Camper Trailers' },
    { id: 'outdoor-seating', label: 'Outdoor Seating' },
    { id: 'patio', label: 'Patio' },
    { id: 'covered-area', label: 'Covered Area' },
    { id: 'transit', label: 'Near Public Transit' },
  ],
} as const

export const REPEAT_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
] as const

export function getCategoryById(id: EventCategoryId | ''): EventCategory | undefined {
  return EVENT_CATEGORIES.find((c) => c.id === id)
}

export const MIN_EVENT_CATEGORIES = 2
export const MAX_EVENT_CATEGORIES = 2

export function countSelectedCategories(form: {
  primaryCategory: string
  secondaryCategory: string
}): number {
  return (form.primaryCategory ? 1 : 0) + (form.secondaryCategory ? 1 : 0)
}

export function eventCategoriesComplete(form: {
  primaryCategory: string
  secondaryCategory: string
}): boolean {
  return countSelectedCategories(form) >= MIN_EVENT_CATEGORIES
}

const AMENITY_LABEL_BY_ID = new Map<string, string>([
  ...PRIMARY_AMENITIES.map((a) => [a.id, a.label] as const),
  ...Object.values(ADDITIONAL_AMENITIES).flatMap((group) =>
    group.map((a) => [a.id, a.label] as const),
  ),
])

export function getEventAmenityLabel(id: string): string {
  return AMENITY_LABEL_BY_ID.get(id) ?? id
}
