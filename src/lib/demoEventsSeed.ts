import { EVENT_CATEGORIES, type EventCategoryId } from '../data/eventCategories'
import {
  defaultHostEventFormData,
  defaultTicketTier,
  getOrganizations,
  publishHostEvent,
  updateHostEvent,
  type HostEventStatus,
  type TicketingMode,
} from './account'
import { createAdminSeededEvent } from './adminSeed'
import type { EventCardBorderType } from './eventCardColors'
import { DEMO_USER, PLATFORM_ADMIN } from './auth'
import { seedDemoBucketListsForAdmin } from './bucketLists'
import { seedDemoRoadTripsForAdmin } from './roadTrips'
import { saveEventsForUser } from './savedEvents'

const DEMO_EVENTS_FLAG = 'tudu_demo_events_v1'

type DemoEventSpec = {
  categoryId: EventCategoryId
  title: string
  venueName: string
  streetAddress: string
  city: string
  province: string
  description: string
  photos: [string, string, string]
  customTags: string[]
  subCategory: string
  status: HostEventStatus
  visibility: 'public' | 'private'
  ticketingMode: TicketingMode
  priceCents?: number
  discoverBorderType: EventCardBorderType
  eventDateOffsetDays: number
  startHour: string
  startPeriod: 'AM' | 'PM'
  hostAsOrg?: boolean
}

const SK_CITIES = [
  { city: 'Saskatoon', province: 'SK' },
  { city: 'Regina', province: 'SK' },
  { city: 'Kindersley', province: 'SK' },
  { city: 'Moose Jaw', province: 'SK' },
  { city: 'Prince Albert', province: 'SK' },
  { city: 'Calgary', province: 'AB' },
  { city: 'Winnipeg', province: 'MB' },
] as const

function photoSet(seed: string): [string, string, string] {
  return [
    `https://picsum.photos/seed/${seed}-a/800/600`,
    `https://picsum.photos/seed/${seed}-b/800/600`,
    `https://picsum.photos/seed/${seed}-c/800/600`,
  ]
}

const BORDER_ROTATION: EventCardBorderType[] = [
  'green',
  'orange',
  'blue',
  'gold',
  'pink',
  'teal',
]

const STATUS_PLAN: HostEventStatus[] = [
  'upcoming',
  'upcoming',
  'upcoming',
  'upcoming',
  'upcoming',
  'live',
  'live',
  'live',
  'live',
  'past',
  'past',
  'past',
  'past',
  'draft',
  'draft',
  'draft',
  'upcoming',
  'upcoming',
  'upcoming',
  'draft',
]

const VISIBILITY_PLAN: Array<'public' | 'private'> = [
  'public',
  'public',
  'public',
  'public',
  'private',
  'public',
  'public',
  'public',
  'private',
  'public',
  'public',
  'public',
  'public',
  'public',
  'private',
  'public',
  'public',
  'private',
  'public',
  'public',
]

const TICKETING_PLAN: TicketingMode[] = [
  'free_rsvp',
  'sell',
  'free_rsvp',
  'sell',
  'free_rsvp',
  'free_rsvp',
  'sell',
  'free_donation',
  'sell',
  'free_rsvp',
  'sell',
  'free_rsvp',
  'sell',
  'free_rsvp',
  'sell',
  'free_rsvp',
  'sell',
  'free_rsvp',
  'sell',
  'free_rsvp',
]

