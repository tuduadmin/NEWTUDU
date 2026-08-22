import type { ReactNode } from 'react'
import { CreditCard, Wallet } from 'lucide-react'
import type { DoorPaymentMode } from '../../lib/eventDoorPayment'
import {
  doorPaymentAcceptsCard,
  doorPaymentAcceptsCash,
  doorPaymentFromFlags,
} from '../../lib/eventDoorPayment'
import { FieldHelper, FieldLabel } from './CreateEventLayout'

type EventDoorPaymentPickerProps = {
  doorPayment: DoorPaymentMode
  atmOnSite: boolean
  onChange: (partial: { doorPayment: DoorPaymentMode; atmOnSite: boolean }) => void
}

export default function EventDoorPaymentPicker({
  doorPayment,
  atmOnSite,
  onChange,
}: EventDoorPaymentPickerProps) {
  const cashAccepted = doorPaymentAcceptsCash(doorPayment)
  const cardAccepted = doorPaymentAcceptsCard(doorPayment)

  function toggleCash() {
    const next = doorPaymentFromFlags(!cashAccepted, cardAccepted)
    onChange({
      doorPayment: next,
      atmOnSite: next === 'cash' || next === 'both' ? atmOnSite : false,
    })
  }

  function toggleCard() {
    const next = doorPaymentFromFlags(cashAccepted, !cardAccepted)
    onChange({ doorPayment: next, atmOnSite })
  }

  function toggleAtm() {
    onChange({ doorPayment, atmOnSite: !atmOnSite })
  }

  return (
    <div className="mt-5">
      <FieldLabel>Payment at the door</FieldLabel>
      <FieldHelper className="mb-2">
        Optional — how guests can pay on site for food, drinks, or extras
      </FieldHelper>
      <div className="grid grid-cols-2 gap-2">
        <PaymentOption
          label="Card / tap"
          icon={<CreditCard size={16} className="shrink-0 text-orange" aria-hidden />}
          checked={cardAccepted}
          onChange={toggleCard}
        />
        <PaymentOption
          label="Cash"
          icon={<Wallet size={16} className="shrink-0 text-orange" aria-hidden />}
          checked={cashAccepted}
          onChange={toggleCash}
        />
      </div>
      {cashAccepted && (
        <label
          className={`mt-2 flex cursor-pointer items-center justify-between rounded-[14px] border px-3 py-2.5 transition ${
            atmOnSite ? 'border-orange/40 bg-orange/5' : 'border-brown/10 bg-white'
          }`}
        >
          <span className="text-xs font-medium text-brown">ATM on site</span>
          <input
            type="checkbox"
            checked={atmOnSite}
            onChange={toggleAtm}
            className="h-4 w-4 rounded accent-orange"
          />
        </label>
      )}
    </div>
  )
}

function PaymentOption({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string
  icon: ReactNode
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-[14px] border px-3 py-2.5 transition ${
        checked ? 'border-orange/40 bg-orange/5' : 'border-brown/10 bg-white'
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-brown">
        {icon}
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-orange" />
    </label>
  )
}
