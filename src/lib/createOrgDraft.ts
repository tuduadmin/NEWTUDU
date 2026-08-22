import type { PersonalHostSocialLinks } from './personalHostProfile'

const CREATE_ORG_DRAFT_KEY = 'tudu-create-org-draft'

export type CreateOrgDraft = {
  email: string
  name: string
  category: string
  bio: string
  logoUrl: string
  address: string
  city: string
  phone: string
  contactEmail: string
  social: PersonalHostSocialLinks
  backupAdminEmail: string
  /** User submitted the form but must verify phone before org is created. */
  pendingSubmit?: boolean
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function getCreateOrgDraft(email: string): CreateOrgDraft | null {
  const draft = readJson<CreateOrgDraft | null>(CREATE_ORG_DRAFT_KEY, null)
  if (!draft || draft.email.toLowerCase() !== email.trim().toLowerCase()) return null
  return draft
}

export function saveCreateOrgDraft(draft: CreateOrgDraft): void {
  localStorage.setItem(CREATE_ORG_DRAFT_KEY, JSON.stringify(draft))
}

export function clearCreateOrgDraft(): void {
  localStorage.removeItem(CREATE_ORG_DRAFT_KEY)
}
