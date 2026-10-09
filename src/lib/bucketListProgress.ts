import type { DiscoverEvent } from '../data/discoverEvents'
import type { BucketList, PublicBucketList } from '../types/bucketList'

export const MAX_COMPLETION_PHOTOS = 3

export function getCompletedEventIds(
  ownList?: BucketList,
  publicList?: PublicBucketList,
): string[] {
  if (ownList) return ownList.completedIds
  if (publicList?.completedEventIds?.length) return publicList.completedEventIds
  if (publicList && publicList.completedCount > 0) {
    const cap = Math.min(publicList.completedCount, publicList.events.length)
    return publicList.events.slice(0, cap).map((e) => e.id)
  }
  return []
}

export function getCompletionPhotoUrls(
  eventId: string,
  ownList?: BucketList,
  publicList?: PublicBucketList,
): string[] {
  const multi =
    ownList?.completionPhotoUrls?.[eventId] ?? publicList?.completionPhotoUrls?.[eventId] ?? []
  if (multi.length) return multi.slice(0, MAX_COMPLETION_PHOTOS)

  const legacy = ownList?.completionPhotos?.[eventId] ?? publicList?.completionPhotos?.[eventId]
  if (typeof legacy === 'string' && legacy.trim()) return [legacy.trim()]
  return []
}

export function getCompletionPhoto(
  eventId: string,
  ownList?: BucketList,
  publicList?: PublicBucketList,
): string | undefined {
  return getCompletionPhotoUrls(eventId, ownList, publicList)[0]
}

export function getCompletionTaggedUserIds(
  eventId: string,
  ownList?: BucketList,
  publicList?: PublicBucketList,
): string[] {
  return (
    ownList?.completionTaggedUserIds?.[eventId] ??
    publicList?.completionTaggedUserIds?.[eventId] ??
    []
  )
}

export function getCompletionNote(
  eventId: string,
  ownList?: BucketList,
  publicList?: PublicBucketList,
): string | undefined {
  return ownList?.completionNotes?.[eventId] ?? publicList?.completionNotes?.[eventId]
}

export function bucketListProgress(events: DiscoverEvent[], completedIds: string[]) {
  const total = events.length
  const done = events.filter((e) => completedIds.includes(e.id)).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return { total, done, pct }
}

export function isBucketListFullyComplete(
  events: DiscoverEvent[],
  completedIds: string[],
): boolean {
  const { total, done } = bucketListProgress(events, completedIds)
  return total > 0 && done === total
}

/** Progress for Explore / public lists — always based on real event rows, not display-only counts. */
export function getPublicListProgress(list: {
  events: { id: string }[]
  completedEventIds?: string[]
  completedCount?: number
}) {
  const total = list.events.length
  let done = 0
  if (list.completedEventIds?.length) {
    done = list.events.filter((e) => list.completedEventIds!.includes(e.id)).length
  } else if (list.completedCount != null && list.completedCount > 0) {
    done = Math.min(list.completedCount, total)
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return {
    total,
    done,
    pct,
    isComplete: total > 0 && done >= total,
  }
}
