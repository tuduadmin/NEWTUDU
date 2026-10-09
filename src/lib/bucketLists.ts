import type { DiscoverEvent } from '../data/discoverEvents'
import { DISCOVER_EVENTS } from '../data/discoverEvents'
import type {
  BucketList,
  CustomBucketListItem,
  PublicBucketList,
  VibeTag,
} from '../types/bucketList'
import { DEMO_USER } from './demoAccounts'
import type { StoredUser } from './auth'
import { removeSavedEvents } from './savedEvents'
import { recordEventSave } from './distantSaves'
import { resolveEventSaveMeta } from './eventSaveMeta'

export type { BucketList, PublicBucketList, CustomBucketListItem } from '../types/bucketList'

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

function writeLists(lists: BucketList[]): boolean {
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
    return true
  } catch {
    return false
  }
}

export function getBucketLists(): BucketList[] {
  return readLists().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/** Saved lists for My lists hub (excludes in-progress wizard drafts). */
export function getMyBucketLists(): BucketList[] {
  return getBucketLists().filter((list) => list.isDraft !== true)
}

export function getBucketListById(id: string): BucketList | undefined {
  return readLists().find((l) => l.id === id)
}

function ownerMetaFromUser(user: StoredUser): {
  ownerId: string
  ownerName: string
  ownerInitials: string
} {
  const ownerName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
    user.username ||
    user.email.split('@')[0] ||
    'You'
  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim().toUpperCase() ||
    ownerName.slice(0, 2).toUpperCase()
  return { ownerId: user.email, ownerName, ownerInitials: initials }
}

export function canUserEditBucketList(list: BucketList, userEmail: string): boolean {
  if (!list.ownerId) return true
  return list.ownerId.toLowerCase() === userEmail.toLowerCase()
}

export type BucketListUpdateInput = {
  name?: string
  description?: string
  coverImageUrl?: string
  vibe?: VibeTag
  region?: string
  isPrivate?: boolean
  spotifyUrl?: string
  appleMusicUrl?: string
  customItems?: CustomBucketListItem[]
  eventIds?: string[]
}

export function createDraftBucketList(user: StoredUser): BucketList {
  const now = new Date().toISOString()
  const owner = ownerMetaFromUser(user)
  const list: BucketList = {
    id: generateId(),
    name: '',
    description: '',
    eventIds: [],
    customItems: [],
    createdAt: now,
    updatedAt: now,
    completedIds: [],
    completionNotes: {},
    isPrivate: false,
    vibe: 'Adventurous',
    isDraft: true,
    ...owner,
  }
  if (!writeLists([list, ...readLists()])) {
    throw new Error('storage')
  }
  return list
}

export function startBucketListCreate(
  navigate: (path: string) => void,
  user: StoredUser,
): BucketList | null {
  try {
    const list = createDraftBucketList(user)
    navigate(`/bucket-list/create/${list.id}/details`)
    return list
  } catch {
    return null
  }
}

export function updateBucketList(
  id: string,
  input: BucketListUpdateInput,
): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === id)
  if (idx === -1) return undefined

  const prev = lists[idx]
  const customItems =
    input.customItems !== undefined ? normalizeCustomItems(input.customItems) : prev.customItems
  const eventIds =
    input.eventIds !== undefined ? [...new Set(input.eventIds)] : prev.eventIds

  lists[idx] = {
    ...prev,
    name: input.name !== undefined ? input.name : prev.name,
    description: input.description !== undefined ? input.description : prev.description,
    coverImageUrl:
      input.coverImageUrl !== undefined
        ? input.coverImageUrl.trim() || undefined
        : prev.coverImageUrl,
    vibe: input.vibe ?? prev.vibe,
    region: input.region !== undefined ? input.region : prev.region,
    isPrivate: input.isPrivate ?? prev.isPrivate,
    spotifyUrl:
      input.spotifyUrl !== undefined ? input.spotifyUrl.trim() || undefined : prev.spotifyUrl,
    appleMusicUrl:
      input.appleMusicUrl !== undefined
        ? input.appleMusicUrl.trim() || undefined
        : prev.appleMusicUrl,
    customItems,
    eventIds,
    updatedAt: new Date().toISOString(),
  }

  if (!writeLists(lists)) {
    return undefined
  }
  return lists[idx]
}

