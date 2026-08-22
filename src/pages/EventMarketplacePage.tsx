import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import { BackLink } from '../components/NavActionButtons'
import { getHostEventById } from '../lib/account'
import { getCurrentUser } from '../lib/auth'
import {
  MERCH_PLATFORM_FEE_CENTS,
  calcMerchPlatformFee,
  createMerchOrderWithValidation,
  firstAvailableMerchSize,
  formatMerchMoney,
  getMerchProductsForEvent,
  getMerchSizeAvailable,
  isMerchSizeSoldOut,
  sortMerchSizes,
  type MerchOrderLine,
  type MerchSize,
} from '../lib/eventMerch'
import { resolveTicketHolderName } from '../lib/ticketHolderName'

type CartLine = {
  productId: string
  productName: string
  size: MerchSize
  unitPriceCents: number
  quantity: number
}

function cartKey(productId: string, size: MerchSize): string {
  return `${productId}:${size}`
}

export default function EventMarketplacePage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const ticketId = searchParams.get('ticket') ?? undefined
  const navigate = useNavigate()
  const user = getCurrentUser()

  const event = eventId ? getHostEventById(eventId) : undefined
  const products = useMemo(() => getMerchProductsForEvent(eventId), [eventId])

  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [selectedSizes, setSelectedSizes] = useState<Record<string, MerchSize>>({})
  const [checkoutError, setCheckoutError] = useState('')

  const cartLines = Object.values(cart)
  const itemCount = cartLines.reduce((sum, l) => sum + l.quantity, 0)
  const subtotalCents = cartLines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0)
  const platformFeeCents = calcMerchPlatformFee(itemCount)
  const totalCents = subtotalCents + platformFeeCents

  function getSelectedSize(productId: string, product: (typeof products)[number]): MerchSize | undefined {
    const picked = selectedSizes[productId]
    if (picked && !isMerchSizeSoldOut(product, picked)) return picked
    return firstAvailableMerchSize(product)
  }

  function getCartQtyForSize(productId: string, size: MerchSize): number {
    return cart[cartKey(productId, size)]?.quantity ?? 0
  }

  function addToCart(productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const size = getSelectedSize(productId, product)
    if (!size || isMerchSizeSoldOut(product, size)) return

    const available = getMerchSizeAvailable(product, size)
    const inCart = getCartQtyForSize(productId, size)
    if (inCart >= available) return

    const key = cartKey(productId, size)
    setCart((prev) => {
      const existing = prev[key]
      return {
        ...prev,
        [key]: {
          productId,
          productName: product.name,
          size,
          unitPriceCents: product.priceCents,
          quantity: (existing?.quantity ?? 0) + 1,
        },
      }
    })
  }

  function adjustQty(productId: string, size: MerchSize, delta: number) {
    const product = products.find((p) => p.id === productId)
    const key = cartKey(productId, size)
    setCart((prev) => {
      const existing = prev[key]
      if (!existing) return prev
      const nextQty = existing.quantity + delta
      if (nextQty <= 0) {
        const { [key]: _, ...rest } = prev
        return rest
      }
      if (product) {
        const available = getMerchSizeAvailable(product, size)
        if (nextQty > available) return prev
      }
      return { ...prev, [key]: { ...existing, quantity: nextQty } }
    })
  }

  function handleCheckout() {
    setCheckoutError('')
    if (!user) {
      setCheckoutError('Sign in to pre-order merch.')
      return
    }
    if (cartLines.length === 0) {
      setCheckoutError('Add at least one item.')
      return
    }

    const lines: MerchOrderLine[] = cartLines.map((l) => ({
      productId: l.productId,
      productName: l.productName,
      size: l.size,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
    }))

    const result = createMerchOrderWithValidation({
      userEmail: user.email,
      eventId,
      ticketId,
      lines,
      holderName: resolveTicketHolderName(user.email),
    })

    if (!result.ok) {
      setCheckoutError(result.error)
      return
    }

    navigate(`/my-tudu/pickups/${result.order.id}`)
  }

  if (!event) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar />
        <main className="px-4 pt-10 text-center">
          <h1 className="font-display text-xl font-bold text-brown">Event not found</h1>
          <BackLink to="/discover" className="mt-4 text-orange">
            Browse events
          </BackLink>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-36">
      <AppHeaderBar />

      <main className="px-4 pt-2">
        <BackLink to={ticketId ? '/my-tudu' : '/discover'}>Back</BackLink>

        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-orange/10 text-orange">
            <ShoppingBag size={22} aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-orange">Event Marketplace</p>
            <h1 className="font-display text-xl font-extrabold text-brown">{event.title}</h1>
            <p className="mt-1 text-xs text-brown-muted">
              Pre-order merch with your ticket — pick up from the shelf at the event. Separate pickup QR
              from your entry ticket.
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="mt-6 rounded-[14px] border border-brown/10 bg-white p-5 text-center text-sm text-brown-muted">
            No merch listed for this event yet.
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {products.map((product) => {
              const selectedSize = getSelectedSize(product.id, product)
              const allSoldOut = !firstAvailableMerchSize(product)

              return (
              <li
                key={product.id}
                className="overflow-hidden rounded-[14px] border border-brown/10 bg-white shadow-sm"
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-bold text-brown">{product.name}</h2>
                      {product.description && (
                        <p className="mt-1 text-xs text-brown-muted">{product.description}</p>
                      )}
                    </div>
                    <p className="shrink-0 font-display text-lg font-extrabold text-brown">
                      {formatMerchMoney(product.priceCents)}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Size</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {sortMerchSizes(product.sizes).map((size) => {
                        const available = getMerchSizeAvailable(product, size)
                        const soldOut = available <= 0
                        const selected = selectedSize === size
                        return (
                        <button
                          key={size}
                          type="button"
                          disabled={soldOut}
                          onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: size }))}
                          className={`rounded-[10px] border px-2.5 py-1 text-xs font-semibold transition ${
                            soldOut
                              ? 'cursor-not-allowed border-brown/10 bg-cream-dark text-brown-muted opacity-60'
                              : selected
                                ? 'border-orange bg-orange/10 text-orange'
                                : 'border-brown/15 text-brown-muted hover:border-orange/30'
                          }`}
                        >
                          {size}
                          <span className="ml-1 tabular-nums opacity-80">
                            {soldOut ? '· Sold out' : `· ${available}`}
                          </span>
                        </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(product.id)}
                    disabled={allSoldOut || !selectedSize}
                    className="mt-3 w-full rounded-[14px] border border-orange/30 bg-orange/5 py-2.5 text-sm font-bold text-brown transition hover:bg-orange/10 disabled:cursor-not-allowed disabled:border-brown/10 disabled:bg-cream-dark disabled:text-brown-muted disabled:opacity-60"
                  >
                    {allSoldOut ? 'Sold out' : 'Add to order'}
                  </button>
                </div>
              </li>
              )
            })}
          </ul>
        )}

        {cartLines.length > 0 && (
          <section className="mt-6 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
            <h2 className="font-display text-sm font-bold text-brown">Your pre-order</h2>
            <ul className="mt-3 space-y-2">
              {cartLines.map((line) => (
                <li
                  key={cartKey(line.productId, line.size)}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 text-brown">
                    {line.productName}{' '}
                    <span className="text-brown-muted">· {line.size}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustQty(line.productId, line.size, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-brown/15"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-4 text-center font-semibold tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => adjustQty(line.productId, line.size, 1)}
                      disabled={
                        (() => {
                          const product = products.find((p) => p.id === line.productId)
                          if (!product) return true
                          return line.quantity >= getMerchSizeAvailable(product, line.size)
                        })()
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-brown/15 disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                    <span className="w-14 text-right font-semibold tabular-nums">
                      {formatMerchMoney(line.unitPriceCents * line.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 space-y-1 border-t border-brown/10 pt-3 text-xs text-brown-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMerchMoney(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>TUDU fee ({itemCount} × {formatMerchMoney(MERCH_PLATFORM_FEE_CENTS)})</span>
                <span>{formatMerchMoney(platformFeeCents)}</span>
              </div>
              <div className="flex justify-between font-display text-sm font-bold text-brown">
                <span>Total</span>
                <span>{formatMerchMoney(totalCents)}</span>
              </div>
            </div>

            <p className="mt-2 text-[10px] text-brown-muted">
              Demo checkout — no payment collected. TUDU charges {formatMerchMoney(MERCH_PLATFORM_FEE_CENTS)}{' '}
              per item, not per transaction.
            </p>

            {!user && (
              <p className="mt-2 text-xs text-brown-muted">
                <Link to="/signin" className="font-semibold text-orange no-underline">
                  Sign in
                </Link>{' '}
                to complete your merch pre-order.
              </p>
            )}

            {checkoutError && (
              <p className="mt-2 text-sm font-semibold text-maroon">{checkoutError}</p>
            )}

            <GradientButton
              type="button"
              fullWidth
              className="mt-3 py-3"
              onClick={handleCheckout}
              disabled={!user}
            >
              Place pre-order · get pickup QR
            </GradientButton>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
