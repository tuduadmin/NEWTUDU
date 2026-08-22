import { Link } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import { formatMerchMoney, type MerchOrder } from '../../lib/eventMerch'

type TicketMerchPickupActionsProps = {
  orders: MerchOrder[]
  className?: string
}

/** Merch pickup entry points on the ticket detail screen — below entry QR, above trip assist. */
export default function TicketMerchPickupActions({
  orders,
  className = '',
}: TicketMerchPickupActionsProps) {
  if (orders.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-center text-[10px] font-bold uppercase tracking-wide text-brown-muted">
        Event marketplace
      </p>
      {orders.map((order) => {
        const pending = order.status === 'pending_pickup'
        return (
          <Link
            key={order.id}
            to={`/my-tudu/pickups/${order.id}`}
            className="ticket-surface-muted flex items-center gap-3 rounded-[14px] border border-orange/30 px-3 py-3 no-underline shadow-sm transition hover:border-orange/50 hover:bg-orange/[0.06]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-orange/10 text-orange">
              <Package size={20} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm font-bold text-brown">
                {pending ? 'Merch pickup QR' : 'Merch order info'}
              </span>
              <span className="mt-0.5 block text-xs text-brown-muted">
                {order.pickupNumber} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'} ·{' '}
                {formatMerchMoney(order.totalCents)}
              </span>
              <span
                className={`mt-1 inline-flex rounded-[8px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                  pending ? 'bg-orange/10 text-orange' : 'bg-white/10 text-brown-muted'
                }`}
              >
                {pending ? 'Show at merch shelf' : 'Picked up'}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-brown-muted" aria-hidden />
          </Link>
        )
      })}
    </div>
  )
}
