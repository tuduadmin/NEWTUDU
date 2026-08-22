/** Basic domain pattern: emerald.com, www.emerald.com, sub.example.co.uk/path */
const DOMAIN_PATTERN =
  /^(?:www\.)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/

function looksLikeDomain(value: string): boolean {
  return DOMAIN_PATTERN.test(value)
}

function isValidWebsite(value: string): boolean {
  if (!value || /\s/.test(value)) return false
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }
  return looksLikeDomain(value)
}

/** Normalize user input: www.emerald.com → https://www.emerald.com */
export function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed || !isValidWebsite(trimmed)) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** Safe href for <a> — returns null if invalid */
export function getWebsiteHref(input: string | undefined): string | null {
  if (!input?.trim()) return null
  const normalized = normalizeWebsiteUrl(input)
  return normalized || null
}

/** Display label — show what user typed or clean domain (no protocol) */
export function formatWebsiteDisplay(input: string | undefined): string {
  if (!input?.trim()) return ''
  return input.trim().replace(/^https?:\/\//i, '')
}

/** Soft validation for optional UI hints — does not block save */
export function isWebsiteInputValid(input: string | undefined): boolean {
  const trimmed = input?.trim()
  if (!trimmed) return true
  return isValidWebsite(trimmed)
}
