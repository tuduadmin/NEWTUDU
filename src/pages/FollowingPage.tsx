import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, Search, X } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import AvatarStoryRing from '../components/AvatarStoryRing'
import type { FollowableUser } from '../data/mockUsers'
import { MOCK_FOLLOWABLE_USERS } from '../data/mockUsers'

export default function FollowingPage() {
  const [query, setQuery] = useState('')
  const [following, setFollowing] = useState<Set<string>>(
    () => new Set(MOCK_FOLLOWABLE_USERS.filter((u) => u.following).map((u) => u.id)),
  )

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
    setFollowing((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-midnight text-white">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <div className="sticky top-[calc(52px+env(safe-area-inset-top))] z-10 glass-surface px-4 pb-4 pt-3">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20" aria-hidden />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-tagline">Now you know</p>
            <h1 className="font-display text-xl font-extrabold">Following</h1>
          </div>
          <Link
            to="/my-tudu"
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full glass-surface text-white/60 no-underline transition hover:text-white"
          >
            <X size={20} />
          </Link>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search organizers, friends & businesses..."
              className="w-full rounded-full border border-white/[0.08] bg-midnight-surface py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-magenta/40"
            />
          </div>
          <button
            type="button"
            aria-label="Sort"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full glass-surface text-white/60 transition hover:text-white"
          >
            <ArrowUpDown size={18} />
          </button>
        </div>
      </div>

      <main className="space-y-3 px-4 pb-8 pt-2">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/48">
            {query ? 'No matches found.' : "You're not following anyone yet."}
          </p>
        ) : (
          filtered.map((user) => (
            <FollowingCard key={user.id} user={user} onUnfollow={() => handleUnfollow(user.id)} />
          ))
        )}

        <Link
          to="/search"
          className="mt-4 block text-center text-sm font-semibold text-sunset-orange no-underline transition hover:text-sunset-pink"
        >
          Discover more to follow →
        </Link>
      </main>
    </div>
  )
}

function FollowingCard({ user, onUnfollow }: { user: FollowableUser; onUnfollow: () => void }) {
  return (
    <article className="flex items-center gap-3 rounded-[var(--radius-lg)] glass-surface p-3">
      <AvatarStoryRing initials={user.initials} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold">{user.name}</p>
        <button
          type="button"
          onClick={onUnfollow}
          className="text-xs font-semibold text-sunset-orange transition hover:text-sunset-pink"
        >
          Unfollow
        </button>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full border border-magenta/30 px-4 py-1.5 text-sm font-semibold text-sunset-orange transition hover:bg-magenta/10"
      >
        View
      </button>
    </article>
  )
}
