import { getHostEventById } from './account'

const KEYWORD_STATS_KEY = 'tudu-keyword-stats'

export type KeywordStat = {
  keyword: string
  views: number
  saves: number
}

type KeywordStatsStore = Record<string, KeywordStat>

function readStore(): KeywordStatsStore {
  try {
    const raw = localStorage.getItem(KEYWORD_STATS_KEY)
    return raw ? (JSON.parse(raw) as KeywordStatsStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: KeywordStatsStore): void {
  localStorage.setItem(KEYWORD_STATS_KEY, JSON.stringify(store))
}

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase().replace(/\s+/g, '-')
}

function bumpKeywords(keywords: string[], field: 'views' | 'saves'): void {
  const store = readStore()
  for (const raw of keywords) {
    const keyword = normalizeKeyword(raw)
    if (!keyword) continue
    const current = store[keyword] ?? { keyword, views: 0, saves: 0 }
    current[field] += 1
    store[keyword] = current
  }
  writeStore(store)
}

export function trackKeywordView(keywords: string[]): void {
  if (keywords.length === 0) return
  bumpKeywords(keywords, 'views')
}

export function trackKeywordSave(keywords: string[]): void {
  if (keywords.length === 0) return
  bumpKeywords(keywords, 'saves')
}

export function getTopSearchKeywords(limit = 5): KeywordStat[] {
  return Object.values(readStore())
    .sort((a, b) => b.views + b.saves * 2 - (a.views + a.saves * 2))
    .slice(0, limit)
}

export function getEventKeywords(hostEventId?: string): string[] {
  if (!hostEventId) return []
  const event = getHostEventById(hostEventId)
  if (!event) return []
  return [...(event.customTags ?? []), ...(event.subCategories ?? [])]
}

export { KEYWORD_SUGGESTIONS } from './eventKeywords'
