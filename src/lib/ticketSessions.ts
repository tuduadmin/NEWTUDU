import {
  defaultTicketTier,
  type HostEventFormData,
  type TicketSession,
  type TicketTier,
  type TicketingMode,
} from './account'
import {
  formatOccurrenceDateLabel,
  getEffectiveOccurrences,
  type EventOccurrence,
} from './eventSchedule'

const DEFAULT_SESSION_CAPACITY = 20

function inferLegacyCapacity(form: Pick<HostEventFormData, 'capacity' | 'ticketTiers'>): number | null {
  if (form.capacity != null && form.capacity > 0) return form.capacity
  const tierQty = form.ticketTiers
    .map((t) => t.quantity)
    .filter((q): q is number => q != null && q > 0)
  if (tierQty.length > 0) return Math.max(...tierQty)
  return null
}

function defaultSessionTiers(mode: TicketingMode, seed?: TicketTier): TicketTier[] {
  const base = seed ? { ...seed, id: seed.id || `tier_${Date.now()}` } : defaultTicketTier()
  if (mode === 'free_rsvp') {
    return [{ ...base, name: 'RSVP', priceCents: 0, quantity: null }]
  }
  if (mode === 'free_donation') {
    return [{ ...base, name: 'Suggested donation', priceCents: 500, quantity: null }]
  }
  if (mode === 'sell') {
    return [{ ...base, name: 'General Admission', priceCents: 1500, quantity: null }]
  }
  return [defaultTicketTier()]
}

/** Whether session 1+ mirrors the first slot's ticket setup. */
export function isSessionTicketConfigLocked(session: TicketSession, index: number): boolean {
  if (index === 0) return false
  return session.tiersLocked !== false
}

function cloneTierConfigFromTemplate(templateTiers: TicketTier[], existingTiers: TicketTier[]): TicketTier[] {
  return templateTiers.map((template, i) => {
    const existing = existingTiers[i]
    return {
      ...(existing ?? defaultTicketTier()),
      id: existing?.id ?? `tier_${Date.now()}_${i}`,
      name: template.name,
      priceCents: template.priceCents,
      description: template.description,
      availableAtDoor: template.availableAtDoor,
      quantity: null,
      sold: existing?.sold ?? 0,
    }
  })
}

/** Copy session 0 capacity + tiers onto locked follower sessions. */
export function applyLockedSessionSync(sessions: TicketSession[]): TicketSession[] {
  if (sessions.length <= 1) return sessions
  const template = sessions[0]
  return sessions.map((session, index) => {
    if (index === 0 || !isSessionTicketConfigLocked(session, index)) return session
    return {
      ...session,
      capacity: template.capacity,
      tiers: cloneTierConfigFromTemplate(template.tiers, session.tiers),
    }
  })
}

/** Plain-English header for a ticket session — e.g. "Sat Jul 26 · 11:00 AM – 2:00 PM". */
export function formatOccurrenceScheduleLabel(occ: EventOccurrence): string {
  const datePart = formatOccurrenceDateLabel(occ)
  if (occ.allDay) return datePart
  const start = `${occ.startHour}:${occ.startMinute} ${occ.startPeriod}`
  const end = `${occ.endHour}:${occ.endMinute} ${occ.endPeriod}`
  return `${datePart} · ${start} – ${end}`
}

function compactTimeRange(occ: EventOccurrence): string {
  if (occ.allDay) return 'All day'
  const startH = parseInt(occ.startHour, 10)
  const endH = parseInt(occ.endHour, 10)
  if (occ.startPeriod === occ.endPeriod) return `${startH}–${endH}`
  const sp = occ.startPeriod === 'AM' ? 'a' : 'p'
  const ep = occ.endPeriod === 'AM' ? 'a' : 'p'
  return `${startH}${sp}–${endH}${ep}`
}

/** One-line accordion summary — e.g. "Sat Jul 26 · 11–2 · 20 cap · Adult $50, Child $20". */
export function formatSessionAccordionSummary(
  session: TicketSession,
  occ: EventOccurrence | undefined,
  mode: TicketingMode,
): string {
  const parts: string[] = []

  if (occ) {
    parts.push(formatOccurrenceDateLabel(occ))
    if (!occ.allDay) parts.push(compactTimeRange(occ))
  }

  if (mode === 'free_rsvp') {
    parts.push(`${session.capacity ?? '—'} cap`)
    return parts.join(' · ')
  }

  if (mode === 'sell' || mode === 'free_donation') {
    parts.push(`${session.capacity ?? '—'} cap`)
    const tierPart = session.tiers
      .map((t) => {
        const price =
          t.priceCents === 0
            ? 'free'
            : `$${(t.priceCents / 100).toFixed(t.priceCents % 100 === 0 ? 0 : 2)}`
        return `${t.name.trim() || 'Unnamed'} ${price}`
      })
      .join(', ')
    if (tierPart) parts.push(tierPart)
  }

  return parts.join(' · ')
}

/** Whether ticketing UI should group by schedule occurrence. */
export function hasMultipleTicketSessions(form: HostEventFormData): boolean {
  return getEffectiveOccurrences(form).length > 1
}

