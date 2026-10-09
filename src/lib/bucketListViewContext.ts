export type BucketListViewContext = 'explore' | 'mine'

export function parseBucketListViewContext(
  searchParams: URLSearchParams,
): BucketListViewContext {
  return searchParams.get('from') === 'explore' ? 'explore' : 'mine'
}

export function bucketListDetailPath(id: string, from: BucketListViewContext): string {
  return from === 'explore' ? `/bucket-list/${id}?from=explore` : `/bucket-list/${id}?from=mine`
}

export function bucketListItemPath(
  listId: string,
  itemId: string,
  from: BucketListViewContext,
): string {
  const q = from === 'explore' ? '?from=explore' : '?from=mine'
  return `/bucket-list/${listId}/item/${itemId}${q}`
}

export function bucketListRecapPath(listId: string, from: BucketListViewContext): string {
  return from === 'explore'
    ? `/bucket-list/${listId}/recap?from=explore`
    : `/bucket-list/${listId}/recap?from=mine`
}

export function bucketListHubPath(from: BucketListViewContext): string {
  return from === 'explore' ? '/bucket-list?tab=explore' : '/bucket-list?tab=mine'
}
