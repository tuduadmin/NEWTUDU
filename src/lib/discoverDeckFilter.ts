import { INTEREST_CATEGORIES } from '../data/categories'
import {
  filterDiscoverPoolByQuickPick,
  getDiscoverEventsPool,
  type DiscoverEvent,
} from '../data/discoverEvents'
import { getCurrentAccount } from './account'
import { getPreferences } from './preferences'
import { getQuickPickOverride, hasExplorerQuickPickAccess } from './quickPickOverride'

function filterDiscoverPoolByInterests(pool: DiscoverEvent[], interestIds: string[]): DiscoverEvent[] {
  if (interestIds.length === 0) return pool

  const interests = interestIds
    .map((id) => INTEREST_CATEGORIES.find((c) => c.id === id))
    .filter(Boolean)

  if (interests.length === 0) return pool

  return pool.filter((event) =>
    interests.some((cat) => {
      const label = cat!.label.toLowerCase()
      return (
        event.categories?.some((c) => c.label.toLowerCase().includes(label)) ||
        event.keywords?.some((k) => k.toLowerCase().includes(label.split('&')[0].trim())) ||
        event.amenityIds?.includes(cat!.id)
      )
    }),
  )
}

/** Card deck pool — quick pick override replaces interest prefs when set. */
export function getDiscoverDeckPool(keyword?: string): DiscoverEvent[] {
  const pool = getDiscoverEventsPool(keyword)
  const quickPick = getQuickPickOverride()
  const account = getCurrentAccount()

  if (quickPick && hasExplorerQuickPickAccess(account)) {
    return filterDiscoverPoolByQuickPick(pool, quickPick)
  }

  const { interests } = getPreferences()
  if (interests.length > 0) {
    return filterDiscoverPoolByInterests(pool, interests)
  }

  return pool
}
