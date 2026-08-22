import type { AdminMessage, DeliveryChannel } from '../../lib/adminMessages'

const CHANNEL_LABELS: Record<DeliveryChannel, string> = {
  email: 'Email',
  sms: 'SMS',
  in_app: 'In-app',
}

function statusGlyph(status: 'sent' | 'failed' | 'skipped' | undefined): string {
  if (status === 'sent') return '✓'
  if (status === 'failed') return '✗'
  if (status === 'skipped') return '—'
  return '?'
}

function statusClass(status: 'sent' | 'failed' | 'skipped' | undefined): string {
  if (status === 'sent') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'failed') return 'border-red-500/30 bg-red-500/10 text-red-300'
  if (status === 'skipped') return 'border-[var(--admin-border)] bg-white/[0.03] text-[var(--admin-text-dim)]'
  return 'border-[var(--admin-border)] text-[var(--admin-text-muted)]'
}

type DeliveryChannelBadgesProps = {
  message: AdminMessage
}

export default function DeliveryChannelBadges({ message }: DeliveryChannelBadgesProps) {
  const channels = message.deliveryChannels
  if (!channels || channels.length === 0 || message.direction !== 'outbound') return null

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {channels.map((channel) => {
        const status = message.deliveryStatus?.[channel]
        const error = message.deliveryErrors?.[channel]
        const title = error
          ? `${CHANNEL_LABELS[channel]}: ${status} — ${error}`
          : `${CHANNEL_LABELS[channel]}: ${status ?? 'pending'}`
        return (
          <span
            key={channel}
            title={title}
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium border ${statusClass(status)}`}
          >
            {CHANNEL_LABELS[channel]} {statusGlyph(status)}
          </span>
        )
      })}
    </div>
  )
}