export function publishBucketList(id: string): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === id)
  if (idx === -1) return undefined

  lists[idx] = {
    ...lists[idx],
    isDraft: false,
    name: lists[idx].name.trim() || 'Untitled List',
    description: lists[idx].description?.trim() || lists[idx].description,
    region: lists[idx].region?.trim() || lists[idx].region,
    updatedAt: new Date().toISOString(),
  }

  if (!writeLists(lists)) {
    return undefined
  }
  return lists[idx]
}

export function createBucketList(
  name: string,
  eventIds: string[] = [],
  options?: { ownerId?: string; isPrivate?: boolean; description?: string },
): BucketList {
  const now = new Date().toISOString()
  const list: BucketList = {
    id: generateId(),
    name: name.trim() || 'Untitled List',
    eventIds: [...new Set(eventIds)],
    createdAt: now,
    updatedAt: now,
    completedIds: [],
    completionNotes: {},
    ownerId: options?.ownerId,
    isPrivate: options?.isPrivate ?? false,
    description: options?.description,
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

  for (const eventId of eventIds) {
    const meta = resolveEventSaveMeta(eventId)
    if (meta) {
      recordEventSave({
        eventId: meta.eventId,
        eventCity: meta.eventCity,
        hostEventId: meta.hostEventId,
        attractionId: meta.attractionId,
        hiddenGemId: meta.hiddenGemId,
        saveContext: 'bucket_list',
      })
    }
  }

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

const MAX_COMPLETION_PHOTOS = 3

function normalizePhotoUrls(urls: string[] | undefined): string[] {
  return (urls ?? [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPLETION_PHOTOS)
}

export function updateBucketListItemCompletion(
  listId: string,
  eventId: string,
  options: {
    note?: string
    photoUrls?: string[]
    taggedUserIds?: string[]
  },
): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === listId)
  if (idx === -1) return undefined
  if (!lists[idx].completedIds.includes(eventId)) return undefined

  const completionNotes = { ...(lists[idx].completionNotes ?? {}) }
  const completionPhotoUrls = { ...(lists[idx].completionPhotoUrls ?? {}) }
  const completionTaggedUserIds = { ...(lists[idx].completionTaggedUserIds ?? {}) }
  const completionPhotos = { ...(lists[idx].completionPhotos ?? {}) }

  if (options.note !== undefined) {
    if (options.note.trim()) completionNotes[eventId] = options.note.trim()
    else delete completionNotes[eventId]
  }
  if (options.photoUrls !== undefined) {
    const next = normalizePhotoUrls(options.photoUrls)
    if (next.length) completionPhotoUrls[eventId] = next
    else delete completionPhotoUrls[eventId]
    delete completionPhotos[eventId]
  }
  if (options.taggedUserIds !== undefined) {
    const next = [...new Set(options.taggedUserIds)]
    if (next.length) completionTaggedUserIds[eventId] = next
    else delete completionTaggedUserIds[eventId]
  }

  lists[idx] = {
    ...lists[idx],
    completionNotes,
    completionPhotoUrls,
    completionTaggedUserIds,
    completionPhotos,
    updatedAt: new Date().toISOString(),
  }
  if (!writeLists(lists)) return undefined
  return lists[idx]
}

export function toggleEventComplete(
  listId: string,
  eventId: string,
  options?: {
    note?: string
    photoDataUrl?: string
    photoUrls?: string[]
    taggedUserIds?: string[]
  },
): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === listId)
  if (idx === -1) return undefined

  const list = lists[idx]
  const isComplete = list.completedIds.includes(eventId)
  let completedIds: string[]
  const completionNotes = { ...(list.completionNotes ?? {}) }
  const completionPhotos = { ...(list.completionPhotos ?? {}) }
  const completionPhotoUrls = { ...(list.completionPhotoUrls ?? {}) }
  const completionTaggedUserIds = { ...(list.completionTaggedUserIds ?? {}) }
  const completedAt = { ...(list.completedAt ?? {}) }

  if (isComplete) {
    completedIds = list.completedIds.filter((id) => id !== eventId)
    delete completionNotes[eventId]
    delete completionPhotos[eventId]
    delete completionPhotoUrls[eventId]
    delete completionTaggedUserIds[eventId]
    delete completedAt[eventId]
  } else {
    completedIds = [...list.completedIds, eventId]
    if (options?.note?.trim()) completionNotes[eventId] = options.note.trim()

    let photos = normalizePhotoUrls(options?.photoUrls)
    if (photos.length === 0 && options?.photoDataUrl?.trim()) {
      photos = [options.photoDataUrl.trim()]
    }
    if (photos.length) {
      completionPhotoUrls[eventId] = photos
      delete completionPhotos[eventId]
    }

    if (options?.taggedUserIds?.length) {
      completionTaggedUserIds[eventId] = [...new Set(options.taggedUserIds)]
    }

    completedAt[eventId] = new Date().toISOString()
  }

  lists[idx] = {
    ...list,
    completedIds,
    completionNotes,
    completionPhotos,
    completionPhotoUrls,
    completionTaggedUserIds,
    completedAt,
    updatedAt: new Date().toISOString(),
  }
  if (!writeLists(lists)) {
    return undefined
  }
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

