import type { HostEvent } from '../lib/account'
import SharePublishModal from './SharePublishModal'

type ShareEventModalProps = {
  open: boolean
  event: HostEvent | null
  onClose: () => void
  publishedJustNow?: boolean
  defaultTab?: 'public' | 'private'
}

/** Host-facing share modal — wraps SharePublishModal with consumer styling. */
export default function ShareEventModal({
  open,
  event,
  onClose,
  publishedJustNow,
  defaultTab,
}: ShareEventModalProps) {
  return (
    <SharePublishModal
      open={open}
      event={event}
      onClose={onClose}
      variant="host"
      defaultTab={defaultTab ?? (event?.visibility === 'private' ? 'private' : 'public')}
      publishedJustNow={publishedJustNow}
    />
  )
}
