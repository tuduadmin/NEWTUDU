import {
  FEED_REACTION_ORDER,
  type FeedReactionId,
} from '../data/feedReactions'
import type { MyTuduFeedItem } from './myTuduFeed'

export const FEED_REACTIONS_CHANGED_EVENT = 'tudu-feed-reactions-changed'

const STORAGE_KEY = 'tudu-feed-reactions'

type TargetReactions = Partial<Record<FeedReactionId, string[]>>

type ReactionStore = Record<string, TargetReactions>

export type FeedReactionSummary = {
  counts: Record<FeedReactionId, number>
  userReaction: FeedReactionId | null
  total: number
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function emptyCounts(): Record<FeedReactionId, number> {
  return { sol: 0, lumi: 0, ember: 0, nova: 0, axis: 0 }
}

function readStore(): ReactionStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ReactionStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: ReactionStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function notifyFeedReactionsChanged(targetKey: string): void {
  window.dispatchEvent(
    new CustomEvent(FEED_REACTIONS_CHANGED_EVENT, { detail: { targetKey } }),
  )
}

/** Unique per feed row — event + merch posts for the same event stay independent. */
export function getFeedItemReactionTargetKey(item: MyTuduFeedItem): string {
  return `feed:${item.id}`
}

export function getFeedReactionSummary(
  targetKey: string,
  viewerEmail: string,
): FeedReactionSummary {
  const target = readStore()[targetKey] ?? {}
  const viewer = normalizeEmail(viewerEmail)
  const counts = emptyCounts()
  let userReaction: FeedReactionId | null = null
  let total = 0

  for (const id of FEED_REACTION_ORDER) {
    const list = (target[id] ?? []).map(normalizeEmail)
    counts[id] = list.length
    total += list.length
    if (list.includes(viewer)) userReaction = id
  }

  return { counts, userReaction, total }
}

/** Toggle a Tuduan reaction — one reaction per user per feed target. */
export function toggleFeedReaction(
  targetKey: string,
  reactionId: FeedReactionId,
  viewerEmail: string,
): FeedReactionSummary {
  const viewer = normalizeEmail(viewerEmail)
  const store = readStore()
  const target: TargetReactions = { ...(store[targetKey] ?? {}) }

  let wasActive = false
  for (const id of FEED_REACTION_ORDER) {
    const list = (target[id] ?? []).filter((email) => normalizeEmail(email) !== viewer)
    if ((target[id] ?? []).some((email) => normalizeEmail(email) === viewer)) {
      wasActive = id === reactionId
    }
    if (list.length > 0) target[id] = list
    else delete target[id]
  }

  if (!wasActive) {
    target[reactionId] = [...(target[reactionId] ?? []), viewer]
  }

  if (Object.keys(target).length === 0) {
    delete store[targetKey]
  } else {
    store[targetKey] = target
  }

  writeStore(store)
  notifyFeedReactionsChanged(targetKey)
  return getFeedReactionSummary(targetKey, viewerEmail)
}
