import { getAccount } from './account'
import { receiveInboundAdminMessage } from './adminMessages'
import { allocateSupportTicketNumber } from './supportTicketIds'

const STORAGE_KEY = 'tudu-account-deletion-requests'

export const ACCOUNT_DELETION_REASONS = [
  {
    id: 'not_using',
    label: "I'm not using TUDU anymore",
  },
  {
    id: 'hard_to_find',
    label: 'I had trouble finding events I like',
  },
  {
    id: 'privacy',
    label: 'Privacy or data concerns',
  },
  {
    id: 'notifications',
    label: 'Too many notifications or emails',
  },
  {
    id: 'other',
    label: 'Other reason',
  },
] as const

export type AccountDeletionReasonId = (typeof ACCOUNT_DELETION_REASONS)[number]['id']

export interface AccountDeletionRequest {
  id: string
  ticketNumber: string
  userEmail: string
  reasonId: AccountDeletionReasonId
  reasonLabel: string
  otherDetail?: string
  createdAt: string
}

function generateId(): string {
  return `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readItems(): AccountDeletionRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AccountDeletionRequest[]) : []
  } catch {
    return []
  }
}

function saveItems(items: AccountDeletionRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tudu-account-deletion-changed'))
  }
}

export function getAccountDeletionReasonLabel(reasonId: AccountDeletionReasonId): string {
  return ACCOUNT_DELETION_REASONS.find((reason) => reason.id === reasonId)?.label ?? reasonId
}

export function getAccountDeletionRequests(): AccountDeletionRequest[] {
  return readItems().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function recordAccountDeletionRequest(input: {
  userEmail: string
  reasonId: AccountDeletionReasonId
  otherDetail?: string
}): AccountDeletionRequest {
  const ticketNumber = allocateSupportTicketNumber('delete')
  const otherDetail = input.otherDetail?.trim()
  const reasonLabel =
    input.reasonId === 'other' && otherDetail
      ? `Other: ${otherDetail}`
      : getAccountDeletionReasonLabel(input.reasonId)
  const account = getAccount(input.userEmail)
  const displayName = account
    ? [account.firstName, account.lastName].filter(Boolean).join(' ').trim() || input.userEmail
    : input.userEmail

  const request: AccountDeletionRequest = {
    id: generateId(),
    ticketNumber,
    userEmail: input.userEmail,
    reasonId: input.reasonId,
    reasonLabel,
    otherDetail: otherDetail || undefined,
    createdAt: new Date().toISOString(),
  }

  const items = readItems()
  items.unshift(request)
  saveItems(items)

  const bodyLines = [
    `Reference: ${ticketNumber}`,
    `User: ${displayName} (${input.userEmail})`,
    `Reason: ${getAccountDeletionReasonLabel(input.reasonId)}`,
  ]
  if (otherDetail) {
    bodyLines.push(`Details: ${otherDetail}`)
  }
  bodyLines.push('', 'The user confirmed permanent account deletion from App Settings.')

  receiveInboundAdminMessage({
    fromEmail: input.userEmail,
    subject: `${ticketNumber} · Account deletion request`,
    body: bodyLines.join('\n'),
    ticketNumber,
  })

  return request
}
