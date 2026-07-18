/**
 * Kudos — social recognition on user profiles.
 * Full awarding rules TBD; see TUDU Milestone Awards / Miles specs.
 * @see docs/TUDU-CHARACTER-DEVELOPMENT.md (Phase 2)
 */

export interface KudosRecord {
  id: string
  fromUserId: string
  toUserId: string
  eventId?: string
  message?: string
  createdAt: string
}

export interface KudosSummary {
  total: number
  recent: KudosRecord[]
}

/** Stub — replace with API when backend is ready. */
export function useKudosSummary(_userId: string): KudosSummary {
  return { total: 0, recent: [] }
}

/** Stub hook for giving kudos after an event. */
export async function giveKudos(_input: {
  toUserId: string
  eventId?: string
  message?: string
}): Promise<KudosRecord> {
  throw new Error('Kudos system not yet implemented')
}
