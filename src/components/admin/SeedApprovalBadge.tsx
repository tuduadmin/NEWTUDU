import { AdminBadge } from './AdminUI'
import { getSeedQueueStage, isSeedDraftArchived, type HostEvent } from '../../lib/account'

export function SeedApprovalBadge({ event }: { event: HostEvent }) {
  const stage = getSeedQueueStage(event)
  if (!stage) return null

  if (stage === 'draft' && isSeedDraftArchived(event)) {
    return <AdminBadge tone="neutral">Draft archive</AdminBadge>
  }

  switch (stage) {
    case 'draft':
      return <AdminBadge tone="neutral">Draft</AdminBadge>
    case 'pending_review':
      return <AdminBadge tone="amber">Pending review</AdminBadge>
    case 'accepted':
      return <AdminBadge tone="cyan">Accepted</AdminBadge>
    case 'rejected':
      return <AdminBadge tone="rose">Declined</AdminBadge>
    default:
      return null
  }
}

export function seedApprovalMenuItems(
  event: HostEvent,
  onApprove: () => void,
  onReject: () => void,
  onSubmitForReview?: () => void,
): { label: string; onClick: () => void; danger?: boolean }[] {
  const stage = getSeedQueueStage(event)
  if (!stage || stage === 'accepted' || stage === 'rejected') return []

  if (stage === 'draft') {
    if (isSeedDraftArchived(event)) {
      const items: { label: string; onClick: () => void; danger?: boolean }[] = []
      if (onSubmitForReview) {
        items.push({ label: 'Send to host again', onClick: onSubmitForReview })
      }
      return items
    }
    return onSubmitForReview
      ? [{ label: 'Send to host for review', onClick: onSubmitForReview }]
      : []
  }

  return [
    { label: 'Approve (admin)', onClick: onApprove },
    { label: 'Decline', onClick: onReject, danger: true },
  ]
}
