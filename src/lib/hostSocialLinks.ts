import type { PersonalHostSocialLinks } from './personalHostProfile'

export type HostSocialFieldId = keyof PersonalHostSocialLinks

export const HOST_SOCIAL_FIELD_IDS: HostSocialFieldId[] = [
  'website',
  'instagram',
  'twitter',
  'facebook',
  'youtube',
  'tiktok',
  'twitch',
  'kick',
]

export function normalizeSocialUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function getFilledSocialLinks(
  social: PersonalHostSocialLinks,
): Array<{ id: HostSocialFieldId; url: string }> {
  return HOST_SOCIAL_FIELD_IDS.flatMap((id) => {
    const raw = social[id]?.trim()
    if (!raw) return []
    return [{ id, url: normalizeSocialUrl(raw) }]
  })
}
