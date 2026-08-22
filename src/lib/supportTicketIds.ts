const SEQ_KEY_PREFIX = 'tudu-support-ticket-seq-'

export type SupportTicketCategory = 'report' | 'feedback' | 'security' | 'safety' | 'delete'

const PREFIX: Record<SupportTicketCategory, string> = {
  report: 'RPT',
  feedback: 'FBK',
  security: 'SEC',
  safety: 'SAF',
  delete: 'DEL',
}

export const SUPPORT_TICKET_LABELS: Record<SupportTicketCategory, string> = {
  report: 'Report',
  feedback: 'Feedback',
  security: 'Security',
  safety: 'Safety',
  delete: 'Account deletion',
}

function readSeq(category: SupportTicketCategory): number {
  try {
    const raw = localStorage.getItem(`${SEQ_KEY_PREFIX}${category}`)
    const parsed = raw ? parseInt(raw, 10) : 0
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

function writeSeq(category: SupportTicketCategory, seq: number): void {
  localStorage.setItem(`${SEQ_KEY_PREFIX}${category}`, String(seq))
}

export function formatSupportTicketNumber(category: SupportTicketCategory, seq: number): string {
  return `${PREFIX[category]}-${String(seq).padStart(6, '0')}`
}

export function parseSupportTicketNumber(
  ticketNumber: string,
): { category: SupportTicketCategory; seq: number } | null {
  const match = ticketNumber.match(/^(RPT|FBK|SEC|SAF|DEL)-(\d+)$/)
  if (!match) return null
  const prefix = match[1]
  const category = (
    Object.entries(PREFIX).find(([, value]) => value === prefix)?.[0] ?? null
  ) as SupportTicketCategory | null
  if (!category) return null
  const seq = parseInt(match[2], 10)
  if (!Number.isFinite(seq)) return null
  return { category, seq }
}

export function syncSupportTicketCounter(category: SupportTicketCategory, ticketNumber: string): void {
  const parsed = parseSupportTicketNumber(ticketNumber)
  if (!parsed || parsed.category !== category) return
  if (parsed.seq > readSeq(category)) {
    writeSeq(category, parsed.seq)
  }
}

export function allocateSupportTicketNumber(category: SupportTicketCategory): string {
  const next = readSeq(category) + 1
  writeSeq(category, next)
  return formatSupportTicketNumber(category, next)
}

/** Current highest issued sequence for a ticket category (SAF, RPT, etc.). */
export function getSupportTicketSequence(category: SupportTicketCategory): number {
  return readSeq(category)
}

export function getSafetyReportSequence(ticketNumber: string): number | null {
  const parsed = parseSupportTicketNumber(ticketNumber)
  if (!parsed || parsed.category !== 'safety') return null
  return parsed.seq
}

export function feedbackCategoryForType(type: 'report' | 'feedback'): SupportTicketCategory {
  return type === 'report' ? 'report' : 'feedback'
}

export const SAFETY_REPORT_REASONS = [
  'Safety concern',
  'Unsafe venue',
  'Harassment',
] as const

export type SafetyReportReason = (typeof SAFETY_REPORT_REASONS)[number]

export function isSafetyReportReason(reason: string): reason is SafetyReportReason {
  return (SAFETY_REPORT_REASONS as readonly string[]).includes(reason)
}

export function feedbackCategoryForReport(
  type: 'report' | 'feedback',
  reason: string,
): SupportTicketCategory {
  if (type === 'report' && isSafetyReportReason(reason)) return 'safety'
  return feedbackCategoryForType(type)
}
