import { Link, useLocation } from 'react-router-dom'

export type MyTuduWalletTab = 'tickets' | 'merch'

function tabClass(active: boolean): string {
  return `flex-1 rounded-[12px] py-2 text-center text-xs font-bold transition ${
    active ? 'bg-white text-brown shadow-sm' : 'text-brown-muted hover:text-brown'
  }`
}

type MyTuduWalletTabBarProps = {
  showMerchTab: boolean
}

export default function MyTuduWalletTabBar({ showMerchTab }: MyTuduWalletTabBarProps) {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const walletTab: MyTuduWalletTab =
    showMerchTab && params.get('wallet') === 'merch' ? 'merch' : 'tickets'

  return (
    <nav
      className="mt-2 flex gap-1 rounded-[14px] border border-app-subtle bg-cream-dark/50 p-1"
      aria-label="Wallet sections"
    >
      <Link
        to="/my-tudu"
        className={`no-underline ${tabClass(walletTab === 'tickets')}`}
      >
        Tickets
      </Link>
      {showMerchTab && (
        <Link
          to="/my-tudu?wallet=merch"
          className={`no-underline ${tabClass(walletTab === 'merch')}`}
        >
          Merch
        </Link>
      )}
    </nav>
  )
}

export function isMyTuduMerchWalletTab(search: string, showMerchTab: boolean): boolean {
  if (!showMerchTab) return false
  return new URLSearchParams(search).get('wallet') === 'merch'
}
