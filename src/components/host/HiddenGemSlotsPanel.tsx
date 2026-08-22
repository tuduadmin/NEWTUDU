import { useMemo, useState } from 'react'
import { Gem } from 'lucide-react'
import {
  getHiddenGemSubscription,
  getOrganization,
  isHiddenGemSubscriptionActive,
  subscribeHiddenGemSlots,
} from '../../lib/account'
import {
  canCreateHiddenGem,
  cancelHiddenGemSubscriptionWithEnforcement,
  formatHiddenGemSlotCapacity,
} from '../../lib/hiddenGemSlots'
import {
  formatMoney,
  getAddonListPrices,
  getAddonPrices,
  isMicroTransactionEnabled,
  stubPurchaseMessage,
} from '../../lib/tierPricing'
import { getTierConfig } from '../../lib/tierConfig'
import { claimFoundingSlot } from '../../lib/foundingPricing'
import { FoundingSectionBanner } from './FoundingPriceTag'
import { HiddenGemInfoAndPreview } from './HiddenGemDeckPreviewSection'
import { useHostContext } from '../../hooks/useHostContext'
import Toast from '../Toast'
import HostCheckoutPlaceholder from './HostCheckoutPlaceholder'

const SUBSCRIPTION_PLANS = [
  {
    slots: 1,
    label: '1 Hidden Gem slot',
    price: (addons: ReturnType<typeof getAddonPrices>) => addons.hiddenGemSingle,
    listPrice: (list: ReturnType<typeof getAddonListPrices>) => list.hiddenGemSingle,
  },
  {
    slots: 2,
    label: '2 Hidden Gem slots',
    price: (addons: ReturnType<typeof getAddonPrices>) => addons.hiddenGem3Pack,
    listPrice: (list: ReturnType<typeof getAddonListPrices>) => list.hiddenGem3Pack,
  },
] as const

type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number]

function planDescription(plan: SubscriptionPlan): string {
  return plan.slots === 1
    ? 'One Hidden Gem deck slot — active while subscribed'
    : `${plan.slots} Hidden Gem deck slots — active while subscribed`
}

function planLineItemLabel(plan: SubscriptionPlan): string {
  return `${plan.slots} Hidden Gem slot${plan.slots === 1 ? '' : 's'} (monthly)`
}

