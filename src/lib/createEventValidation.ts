import type { CreateEventStep } from './createEventDraft'
import type { HostEventFormData } from './account'
import {
  expandOccurrenceDates,
  getEffectiveOccurrences,
  templateFromScheduleFields,
  type EventOccurrence,
} from './eventSchedule'
import { areTicketSessionsValid, getSyncedTicketSessions } from './ticketSessions'
import { eventKeywordsComplete } from './eventKeywords'
import { eventCategoriesComplete } from '../data/eventCategories'

export type StepStatus = 'complete' | 'incomplete'

export const CREATE_EVENT_STEPS: { id: string; label: string; number: CreateEventStep }[] = [
  { id: 'basics', label: 'BASICS', number: 1 },
  { id: 'category', label: 'CATEGORY', number: 2 },
  { id: 'schedule', label: 'SCHEDULE', number: 3 },
  { id: 'ticketing', label: 'TICKETING', number: 4 },
  { id: 'review', label: 'REVIEW', number: 5 },
]

function isTimeFilled(hour: string, minute: string): boolean {
  return hour.trim() !== '' && minute.trim() !== ''
}

function occurrenceTimesComplete(
  occ: EventOccurrence,
  template: ReturnType<typeof templateFromScheduleFields>,
): boolean {
  if (!occ.date) return false
  const startHour = occ.startHour?.trim() || template.startHour
  const startMinute = occ.startMinute?.trim() || template.startMinute
  const endHour = occ.endHour?.trim() || template.endHour
  const endMinute = occ.endMinute?.trim() || template.endMinute
  return (
    isTimeFilled(startHour, startMinute) &&
    isTimeFilled(endHour, endMinute)
  )
}

/** At least one calendar day selected on the schedule step. */
export function hasScheduleDaysSelected(form: HostEventFormData): boolean {
  return expandOccurrenceDates(getEffectiveOccurrences(form)).length > 0
}

export function isBasicsStepComplete(form: HostEventFormData): boolean {
  return (
    form.title.trim() !== '' &&
    form.streetAddress.trim() !== '' &&
    form.city.trim() !== '' &&
    form.description.trim() !== '' &&
    form.coverImage.trim() !== ''
  )
}

export function isScheduleStepComplete(form: HostEventFormData): boolean {
  if (form.scheduleMode === 'seasonal') return false
  if (!hasScheduleDaysSelected(form)) return false

  const template = templateFromScheduleFields(form)
  const occurrences = getEffectiveOccurrences(form)
  if (!occurrences.every((occ) => occurrenceTimesComplete(occ, template))) return false

  if (form.scheduleRepeatMode === 'pattern' && form.repeats !== 'none' && form.weeksOnDeck < 1) {
    return false
  }

  return true
}

export function isCategoryStepComplete(form: HostEventFormData): boolean {
  return eventCategoriesComplete(form) && eventKeywordsComplete(form.customTags)
}

export function isFinalStepComplete(form: HostEventFormData): boolean {
  if (!form.ageRestriction) return false

  if (form.ticketingMode === 'external') {
    if (!form.externalTicketUrl.trim()) return false
  }

  if (
    form.ticketingMode === 'free_rsvp' ||
    form.ticketingMode === 'sell' ||
    form.ticketingMode === 'free_donation'
  ) {
    const sessions = getSyncedTicketSessions(form)
    if (sessions.length === 0 && getEffectiveOccurrences(form).length === 0) return false
    if (!areTicketSessionsValid(form)) return false
  }

  return true
}

export function isReviewStepComplete(form: HostEventFormData): boolean {
  return (
    isBasicsStepComplete(form) &&
    isScheduleStepComplete(form) &&
    isCategoryStepComplete(form) &&
    isFinalStepComplete(form)
  )
}

export function isStepComplete(step: CreateEventStep, form: HostEventFormData): boolean {
  switch (step) {
    case 1:
      return isBasicsStepComplete(form)
    case 2:
      return isCategoryStepComplete(form)
    case 3:
      return isScheduleStepComplete(form)
    case 4:
      return isFinalStepComplete(form)
    case 5:
      return isReviewStepComplete(form)
    default:
      return false
  }
}

