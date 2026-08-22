import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import {
  canCreatePublicEvent,
  getCurrentAccount,
  purchaseExtraEventSlots,
} from '../../lib/account'
import { formatPublicEventSlotCapacity } from '../../lib/eventSlots'
import { getVerifyPhoneUrl } from '../../lib/verifyPhoneNav'
import {
  formatMoney,
  getAddonPrices,
  isMicroTransactionEnabled,
  stubPurchaseMessage,
} from '../../lib/tierPricing'
import { claimFoundingSlot } from '../../lib/foundingPricing'
import Toast from '../Toast'
import HostCheckoutPlaceholder from './HostCheckoutPlaceholder'

const SLOT_PACKS = [
  { slots: 1, label: '+1 slot', price: (addons: ReturnType<typeof getAddonPrices>) => addons.extraEventSingle },
  { slots: 3, label: '+3 slots', price: (addons: ReturnType<typeof getAddonPrices>) => addons.extraEventSingle * 3 * 0.9 },
  { slots: 5, label: '+5 slots', price: (addons: ReturnType<typeof getAddonPrices>) => addons.extraEvent5Pack },
] as const

type SlotPack = (typeof SLOT_PACKS)[number]

function slotPackDescription(pack: SlotPack): string {
  return pack.slots === 1 ? 'One extra public event slot' : `${pack.slots} extra public event slots`
}

function slotPackLineItemLabel(pack: SlotPack): string {
  return pack.slots === 1 ? '+1 public event slot' : `+${pack.slots} public event slots`
}

type EventSlotsPanelProps = {
  className?: string
}

export default function EventSlotsPanel({ className = '' }: EventSlotsPanelProps) {
  const [refresh, setRefresh] = useState(0)
  void refresh

  const [selectedPack, setSelectedPack] = useState<SlotPack | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const account = getCurrentAccount()
  const publicCheck = account ? canCreatePublicEvent(account) : null
  const verified = account?.verificationStatus === 'phone_verified'
  const addons = getAddonPrices()
  const shopEnabled = isMicroTransactionEnabled('extraEvents')

  function handleBuyClick(pack: SlotPack) {
    if (!account) return
    if (!verified) return
    if (!shopEnabled) {
      alert(stubPurchaseMessage(pack.label))
      return
    }
    setSelectedPack(pack)
    setCheckoutOpen(true)
  }

  function handleCompleteDemo() {
    if (!account || !selectedPack) return
    const result = purchaseExtraEventSlots(account.email, selectedPack.slots)
    if (!result.ok) {
      setToast(result.error ?? 'Purchase could not be completed.')
      return
    }
    setRefresh((r) => r + 1)
    claimFoundingSlot('extraEvent')
    setToast(`Added ${selectedPack.slots} public event slot${selectedPack.slots === 1 ? '' : 's'} to your account.`)
  }

  function handleCloseCheckout() {
    setCheckoutOpen(false)
    setSelectedPack(null)
  }

  const selectedPrice = selectedPack ? selectedPack.price(addons) : 0

  return (
    <>
      <section
        id="event-slots"
        className={`scroll-mt-24 rounded-[14px] border border-app-subtle bg-cream-dark p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-orange/10">
            <CalendarPlus size={18} className="text-orange" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-brown">Extra public events</h2>
            <p className="mt-1 text-xs text-brown-muted">One-time slot packs — no tier change.</p>
          </div>
        </div>

        {account && publicCheck && (
          <p className="mt-4 rounded-[14px] border border-brown/10 bg-cream/40 px-3 py-2 text-xs text-brown-muted">
            {formatPublicEventSlotCapacity(
              account.publicEventCount,
              publicCheck.baseLimit,
              publicCheck.extraSlots,
            )}
          </p>
        )}

        {!verified ? (
          <div className="mt-4 rounded-[14px] border border-brown/10 bg-cream/40 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-brown">Verify phone to buy slots</p>
            <Link
              to={getVerifyPhoneUrl('/host/subscription')}
              className="mt-3 inline-flex text-sm font-bold text-orange no-underline hover:underline"
            >
              Verify phone →
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {SLOT_PACKS.map((pack) => {
                const price = pack.price(addons)
                return (
                  <button
                    key={pack.slots}
                    type="button"
                    onClick={() => handleBuyClick(pack)}
                    className="rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-3 text-left transition hover:border-orange/40 hover:bg-orange/5"
                  >
                    <p className="font-display text-sm font-bold text-brown">{pack.label}</p>
                    <p className="mt-0.5 text-[10px] text-brown-muted">
                      {pack.slots === 1 ? 'One-time slot' : `${pack.slots} public events`}
                    </p>
                    <p className="mt-2 text-sm font-bold text-purple">{formatMoney(price)}</p>
                  </button>
                )
              })}
            </div>

            {!shopEnabled && (
              <p className="mt-3 text-center text-[10px] text-brown-muted">Checkout coming soon.</p>
            )}
          </>
        )}
      </section>

      {selectedPack && (
        <HostCheckoutPlaceholder
          open={checkoutOpen}
          onClose={handleCloseCheckout}
          productName={slotPackLineItemLabel(selectedPack)}
          productDescription={slotPackDescription(selectedPack)}
          lineItems={[{ label: slotPackLineItemLabel(selectedPack), amount: selectedPrice }]}
          totalAmount={selectedPrice}
          demoEnabled={shopEnabled}
          onCompleteDemo={handleCompleteDemo}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
