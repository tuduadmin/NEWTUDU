import type { EventChecklist, HostEvent } from './account'
import { getAccount } from './account'
import { getChecklistClaims, getChecklistResponse, getWhosBringingWhat } from './checklist'
import { getMerchStockReport, type MerchStockLine } from './eventMerch'
import { getEventGuests, type EventGuest } from './hostGuests'

export type EventContactRow = EventGuest & {
  phone?: string
  checklistNote?: string
}

export type ChecklistPickRow = {
  itemId: string
  label: string
  needed: number
  claimed: number
  remaining: number
  bringers: string[]
}

export function getEventMerchPickList(eventId: string): MerchStockLine[] {
  return getMerchStockReport(eventId).sort((a, b) =>
    a.productName.localeCompare(b.productName) || a.size.localeCompare(b.size),
  )
}

export function getEventChecklistPickList(
  eventId: string,
  checklist: EventChecklist | undefined,
): ChecklistPickRow[] {
  if (!checklist?.enabled || checklist.items.length === 0) return []

  const entries = getWhosBringingWhat(eventId, checklist.items)
  return entries.map((entry) => ({
    itemId: entry.itemId,
    label: entry.label,
    needed: entry.maxClaims,
    claimed: entry.claims.length,
    remaining: Math.max(0, entry.maxClaims - entry.claims.length),
    bringers: entry.claims.map((c) =>
      c.note?.trim() ? `${c.attendeeName} (${c.note.trim()})` : c.attendeeName,
    ),
  }))
}

export function getEventContactList(eventId: string, event?: HostEvent): EventContactRow[] {
  const guests = getEventGuests(eventId)
  return guests.map((guest) => {
    const account = guest.email ? getAccount(guest.email) : undefined
    const response =
      event?.checklist?.enabled && guest.email
        ? getChecklistResponse(eventId, guest.email)
        : undefined
    let checklistNote: string | undefined
    if (response) {
      if (response.skipped) checklistNote = 'Skipped checklist'
      else if (response.dietaryNote?.trim()) checklistNote = response.dietaryNote.trim()
      else if (response.selectedItemIds.length > 0 && event?.checklist) {
        const labels = response.selectedItemIds
          .map((id) => event.checklist!.items.find((i) => i.id === id)?.label)
          .filter(Boolean)
        checklistNote = labels.join(', ')
      }
    }
    const claimLabels = getChecklistClaims(eventId)
      .filter((c) => c.attendeeEmail.toLowerCase() === guest.email.toLowerCase())
      .map((c) => {
        const label = event?.checklist?.items.find((i) => i.id === c.itemId)?.label
        return label ? `${label}${c.note ? ` (${c.note})` : ''}` : c.attendeeName
      })
    if (claimLabels.length > 0) {
      checklistNote = [checklistNote, claimLabels.join('; ')].filter(Boolean).join(' · ')
    }

    return {
      ...guest,
      phone: account?.phone?.trim() || undefined,
      checklistNote,
    }
  })
}
