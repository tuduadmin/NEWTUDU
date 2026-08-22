import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { ResolvedFollowedHost } from '../../lib/hostFollows'
import HostProfileAvatar from './HostProfileAvatar'

type FollowingListDrawerProps = {
  hosts: ResolvedFollowedHost[]
  onClose: () => void
}

export default function FollowingListDrawer({ hosts, onClose }: FollowingListDrawerProps) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/40"
        aria-label="Close following list"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="following-list-title"
        className="fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] left-1/2 z-[calc(var(--z-modal)+1)] max-h-[min(70vh,520px)] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 overflow-hidden rounded-[14px] border border-brown/10 bg-cream shadow-float"
      >
        <div className="flex items-center justify-between border-b border-brown/10 px-4 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brown-muted">Following</p>
            <h2 id="following-list-title" className="font-display text-lg font-bold text-brown">
              Hosts you follow
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-brown-muted transition hover:bg-brown/5 hover:text-brown"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="max-h-[min(52vh,420px)] overflow-y-auto px-3 py-2">
          {hosts.length === 0 ? (
            <li className="px-2 py-10 text-center text-sm text-brown-muted">
              You are not following any hosts yet.
            </li>
          ) : (
            hosts.map((host) => (
              <li key={`${host.kind}:${host.id}`}>
                <Link
                  to={host.profileUrl}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-[14px] px-2 py-2.5 no-underline transition hover:bg-brown/5"
                >
                  <HostProfileAvatar name={host.displayName} avatarUrl={host.avatarUrl} size="md" />
                  <span className="min-w-0 flex-1 truncate font-display font-bold text-brown">
                    {host.displayName}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-orange">View â†’</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  )
}
