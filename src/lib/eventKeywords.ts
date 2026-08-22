export const MIN_EVENT_KEYWORDS = 2
export const MAX_EVENT_KEYWORDS = 5

/** Example copy only — not selectable suggestions. */
export const SEARCH_WORD_EXAMPLES = ['wings', 'cheap', 'beer', 'patio'] as const

/** @deprecated Admin seed autocomplete — generic examples only. */
export const KEYWORD_SUGGESTIONS = [...SEARCH_WORD_EXAMPLES, 'live-music', 'family-friendly']

export function normalizeSearchWord(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split typed input into individual search words (commas, semicolons, or spaces). */
export function parseSearchWordInput(raw: string): string[] {
  const parts = raw.split(/[,;]+/).flatMap((chunk) => chunk.split(/\s+/))
  const seen = new Set<string>()
  const words: string[] = []

  for (const part of parts) {
    const normalized = normalizeSearchWord(part)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    words.push(normalized)
  }

  return words
}

export function eventKeywordsComplete(tags: string[]): boolean {
  return tags.length >= MIN_EVENT_KEYWORDS
}

/** @deprecated Use normalizeSearchWord */
export function normalizeEventKeyword(raw: string): string {
  return normalizeSearchWord(raw).replace(/\s+/g, '-')
}
