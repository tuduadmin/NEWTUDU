export type DiscoverBadge = 'TRUSTED HOST' | 'HIDDEN GEM'
export type DiscoverAmenity = 'food' | 'parking' | 'wheelchair'

export type DiscoverCategory = {
  label: string
  color: 'teal' | 'yellow' | 'purple'
  icon: 'cart' | 'food' | 'party'
}

export type DiscoverEvent = {
  id: string
  title: string
  city: string
  image: string
  badges: DiscoverBadge[]
  amenities?: DiscoverAmenity[]
  dateTag?: string
  dateTime?: string
  cost?: string
  isRsvp?: boolean
  isUnavailable?: boolean
  ageRange?: string
  distance?: string
  categories?: DiscoverCategory[]
  partyType?: string
  locationDetail?: string
  borderColor?: 'blue' | 'yellow'
}

import { getHostAccount, getPublicHostEventsForDiscover, getAgeRestrictionLabel, getEventCostLabel, type HostEvent } from '../lib/account'
import { getCategoryById, type EventCategoryId } from './eventCategories'

export const DISCOVER_EVENTS: DiscoverEvent[] = [
  {
    id: 'farmers-market',
    title: "Saskatoon Farmers' Market",
    city: 'Saskatoon',
    image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80',
    badges: ['TRUSTED HOST'],
    amenities: ['food', 'parking', 'wheelchair'],
    dateTag: 'Tomorrow',
    dateTime: 'Dec 17, 9:00 AM',
    cost: 'Free',
    ageRange: 'All Ages',
    distance: '~5 mins away',
    categories: [
      { label: 'Shopping & Markets', color: 'teal', icon: 'cart' },
      { label: 'Food & Drink', color: 'yellow', icon: 'food' },
    ],
    borderColor: 'blue',
  },
  {
    id: 'one-book-one-province',
    title: 'One Book One Province 2026',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    badges: ['HIDDEN GEM'],
    partyType: 'Party',
    ageRange: 'All Ages',
    locationDetail:
      'In Maple Creek, Assiniboia, Saskatoon, Moosomin, Yorkton & Regina',
    borderColor: 'yellow',
  },
  {
    id: 'kindersley-summer-market',
    title: 'Kindersley Summer Market',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1567306303716-647a3c3a0a4c?w=800&q=80',
    badges: ['TRUSTED HOST'],
    amenities: ['food', 'parking'],
    dateTag: 'This Weekend',
    dateTime: 'Jul 19, 9:00 AM',
    cost: 'Free',
    ageRange: 'All Ages',
    distance: '~10 mins away',
    categories: [{ label: 'Shopping & Markets', color: 'teal', icon: 'cart' }],
    borderColor: 'blue',
  },
  {
    id: 'jazz-emerald',
    title: 'Live Jazz at Emerald Lounge',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1415201361474-7efff816c025?w=800&q=80',
    badges: ['HIDDEN GEM'],
    amenities: ['food', 'wheelchair'],
    dateTag: 'Next Week',
    dateTime: 'Jul 20, 8:00 PM',
    cost: '$15',
    ageRange: '19+',
    distance: '~3 mins away',
    categories: [{ label: 'Music', color: 'purple', icon: 'party' }],
    borderColor: 'yellow',
  },
]

const HOST_EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
  'https://images.unsplash.com/photo-1517456793572-1e8a4e4b875a?w=800&q=80',
]

function formatEventDateTime(event: HostEvent): string | undefined {
  if (!event.eventDate) return undefined
  const date = new Date(event.eventDate + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  if (event.allDay) return date
  const start = `${event.startHour ?? '12'}:${event.startMinute ?? '00'} ${event.startPeriod ?? 'PM'}`
  return `${date}, ${start}`
}

function mapAmenities(event: HostEvent): DiscoverAmenity[] {
  const list: DiscoverAmenity[] = []
  if (event.amenities?.includes('food-drink')) list.push('food')
  if (event.amenities?.includes('parking')) list.push('parking')
  if (event.amenities?.includes('wheelchair')) list.push('wheelchair')
  return list
}

function hostEventToDiscoverCard(event: HostEvent, index: number): DiscoverEvent {
  const hostAccount = event.hostAccountId ? getHostAccount(event.hostAccountId) : null
  const city = event.city ?? (hostAccount?.category === 'Community' ? 'Kindersley' : 'Saskatoon')
  const costLabel = getEventCostLabel(event)
  const primary = event.primaryCategory
    ? getCategoryById(event.primaryCategory as EventCategoryId)
    : null

  return {
    id: `host-${event.id}`,
    title: event.title,
    city,
    image: event.photos?.[0] ?? HOST_EVENT_IMAGES[index % HOST_EVENT_IMAGES.length],
    badges: hostAccount ? ['TRUSTED HOST'] : ['HIDDEN GEM'],
    amenities: mapAmenities(event),
    dateTag: event.status === 'live' ? 'Live Now' : 'Upcoming',
    dateTime: formatEventDateTime(event),
    cost: costLabel,
    isRsvp: costLabel === 'RSVP',
    isUnavailable: costLabel === 'UNAVAILABLE',
    ageRange: getAgeRestrictionLabel(event.ageRestriction),
    distance: '~15 mins away',
    categories: primary
      ? [{ label: primary.label, color: 'teal', icon: 'party' }]
      : [
          {
            label: hostAccount?.category ?? 'Community',
            color: 'teal',
            icon: 'party',
          },
        ],
    locationDetail: [event.venueName, event.streetAddress, event.city].filter(Boolean).join(', ') || undefined,
    borderColor: 'blue',
  }
}

/** Static seed cards plus live/upcoming public host events for the card deck. */
export function getDiscoverEventsPool(): DiscoverEvent[] {
  const hostEvents = getPublicHostEventsForDiscover().map(hostEventToDiscoverCard)
  return [...hostEvents, ...DISCOVER_EVENTS]
}