function buildCategorySpecs(): DemoEventSpec[] {
  const specs: DemoEventSpec[] = EVENT_CATEGORIES.map((cat, index) => {
    const loc = SK_CITIES[index % SK_CITIES.length]
    const sub = cat.subcategories[0] ?? cat.label
    const status = STATUS_PLAN[index] ?? 'upcoming'
    const offset =
      status === 'past'
        ? -(14 + index)
        : status === 'live'
          ? -1
          : status === 'draft'
            ? 21 + index
            : 7 + index * 3

    return {
      categoryId: cat.id,
      title: demoTitle(cat.id, loc.city),
      venueName: demoVenue(cat.id),
      streetAddress: `${100 + index * 11} Main Street`,
      city: loc.city,
      province: loc.province,
      description: demoDescription(cat.label, loc.city),
      photos: photoSet(`tudu-${cat.id}`),
      customTags: demoTags(cat.id),
      subCategory: sub,
      status,
      visibility: VISIBILITY_PLAN[index] ?? 'public',
      ticketingMode: TICKETING_PLAN[index] ?? 'free_rsvp',
      priceCents: TICKETING_PLAN[index] === 'sell' ? 1500 + index * 500 : undefined,
      discoverBorderType: BORDER_ROTATION[index % BORDER_ROTATION.length],
      eventDateOffsetDays: offset,
      startHour: index % 2 === 0 ? '7' : '2',
      startPeriod: index % 2 === 0 ? 'PM' : 'PM',
      hostAsOrg: index % 5 === 0 && getOrganizations().length > 0,
    }
  })

  specs.push(
    {
      categoryId: 'food-drink',
      title: '$1 Wing Night — Emerald Lounge',
      venueName: 'Emerald Lounge',
      streetAddress: '1 Dilson Drive',
      city: 'Kindersley',
      province: 'SK',
      description:
        'Classic prairie wing night — $1 wings, cheap pints, and live DJ sets every Thursday.',
      photos: photoSet('tudu-wing-night'),
      customTags: ['wing-night', 'cheap-wings', 'thursday-special'],
      subCategory: 'Bar Events',
      status: 'upcoming',
      visibility: 'public',
      ticketingMode: 'free_rsvp',
      discoverBorderType: 'gold',
      eventDateOffsetDays: 3,
      startHour: '6',
      startPeriod: 'PM',
    },
    {
      categoryId: 'nightlife-social',
      title: 'Neon Prairie Social Mixer',
      venueName: 'The Exchange',
      streetAddress: '220 21st Street East',
      city: 'Saskatoon',
      province: 'SK',
      description: 'Meet locals, sip craft cocktails, and discover what is happening in the city.',
      photos: photoSet('tudu-neon-mixer'),
      customTags: ['social-mixer', 'networking', 'cocktails'],
      subCategory: 'Social Mixers',
      status: 'live',
      visibility: 'public',
      ticketingMode: 'sell',
      priceCents: 2000,
      discoverBorderType: 'orange',
      eventDateOffsetDays: -1,
      startHour: '8',
      startPeriod: 'PM',
    },
  )

  return specs
}

function demoTitle(id: EventCategoryId, city: string): string {
  const titles: Partial<Record<EventCategoryId, string>> = {
    music: `Summer Sessions — ${city}`,
    'arts-culture': `${city} Gallery Walk`,
    'lifestyle-wellness': `Sunrise Yoga in ${city}`,
    'community-causes': `${city} Community Food Drive`,
    'faith-spirituality': `Interfaith Gathering — ${city}`,
    'sports-fitness': `${city} Charity 5K Run`,
    'outdoors-adventure': `Badlands Day Hike near ${city}`,
    'food-drink': `${city} Farm-to-Table Supper`,
    'family-kids': `Family Fun Day — ${city}`,
    'pets-animals': `Paws in the Park — ${city}`,
    'nightlife-social': `Karaoke Night at ${city} Pub`,
    'tech-gaming': `${city} LAN Party & Esports`,
    'shopping-markets': `${city} Makers Market`,
    'education-workshops': `Skill Share Workshop — ${city}`,
    'business-science': `Innovation Breakfast — ${city}`,
    'auto-motorsports': `Classic Car Show — ${city}`,
    'aviation-aerospace': `Aviation Day at ${city} Airport`,
    'festivals-special': `${city} Summer Festival`,
  }
  return titles[id] ?? `${city} ${id} Event`
}

function demoVenue(id: EventCategoryId): string {
  const venues: Partial<Record<EventCategoryId, string>> = {
    music: 'The Bassment',
    'arts-culture': 'Remai Modern',
    'lifestyle-wellness': 'Prana Studio',
    'community-causes': 'Community Hall',
    'faith-spirituality': 'Cathedral Centre',
    'sports-fitness': 'Sportsplex',
    'outdoors-adventure': 'Trailhead Pavilion',
    'food-drink': 'Harvest Table',
    'family-kids': 'Discovery Centre',
    'pets-animals': 'Off-Leash Park',
    'nightlife-social': 'The Capitol',
    'tech-gaming': 'Pixel Arena',
    'shopping-markets': 'River Landing Market',
    'education-workshops': 'Library Auditorium',
    'business-science': 'Innovation Place',
    'auto-motorsports': 'Speedway Park',
    'aviation-aerospace': 'Regional Airport',
    'festivals-special': 'Waskesiu Grounds',
  }
  return venues[id] ?? 'Event Venue'
}

function demoDescription(label: string, city: string): string {
  return `Demo ${label.toLowerCase()} event seeded for category coverage in ${city}, Saskatchewan/Canada.`
}

