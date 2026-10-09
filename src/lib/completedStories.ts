import type { DiscoverEvent } from '../data/discoverEvents'
import {
  getBucketLists,
  getBucketListById,
  resolveEventsFromAnySource,
  resolveListDisplayEvents,
  copyPublicEventToList,
  createBucketList,
  type BucketList,
} from './bucketLists'
import { isBucketListFullyComplete } from './bucketListProgress'

export type CompletedStorySlide = {
  eventId: string
  title: string
  city: string
  image: string
  completionNote?: string
  completionPhoto?: string
  completedAt?: string
  dateTime?: string
  cost?: string
}

export type CompletedStory = {
  id: string
  sourceListId?: string
  name: string
  ownerName: string
  ownerInitials: string
  coverImage: string
  description?: string
  spotifyUrl?: string
  slides: CompletedStorySlide[]
  isOwn: boolean
  completedAt: string
  baseLikeCount: number
}

const LIKES_KEY = 'tudu_completed_story_likes'
const MOCK_STORIES_KEY = 'tudu_mock_completed_stories'

function readLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKES_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function writeLikedIds(ids: Set<string>): void {
  localStorage.setItem(LIKES_KEY, JSON.stringify([...ids]))
}

export function isStoryLiked(storyId: string): boolean {
  return readLikedIds().has(storyId)
}

export function toggleStoryLike(storyId: string): boolean {
  const liked = readLikedIds()
  const nowLiked = !liked.has(storyId)
  if (nowLiked) liked.add(storyId)
  else liked.delete(storyId)
  writeLikedIds(liked)
  return nowLiked
}

export function getDisplayLikeCount(story: CompletedStory): number {
  return story.baseLikeCount + (isStoryLiked(story.id) ? 1 : 0)
}

export function spotifyEmbedUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('spotify.com')) return undefined
    const path = parsed.pathname.replace(/^\/+/, '')
    if (path.startsWith('embed/')) return url
    return `https://open.spotify.com/embed/${path}?utm_source=generator&theme=0`
  } catch {
    return undefined
  }
}

function eventToSlide(
  event: DiscoverEvent,
  list: BucketList,
  eventId: string,
): CompletedStorySlide {
  return {
    eventId,
    title: event.title,
    city: event.city,
    image:
      list.completionPhotoUrls?.[eventId]?.[0] ??
      list.completionPhotos?.[eventId] ??
      event.image,
    completionNote: list.completionNotes?.[eventId],
    completionPhoto:
      list.completionPhotoUrls?.[eventId]?.[0] ?? list.completionPhotos?.[eventId],
    completedAt: list.completedAt?.[eventId],
    dateTime: event.dateTime,
    cost: event.cost,
  }
}

export function buildStoryFromOwnList(list: BucketList): CompletedStory | undefined {
  const displayEvents = resolveListDisplayEvents(list)
  if (!isBucketListFullyComplete(displayEvents, list.completedIds)) return undefined

  const events = resolveEventsFromAnySource(list.completedIds)
  const slides = list.completedIds
    .map((eventId) => {
      const event = events.find((e) => e.id === eventId)
      if (!event) return null
      return eventToSlide(event, list, eventId)
    })
    .filter((s): s is CompletedStorySlide => s != null)

  if (slides.length === 0) return undefined

  const latestAt = slides.reduce((latest, slide) => {
    const at = slide.completedAt ?? list.updatedAt
    return at > latest ? at : latest
  }, list.updatedAt)

  return {
    id: `own-${list.id}`,
    sourceListId: list.id,
    name: list.name,
    ownerName: 'You',
    ownerInitials: 'ME',
    coverImage: slides[0]?.image ?? '',
    spotifyUrl: list.spotifyUrl,
    slides,
    isOwn: true,
    completedAt: latestAt,
    baseLikeCount: 0,
  }
}

