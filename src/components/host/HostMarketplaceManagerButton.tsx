import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

type HostMarketplaceManagerButtonProps = {
  enabled: boolean
  prominent?: boolean
}

/** Event Manager CTA — host sales & inventory hub (not the buyer shop). */
export default function HostMarketplaceManagerButton({
  enabled,
  prominent = false,
}: HostMarketplaceManagerButtonProps) {
  const baseClass = prominent
    ? 'flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-sm font-bold uppercase tracking-wide shadow-sm transition no-underline'
    : 'flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition no-underline'

  const activeClass = prominent
    ? 'border-2 border-orange bg-gradient-to-r from-orange/15 to-amber-400/20 text-brown hover:from-orange/25 hover:to-amber-400/30'
    : 'border border-orange/35 bg-orange/10 text-brown hover:border-orange/50 hover:bg-orange/15'

  const pendingClass = prominent
    ? 'border-2 border-orange/40 bg-gradient-to-r from-orange/10 to-amber-400/10 text-brown'
    : 'border border-orange/30 bg-orange/5 text-brown'

  if (!enabled) {
    return (
      <div className={prominent ? 'mt-4 w-full' : 'mt-4'}>
        <button
          type="button"
          disabled
          title="Marketplace is off for this host or platform-wide"
          className={`${baseClass} ${pendingClass} cursor-not-allowed opacity-60`}
        >
          <ShoppingBag size={18} aria-hidden />
          <span>Marketplace</span>
          <span className="ml-1 text-[10px] font-semibold normal-case tracking-normal text-brown-muted">
            · Off
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={prominent ? 'mt-4 w-full' : 'mt-4'}>
      <Link to="/host/marketplace" className={`${baseClass} ${activeClass}`}>
        <ShoppingBag size={18} aria-hidden />
        Marketplace manager
      </Link>
      {prominent && (
        <p className="mt-1.5 text-center text-[10px] text-brown-muted">
          Sales, inventory & fulfillment — not the public shop
        </p>
      )}
    </div>
  )
}