function demoTags(id: EventCategoryId): string[] {
  const tags: Partial<Record<EventCategoryId, string[]>> = {
    music: ['live-music', 'local-band'],
    'food-drink': ['foodie', 'tasting'],
    'nightlife-social': ['night-out', 'social'],
    'shopping-markets': ['farmers-market', 'local-vendors'],
    'sports-fitness': ['5k', 'charity-run'],
    'outdoors-adventure': ['hiking', 'weekend-trip'],
    'family-kids': ['kid-friendly', 'family-day'],
    'pets-animals': ['dog-friendly', 'pet-meetup'],
    'tech-gaming': ['esports', 'lan-party'],
    'festivals-special': ['festival', 'summer-fun'],
  }
  return tags[id] ?? [`${id.replace(/-/g, '_')}`, 'demo-seed']
}

function formatDateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function isDemoEventsLoaded(): boolean {
  return localStorage.getItem(DEMO_EVENTS_FLAG) === 'true'
}

export function seedDemoEvents(): {
  ok: boolean
  created: number
  skipped?: boolean
  message?: string
  error?: string
} {
  if (isDemoEventsLoaded()) {
    return { ok: true, created: 0, skipped: true, message: 'Demo events already loaded.' }
  }

  const org = getOrganizations()[0]
  const specs = buildCategorySpecs()
  let created = 0
  const createdHostIds: string[] = []

  for (const spec of specs) {
    const form = defaultHostEventFormData()
    form.title = spec.title
    form.venueName = spec.venueName
    form.streetAddress = spec.streetAddress
    form.city = spec.city
    form.province = spec.province
    form.country = 'Canada'
    form.description = spec.description
    form.coverImage = spec.photos[0] ?? ''
    form.additionalPhotos = spec.photos.slice(1, 5)
    form.primaryCategory = spec.categoryId
    form.subCategories = [spec.subCategory]
    form.customTags = spec.customTags
    form.visibility = spec.visibility
    form.eventDate = formatDateOffset(spec.eventDateOffsetDays)
    form.startHour = spec.startHour
    form.startMinute = '00'
    form.startPeriod = spec.startPeriod
    form.endHour = '10'
    form.endMinute = '00'
    form.endPeriod = 'PM'
    form.ticketingMode = spec.ticketingMode
    form.amenities = ['parking', 'food-drink']

    if (spec.ticketingMode === 'sell' && spec.priceCents != null) {
      const tier = defaultTicketTier()
      tier.name = 'General Admission'
      tier.priceCents = spec.priceCents
      tier.quantity = 200
      form.ticketTiers = [tier]
    } else if (spec.ticketingMode === 'free_rsvp') {
      form.capacity = 150
      form.ticketTiers = [defaultTicketTier()]
    }

    const target = spec.hostAsOrg && org
      ? { type: 'org' as const, id: org.id, label: org.name }
      : {
          type: 'personal' as const,
          id: DEMO_USER.email,
          label: DEMO_USER.firstName,
          email: DEMO_USER.email,
        }

    const publishLive =
      spec.visibility === 'public' && (spec.status === 'live' || spec.status === 'upcoming')

    const result = createAdminSeededEvent({
      target,
      form,
      publishLive,
      discoverBorderType: spec.discoverBorderType,
    })

    if (!result.ok || !result.event) continue

    let event = result.event
    createdHostIds.push(event.id)

    if (spec.status === 'past') {
      updateHostEvent(event.id, { status: 'past' })
    } else if (spec.status === 'draft') {
      updateHostEvent(event.id, { status: 'draft' })
    } else if (spec.status === 'upcoming' && event.status === 'live') {
      updateHostEvent(event.id, { status: 'upcoming' })
    } else if (spec.status === 'live' && event.status !== 'live' && spec.visibility === 'public') {
      publishHostEvent(event.id, { adminBypass: true })
    }

    created += 1
  }

  if (createdHostIds.length >= 3) {
    saveEventsForUser(
      DEMO_USER.email,
      createdHostIds.slice(0, 5).map((id) => `host-${id}`),
    )
  }

  seedDemoBucketListsForAdmin(createdHostIds)
  seedDemoRoadTripsForAdmin()

  localStorage.setItem(DEMO_EVENTS_FLAG, 'true')

  return {
    ok: true,
    created,
    message: `Loaded ${created} demo events across ${EVENT_CATEGORIES.length} categories (+2 bonus).`,
  }
}

/** Admin-only: remove flag so demo batch can be re-run (does not delete events). */
export function resetDemoEventsFlag(): void {
  localStorage.removeItem(DEMO_EVENTS_FLAG)
}

export function getDemoEventCategoryCount(): number {
  return EVENT_CATEGORIES.length
}

export const DEMO_SEED_ADMIN_EMAIL = PLATFORM_ADMIN.email
