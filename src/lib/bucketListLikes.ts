const LIKES_KEY = 'tudu_bucket_list_likes'

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

export function isBucketListLiked(listId: string): boolean {
  return readLikedIds().has(listId)
}

export function toggleBucketListLike(listId: string): boolean {
  const liked = readLikedIds()
  const nowLiked = !liked.has(listId)
  if (nowLiked) liked.add(listId)
  else liked.delete(listId)
  writeLikedIds(liked)
  return nowLiked
}

export function getBucketListDisplayLikeCount(listId: string, baseLikeCount = 0): number {
  return baseLikeCount + (isBucketListLiked(listId) ? 1 : 0)
}
