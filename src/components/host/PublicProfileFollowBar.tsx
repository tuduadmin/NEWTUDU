import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Users } from 'lucide-react'
import { getCurrentUser } from '../../lib/auth'
import {
  getFollowingCount,
  isFollowingHost,
  resolveViewerFollowing,
  toggleFollowHost,
} from '../../lib/hostFollows'
import FollowingListDrawer from './FollowingListDrawer'

type PublicProfileFollowBarProps = {
  hostKind: 'personal' | 'org'
  hostId: string
  embedded?: boolean
}

export default function PublicProfileFollowBar({
  hostKind,
  hostId,
  embedded = false,
}: PublicProfileFollowBarProps) {
  const viewer = getCurrentUser()
  const [following, setFollowing] = useState(() => isFollowingHost(hostKind, hostId))
  const [followingCount, setFollowingCount] = useState(() => getFollowingCount())
  const [showFollowingList, setShowFollowingList] = useState(false)
  const [signInPrompt, setSignInPrompt] = useState(false)

  function handleFollowToggle() {
    if (!viewer) {
      setSignInPrompt(true)
      return
    }

    const result = toggleFollowHost(hostKind, hostId, viewer.email)
    if (result.error) {
      setSignInPrompt(true)
      return
    }

    setFollowing(result.following)
    setFollowingCount(getFollowingCount(viewer.email))
    setSignInPrompt(false)
  }

  const followingList = viewer ? resolveViewerFollowing(viewer.email) : []

  return (
    <>
      <div className={`border-t border-brown/10 ${embedded ? 'mt-4 pt-4' : 'mt-5 pt-5'}`}>
        {signInPrompt && !viewer && (
          <p className="mb-3 rounded-[14px] border border-orange/20 bg-orange/5 px-3 py-2.5 text-sm text-brown">
            <Link to="/signin" className="font-semibold text-orange no-underline hover:underline">
              Sign in
            </Link>{' '}
            to follow this host and get updates in Discover.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleFollowToggle}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold transition ${
              following
                ? 'border border-brown/15 bg-white text-brown hover:bg-cream-dark'
                : 'bg-gradient-tudu text-white shadow-sm hover:opacity-95'
            }`}
          >
            <UserPlus size={16} />
            {following ? 'Following' : 'Follow'}
          </button>

          {viewer && followingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowFollowingList(true)}
              className="inline-flex items-center gap-1.5 rounded-[14px] border border-brown/10 bg-white px-3 py-2.5 text-sm font-semibold text-brown-muted transition hover:border-orange/25 hover:text-brown"
            >
              <Users size={15} />
              {followingCount} following
            </button>
          )}
        </div>
      </div>

      {showFollowingList && (
        <FollowingListDrawer hosts={followingList} onClose={() => setShowFollowingList(false)} />
      )}
    </>
  )
}
