import type { DiscoverEvent } from '../data/discoverEvents'
import { DISCOVER_EVENTS } from '../data/discoverEvents'
import type { BucketList, PublicBucketList } from '../types/bucketList'
import { removeSavedEvents } from './savedEvents'

export type { BucketList, PublicBucketList } from '../types/bucketList'

const LISTS_KEY = 'tudu_bucket_lists'
const PUBLIC_KEY = 'tudu_public_bucket_lists'

function generateId(): string {
  return `bl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readLists(): BucketList[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BucketList[]
  } catch {
    return []
  }
}

function writeLists(lists: BucketList[]): void {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
}

export function getBucketLists(): BucketList[] {
  return readLists().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function getBucketListById(id: string): BucketList | undefined {
  return readLists().find((l) => l.id === id)
}

export function createBucketList(name: string, eventIds: string[] = []): BucketList {
  const now = new Date().toISOString()
  const list: BucketList = {
    id: generateId(),
    name: name.trim() || 'Untitled List',
    eventIds: [...new Set(eventIds)],
    createdAt: now,
    updatedAt: now,
    completedIds: [],
    completionNotes: {},
  }
  writeLists([list, ...readLists()])
  return list
}

export function updateBucketListName(id: string, name: string): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === id)
  if (idx === -1) return undefined

  lists[idx] = {
    ...lists[idx],
    name: name.trim() || lists[idx].name,
    updatedAt: new Date().toISOString(),
  }
  writeLists(lists)
  return lists[idx]
}

export function addEventsToBucketList(id: string, eventIds: string[]): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === id)
  if (idx === -1) return undefined

  const merged = [...new Set([...lists[idx].eventIds, ...eventIds])]
  lists[idx] = { ...lists[idx], eventIds: merged, updatedAt: new Date().toISOString() }
  writeLists(lists)
  return lists[idx]
}

export function removeEventFromBucketList(listId: string, eventId: string): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === listId)
  if (idx === -1) return undefined

  const completedIds = lists[idx].completedIds.filter((id) => id !== eventId)
  const completionNotes = { ...lists[idx].completionNotes }
  delete completionNotes[eventId]

  lists[idx] = {
    ...lists[idx],
    eventIds: lists[idx].eventIds.filter((id) => id !== eventId),
    completedIds,
    completionNotes,
    updatedAt: new Date().toISOString(),
  }
  writeLists(lists)
  return lists[idx]
}

export function toggleEventComplete(
  listId: string,
  eventId: string,
  note?: string,
): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === listId)
  if (idx === -1) return undefined

  const list = lists[idx]
  const isComplete = list.completedIds.includes(eventId)
  let completedIds: string[]
  const completionNotes = { ...(list.completionNotes ?? {}) }

  if (isComplete) {
    completedIds = list.completedIds.filter((id) => id !== eventId)
    delete completionNotes[eventId]
  } else {
    completedIds = [...list.completedIds, eventId]
    if (note?.trim()) completionNotes[eventId] = note.trim()
  }

  lists[idx] = {
    ...list,
    completedIds,
    completionNotes,
    updatedAt: new Date().toISOString(),
  }
  writeLists(lists)
  return lists[idx]
}

export function moveSavedEventsToBucketList(
  listId: string,
  eventIds: string[],
): BucketList | undefined {
  const list = addEventsToBucketList(listId, eventIds)
  if (list) removeSavedEvents(eventIds)
  return list
}

export function deleteBucketList(id: string): void {
  writeLists(readLists().filter((l) => l.id !== id))
}

export function copyPublicListToMine(
  publicList: PublicBucketList,
  customName?: string,
): BucketList {
  const eventIds = publicList.events.map((e) => e.id)
  return createBucketList(customName?.trim() || `${publicList.name} (copy)`, eventIds)
}

export function copyPublicEventToList(listId: string, event: DiscoverEvent): BucketList | undefined {
  return addEventsToBucketList(listId, [event.id])
}

export function resolveEvent(eventId: string): DiscoverEvent | undefined {
  return DISCOVER_EVENTS.find((e) => e.id === eventId)
}

export function resolveEvents(eventIds: string[]): DiscoverEvent[] {
  return eventIds
    .map((id) => resolveEvent(id))
    .filter((e): e is DiscoverEvent => e != null)
}

export function getListCoverImage(list: BucketList): string | undefined {
  const first = resolveEvent(list.eventIds[0])
  return first?.image
}

export function seedDemoBucketLists(): void {
  if (readLists().length > 0) return

  createBucketList('Summer in Saskatchewan', [
    DISCOVER_EVENTS[2]?.id,
    DISCOVER_EVENTS[3]?.id,
  ].filter(Boolean) as string[])

  createBucketList('Weekend Food Tour', [DISCOVER_EVENTS[0]?.id].filter(Boolean) as string[])
}

const DEFAULT_PUBLIC_LISTS: PublicBucketList[] = [
  {
    id: 'pub-summer-saskatchewan',
    name: 'Summer in Saskatchewan',
    ownerName: 'Jordan Lee',
    ownerInitials: 'JL',
    ownerVerified: true,
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    description: 'Sun-soaked prairie adventures before the snow returns',
    region: 'Saskatchewan, Canada',
    vibe: 'Adventurous',
    itemCount: 12,
    completedCount: 4,
    likeCount: 248,
    saveCount: 89,
    hasSoundtrack: true,
    events: [
      DISCOVER_EVENTS[2],
      {
        id: 'regina-folk-fest',
        title: 'Regina Folk Festival',
        city: 'Regina',
        image: 'https://images.unsplash.com/photo-1459749411175-04bf8532c0fb?w=800&q=80',
        badges: ['TRUSTED HOST'],
        dateTag: 'August',
        dateTime: 'Aug 8–10, 2026',
        cost: '$45/day',
        categories: [{ label: 'Music', color: 'purple', icon: 'party' }],
      },
    ],
  },
  {
    id: 'pub-before-30',
    name: 'Before I Turn 30',
    ownerName: 'Maya Chen',
    ownerInitials: 'MC',
    coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
    description: 'Big dreams, small windows — making every weekend count',
    region: 'Western Canada',
    vibe: 'Wild',
    itemCount: 25,
    completedCount: 12,
    likeCount: 512,
    saveCount: 201,
    hasSoundtrack: true,
    events: [DISCOVER_EVENTS[0], DISCOVER_EVENTS[3]],
  },
  {
    id: 'pub-foodie-stops',
    name: 'Best Small-Town Food Stops',
    ownerName: 'Chris Rivera',
    ownerInitials: 'CR',
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    description: 'Hidden gems from Saskatoon to Moose Jaw',
    region: 'Prairies',
    vibe: 'Foodie',
    itemCount: 18,
    completedCount: 9,
    likeCount: 167,
    saveCount: 74,
    hasSoundtrack: false,
    events: [DISCOVER_EVENTS[0], DISCOVER_EVENTS[3]],
  },
  {
    id: 'pub-rocky-weekend',
    name: 'Rocky Mountain Weekend',
    ownerName: 'Alex Kim',
    ownerInitials: 'AK',
    ownerVerified: true,
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    description: 'Peaks, lakes, and cabin mornings',
    region: 'Alberta & BC',
    vibe: 'Adventurous',
    itemCount: 8,
    completedCount: 3,
    likeCount: 392,
    saveCount: 156,
    hasSoundtrack: true,
    events: [DISCOVER_EVENTS[2]],
  },
  {
    id: 'pub-kids-weekend',
    name: 'Things to Do With the Kids',
    ownerName: 'Sam & Riley',
    ownerInitials: 'SR',
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    description: 'Kid-approved picks around Kindersley',
    region: 'Kindersley, SK',
    vibe: 'Family',
    itemCount: 14,
    completedCount: 6,
    likeCount: 98,
    saveCount: 45,
    hasSoundtrack: false,
    events: [DISCOVER_EVENTS[1], DISCOVER_EVENTS[2]],
  },
  {
    id: 'pub-hockey-road-trip',
    name: 'Ultimate Hockey Road Trip',
    ownerName: 'Tyler Moss',
    ownerInitials: 'TM',
    coverImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
    description: 'Rinks, rivalries, and roadside poutine',
    region: 'Canada',
    vibe: 'Road Trip',
    itemCount: 20,
    completedCount: 7,
    likeCount: 621,
    saveCount: 288,
    hasSoundtrack: true,
    events: [DISCOVER_EVENTS[3]],
  },
  {
    id: 'pub-sask-summer-legacy',
    name: 'Saskatchewan Summer',
    ownerName: 'Jordan Lee',
    ownerInitials: 'JL',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    description: 'Sun-soaked adventures across the prairies',
    region: 'Saskatchewan',
    vibe: 'Local',
    itemCount: 10,
    completedCount: 5,
    likeCount: 134,
    saveCount: 52,
    hasSoundtrack: true,
    events: [
      DISCOVER_EVENTS[2],
      {
        id: 'waskesiu-paddle',
        title: 'Sunset Paddle on Waskesiu Lake',
        city: 'Prince Albert NP',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
        badges: ['HIDDEN GEM'],
        dateTag: 'Anytime',
        cost: '$35',
        categories: [{ label: 'Outdoors', color: 'teal', icon: 'cart' }],
      },
    ],
  },
  {
    id: 'pub-live-music',
    name: 'Live Music Nights',
    ownerName: 'Alex Rivera',
    ownerInitials: 'AR',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    description: 'Jazz, folk, and indie across SK',
    region: 'Saskatchewan',
    vibe: 'Chill',
    itemCount: 6,
    completedCount: 2,
    likeCount: 87,
    saveCount: 31,
    hasSoundtrack: true,
    events: [DISCOVER_EVENTS[3]],
  },
]

export function getPublicBucketLists(): PublicBucketList[] {
  try {
    const raw = localStorage.getItem(PUBLIC_KEY)
    if (raw) return JSON.parse(raw) as PublicBucketList[]
  } catch {
    /* use defaults */
  }
  localStorage.setItem(PUBLIC_KEY, JSON.stringify(DEFAULT_PUBLIC_LISTS))
  return DEFAULT_PUBLIC_LISTS
}

/** Full-screen album-cover discovery deck (Screen 2) */
export function getDiscoveryFeedLists(): PublicBucketList[] {
  return getPublicBucketLists().map((list) => ({
    ...list,
    itemCount: list.itemCount ?? list.events.length,
    completedCount: list.completedCount ?? 0,
  }))
}

export function getPublicBucketListById(id: string): PublicBucketList | undefined {
  return getPublicBucketLists().find((l) => l.id === id)
}

export function resolveEventFromAnySource(eventId: string): DiscoverEvent | undefined {
  const fromDiscover = resolveEvent(eventId)
  if (fromDiscover) return fromDiscover

  for (const list of getPublicBucketLists()) {
    const found = list.events.find((e) => e.id === eventId)
    if (found) return found
  }
  return undefined
}

export function resolveEventsFromAnySource(eventIds: string[]): DiscoverEvent[] {
  return eventIds
    .map((id) => resolveEventFromAnySource(id))
    .filter((e): e is DiscoverEvent => e != null)
}
