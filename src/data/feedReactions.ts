/** Tuduan-motif feed reactions — one per user per event target. */

export type FeedReactionId = 'sol' | 'lumi' | 'ember' | 'nova' | 'axis'

export type FeedReactionDef = {
  id: FeedReactionId
  tuduanName: string
  label: string
  /** Compact label for the connected reaction bar. */
  shortLabel: string
  color: string
  /** Placeholder until illustrated Tuduan reaction assets ship. */
  motif: string
}

export const FEED_REACTIONS: Record<FeedReactionId, FeedReactionDef> = {
  sol: {
    id: 'sol',
    tuduanName: 'Sol',
    label: "Let's go!",
    shortLabel: 'Go',
    color: '#F97316',
    motif: '☀',
  },
  lumi: {
    id: 'lumi',
    tuduanName: 'Lumi',
    label: 'Curious',
    shortLabel: 'Curious',
    color: '#38BDF8',
    motif: '✦',
  },
  ember: {
    id: 'ember',
    tuduanName: 'Ember',
    label: 'Out there',
    shortLabel: 'Out',
    color: '#84CC16',
    motif: '🌿',
  },
  nova: {
    id: 'nova',
    tuduanName: 'Nova',
    label: 'Dreamy',
    shortLabel: 'Dream',
    color: '#6366F1',
    motif: '★',
  },
  axis: {
    id: 'axis',
    tuduanName: 'Axis',
    label: 'Maybe',
    shortLabel: 'Maybe',
    color: '#94A3B8',
    motif: '❄',
  },
}

export const FEED_REACTION_ORDER: FeedReactionId[] = ['sol', 'lumi', 'ember', 'nova', 'axis']

export function getFeedReactionDef(id: FeedReactionId): FeedReactionDef {
  return FEED_REACTIONS[id]
}
