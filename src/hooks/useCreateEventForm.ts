import { useCallback, useEffect, useState } from 'react'
import {
  defaultHostEventFormData,
  type HostEventFormData,
  type TicketTier,
} from '../lib/account'

const DRAFT_KEY = 'tudu_create_event_draft'

export type CreateEventStep = 1 | 2 | 3 | 4 | 5

export type CreateEventDraft = {
  form: HostEventFormData
  step: CreateEventStep
  eventId?: string
  updatedAt: string
}

function readDraft(): CreateEventDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CreateEventDraft
    return {
      ...parsed,
      form: { ...defaultHostEventFormData(), ...parsed.form },
    }
  } catch {
    return null
  }
}

function writeDraft(draft: CreateEventDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearCreateEventDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}

export function useCreateEventForm(initialStep: CreateEventStep = 1) {
  const existing = readDraft()
  const [step, setStep] = useState<CreateEventStep>(existing?.step ?? initialStep)
  const [form, setForm] = useState<HostEventFormData>(existing?.form ?? defaultHostEventFormData())
  const [eventId, setEventId] = useState<string | undefined>(existing?.eventId)

  useEffect(() => {
    writeDraft({ form, step, eventId, updatedAt: new Date().toISOString() })
  }, [form, step, eventId])

  const updateForm = useCallback((partial: Partial<HostEventFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetForm = useCallback(() => {
    clearCreateEventDraft()
    setForm(defaultHostEventFormData())
    setStep(1)
    setEventId(undefined)
  }, [])

  const goToStep = useCallback((next: CreateEventStep) => {
    setStep(next)
  }, [])

  const nextStep = useCallback(() => {
    setStep((s) => Math.min(5, s + 1) as CreateEventStep)
  }, [])

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(1, s - 1) as CreateEventStep)
  }, [])

  const updateTicketTier = useCallback((tierId: string, partial: Partial<TicketTier>) => {
    setForm((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((t) => (t.id === tierId ? { ...t, ...partial } : t)),
    }))
  }, [])

  const addTicketTier = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      ticketTiers: [
        ...prev.ticketTiers,
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
    }))
  }, [])

  const removeTicketTier = useCallback((tierId: string) => {
    setForm((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter((t) => t.id !== tierId),
    }))
  }, [])

  const addPhoto = useCallback((dataUrl: string) => {
    setForm((prev) => {
      if (prev.photos.length >= 3) return prev
      return { ...prev, photos: [...prev.photos, dataUrl] }
    })
  }, [])

  const removePhoto = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }, [])

  return {
    step,
    form,
    eventId,
    setEventId,
    updateForm,
    resetForm,
    goToStep,
    nextStep,
    prevStep,
    updateTicketTier,
    addTicketTier,
    removeTicketTier,
    addPhoto,
    removePhoto,
  }
}