export function updateBucketListVisibility(
  id: string,
  isPrivate: boolean,
): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === id)
  if (idx === -1) return undefined
  lists[idx] = {
    ...lists[idx],
    isPrivate,
    updatedAt: new Date().toISOString(),
  }
  writeLists(lists)
  return lists[idx]
}

export function getBucketListsForUser(ownerId: string): BucketList[] {
  const normalized = ownerId.trim().toLowerCase()
  return readLists().filter((l) => l.ownerId?.toLowerCase() === normalized)
}

const ADMIN_DEMO_LISTS_FLAG = 'tudu_admin_demo_bucket_lists'

export function seedDemoBucketListsForAdmin(eventIds: string[] = []): void {
  if (localStorage.getItem(ADMIN_DEMO_LISTS_FLAG) === 'true') return

  const demoEmail = DEMO_USER.email
  const ids = eventIds.length > 0 ? eventIds : []

  createBucketList('Saskatchewan Summer Hits', ids.slice(0, 4), {
    ownerId: demoEmail,
    isPrivate: false,
    description: 'Must-do prairie events before the snow flies.',
  })
  createBucketList('Date Night Ideas', ids.slice(2, 6), {
    ownerId: demoEmail,
    isPrivate: true,
    description: 'Private list for planning evenings out.',
  })
  createBucketList('Family Weekend Picks', ids.slice(0, 3), {
    ownerId: demoEmail,
    isPrivate: false,
  })

  localStorage.setItem(ADMIN_DEMO_LISTS_FLAG, 'true')
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
  if (list.coverImageUrl) return list.coverImageUrl
  const firstCustom = list.customItems?.[0]
  if (firstCustom?.image) return firstCustom.image
  if (firstCustom?.videoUrl) return firstCustom.videoUrl
  const first = resolveEvent(list.eventIds[0])
  return first?.image
}

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'

export function customItemToDiscoverEvent(item: CustomBucketListItem): DiscoverEvent {
  const mediaType = item.mediaType ?? (item.videoUrl ? 'video' : 'image')
  const image =
    item.image.trim() ||
    (mediaType === 'video' && item.videoUrl ? item.videoUrl : DEFAULT_COVER)

  return {
    id: item.id,
    title: item.title,
    city:
      item.location?.trim() ||
      item.caption?.slice(0, 48) ||
      'Location not set',
    image,
    badges: [],
    locationDetail: item.link,
    videoUrl: item.videoUrl,
    mediaType,
  }
}

export function resolveListDisplayEvents(list: BucketList): DiscoverEvent[] {
  const custom = (list.customItems ?? []).map(customItemToDiscoverEvent)
  const fromEvents = resolveEventsFromAnySource(list.eventIds)
  return [...custom, ...fromEvents]
}

export type AdminBucketListInput = {
  name: string
  description?: string
  coverImageUrl?: string
  customItems?: CustomBucketListItem[]
  eventIds?: string[]
  isPrivate?: boolean
  vibe?: VibeTag
  region?: string
  spotifyUrl?: string
  appleMusicUrl?: string
  ownerName?: string
  ownerInitials?: string
  ownerAvatarUrl?: string
  ownerAvatarSecondaryUrl?: string
}

