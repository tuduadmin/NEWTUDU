import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, Search, X } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import AvatarStoryRing from '../components/AvatarStoryRing'
import { getCurrentUser } from '../lib/auth'
import type { FollowableUser } from '../data/mockUsers'
import { MOCK_FOLLOWABLE_USERS } from '../data/mockUsers'
import { getFollowedUserIds, toggleFollowUser } from '../lib/userFollows'

export default function FollowingPage() {
  const user = getCurrentUser()
  const [refresh, setRefresh] = useState(0)
  const [query, setQuery] = useState('')

  const following = useMemo(() => {
    void refresh
    return new Set(user ? getFollowedUserIds(user.email) : [])
  }, [user, refresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = MOCK_FOLLOWABLE_USERS.filter((u) => following.has(u.id))
    if (!q) return list
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.type.includes(q) ||
        (u.location?.toLowerCase().includes(q) ?? false),
    )
  }, [query, following])

  function handleUnfollow(id: string) {
    if (!user) return
    toggleFollowUser(id, user.email)
    setRefresh((n) => n + 1)
  }

  return (
    <div className="app-page-shell">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <div className="sticky top-[calc(52px+env(safe-area-inset-top))] z-10 border-b border-brown/10 bg-cream px-4 pb-4 pt-3">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-brown/15" aria-hidden />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-tagline">Now you know</p>
            <h1 className="font-display text-xl font-extrabold text-brown">Following</h1>
          </div>
          <Link
            to="/my-tudu"
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-brown/10 bg-white text-brown-muted no-underline transition hover:border-orange/30 hover:text-brown"
          >
            <X size={20} />
          </Link>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search organizers, friends & businesses..."
              className="w-full rounded-[14px] border border-brown/15 bg-white py-2.5 pl-9 pr-3 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </div>
          <button
            type="button"
            aria-label="Sort"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brown/10 bg-white text-brown-muted transition hover:border-orange/30 hover:text-brown"
          >
            <ArrowUpDown size={18} />
          </button>
        </div>
      </div>

      <main className="space-y-3 px-4 pb-8 pt-2">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-brown-muted">
            {query ? 'No matches found.' : "You're not following anyone yet."}
          </p>
        ) : (
          filtered.map((followedUser) => (
            <FollowingCard
              key={followedUser.id}
              user={followedUser}
              onUnfollow={() => handleUnfollow(followedUser.id)}
            />
          ))
        )}

        <Link
          to="/search"
          className="mt-4 block text-center text-sm font-semibold text-orange no-underline transition hover:text-orange/80"
        >
          Discover more to follow →
        </Link>
      </main>
    </div>
  )
}

function FollowingCard({ user, onUnfollow }: { user: FollowableUser; onUnfollow: () => void }) {
  return (
    <article className="flex items-center gap-3 rounded-[14px] border border-brown/10 bg-white p-3 shadow-sm">
      <AvatarStoryRing initials={user.initials} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold text-brown">{user.name}</p>
        <button
          type="button"
          onClick={onUnfollow}
          className="text-xs font-semibold text-orange transition hover:text-orange/80"
        >
          Unfollow
        </button>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-[14px] border border-brown/15 px-4 py-1.5 text-sm font-semibold text-orange transition hover:border-orange/30 hover:bg-orange/5"
      >
        View
      </button>
    </article>
  )
}
