import { ChevronRightIcon, ShoppingBagIcon } from '@heroicons/react/24/solid'
import { getHostEventById } from '../../lib/account'
import { formatMerchMoney, type MerchOrder } from '../../lib/eventMerch'

type MerchPickupCardProps = {
  order: MerchOrder
  onClick: () => void
}

export default function MerchPickupCard({ order, onClick }: MerchPickupCardProps) {
  const event = getHostEventById(order.eventId)
  const pickedUp = order.status === 'picked_up'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left no-underline"
    >
      <div className="ticket-surface ticket-stub-card overflow-hidden rounded-[14px] border border-orange/35 shadow-sm transition group-hover:border-orange/50 group-hover:shadow-md group-active:scale-[0.99]">
        <div className="flex items-stretch gap-0">
          <div className="ticket-surface-muted flex w-[72px] shrink-0 flex-col items-center justify-center border-r border-dashed border-white/10 px-2 py-4">
            <ShoppingBagIcon className="h-6 w-6 text-orange" aria-hidden />
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wide text-brown-muted">
              Pickup
            </span>
          </div>

          <div className="min-w-0 flex-1 px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-extrabold text-brown">
                  {event?.title ?? 'Event merch'}
                </p>
                <p className="mt-1 text-xs text-brown-muted">
                  {order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {formatMerchMoney(order.totalCents)}
                </p>
                <p className="mt-1.5 font-mono text-[10px] tracking-wider text-brown-muted">
                  {order.pickupNumber}
                </p>
              </div>
              <ChevronRightIcon
                className="mt-0.5 h-5 w-5 shrink-0 text-brown-muted/50 transition group-hover:text-orange"
                aria-hidden
              />
            </div>
            <p
              className={`mt-2 inline-flex rounded-[10px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                pickedUp
                  ? 'bg-success/15 text-success-deep'
                  : 'bg-orange/10 text-orange'
              }`}
            >
              {pickedUp ? 'Picked up' : 'Show QR at shelf'}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}
