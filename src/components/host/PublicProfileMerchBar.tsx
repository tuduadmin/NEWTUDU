import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import {
  canOpenHostMarketplace,
  openHostMarketplace,
} from '../../lib/eventMerch'

type PublicProfileMerchBarProps = {
  shopUrl?: string
  /** Larger CTA styling for Event Manager profile card. */
  prominent?: boolean
  hostKind?: 'personal' | 'org'
  hostId?: string
  showMerchShop?: boolean
}

export default function PublicProfileMerchBar({
  shopUrl,
  prominent = false,
  hostKind,
  hostId,
  showMerchShop = false,
}: PublicProfileMerchBarProps) {
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)

  const canOpen =
    hostKind && hostId
      ? canOpenHostMarketplace(hostKind, hostId, showMerchShop, shopUrl)
      : Boolean(shopUrl?.trim())

  const baseClass = prominent
    ? 'flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-sm font-bold uppercase tracking-wide shadow-sm transition'
    : 'flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition'

  const activeClass = prominent
    ? 'border-2 border-orange bg-gradient-to-r from-orange/15 to-amber-400/20 text-brown hover:from-orange/25 hover:to-amber-400/30'
    : 'border border-orange/35 bg-orange/10 text-brown hover:border-orange/50 hover:bg-orange/15'

  const pendingClass = prominent
    ? 'border-2 border-orange/40 bg-gradient-to-r from-orange/10 to-amber-400/10 text-brown'
    : 'border border-orange/30 bg-orange/5 text-brown'

  function handleClick() {
    if (hostKind && hostId && showMerchShop) {
      const opened = openHostMarketplace(navigate, hostKind, hostId, shopUrl)
      if (!opened) {
        setToast('No marketplace yet — create an upcoming event or add a shop URL.')
        window.setTimeout(() => setToast(null), 3200)
      }
      return
    }

    const href = shopUrl?.trim()
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={prominent ? 'mt-4 w-full' : 'mt-4'}>
      {toast && (
        <p className="mb-2 rounded-[14px] border border-orange/20 bg-orange/5 px-3 py-2 text-center text-xs font-medium text-brown">
          {toast}
        </p>
      )}

      {canOpen ? (
        <button
          type="button"
          onClick={handleClick}
          className={`${baseClass} ${activeClass} cursor-pointer`}
        >
          <ShoppingBag size={18} aria-hidden />
          Marketplace
        </button>
      ) : (
        <button
          type="button"
          disabled
          title={
            showMerchShop
              ? 'Create an upcoming event to open the in-app marketplace'
              : 'Marketplace is off for this host or platform-wide'
          }
          className={`${baseClass} ${pendingClass} cursor-not-allowed opacity-60`}
        >
          <ShoppingBag size={18} aria-hidden />
          <span>Marketplace</span>
          <span className="ml-1 text-[10px] font-semibold normal-case tracking-normal text-brown-muted">
            · Coming soon
          </span>
        </button>
      )}
    </div>
  )
}
