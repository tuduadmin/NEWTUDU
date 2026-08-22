import { QRCodeSVG } from 'qrcode.react'
import { Package } from 'lucide-react'
import { getHostEventById } from '../../lib/account'
import {
  buildMerchPickupQrPayload,
  formatMerchMoney,
  getMerchOrderById,
  type MerchOrder,
} from '../../lib/eventMerch'

type MerchPickupDetailViewProps = {
  orderId: string
  userEmail: string
}

export default function MerchPickupDetailView({ orderId, userEmail }: MerchPickupDetailViewProps) {
  const order = getMerchOrderById(orderId)

  if (!order || order.userEmail.toLowerCase() !== userEmail.toLowerCase()) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="font-display text-sm font-bold text-brown">Pickup order not found</p>
      </div>
    )
  }

  const event = getHostEventById(order.eventId)
  const qrPayload = buildMerchPickupQrPayload(order)

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-6">
      <div className="ticket-surface ticket-detail-card overflow-hidden rounded-[14px] border shadow-lg">
        <div className="ticket-perforation h-3 w-full" aria-hidden />

        <div className="px-6 pt-6 pb-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brown-muted">
            Merch pickup
          </p>
          <h1 className="mt-2 font-display text-lg font-extrabold text-brown">
            {event?.title ?? 'Event merch'}
          </h1>
          <p className="mt-1 text-xs text-brown-muted">Scan at the merch shelf — not for event entry</p>
        </div>

        <div className="ticket-surface-muted mx-6 flex flex-col items-center rounded-[14px] border border-dashed border-orange/30 px-6 py-8">
          <QRCodeSVG
            value={qrPayload}
            size={220}
            level="M"
            includeMargin
            className="rounded-[14px] bg-white p-2"
          />
          <p className="mt-4 font-mono text-sm font-bold tracking-widest text-brown">
            {order.pickupNumber}
          </p>
          <p className="mt-3 text-sm font-semibold text-brown">{order.holderName}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
            Pickup name
          </p>
        </div>

        <div className="mt-4 space-y-2 px-6 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Your items</p>
          <ul className="space-y-2">
            {order.lines.map((line) => (
              <li
                key={`${line.productId}-${line.size}`}
                className="ticket-surface-muted flex items-center justify-between gap-2 rounded-[12px] border border-white/10 px-3 py-2 text-sm"
              >
                <span className="text-brown">
                  {line.productName} · {line.size}
                </span>
                <span className="font-semibold tabular-nums text-brown-muted">×{line.quantity}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-dashed border-white/10 pt-3 text-sm">
            <span className="text-brown-muted">Total paid (demo)</span>
            <span className="font-display font-bold text-brown">{formatMerchMoney(order.totalCents)}</span>
          </div>

          <div className="flex items-start gap-2 rounded-[12px] border border-white/8 bg-white/5 px-3 py-2.5 text-xs text-brown-muted">
            <Package size={16} className="mt-0.5 shrink-0 text-orange" aria-hidden />
            <p>
              Show this QR at the merch counter. Staff scan it, call out your pickup number, and hand you
              the items from the pre-stocked shelf.
            </p>
          </div>

          {order.status === 'picked_up' && order.pickedUpAt && (
            <p className="text-center text-xs font-semibold text-success-deep">
              Picked up {new Date(order.pickedUpAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="ticket-perforation h-3 w-full rotate-180" aria-hidden />
      </div>
    </div>
  )
}
