import {
  defaultHostEventFormData,
  defaultEventChecklist,
  getCurrentAccount,
  type HostEventFormData,
  type UserTier,
  type VerificationStatus,
} from './account'
import { migrateScheduleFields, migrateOccurrencesFromLegacy } from './eventSchedule'
import { migrateTicketSessions } from './ticketSessions'
import { getCurrentUser } from './auth'

export const CREATE_EVENT_DRAFT_KEY = 'tudu_create_event_draft'
const SESSION_KEY = 'tudu_create_event_session'

export type CreateEventStep = 1 | 2 | 3 | 4 | 5 | 6

export type CreateEventDraftAccountSnapshot = {
  tier: UserTier
  verificationStatus: VerificationStatus
  userEmail: string
}

export type CreateEventDraft = {
  form: HostEventFormData
  step: CreateEventStep
  eventId?: string
  updatedAt: string
  accountSnapshot?: CreateEventDraftAccountSnapshot
}

export type CreateEventDraftLoadMode = 'default' | 'fresh' | 'resume'

function migrateLegacyFormFields(form: Partial<HostEventFormData>): Partial<HostEventFormData> {
  const migrated: Partial<HostEventFormData> & { photos?: string[] } = migrateScheduleFields({
    ...form,
  })

  if (Array.isArray(migrated.photos) && !migrated.coverImage) {
    migrated.coverImage = migrated.photos[0] ?? ''
    migrated.additionalPhotos = migrated.photos.slice(1, 5)
    delete migrated.photos
  }

  if (!migrated.additionalPhotos) migrated.additionalPhotos = []
  if (!migrated.coverImage) migrated.coverImage = ''
  if (!migrated.streetSuite) migrated.streetSuite = ''
  if (!migrated.postalCode) migrated.postalCode = ''
  if (!migrated.multiDates) migrated.multiDates = migrated.eventDate ? [migrated.eventDate] : []
  if (!migrated.occurrences?.length) {
    const occ = migrateOccurrencesFromLegacy(migrated)
    migrated.occurrences = occ.occurrences
    if (!migrated.scheduleRepeatMode) migrated.scheduleRepeatMode = occ.scheduleRepeatMode
  }
  if (!migrated.scheduleRepeatMode) migrated.scheduleRepeatMode = 'none'
  if (!migrated.scheduleMode) migrated.scheduleMode = 'single'
  if (!migrated.seriesEndDate) migrated.seriesEndDate = migrated.recurrenceEndDate ?? ''
  if (!migrated.seasonStartDate) migrated.seasonStartDate = migrated.recurrenceStartDate ?? ''
  if (!migrated.seasonEndDate) migrated.seasonEndDate = migrated.recurrenceEndDate ?? ''
  if (migrated.recurrenceCount === undefined) migrated.recurrenceCount = null
  if (!migrated.scheduledPublishAt) migrated.scheduledPublishAt = ''
  if (!migrated.ticketSessions?.length) {
    migrated.ticketSessions = migrateTicketSessions(migrated)
  }
  if (migrated.marketplaceEnabled === undefined) migrated.marketplaceEnabled = false
  if (!migrated.marketplaceDraftProducts) migrated.marketplaceDraftProducts = []
  if (migrated.marketplaceFeeMode === undefined) {
    migrated.marketplaceFeeMode = 'fees_on_top'
  }

  return migrated
}

function normalizeDraftForm(form: Partial<HostEventFormData> | undefined): HostEventFormData {
  return {
    ...defaultHostEventFormData(),
    ...migrateLegacyFormFields(form ?? {}),
    checklist: { ...defaultEventChecklist(), ...form?.checklist },
  }
}

export function getCurrentAccountSnapshot(): CreateEventDraftAccountSnapshot | null {
  const user = getCurrentUser()
  const account = getCurrentAccount()
  if (!user || !account) return null
  return {
    tier: account.tier,
    verificationStatus: account.verificationStatus ?? 'unverified',
    userEmail: user.email.toLowerCase(),
  }
}

export function isCreateEventDraftStale(
  draft: CreateEventDraft,
  snapshot: CreateEventDraftAccountSnapshot | null = getCurrentAccountSnapshot(),
): boolean {
  if (!snapshot) return true
  if (!draft.accountSnapshot) {
    return draft.step > 1
  }
  return (
    draft.accountSnapshot.tier !== snapshot.tier ||
    draft.accountSnapshot.verificationStatus !== snapshot.verificationStatus ||
    draft.accountSnapshot.userEmail !== snapshot.userEmail
  )
}

function hasMeaningfulDraftContent(form: HostEventFormData): boolean {
  return (
    form.title.trim() !== '' ||
    form.description.trim() !== '' ||
    form.coverImage.trim() !== '' ||
    form.additionalPhotos.some((photo) => photo.trim() !== '') ||
    form.venueName.trim() !== ''
  )
}

export function readCreateEventDraft(): CreateEventDraft | null {
  try {
    const raw = localStorage.getItem(CREATE_EVENT_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CreateEventDraft
    return {
      ...parsed,
      form: normalizeDraftForm(parsed.form),
    }
  } catch {
    return null
  }
}

export function writeCreateEventDraft(draft: CreateEventDraft): void {
  localStorage.setItem(CREATE_EVENT_DRAFT_KEY, JSON.stringify(draft))
}

export function clearCreateEventDraft(): void {
  localStorage.removeItem(CREATE_EVENT_DRAFT_KEY)
}

export function hasResumableCreateEventDraft(): boolean {
  const draft = readCreateEventDraft()
  if (!draft) return false
  if (isCreateEventDraftStale(draft)) return false
  return draft.step > 1 || hasMeaningfulDraftContent(draft.form)
}

export function markCreateEventSessionActive(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // sessionStorage unavailable
  }
}

export function clearCreateEventSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // sessionStorage unavailable
  }
}

function isCreateEventSessionActive(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function resolveCreateEventDraftState(mode: CreateEventDraftLoadMode): {
  form: HostEventFormData
  step: CreateEventStep
  eventId?: string
} {
  const defaults = {
    form: defaultHostEventFormData(),
    step: 1 as CreateEventStep,
    eventId: undefined as string | undefined,
  }

  if (mode === 'fresh') {
    clearCreateEventDraft()
    clearCreateEventSession()
    return defaults
  }

  const draft = readCreateEventDraft()
  if (!draft) return defaults

  const snapshot = getCurrentAccountSnapshot()
  if (isCreateEventDraftStale(draft, snapshot)) {
    clearCreateEventDraft()
    clearCreateEventSession()
    return defaults
  }

  if (mode === 'resume' || isCreateEventSessionActive()) {
    return {
      form: draft.form,
      step: draft.step,
      eventId: draft.eventId,
    }
  }

  clearCreateEventDraft()
  return defaults
}

export function invalidateCreateEventDraftOnAccountChange(): void {
  const draft = readCreateEventDraft()
  if (!draft) return
  if (isCreateEventDraftStale(draft)) {
    clearCreateEventDraft()
    clearCreateEventSession()
  }
}