export default function HiddenGemSlotsPanel() {
  const [refresh, setRefresh] = useState(0)
  void refresh

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { activeOrg, isPersonal } = useHostContext()
  const org = useMemo(() => {
    void refresh
    if (isPersonal || !activeOrg) return null
    return getOrganization(activeOrg.id) ?? activeOrg
  }, [refresh, isPersonal, activeOrg])
  const slotCheck = org ? canCreateHiddenGem(org.id) : null
  const subscription = org ? getHiddenGemSubscription(org) : undefined
  const subscriptionActive = org ? isHiddenGemSubscriptionActive(org) : false
  const addons = getAddonPrices()
  const listPrices = getAddonListPrices()
  const tierConfig = getTierConfig()
  const shopEnabled = isMicroTransactionEnabled('hiddenGems')

  function handleSubscribeClick(plan: SubscriptionPlan) {
    if (!org) return
    if (!shopEnabled) {
      alert(stubPurchaseMessage(plan.label))
      return
    }
    setSelectedPlan(plan)
    setCheckoutOpen(true)
  }

  function handleCompleteDemo() {
    if (!org || !selectedPlan) return
    const result = subscribeHiddenGemSlots(org.id, selectedPlan.slots)
    if (!result.ok) {
      setToast(result.error ?? 'Subscription could not be completed.')
      return
    }
    setRefresh((r) => r + 1)
    claimFoundingSlot('hiddenGem')
    setToast(
      `${selectedPlan.slots} Hidden Gem slot${selectedPlan.slots === 1 ? '' : 's'} — active while subscribed.`,
    )
  }

  function handleCancelSubscription() {
    if (!org) return
    const result = cancelHiddenGemSubscriptionWithEnforcement(org.id)
    if (!result.ok) {
      setToast(result.error ?? 'Could not cancel subscription.')
      return
    }
    setRefresh((r) => r + 1)
    setToast(
      result.message ??
        'Hidden Gem subscription cancelled. Purchased slots no longer apply to your deck limit.',
    )
  }

  function handleCloseCheckout() {
    setCheckoutOpen(false)
    setSelectedPlan(null)
  }

  const selectedPrice = selectedPlan ? selectedPlan.price(addons) : 0

  return (
    <>
      <section
        id="hidden-gems"
        className="mt-8 scroll-mt-24 rounded-[14px] border border-app-subtle bg-cream-dark p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-orange/10">
            <Gem size={18} className="text-orange" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-brown">Hidden Gems</h2>
            <p className="mt-1 text-xs text-brown-muted">
              Your org on Discover — deck card, hours, menu &amp; tickets
            </p>
          </div>
        </div>

        <div className="mt-4">
          <HiddenGemInfoAndPreview />
        </div>

        <div className="mt-6 border-t border-brown/10 pt-5">
          <h3 className="font-display text-sm font-bold text-brown">Listing slots</h3>
          <p className="mt-1 text-xs text-brown-muted">
            Trusted Host includes 1 slot · extra slots from {formatMoney(listPrices.hiddenGemSingle)}/mo
          </p>

          {isPersonal && (
            <p className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Switch to a Host Account to manage Hidden Gem slots.
            </p>
          )}

          {slotCheck && org && !isPersonal && (
            <div className="mt-4 space-y-2">
              <p className="rounded-[14px] border border-brown/10 bg-cream/40 px-3 py-2 text-xs text-brown-muted">
                {formatHiddenGemSlotCapacity(
                  slotCheck.used,
                  slotCheck.includedSlots,
                  slotCheck.purchasedSlots,
                  slotCheck.subscriptionActive,
                )}
              </p>
              {subscriptionActive && subscription && subscription.slotsPurchased > 0 && (
                <p className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  {subscription.slotsPurchased} Hidden Gem slot
                  {subscription.slotsPurchased === 1 ? '' : 's'} — active while subscribed
                  {slotCheck.includedSlots > 0 &&
                    ` (+ ${slotCheck.includedSlots} included with Trusted Host)`}
                </p>
              )}
            </div>
          )}

          {subscriptionActive && org && !isPersonal && (
            <button
              type="button"
              onClick={handleCancelSubscription}
              className="mt-4 w-full rounded-[14px] border border-brown/20 bg-cream/40 px-3 py-2.5 text-xs font-semibold text-brown-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-800"
            >
              Cancel subscription (demo — stop paying)
            </button>
          )}

          <div className="mt-4">
            <FoundingSectionBanner offer={tierConfig.addonFounding.hiddenGem} offerId="hiddenGem" compact />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const price = plan.price(addons)
              const listPrice = plan.listPrice(listPrices)
              return (
                <button
                  key={plan.slots}
                  type="button"
                  onClick={() => handleSubscribeClick(plan)}
                  disabled={isPersonal}
                  className="rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-3 text-left transition hover:border-orange/40 hover:bg-orange/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="font-display text-sm font-bold text-brown">{plan.label}</p>
                  <p className="mt-0.5 text-[10px] text-brown-muted">{planDescription(plan)}</p>
                  <p className="mt-2 text-sm font-bold text-purple">{formatMoney(price)}/mo</p>
                  {listPrice > price && (
                    <p className="text-[10px] text-brown-muted line-through">{formatMoney(listPrice)}/mo</p>
                  )}
                </button>
              )
            })}
          </div>

          {!shopEnabled && (
            <p className="mt-3 text-center text-[10px] text-brown-muted">Checkout coming soon.</p>
          )}
        </div>
      </section>

      {selectedPlan && (
        <HostCheckoutPlaceholder
          open={checkoutOpen}
          onClose={handleCloseCheckout}
          productName={planLineItemLabel(selectedPlan)}
          productDescription={planDescription(selectedPlan)}
          lineItems={[{ label: planLineItemLabel(selectedPlan), amount: selectedPrice }]}
          totalAmount={selectedPrice}
          demoEnabled={shopEnabled}
          onCompleteDemo={handleCompleteDemo}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
