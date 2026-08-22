/** Max undo (back) actions per discover deck session. */
export const DISCOVER_BACK_LIMIT = 5

export type DiscoverDeckAction = 'skip' | 'interested' | 'save'

export type DiscoverDeckUndoEntry = {
  queue: string[]
  skippedIds: string[]
  action: DiscoverDeckAction
}

export function createDiscoverDeckQueue(poolIds: string[]): string[] {
  return [...poolIds]
}
