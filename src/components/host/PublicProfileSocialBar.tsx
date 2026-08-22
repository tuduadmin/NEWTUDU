import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Share2, ShoppingBag, UserPlus, Users } from 'lucide-react'
import { getCurrentUser } from '../../lib/auth'
import {
  getFollowingCount,
  isFollowingHost,
  resolveViewerFollowing,
  toggleFollowHost,
} from '../../lib/hostFollows'
import { getHostLikeCount, isHostLiked, toggleHostLike } from '../../lib/hostLikes'
import {
  canOpenHostMarketplace,
  openHostMarketplace,
} from '../../lib/eventMerch'
import {
  getOrgPublicProfileUrl,
  getPersonalPublicProfileUrl,
} from '../../lib/publicHostProfile'
import FollowingListDrawer from './FollowingListDrawer'

type PublicProfileSocialBarProps = {
  hostKind: 'personal' | 'org'
  hostId: string
  displayName: string
  showMerchShop?: boolean
  merchShopUrl?: string
  embedded?: boolean
}

function profileShareUrl(hostKind: 'personal' | 'org', hostId: string): string {
  const path =
    hostKind === 'personal'
      ? getPersonalPublicProfileUrl(hostId)
      : getOrgPublicProfileUrl(hostId)
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export default function PublicProfileSocialBar({
  hostKind,
  hostId,
  displayName,
  showMerchShop = false,
  merchShopUrl,
  embedded = false,
}: PublicProfileSocialBarProps) {
  const navigate = useNavigate()
  const viewer = getCurrentUser()
  const [liked, setLiked] = useState(() => isHostLiked(hostKind, hostId))
  const [likeCount, setLikeCount] = useState(() => getHostLikeCount(hostKind, hostId))
  const [following, setFollowing] = useState(() => isFollowingHost(hostKind, hostId))
  const [followingCount, setFollowingCount] = useState(() => getFollowingCount())
  const [showFollowingList, setShowFollowingList] = useState(false)
  const [signInPrompt, setSignInPrompt] = useState(false)
  const [shareToast, setShareToast] = useState<string | null>(null)
  const [marketplaceToast, setMarketplaceToast] = useState<string | null>(null)

  const merchHref = merchShopUrl?.trim() || undefined
  const marketplaceAvailable = canOpenHostMarketplace(hostKind, hostId, showMerchShop, merchHref)

  function requireSignIn(): boolean {
    if (viewer) return false
    setSignInPrompt(true)
    return true
  }

  function handleLike() {
    if (requireSignIn() || !viewer) return
    const result = toggleHostLike(hostKind, hostId, viewer.email)
    if (result.error) {
      setSignInPrompt(true)
      return
    }
    setLiked(result.liked)
    setLikeCount(result.likeCount)
    setSignInPrompt(false)
  }

  function handleFollow() {
    if (requireSignIn() || !viewer) return
    const result = toggleFollowHost(hostKind, hostId, viewer.email)
    if (result.error) {
      setSignInPrompt(true)
      return
    }
    setFollowing(result.following)
    setFollowingCount(getFollowingCount(viewer.email))
    setSignInPrompt(false)
  }

  async function handleShare() {
    const url = profileShareUrl(hostKind, hostId)
    const text = `Check out ${displayName} on TUDU`

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: displayName, text, url })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setShareToast('Profile link copied')
    } catch {
      setShareToast(url)
    }
    window.setTimeout(() => setShareToast(null), 2800)
  }

  function handleMarketplace() {
    if (!showMerchShop) return
    const opened = openHostMarketplace(navigate, hostKind, hostId, merchHref)
    if (!opened) {
      setMarketplaceToast('No marketplace yet — host needs an upcoming event or shop link.')
      window.setTimeout(() => setMarketplaceToast(null), 3200)
    }
  }

  const followingList = viewer ? resolveViewerFollowing(viewer.email) : []

  const actionBtn =
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[14px] border border-brown/10 bg-cream/40 px-1 py-2.5 transition hover:border-orange/25 hover:bg-orange/5 active:scale-[0.98]'

  return (
    <>
      <div className={`border-t border-brown/10 ${embedded ? 'mt-4 pt-4' : 'mt-5 pt-5'}`}>
        {signInPrompt && !viewer && (
          <p className="mb-3 rounded-[14px] border border-orange/20 bg-orange/5 px-3 py-2.5 text-sm text-brown">
            <Link to="/signin" className="font-semibold text-orange no-underline hover:underline">
              Sign in
            </Link>{' '}
            to like, follow, and save hosts in Discover.
          </p>
        )}

        {shareToast && (
          <p className="mb-3 rounded-[14px] border border-brown/10 bg-white px-3 py-2 text-center text-xs font-medium text-brown">
            {shareToast}
          </p>
        )}

        {marketplaceToast && (
          <p className="mb-3 rounded-[14px] border border-orange/20 bg-orange/5 px-3 py-2 text-center text-xs font-medium text-brown">
            {marketplaceToast}
          </p>
        )}

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleLike}
            className={`${actionBtn} ${liked ? 'border-rose-300/50 bg-rose-50 text-rose-600' : 'text-brown'}`}
            aria-pressed={liked}
          >
            <Heart size={20} className={liked ? 'fill-current' : undefined} aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wide">Like</span>
            {likeCount > 0 && (
              <span className="text-[10px] font-semibold tabular-nums text-brown-muted">{likeCount}</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleFollow}
            className={`${actionBtn} ${following ? 'border-orange/40 bg-orange/10 text-orange' : 'text-brown'}`}
            aria-pressed={following}
          >
            <UserPlus size={20} aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              {following ? 'Following' : 'Follow'}
            </span>
          </button>

          <button type="button" onClick={handleShare} className={`${actionBtn} text-brown`}>
            <Share2 size={20} aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wide">Share</span>
          </button>

          <button
            type="button"
            onClick={handleMarketplace}
            disabled={!showMerchShop || !marketplaceAvailable}
            title={
              !showMerchShop
                ? 'Marketplace is off for this host or platform-wide'
                : marketplaceAvailable
                  ? 'Browse event marketplace'
                  : 'Add an upcoming event or shop URL to enable marketplace'
            }
            className={`${actionBtn} ${
              showMerchShop && marketplaceAvailable
                ? 'text-brown hover:border-orange/35'
                : 'cursor-not-allowed opacity-45'
            }`}
          >
            <ShoppingBag size={20} aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-wide leading-tight text-center">
              Marketplace
            </span>
          </button>
        </div>

        {viewer && followingCount > 0 && (
          <button
            type="button"
            onClick={() => setShowFollowingList(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[14px] py-1.5 text-xs font-semibold text-brown-muted transition hover:text-brown"
          >
            <Users size={14} aria-hidden />
            {followingCount} following
          </button>
        )}
      </div>

      {showFollowingList && (
        <FollowingListDrawer hosts={followingList} onClose={() => setShowFollowingList(false)} />
      )}
    </>
  )
}
