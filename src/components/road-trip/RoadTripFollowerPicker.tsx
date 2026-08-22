import { UserPlus } from 'lucide-react'
import { useMemo } from 'react'
import { getFollowedUsers, resolveTaggedFollowers } from '../../lib/userFollows'
import { getCurrentUser } from '../../lib/auth'

type RoadTripFollowerPickerProps = {
  taggedFollowerIds: string[]
  onChange: (ids: string[]) => void
}

export default function RoadTripFollowerPicker({
  taggedFollowerIds,
  onChange,
}: RoadTripFollowerPickerProps) {
  const user = getCurrentUser()
  const followed = useMemo(() => (user ? getFollowedUsers(user.email) : []), [user?.email])
  const tagged = resolveTaggedFollowers(taggedFollowerIds)

  function toggle(userId: string) {
    onChange(
      taggedFollowerIds.includes(userId)
        ? taggedFollowerIds.filter((id) => id !== userId)
        : [...taggedFollowerIds, userId],
    )
  }

  if (!user) return null

  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brown-muted">
        <UserPlus size={14} />
        Tag people you follow
      </p>
      <p className="mt-1 text-[11px] text-brown-muted">
        They can follow this trip or add it to their own road trips.
      </p>

      {followed.length === 0 ? (
        <p className="mt-3 rounded-[14px] border border-dashed border-app-subtle bg-cream-dark/40 px-3 py-4 text-center text-xs text-brown-muted">
          You&apos;re not following anyone yet.{' '}
          <a href="/following" className="font-semibold text-orange no-underline">
            Find people to follow
          </a>
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {followed.map((person) => {
            const selected = taggedFollowerIds.includes(person.id)
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => toggle(person.id)}
                className={`inline-flex items-center gap-2 rounded-[14px] border px-2.5 py-1.5 text-left transition ${
                  selected
                    ? 'border-orange bg-orange/10 text-brown'
                    : 'border-app-subtle bg-app-elevated text-brown-muted hover:border-orange/30'
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: person.avatarColor }}
                >
                  {person.initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold">{person.name}</span>
                  <span className="block text-[10px] capitalize text-brown-muted">{person.type}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {tagged.length > 0 && (
        <p className="mt-2 text-[11px] text-brown-muted">
          Tagged: {tagged.map((p) => p.name).join(', ')}
        </p>
      )}
    </div>
  )
}
