import type { DiscoverEvent } from '../data/discoverEvents'

export type SavedTimeFilter =
  | 'any'
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'august'
  | 'september'

export type SavedSortOption = 'soonest' | 'name' | 'category'

export function getSavedEventStatusLabel(event: DiscoverEvent): string {
  if (event.badges.includes('HIDDEN GEM')) return 'HIDDEN GEM'
  if (
    event.cardKind === 'attraction' ||
    event.dateTag === 'Always On' ||
    event.dateTag === 'Anytime' ||
    event.repeatsLabel
  ) {
    return 'ALWAYS AVAILABLE'
  }
  if (event.dateTag?.toLowerCase().includes('live')) return 'LIVE NOW'
  if (event.dateTag) return event.dateTag.toUpperCase()
  return 'UPCOMING'
}

export function getSavedEventLocation(event: DiscoverEvent): string {
  return [event.venueName, event.city, event.locationDetail].filter(Boolean).join(', ')
}

const SOONEST_ORDER: Record<string, number> = {
  'live now': 0,
  today: 1,
  tomorrow: 2,
  'this weekend': 3,
  'next week': 4,
  upcoming: 5,
  featured: 6,
  'always on': 7,
  anytime: 8,
  'always available': 9,
}

function getSoonestRank(event: DiscoverEvent): number {
  const tag = (event.dateTag ?? '').toLowerCase()
  if (tag in SOONEST_ORDER) return SOONEST_ORDER[tag]
  if (tag.includes('live')) return 0
  if (tag.includes('today')) return 1
  if (tag.includes('week')) return 3
  if (tag.includes('month') || /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(tag)) {
    return 6
  }
  return 10
}

function matchesTimeFilter(event: DiscoverEvent, filter: SavedTimeFilter): boolean {
  if (filter === 'any') return true
  const tag = (event.dateTag ?? '').toLowerCase()
  switch (filter) {
    case 'today':
      return tag.includes('today') || tag.includes('live')
    case 'this-week':
      return (
        tag.includes('today') ||
        tag.includes('live') ||
        tag.includes('weekend') ||
        tag.includes('week') ||
        tag.includes('tomorrow')
      )
    case 'this-month':
      return !tag.includes('always') && !tag.includes('anytime')
    case 'august':
      return tag.includes('aug')
    case 'september':
      return tag.includes('sep')
    default:
      return true
  }
}

export function filterAndSortSavedEvents(
  events: DiscoverEvent[],
  query: string,
  timeFilter: SavedTimeFilter,
  sortBy: SavedSortOption,
): DiscoverEvent[] {
  const normalizedQuery = query.trim().toLowerCase()
  let result = events.filter((event) => {
    if (!matchesTimeFilter(event, timeFilter)) return false
    if (!normalizedQuery) return true
    const haystack = [
      event.title,
      event.city,
      event.venueName,
      event.locationDetail,
      event.dateTag,
      ...(event.categories?.map((c) => c.label) ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  result = [...result].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title)
    if (sortBy === 'category') {
      const catA = a.categories?.[0]?.label ?? ''
      const catB = b.categories?.[0]?.label ?? ''
      return catA.localeCompare(catB) || a.title.localeCompare(b.title)
    }
    const rankDiff = getSoonestRank(a) - getSoonestRank(b)
    return rankDiff !== 0 ? rankDiff : a.title.localeCompare(b.title)
  })

  return result
}