function normalizeCustomItems(items: CustomBucketListItem[] | undefined): CustomBucketListItem[] {
  return (items ?? [])
    .filter((item) => item.title.trim() || item.image.trim() || item.videoUrl?.trim())
    .map((item) => ({
      id: item.id || generateId(),
      title: item.title.trim() || 'Untitled',
      image: item.image.trim() || (item.videoUrl?.trim() ? '' : DEFAULT_COVER),
      videoUrl: item.videoUrl?.trim() || undefined,
      mediaType: item.mediaType ?? (item.videoUrl?.trim() ? 'video' : 'image'),
      location: item.location?.trim() || undefined,
      caption: item.caption?.trim() || undefined,
      link: item.link?.trim() || undefined,
    }))
}

export function bucketListToPublic(list: BucketList): PublicBucketList | null {
  if (list.isPrivate) return null

  const events = resolveListDisplayEvents(list)
  const itemCount = events.length
  const hasSoundtrack = Boolean(list.spotifyUrl?.trim() || list.appleMusicUrl?.trim())

  return {
    id: list.id,
    name: list.name,
    ownerName: list.ownerName ?? 'TUDU',
    ownerInitials: list.ownerInitials ?? 'TU',
    ownerAvatarUrl: list.ownerAvatarUrl,
    ownerAvatarSecondaryUrl: list.ownerAvatarSecondaryUrl,
    ownerVerified: list.seededByAdmin === true,
    coverImage: getListCoverImage(list) ?? DEFAULT_COVER,
    description: list.description?.trim() || list.name,
    region: list.region,
    vibe: list.vibe ?? 'Adventurous',
    itemCount,
    completedCount: list.completedIds.length,
    completedEventIds: [...list.completedIds],
    completionPhotos: list.completionPhotos,
    completionPhotoUrls: list.completionPhotoUrls,
    completionTaggedUserIds: list.completionTaggedUserIds,
    completionNotes: list.completionNotes,
    likeCount: list.likeCount ?? 0,
    saveCount: list.saveCount ?? 0,
    hasSoundtrack,
    spotifyUrl: list.spotifyUrl,
    appleMusicUrl: list.appleMusicUrl,
    seededByAdmin: list.seededByAdmin,
    events,
  }
}

export function createAdminBucketList(input: AdminBucketListInput): BucketList {
  const now = new Date().toISOString()
  const customItems = normalizeCustomItems(input.customItems)
  const eventIds = [...new Set(input.eventIds ?? [])]

  const list: BucketList = {
    id: generateId(),
    name: input.name.trim() || 'Untitled List',
    description: input.description?.trim(),
    coverImageUrl: input.coverImageUrl?.trim() || customItems[0]?.image || customItems[0]?.videoUrl || DEFAULT_COVER,
    eventIds,
    customItems,
    createdAt: now,
    updatedAt: now,
    completedIds: [],
    completionNotes: {},
    isPrivate: input.isPrivate ?? false,
    seededByAdmin: true,
    vibe: input.vibe ?? 'Adventurous',
    region: input.region?.trim(),
    spotifyUrl: input.spotifyUrl?.trim() || undefined,
    appleMusicUrl: input.appleMusicUrl?.trim() || undefined,
    ownerName: input.ownerName?.trim() || 'TUDU',
    ownerInitials: input.ownerInitials?.trim() || 'TU',
    ownerAvatarUrl: input.ownerAvatarUrl?.trim() || undefined,
    ownerAvatarSecondaryUrl: input.ownerAvatarSecondaryUrl?.trim() || undefined,
    likeCount: 0,
    saveCount: 0,
  }

  writeLists([list, ...readLists()])
  return list
}

