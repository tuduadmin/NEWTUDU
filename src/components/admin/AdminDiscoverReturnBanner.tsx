import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type AdminDiscoverReturnBannerProps = {
  returnTo: string
}

/** Shown on Discover when an admin opened a user preview from Control Room. */
export default function AdminDiscoverReturnBanner({ returnTo }: AdminDiscoverReturnBannerProps) {
  return (
    <div
      className="sticky top-0 z-[calc(var(--z-header)+2)] border-b border-amber-500/35 bg-[#1a1208]/95 px-4 py-2.5 backdrop-blur-sm"
      role="status"
    >
      <div className="mx-auto flex max-w-lg flex-col items-center gap-0.5 text-center">
        <Link
          to={returnTo}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-200 no-underline hover:underline"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to Control Room
        </Link>
        <p className="text-[11px] text-amber-200/75">User preview — this is how the event appears on Discover</p>
      </div>
    </div>
  )
}