const DEFAULT_MOCK_STORIES: CompletedStory[] = [
  {
    id: 'story-jordan-summer',
    sourceListId: 'pub-sask-summer',
    name: 'Saskatchewan Summer ✓',
    ownerName: 'Jordan Lee',
    ownerInitials: 'JL',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    description: 'Three prairie adventures, one unforgettable summer',
    spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    isOwn: false,
    completedAt: '2026-07-10T18:30:00.000Z',
    baseLikeCount: 24,
    slides: [
      {
        eventId: 'kindersley-summer-market',
        title: 'Kindersley Summer Market',
        city: 'Kindersley',
        image: 'https://images.unsplash.com/photo-1567306303716-647a3c3a0a4c?w=800&q=80',
        completionPhoto: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&q=80',
        completionNote:
          'Found the best homemade perogies and live fiddle music. Already planning next year!',
        completedAt: '2026-07-05T14:00:00.000Z',
        dateTime: 'Jul 19, 9:00 AM',
        cost: 'Free',
      },
      {
        eventId: 'regina-folk-fest',
        title: 'Regina Folk Festival',
        city: 'Regina',
        image: 'https://images.unsplash.com/photo-1459749411175-04bf8532c0fb?w=800&q=80',
        completionPhoto: 'https://images.unsplash.com/photo-1458565475913-560069af8269?w=800&q=80',
        completionNote: 'Danced until midnight under the prairie stars. Absolute magic.',
        completedAt: '2026-08-09T22:15:00.000Z',
        dateTime: 'Aug 8–10, 2026',
        cost: '$45/day',
      },
      {
        eventId: 'waskesiu-paddle',
        title: 'Sunset Paddle on Waskesiu Lake',
        city: 'Prince Albert NP',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
        completionPhoto: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
        completionNote: 'Golden hour on the water — loons calling, zero cell service, pure bliss.',
        completedAt: '2026-07-10T18:30:00.000Z',
        cost: '$35',
      },
    ],
  },
  {
    id: 'story-maya-foodie',
    sourceListId: 'pub-foodie-adventures',
    name: 'Foodie Adventures ✓',
    ownerName: 'Maya Chen',
    ownerInitials: 'MC',
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    description: 'A tasty tour from Saskatoon to Moose Jaw',
    spotifyUrl: 'https://open.spotify.com/track/2LawezPeJRG2X9J7ImyE6T',
    isOwn: false,
    completedAt: '2026-06-22T20:00:00.000Z',
    baseLikeCount: 18,
    slides: [
      {
        eventId: 'farmers-market',
        title: "Saskatoon Farmers' Market",
        city: 'Saskatoon',
        image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80',
        completionPhoto: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
        completionNote: 'Sourdough, Saskatoon berry pie, and the friendliest vendors ever.',
        completedAt: '2026-06-15T10:30:00.000Z',
        dateTime: 'Dec 17, 9:00 AM',
        cost: 'Free',
      },
      {
        eventId: 'moose-jaw-taproom',
        title: 'Moose Jaw Craft Taproom Tour',
        city: 'Moose Jaw',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
        completionPhoto: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800&q=80',
        completionNote: 'Six stops, six pints, one very happy food blogger.',
        completedAt: '2026-06-22T20:00:00.000Z',
        cost: '$25',
      },
    ],
  },
  {
    id: 'story-alex-live-music',
    sourceListId: 'pub-live-music',
    name: 'Live Music Nights ✓',
    ownerName: 'Alex Rivera',
    ownerInitials: 'AR',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    description: 'Jazz, folk, and indie across SK — all checked off',
    isOwn: false,
    completedAt: '2026-07-12T23:45:00.000Z',
    baseLikeCount: 31,
    slides: [
      {
        eventId: 'jazz-emerald',
        title: 'Live Jazz at Emerald Lounge',
        city: 'Kindersley',
        image: 'https://images.unsplash.com/photo-1415201361474-7efff816c025?w=800&q=80',
        completionPhoto: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
        completionNote: 'Intimate venue, incredible sax solo. New favourite spot in town.',
        completedAt: '2026-07-12T23:45:00.000Z',
        cost: '$15',
      },
    ],
  },
]

function getMockStories(): CompletedStory[] {
  try {
    const raw = localStorage.getItem(MOCK_STORIES_KEY)
    if (raw) return JSON.parse(raw) as CompletedStory[]
  } catch {
    /* use defaults */
  }
  localStorage.setItem(MOCK_STORIES_KEY, JSON.stringify(DEFAULT_MOCK_STORIES))
  return DEFAULT_MOCK_STORIES
}

export function getCompletedStories(): CompletedStory[] {
  const own = getBucketLists()
    .map(buildStoryFromOwnList)
    .filter((s): s is CompletedStory => s != null)

  const mock = getMockStories()

  return [...own, ...mock].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )
}

export function getCompletedStoryById(id: string): CompletedStory | undefined {
  return getCompletedStories().find((s) => s.id === id)
}

export function saveStorySlideToList(
  story: CompletedStory,
  slideIndex: number,
  listId?: string,
): { listId: string; listName: string } | undefined {
  const slide = story.slides[slideIndex]
  if (!slide) return undefined

  if (listId) {
    const updated = copyPublicEventToList(listId, {
      id: slide.eventId,
      title: slide.title,
      city: slide.city,
      image: slide.completionPhoto ?? slide.image,
      badges: [],
    })
    if (updated) return { listId: updated.id, listName: updated.name }
    return undefined
  }

  const list = createBucketList(`${slide.title} (saved)`, [slide.eventId])
  return { listId: list.id, listName: list.name }
}

export function getOwnListForStory(story: CompletedStory): BucketList | undefined {
  if (!story.isOwn || !story.sourceListId) return undefined
  return getBucketListById(story.sourceListId)
}
