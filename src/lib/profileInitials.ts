/** Derive display initials from a name (e.g. "Jane Doe" → "JD"). */
export function getInitialsFromName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'M'

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
  }

  const word = parts[0]
  if (word.length >= 2) return word.slice(0, 2).toUpperCase()
  return word.charAt(0).toUpperCase() || 'M'
}
