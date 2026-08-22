import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { EventSlotBudget } from '../../lib/eventSlotBudget'
import { HOST_EVENT_SLOTS_HREF } from '../../lib/eventSlots'
import { getVerifyPhoneUrl } from '../../lib/verifyPhoneNav'
import GradientButton from '../GradientButton'

type PublishSlotBlockSheetProps = {
  open: boolean
  message: string
  budget: EventSlotBudget
  onClose: () => void
  onEditSchedule: () => void
  onSaveDraft: () => void
}

const outlineClass =
  'flex w-full items-center justify-center rounded-[14px] border border-app-subtle bg-app-elevated py-2.5 text-sm font-semibold text-brown transition hover:border-orange/35 hover:bg-orange/5'

export default function PublishSlotBlockSheet({
  open,
  message,
  budget,
  onClose,
  onEditSchedule,
  onSaveDraft,
}: PublishSlotBlockSheetProps) {
  if (!open) return null

  const slotsLabel = budget.kind === 'private' ? 'private slots' : 'public slots'
  const remaining = Math.max(0, budget.limit - budget.used)

  return (
    <div className="fixed inset-0 z-[var(--z-modal,60)] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-block-title"
        className="install-app-sheet relative z-10 w-full max-w-sm rounded-[14px] border border-app-subtle bg-app-elevated p-5 shadow-xl"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 id="slot-block-title" className="font-display text-base font-extrabold text-brown">
            Not enough event slots
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brown-muted transition hover:bg-orange/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-brown-muted">{message}</p>

        <p className="mt-3 rounded-[14px] border border-maroon/25 bg-maroon/5 px-3 py-2 text-center text-sm font-semibold text-maroon">
          {budget.projected}/{budget.limit} {slotsLabel} · {remaining} remaining
        </p>

        <div className="mt-4 space-y-2">
          <GradientButton type="button" fullWidth className="rounded-[14px] py-2.5 text-sm" onClick={onEditSchedule}>
            Edit schedule
          </GradientButton>
          {budget.showVerify && (
            <Link to={getVerifyPhoneUrl('/host/create-event')} className={`${outlineClass} no-underline`}>
              Verify phone
            </Link>
          )}
          {budget.canBuyMore && (
            <Link to={HOST_EVENT_SLOTS_HREF} className={`${outlineClass} no-underline text-orange`}>
              Buy event slots
            </Link>
          )}
          <button type="button" onClick={onSaveDraft} className={outlineClass}>
            Save as draft for later
          </button>
        </div>
      </div>
    </div>
  )
}
