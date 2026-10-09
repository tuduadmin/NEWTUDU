import { useCallback, useEffect, useState } from 'react'
import {
  defaultHostEventFormData,
  getFormAllPhotos,
  countFilledAdditionalPhotos,
  MAX_EVENT_ADDITIONAL_PHOTOS,
  type HostEventFormData,
  type TicketTier,
} from '../lib/account'
import {
  clearCreateEventDraft,
  clearCreateEventSession,
  getCurrentAccountSnapshot,
  markCreateEventSessionActive,
  resolveCreateEventDraftState,
  writeCreateEventDraft,
  type CreateEventDraftLoadMode,
  type CreateEventStep,
} from '../lib/createEventDraft'
import {
  applyLockedSessionSync,
  getSyncedTicketSessions,
  isSessionTicketConfigLocked,
  sessionTiersForMode,
  syncTicketSessions,
  updateTicketSessionsInForm,
} from '../lib/ticketSessions'

export type { CreateEventStep } from '../lib/createEventDraft'
export { clearCreateEventDraft, hasResumableCreateEventDraft } from '../lib/createEventDraft'

export function useCreateEventForm(mode: CreateEventDraftLoadMode = 'default') {
  const initial = resolveCreateEventDraftState(mode)
  const [step, setStep] = useState<CreateEventStep>(initial.step)
  const [form, setForm] = useState<HostEventFormData>(initial.form)
  const [eventId, setEventId] = useState<string | undefined>(initial.eventId)
  const [visitedSteps, setVisitedSteps] = useState<Set<CreateEventStep>>(
    () => new Set([initial.step]),
  )

  const markStepVisited = useCallback((next: CreateEventStep) => {
    setVisitedSteps((prev) => {
      if (prev.has(next)) return prev
      const nextSet = new Set(prev)
      nextSet.add(next)
      return nextSet
    })
  }, [])

  useEffect(() => {
    markCreateEventSessionActive()
  }, [])

  useEffect(() => {
    const snapshot = getCurrentAccountSnapshot()
    if (!snapshot) return
    writeCreateEventDraft({
      form,
      step,
      eventId,
      updatedAt: new Date().toISOString(),
      accountSnapshot: snapshot,
    })
  }, [form, step, eventId])

  const syncSessionsFromSchedule = useCallback((prev: HostEventFormData): HostEventFormData => {
    const synced = syncTicketSessions(prev)
    const sameLength = synced.length === prev.ticketSessions.length
    const sameIndices = sameLength
      ? synced.every((s, i) => s.occurrenceIndex === prev.ticketSessions[i]?.occurrenceIndex)
      : false
    if (sameLength && sameIndices && prev.ticketSessions.length > 0) return prev
    return { ...prev, ...updateTicketSessionsInForm(prev, synced) }
  }, [])

  const updateForm = useCallback((partial: Partial<HostEventFormData>) => {
    setForm((prev) => {
      const next = { ...prev, ...partial }
      if (
        partial.occurrences != null ||
        partial.eventDate != null ||
        partial.scheduleMode != null ||
        partial.scheduleRepeatMode != null ||
        partial.scheduleTimeSlots != null
      ) {
        return syncSessionsFromSchedule(next)
      }
      return next
    })
  }, [syncSessionsFromSchedule])

  const resetForm = useCallback(() => {
    clearCreateEventDraft()
    clearCreateEventSession()
    setForm(defaultHostEventFormData())
    setStep(1)
    setEventId(undefined)
    setVisitedSteps(new Set([1]))
  }, [])

  const goToStep = useCallback(
    (next: CreateEventStep) => {
      markStepVisited(next)
      setStep(next)
    },
    [markStepVisited],
  )

  const nextStep = useCallback(() => {
    setStep((s) => {
      const next = Math.min(6, s + 1) as CreateEventStep
      markStepVisited(next)
      return next
    })
  }, [markStepVisited])

  const prevStep = useCallback(() => {
    setStep((s) => {
      const next = Math.max(1, s - 1) as CreateEventStep
      markStepVisited(next)
      return next
    })
  }, [markStepVisited])

  const updateTicketSessions = useCallback(
    (updater: (sessions: ReturnType<typeof getSyncedTicketSessions>) => ReturnType<typeof getSyncedTicketSessions>) => {
      setForm((prev) => {
        const sessions = applyLockedSessionSync(updater(getSyncedTicketSessions(prev)))
        return { ...prev, ...updateTicketSessionsInForm(prev, sessions) }
      })
    },
    [],
  )

  const setSessionTiersLocked = useCallback((sessionIndex: number, locked: boolean) => {
    updateTicketSessions((sessions) =>
      sessions.map((s, i) => (i === sessionIndex ? { ...s, tiersLocked: locked } : s)),
    )
  }, [updateTicketSessions])

  const updateSessionCapacity = useCallback((sessionIndex: number, capacity: number | null) => {
    updateTicketSessions((sessions) => {
      if (isSessionTicketConfigLocked(sessions[sessionIndex], sessionIndex)) return sessions
      return sessions.map((s, i) => (i === sessionIndex ? { ...s, capacity } : s))
    })
  }, [updateTicketSessions])

  const updateSessionTier = useCallback(
    (sessionIndex: number, tierId: string, partial: Partial<TicketTier>) => {
      updateTicketSessions((sessions) => {
        if (isSessionTicketConfigLocked(sessions[sessionIndex], sessionIndex)) return sessions
        return sessions.map((s, i) =>
          i === sessionIndex
            ? {
                ...s,
                tiers: s.tiers.map((t) => (t.id === tierId ? { ...t, ...partial } : t)),
              }
            : s,
        )
      })
    },
    [updateTicketSessions],
  )

  const addSessionTier = useCallback((sessionIndex: number) => {
    updateTicketSessions((sessions) => {
      if (isSessionTicketConfigLocked(sessions[sessionIndex], sessionIndex)) return sessions
      return sessions.map((s, i) =>
        i === sessionIndex
          ? {
              ...s,
              tiers: [
                ...s.tiers,
                {
                  id: `tier_${Date.now()}`,
                  name: '',
                  priceCents: 0,
                  quantity: null,
                  sold: 0,
                  description: '',
                  availableAtDoor: false,
                },
              ],
            }
          : s,
      )
    })
  }, [updateTicketSessions])

  const removeSessionTier = useCallback((sessionIndex: number, tierId: string) => {
    updateTicketSessions((sessions) => {
      if (isSessionTicketConfigLocked(sessions[sessionIndex], sessionIndex)) return sessions
      return sessions.map((s, i) =>
        i === sessionIndex ? { ...s, tiers: s.tiers.filter((t) => t.id !== tierId) } : s,
      )
    })
  }, [updateTicketSessions])

  /** @deprecated — use session tier helpers; kept for compatibility. */
  const updateTicketTier = useCallback((tierId: string, partial: Partial<TicketTier>) => {
    updateSessionTier(0, tierId, partial)
  }, [updateSessionTier])

  const addTicketTier = useCallback(() => {
    addSessionTier(0)
  }, [addSessionTier])

  const removeTicketTier = useCallback((tierId: string) => {
    removeSessionTier(0, tierId)
  }, [removeSessionTier])

  const addPhoto = useCallback((dataUrl: string) => {
    setForm((prev) => {
      if (!prev.coverImage) return { ...prev, coverImage: dataUrl }
      if (countFilledAdditionalPhotos(prev.additionalPhotos) >= MAX_EVENT_ADDITIONAL_PHOTOS) return prev
      return { ...prev, additionalPhotos: [...prev.additionalPhotos, dataUrl] }
    })
  }, [])

  const removePhoto = useCallback((index: number) => {
    setForm((prev) => {
      const all = getFormAllPhotos(prev)
      if (index < 0 || index >= all.length) return prev
      if (index === 0) {
        const [, ...rest] = all
        return {
          ...prev,
          coverImage: rest[0] ?? '',
          additionalPhotos: rest.slice(1),
        }
      }
      const additionalIndex = index - 1
      return {
        ...prev,
        additionalPhotos: prev.additionalPhotos.filter((_, i) => i !== additionalIndex),
      }
    })
  }, [])

  const loadFromEvent = useCallback(
    (nextForm: HostEventFormData, id: string, nextStep: CreateEventStep = 1) => {
      clearCreateEventDraft()
      const synced = syncSessionsFromSchedule(nextForm)
      setForm(synced)
      setEventId(id)
      setStep(nextStep)
      setVisitedSteps(new Set([nextStep]))
    },
    [syncSessionsFromSchedule],
  )

  return {
    step,
    form,
    eventId,
    setEventId,
    updateForm,
    resetForm,
    loadFromEvent,
    goToStep,
    nextStep,
    prevStep,
    visitedSteps,
    updateTicketTier,
    addTicketTier,
    removeTicketTier,
    updateSessionCapacity,
    updateSessionTier,
    addSessionTier,
    removeSessionTier,
    setSessionTiersLocked,
    updateTicketSessions,
    sessionTiersForMode,
    addPhoto,
    removePhoto,
  }
}