export function updateAdminBucketList(
  id: string,
  input: AdminBucketListInput,
): BucketList | undefined {
  const lists = readLists()
  const idx = lists.findIndex((l) => l.id === id)
  if (idx === -1) return undefined

  const customItems = normalizeCustomItems(input.customItems)
  const eventIds = [...new Set(input.eventIds ?? lists[idx].eventIds)]

  lists[idx] = {
    ...lists[idx],
    name: input.name.trim() || lists[idx].name,
    description: input.description?.trim(),
    coverImageUrl:
      input.coverImageUrl?.trim() ||
      customItems[0]?.image ||
      customItems[0]?.videoUrl ||
      lists[idx].coverImageUrl,
    eventIds,
    customItems,
    isPrivate: input.isPrivate ?? lists[idx].isPrivate ?? false,
    vibe: input.vibe ?? lists[idx].vibe,
    region: input.region?.trim() ?? lists[idx].region,
    spotifyUrl: input.spotifyUrl?.trim() || undefined,
    appleMusicUrl: input.appleMusicUrl?.trim() || undefined,
    ownerName: input.ownerName?.trim() || lists[idx].ownerName || 'TUDU',
    ownerInitials: input.ownerInitials?.trim() || lists[idx].ownerInitials || 'TU',
    ownerAvatarUrl: input.ownerAvatarUrl?.trim() || undefined,
    ownerAvatarSecondaryUrl: input.ownerAvatarSecondaryUrl?.trim() || undefined,
    seededByAdmin: true,
    updatedAt: new Date().toISOString(),
  }

  writeLists(lists)
  return lists[idx]
}

export function adminBucketListToForm(list: BucketList): AdminBucketListInput {
  return {
    name: list.name,
    description: list.description ?? '',
    coverImageUrl: list.coverImageUrl ?? getListCoverImage(list) ?? '',
    customItems: list.customItems ?? [],
    eventIds: list.eventIds,
    isPrivate: list.isPrivate ?? false,
    vibe: list.vibe ?? 'Adventurous',
    region: list.region ?? '',
    spotifyUrl: list.spotifyUrl ?? '',
    appleMusicUrl: list.appleMusicUrl ?? '',
    ownerName: list.ownerName ?? 'TUDU',
    ownerInitials: list.ownerInitials ?? 'TU',
    ownerAvatarUrl: list.ownerAvatarUrl ?? '',
    ownerAvatarSecondaryUrl: list.ownerAvatarSecondaryUrl ?? '',
  }
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

/** Public lists for the Explore tab (defaults, admin-seeded, and user-shared). */
export function getDiscoveryFeedLists(): PublicBucketList[] {
  const defaults = getPublicBucketLists().map((list) => {
    const total = list.events.length
    const done = list.completedEventIds?.length
      ? list.events.filter((e) => list.completedEventIds!.includes(e.id)).length
      : Math.min(list.completedCount ?? 0, total)
    return {
      ...list,
      itemCount: total,
      completedCount: done,
    }
  })

  const userPublic = getBucketLists()
    .filter((l) => !l.isPrivate && l.isDraft !== true)
    .map(bucketListToPublic)
    .filter((l): l is PublicBucketList => l != null)

  const seen = new Set<string>()
  const merged: PublicBucketList[] = []

  for (const list of [...userPublic, ...defaults]) {
    if (seen.has(list.id)) continue
    seen.add(list.id)
    merged.push(list)
  }

  return merged
}

export function getPublicBucketListById(id: string): PublicBucketList | undefined {
  const fromStore = getPublicBucketLists().find((l) => l.id === id)
  if (fromStore) return fromStore

  const adminList = getBucketListById(id)
  if (adminList && !adminList.isPrivate) {
    return bucketListToPublic(adminList) ?? undefined
  }

  return undefined
}

export function resolveEventsFromAnySource(eventIds: string[]): DiscoverEvent[] {
  return eventIds
    .map((id) => resolveEventFromAnySource(id))
    .filter((e): e is DiscoverEvent => e != null)
}

export function resolveEventFromAnySource(eventId: string): DiscoverEvent | undefined {
  const fromDiscover = resolveEvent(eventId)
  if (fromDiscover) return fromDiscover

  for (const list of getPublicBucketLists()) {
    const found = list.events.find((e) => e.id === eventId)
    if (found) return found
  }

  for (const list of readLists()) {
    const custom = list.customItems?.find((item) => item.id === eventId)
    if (custom) return customItemToDiscoverEvent(custom)
  }

  return undefined
}
