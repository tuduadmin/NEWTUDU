/** Parse raw QR / manual input into ticket or merch pickup identifiers. */

export type ParsedMerchScan = {
  kind: 'merch_pickup'
  pickupNumber?: string
  orderId?: string
}

export type ParsedTicketScan = {
  kind: 'ticket'
  ticketId: string
}

export function parseMerchScanInput(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed) as ParsedMerchScan & { type?: string }
    if (parsed.type === 'merch_pickup') {
      return parsed.pickupNumber ?? parsed.orderId ?? trimmed
    }
  } catch {
    // plain pickup number or order id
  }
  return trimmed
}

export function parseTicketScanInput(raw: string): ParsedTicketScan | { kind: 'event_link' } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    if (trimmed.startsWith(origin) && /\/event\/[^/]+\/rsvp/.test(trimmed)) {
      return { kind: 'event_link' }
    }
  }

  const paperMatch = trimmed.match(/\/ticket\/paper\/([^/?#]+)/i)
  if (paperMatch?.[1]) {
    return { kind: 'ticket', ticketId: decodeURIComponent(paperMatch[1]) }
  }

  try {
    const parsed = JSON.parse(trimmed) as { ticketId?: string; eventId?: string }
    if (parsed.ticketId) {
      return { kind: 'ticket', ticketId: parsed.ticketId }
    }
  } catch {
    // not JSON
  }

  if (/^tkt_/i.test(trimmed)) {
    return { kind: 'ticket', ticketId: trimmed }
  }

  return { kind: 'ticket', ticketId: trimmed }
}