export function getStepStatus(step: CreateEventStep, form: HostEventFormData): StepStatus {
  return isStepComplete(step, form) ? 'complete' : 'incomplete'
}

/** Inline hint for the active step — hidden once that step's requirements are met. */
export function getStepHintMessage(step: CreateEventStep, form: HostEventFormData): string | null {
  if (step === 5 || isStepComplete(step, form)) return null

  switch (step) {
    case 1:
      return 'Required fields need to be finished.'
    case 2:
      if (!eventCategoriesComplete(form)) {
        return 'Required fields need to be finished — pick 2 categories.'
      }
      return 'Required fields need to be finished — add 2 search words.'
    case 3:
      if (!hasScheduleDaysSelected(form)) {
        return 'Required fields need to be finished — pick at least one day.'
      }
      return 'Required fields need to be finished — set start and end times.'
    case 4: {
      if (!form.ageRestriction) {
        return 'Required — pick an age restriction.'
      }
      if (form.ticketingMode === 'external' && !form.externalTicketUrl.trim()) {
        return 'Required — add your external ticket link.'
      }
      if (
        (form.ticketingMode === 'free_rsvp' ||
          form.ticketingMode === 'sell' ||
          form.ticketingMode === 'free_donation') &&
        !areTicketSessionsValid(form)
      ) {
        return form.ticketingMode === 'free_rsvp'
          ? 'Required — set RSVP capacity.'
          : 'Required — set capacity and tier details.'
      }
      return null
    }
    default:
      return null
  }
}

/** Steps 1–4 that still have required fields missing (review step aggregates these). */
export function getIncompleteSteps(form: HostEventFormData): CreateEventStep[] {
  const incomplete: CreateEventStep[] = []
  if (!isBasicsStepComplete(form)) incomplete.push(1)
  if (!isCategoryStepComplete(form)) incomplete.push(2)
  if (!isScheduleStepComplete(form)) incomplete.push(3)
  if (!isFinalStepComplete(form)) incomplete.push(4)
  return incomplete
}

export function getFirstIncompleteStep(form: HostEventFormData): CreateEventStep | null {
  return getIncompleteSteps(form)[0] ?? null
}

export function canPublishEvent(form: HostEventFormData): boolean {
  return isReviewStepComplete(form)
}

/** Human-readable labels for missing required fields (used before publish). */
export function getPublishValidationIssues(form: HostEventFormData): string[] {
  const issues: string[] = []

  if (!form.title.trim()) issues.push('event title')
  if (!form.streetAddress.trim()) issues.push('street address')
  if (!form.city.trim()) issues.push('city')
  if (!form.description.trim()) issues.push('description')
  if (!form.coverImage.trim()) issues.push('card deck cover')

  if (!isScheduleStepComplete(form)) {
    if (form.scheduleMode === 'seasonal') {
      issues.push('schedule (seasonal not available yet)')
    } else if (!hasScheduleDaysSelected(form)) {
      issues.push('event date')
    } else {
      issues.push('event time')
    }
  }

  if (!eventCategoriesComplete(form)) issues.push('categories (pick 2)')
  if (!eventKeywordsComplete(form.customTags)) issues.push('search words (add 2)')

  if (form.visibility !== 'public' && form.visibility !== 'private') {
    issues.push('visibility (public or private)')
  }

  if (!form.ageRestriction) {
    issues.push('age restriction')
  } else if (form.ticketingMode === 'external' && !form.externalTicketUrl.trim()) {
    issues.push('external ticket URL')
  } else if (
    (form.ticketingMode === 'free_rsvp' ||
      form.ticketingMode === 'sell' ||
      form.ticketingMode === 'free_donation') &&
    !areTicketSessionsValid(form)
  ) {
    if (form.ticketingMode === 'free_rsvp') {
      issues.push('RSVP capacity')
    } else {
      issues.push('ticket capacity and tier details')
    }
  }

  return issues
}

export function getPublishBlockMessage(form: HostEventFormData): string | null {
  if (canPublishEvent(form)) return null
  const issues = getPublishValidationIssues(form)
  if (issues.length === 0) {
    return 'Complete all required steps before publishing.'
  }
  return `Complete required fields before publishing: ${issues.join(', ')}.`
}
