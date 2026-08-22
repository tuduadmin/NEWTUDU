import type { ChecklistItem, EventChecklist } from './account'

const CLAIMS_KEY = 'tudu_checklist_claims'
const RESPONSES_KEY = 'tudu_checklist_responses'

export type ChecklistClaim = {
  eventId: string
  itemId: string
  attendeeEmail: string
  attendeeName: string
  note?: string
  claimedAt: string
}

export type ChecklistResponse = {
  eventId: string
  attendeeEmail: string
  attendeeName: string
  selectedItemIds: string[]
  dietaryNote: string
  skipped: boolean
  completedAt: string
}

export type WhosBringingEntry = {
  itemId: string
  label: string
  maxClaims: number
  claims: ChecklistClaim[]
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/** Old items without maxClaims default to 1. */
export function normalizeChecklistItem(item: ChecklistItem): ChecklistItem {
  return {
    ...item,
    maxClaims: item.maxClaims ?? 1,
    allowNote: item.allowNote ?? false,
  }
}

export function normalizeChecklist(checklist: EventChecklist): EventChecklist {
  const mandatory = checklist.mandatory
  const allowSkip = checklist.allowSkip && !mandatory
  return {
    ...checklist,
    mandatory,
    allowSkip,
    items: checklist.items.map(normalizeChecklistItem),
  }
}

export function getMaxClaimsForItem(item: ChecklistItem): number {
  return Math.max(1, item.maxClaims ?? 1)
}

export function getChecklistClaims(eventId: string): ChecklistClaim[] {
  const all = readJson<Record<string, ChecklistClaim[]>>(CLAIMS_KEY, {})
  return (all[eventId] ?? []).map((c) => ({
    ...c,
    eventId: c.eventId ?? eventId,
    claimedAt: c.claimedAt ?? new Date(0).toISOString(),
  }))
}

export function getClaimsForItem(eventId: string, itemId: string): ChecklistClaim[] {
  return getChecklistClaims(eventId).filter((c) => c.itemId === itemId)
}

export function getItemClaimCount(eventId: string, itemId: string): number {
  return getClaimsForItem(eventId, itemId).length
}

export function isItemFull(eventId: string, item: ChecklistItem): boolean {
  return getItemClaimCount(eventId, item.id) >= getMaxClaimsForItem(item)
}

/** @deprecated Prefer isItemFull — items with maxClaims > 1 stay available until full. */
export function getClaimedItemIds(eventId: string): Set<string> {
  return new Set(getChecklistClaims(eventId).map((c) => c.itemId))
}

export function claimChecklistItem(input: {
  eventId: string
  itemId: string
  attendeeEmail: string
  attendeeName: string
  note?: string
  maxClaims?: number
}): { ok: boolean; error?: string } {
  const all = readJson<Record<string, ChecklistClaim[]>>(CLAIMS_KEY, {})
  const claims = all[input.eventId] ?? []
  const maxClaims = Math.max(1, input.maxClaims ?? 1)
  const itemClaims = claims.filter((c) => c.itemId === input.itemId)

  if (itemClaims.length >= maxClaims) {
    return { ok: false, error: 'All spots for this item are taken.' }
  }

  const alreadyClaimed = itemClaims.some(
    (c) => c.attendeeEmail.toLowerCase() === input.attendeeEmail.trim().toLowerCase(),
  )
  if (alreadyClaimed) {
    return { ok: false, error: 'You already signed up for this item.' }
  }

  claims.push({
    eventId: input.eventId,
    itemId: input.itemId,
    attendeeEmail: input.attendeeEmail,
    attendeeName: input.attendeeName,
    note: input.note?.trim() || undefined,
    claimedAt: new Date().toISOString(),
  })
  all[input.eventId] = claims
  writeJson(CLAIMS_KEY, all)
  return { ok: true }
}

export function saveChecklistResponse(response: ChecklistResponse): void {
  const all = readJson<ChecklistResponse[]>(RESPONSES_KEY, [])
  const idx = all.findIndex(
    (r) => r.eventId === response.eventId && r.attendeeEmail === response.attendeeEmail,
  )
  if (idx >= 0) all[idx] = response
  else all.push(response)
  writeJson(RESPONSES_KEY, all)
}

export function getChecklistResponse(
  eventId: string,
  attendeeEmail: string,
): ChecklistResponse | undefined {
  return readJson<ChecklistResponse[]>(RESPONSES_KEY, []).find(
    (r) => r.eventId === eventId && r.attendeeEmail === attendeeEmail,
  )
}

export function getChecklistResponsesForUser(email: string): ChecklistResponse[] {
  const normalized = email.trim().toLowerCase()
  return readJson<ChecklistResponse[]>(RESPONSES_KEY, []).filter(
    (r) => r.attendeeEmail.toLowerCase() === normalized,
  )
}

export function getAvailablePotluckItems(
  eventId: string,
  items: ChecklistItem[],
): ChecklistItem[] {
  return items
    .filter((item) => item.type === 'single_pick')
    .filter((item) => !isItemFull(eventId, item))
}

export function getWhosBringingWhat(
  eventId: string,
  items: ChecklistItem[],
): WhosBringingEntry[] {
  const claims = getChecklistClaims(eventId)
  return items
    .filter((item) => item.type === 'single_pick')
    .map((item) => ({
      itemId: item.id,
      label: item.label,
      maxClaims: getMaxClaimsForItem(item),
      claims: claims.filter((c) => c.itemId === item.id),
    }))
}

export function formatClaimantName(claim: ChecklistClaim): string {
  if (claim.note?.trim()) {
    return `${claim.attendeeName} (${claim.note.trim()})`
  }
  return claim.attendeeName
}

export function validateChecklistResponse(
  checklist: EventChecklist,
  input: {
    selectedItemIds: string[]
    dietaryNote: string
    skipped: boolean
  },
): { ok: boolean; error?: string } {
  if (!checklist.enabled) return { ok: true }
  if (!checklist.mandatory) return { ok: true }

  if (checklist.template === 'potluck' || checklist.items.some((i) => i.type === 'single_pick')) {
    if (input.skipped) {
      if (checklist.mandatory && !checklist.allowSkip) {
        return { ok: false, error: 'Please pick an item to bring or enable skip.' }
      }
      return { ok: true }
    }
    if (input.selectedItemIds.length !== 1) {
      return { ok: false, error: 'Pick exactly one item to bring.' }
    }
    return { ok: true }
  }

  if (checklist.template === 'conference' || checklist.items.some((i) => i.type === 'multi_check')) {
    if (input.skipped) {
      if (checklist.allowSkip) return { ok: true }
      return { ok: false, error: 'Please complete the checklist or enable skip.' }
    }
    const mealItems = checklist.items.filter((i) => i.type === 'multi_check')
    const textItems = checklist.items.filter((i) => i.type === 'text_note')
    if (checklist.mandatory && mealItems.length > 0 && input.selectedItemIds.length === 0) {
      return { ok: false, error: 'Select at least one meal.' }
    }
    if (checklist.mandatory && textItems.length > 0 && !input.dietaryNote.trim()) {
      return { ok: false, error: 'Please complete all note fields (or write "None").' }
    }
    const validIds = new Set(mealItems.map((i) => i.id))
    if (input.selectedItemIds.some((id) => !validIds.has(id))) {
      return { ok: false, error: 'Invalid meal selection.' }
    }
    return { ok: true }
  }

  if (checklist.mandatory) {
    const textItems = checklist.items.filter((i) => i.type === 'text_note')
    const pickItems = checklist.items.filter((i) => i.type === 'single_pick')
    if (pickItems.length > 0 && input.selectedItemIds.length === 0 && !input.skipped) {
      return { ok: false, error: 'Complete all required checklist items.' }
    }
    if (textItems.length > 0 && !input.dietaryNote.trim()) {
      return { ok: false, error: 'Please complete the notes field.' }
    }
  }

  return { ok: true }
}

export function getChecklistSummary(checklist: EventChecklist): string {
  if (!checklist.enabled) return 'No attendee checklist'
  if (!checklist.template) return 'Choose a checklist template'
  const templateLabel =
    checklist.template === 'potluck'
      ? 'Potluck signup'
      : checklist.template === 'conference'
        ? 'Conference meals'
        : 'Custom checklist'
  const itemCount = checklist.items.length
  const req = checklist.mandatory ? 'Required' : 'Optional'
  const multiSpot = checklist.items.some((i) => (i.maxClaims ?? 1) > 1)
  const multiLabel = multiSpot ? ' · multi-spot items' : ''
  return `${templateLabel} · ${itemCount} item${itemCount === 1 ? '' : 's'} · ${req}${multiLabel}`
}