/** Resolve sessions aligned 1:1 with effective schedule occurrences. */
export function syncTicketSessions(form: HostEventFormData): TicketSession[] {
  const occurrences = getEffectiveOccurrences(form)
  const legacyCapacity = inferLegacyCapacity(form)
  const legacyTiers =
    form.ticketTiers.length > 0 ? form.ticketTiers : defaultSessionTiers(form.ticketingMode)

  if (occurrences.length === 0) {
    const existing = form.ticketSessions[0]
    if (existing) {
      return [
        {
          ...existing,
          occurrenceIndex: 0,
          tiers:
            existing.tiers.length > 0
              ? existing.tiers.map((t) => ({ ...t, quantity: null }))
              : defaultSessionTiers(form.ticketingMode, legacyTiers[0]),
        },
      ]
    }

    return [
      {
        occurrenceIndex: 0,
        capacity: legacyCapacity,
        tiers: legacyTiers.map((t) => ({ ...t, quantity: null })),
      },
    ]
  }

  return occurrences.map((_, index) => {
    const existing = form.ticketSessions[index]
    if (existing) {
      return {
        ...existing,
        occurrenceIndex: index,
        tiers:
          existing.tiers.length > 0
            ? existing.tiers.map((t) => ({ ...t, quantity: null }))
            : defaultSessionTiers(form.ticketingMode, legacyTiers[0]),
      }
    }

    const capacity =
      index === 0
        ? legacyCapacity ?? DEFAULT_SESSION_CAPACITY
        : form.ticketSessions[0]?.capacity ?? legacyCapacity ?? DEFAULT_SESSION_CAPACITY

    const tiers =
      index === 0
        ? legacyTiers.map((t) => ({ ...t, quantity: null }))
        : defaultSessionTiers(form.ticketingMode, legacyTiers[0])

    return {
      occurrenceIndex: index,
      capacity,
      tiers,
      tiersLocked: index > 0 ? true : undefined,
    }
  })
}

/** Migrate legacy flat ticket fields into per-occurrence sessions. */
export function migrateTicketSessions(form: Partial<HostEventFormData>): TicketSession[] {
  const full = { ...form } as HostEventFormData
  if (form.ticketSessions?.length) {
    return syncTicketSessions({ ...full, ticketSessions: form.ticketSessions })
  }
  return syncTicketSessions(full)
}

export function getSyncedTicketSessions(form: HostEventFormData): TicketSession[] {
  return applyLockedSessionSync(syncTicketSessions(form))
}

export function updateTicketSessionsInForm(
  form: HostEventFormData,
  sessions: TicketSession[],
): Partial<HostEventFormData> {
  const synced = sessions.map((s, i) => ({ ...s, occurrenceIndex: i }))
  const primary = synced[0]
  return {
    ticketSessions: synced,
    capacity: primary?.capacity ?? form.capacity,
    ticketTiers: primary?.tiers ?? form.ticketTiers,
    sellTicketsPerDay: synced.length > 1,
    advancedTicketSales: synced.length > 1,
  }
}

export function sessionTiersForMode(
  mode: TicketingMode,
  currentTiers: TicketTier[],
): TicketTier[] {
  return defaultSessionTiers(mode, currentTiers[0])
}

/** Validation helpers for create-event step 4. */
export function areTicketSessionsValid(form: HostEventFormData): boolean {
  const sessions = getSyncedTicketSessions(form)
  if (sessions.length === 0) return false

  if (form.ticketingMode === 'free_rsvp') {
    return sessions.every((s) => s.capacity != null && s.capacity > 0)
  }

  if (form.ticketingMode === 'sell' || form.ticketingMode === 'free_donation') {
    return sessions.every(
      (s) =>
        s.capacity != null &&
        s.capacity > 0 &&
        s.tiers.length > 0 &&
        s.tiers.every((t) => t.name.trim() !== ''),
    )
  }

  return true
}

/** Plain-English ticket summary for review step. */
export function formatTicketSummary(form: HostEventFormData): string[] {
  const sessions = getSyncedTicketSessions(form)
  const occurrences = getEffectiveOccurrences(form)
  const lines: string[] = []

  if (form.ticketingMode === 'external') {
    return ['External ticket link']
  }

  if (form.ticketingMode === 'free_rsvp') {
    if (sessions.length === 1) {
      const cap = sessions[0].capacity ?? '—'
      lines.push(`Free RSVP · capacity ${cap}`)
    } else {
      sessions.forEach((session, i) => {
        const label = occurrences[i]
          ? formatOccurrenceScheduleLabel(occurrences[i])
          : `Session ${i + 1}`
        lines.push(`${label}: RSVP · capacity ${session.capacity ?? '—'}`)
      })
    }
    return lines
  }

  if (form.ticketingMode === 'free_donation') {
    sessions.forEach((session, i) => {
      const label =
        sessions.length === 1
          ? 'All sessions'
          : occurrences[i]
            ? formatOccurrenceScheduleLabel(occurrences[i])
            : `Session ${i + 1}`
      const tierText = session.tiers
        .map((t) => {
          const price =
            t.priceCents === 0 ? 'free' : `$${(t.priceCents / 100).toFixed(t.priceCents % 100 === 0 ? 0 : 2)}`
          return `${t.name.trim() || 'Unnamed'} (${price})`
        })
        .join(', ')
      lines.push(`${label}: capacity ${session.capacity ?? '—'} · ${tierText}`)
    })
    return lines
  }

  if (form.ticketingMode === 'sell') {
    sessions.forEach((session, i) => {
      const label =
        sessions.length === 1
          ? 'Tickets'
          : occurrences[i]
            ? formatOccurrenceScheduleLabel(occurrences[i])
            : `Session ${i + 1}`
      const tierText = session.tiers
        .map((t) => {
          const price =
            t.priceCents === 0 ? 'free' : `$${(t.priceCents / 100).toFixed(t.priceCents % 100 === 0 ? 0 : 2)}`
          return `${t.name.trim() || 'Unnamed'} ${price}`
        })
        .join(', ')
      lines.push(`${label}: ${session.capacity ?? '—'} seats · ${tierText}`)
    })
  }

  return lines
}
