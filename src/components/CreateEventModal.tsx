import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Lock, X } from 'lucide-react'
import GradientButton from './GradientButton'
import HostAddSlotsLink from './host/HostAddSlotsLink'
import { formatPrivateEventSlotLabel, formatPublicEventSlotLabel } from '../lib/eventSlots'
import ShareEventModal from './ShareEventModal'
import {
  canCreatePrivateEvent,
  canCreatePublicEvent,
  createHostEvent,
  privateEventBlockMessage,
  getCurrentAccount,
  getHostAccount,
  getPostingAs,
  publishHostEvent,
  type EventVisibility,
  type HostEvent,
} from '../lib/account'
import { getCurrentUser } from '../lib/auth'
import { getUnverifiedPrivateEventLimit } from '../lib/tierConfig'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../lib/prefChoiceClasses'

type CreateEventModalProps = {
  open: boolean
  onClose: () => void
  onCreated?: () => void
  postingAs?: 'personal' | string
}

export default function CreateEventModal({
  open,
  onClose,
  onCreated,
  postingAs: postingAsProp,
}: CreateEventModalProps) {
  const user = getCurrentUser()
  const account = getCurrentAccount()
  const postingAs = postingAsProp ?? (account ? getPostingAs(account) : 'personal')
  const hostAccount = postingAs !== 'personal' ? getHostAccount(postingAs) : null
  const isPersonal = postingAs === 'personal'
  const publicCheck = account ? canCreatePublicEvent(account, isPersonal ? null : postingAs) : null
  const isPhoneVerified = account?.verificationStatus === 'phone_verified'
  const privateCheckRaw =
    account && isPersonal ? canCreatePrivateEvent(account, null) : null
  const privateCheck =
    privateCheckRaw && privateCheckRaw.limit > 0 ? privateCheckRaw : null

  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState<EventVisibility>('private')
  const [error, setError] = useState('')
  const [shareEvent, setShareEvent] = useState<HostEvent | null>(null)
  const [sharePublishedJustNow, setSharePublishedJustNow] = useState(false)

  if (!open) return null

  const personalName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Me'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!user || !title.trim()) {
      setError('Please enter an event title.')
      return
    }

    const isPersonal = postingAs === 'personal'
    const result = createHostEvent({
      title,
      visibility,
      createdBy: user.email,
      hostAccountId: isPersonal ? null : postingAs,
      postedAsUserId: isPersonal ? user.email : undefined,
      displayName: isPersonal ? personalName : undefined,
      status: visibility === 'public' ? 'draft' : 'draft',
    })

    if (!result.ok || !result.event) {
      setError(result.error ?? 'Could not create event.')
      return
    }

    setTitle('')
    setVisibility('private')
    onCreated?.()

    if (visibility === 'private') {
      onClose()
      setSharePublishedJustNow(true)
      setShareEvent(result.event)
      return
    }

    const published = publishHostEvent(result.event.id)
    if (published.ok) {
      onClose()
      setSharePublishedJustNow(true)
      setShareEvent(published.event ?? result.event)
      return
    }

    onClose()
  }

  const publicBlocked = visibility === 'public' && publicCheck && !publicCheck.allowed
  const privateBlocked = visibility === 'private' && privateCheck && !privateCheck.allowed

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div
          className="w-full max-w-lg rounded-[14px] bg-white p-5 shadow-xl"
          role="dialog"
          aria-labelledby="create-event-title"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 id="create-event-title" className="font-display text-lg font-bold text-brown">
                Create Event
              </h2>
              <p className="mt-0.5 text-xs text-brown-muted">
                Posting as{' '}
                <span className="font-semibold text-brown">
                  {isPersonalLabel(postingAs, hostAccount?.name, personalName)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-brown/10 text-brown-muted"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brown-muted">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={visibility === 'private' ? 'Jamie\'s House Party' : 'Community Garage Sale'}
                className="w-full rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-brown-muted">Event type</p>
              <div className="grid grid-cols-2 gap-2">
                <VisibilityOption
                  selected={visibility === 'private'}
                  onSelect={() => setVisibility('private')}
                  icon={<Lock size={16} />}
                  label="Private"
                  description="House party, invite-only â€” share link, won't appear in TUDU discover"
                />
                <VisibilityOption
                  selected={visibility === 'public'}
                  onSelect={() => setVisibility('public')}
                  icon={<Globe size={16} />}
                  label="Public"
                  description="Garage sale, community event â€” appears in card deck when live"
                  disabled={publicCheck ? !publicCheck.allowed : false}
                />
              </div>
            </div>

            {account && privateCheck && visibility === 'private' && (
              <p className="text-xs text-brown-muted">
                {formatPrivateEventSlotLabel(privateCheck.used, privateCheck.limit)}
                {privateCheck.remaining > 0 &&
                  ` | ${privateCheck.remaining} slot${privateCheck.remaining === 1 ? '' : 's'} left`}
              </p>
            )}

            {account && publicCheck && visibility === 'public' && isPhoneVerified && (
              <p className="text-xs text-brown-muted">
                {formatPublicEventSlotLabel(
                  account.publicEventCount,
                  publicCheck.baseLimit,
                  publicCheck.extraSlots,
                )}
                {publicCheck.remaining > 0 &&
                  ` | ${publicCheck.remaining} slot${publicCheck.remaining === 1 ? '' : 's'} left`}
                {' | '}
                <HostAddSlotsLink remaining={publicCheck.remaining} />
              </p>
            )}

            {publicBlocked && publicCheck?.reason === 'org_pending' && (
              <div className="rounded-[14px] border border-brown/20 bg-brown/5 p-3 text-sm text-brown">
                <p className="font-semibold">Host Account pending approval</p>
                <p className="mt-1 text-xs text-brown-muted">
                  Private events are always unlimited. Public events unlock after Control Room review.
                </p>
              </div>
            )}

            {publicBlocked && publicCheck?.reason === 'org_rejected' && (
              <div className="rounded-[14px] border border-maroon/30 bg-maroon/10 p-3 text-sm text-brown">
                <p className="font-semibold">Host Account not approved</p>
                <p className="mt-1 text-xs text-brown-muted">
                  Contact support if you believe this was a mistake.
                </p>
              </div>
            )}

            {publicBlocked && publicCheck?.reason === 'verify' && (
              <div className="rounded-[14px] border border-orange/30 bg-orange/10 p-3 text-sm text-brown">
                <p className="font-semibold">Verify phone to post public events</p>
                <p className="mt-1 text-xs text-brown-muted">
                  You can host up to {getUnverifiedPrivateEventLimit()} private events until you
                  verify. Public events unlock after SMS verification.
                </p>
                <Link
                  to="/verify-phone"
                  className="mt-2 inline-block text-xs font-bold text-orange no-underline"
                >
                  Verify phone â†’
                </Link>
              </div>
            )}

            {privateBlocked && account && (
              <div className="rounded-[14px] border border-orange/30 bg-orange/10 p-3 text-sm text-brown">
                <p className="font-semibold">Private event limit reached</p>
                <p className="mt-1 text-xs text-brown-muted">
                  {privateEventBlockMessage('limit', privateCheck?.limit, account)}
                </p>
                {!isPhoneVerified ? (
                  <Link
                    to="/verify-phone"
                    className="mt-2 inline-block text-xs font-bold text-orange no-underline"
                  >
                    Verify phone →
                  </Link>
                ) : (
                  <Link
                    to="/host/subscription"
                    className="mt-2 inline-block text-xs font-bold text-orange no-underline"
                  >
                    Upgrade to Explorer →
                  </Link>
                )}
              </div>
            )}

            {publicBlocked && publicCheck?.reason === 'upgrade' && isPhoneVerified && (
              <div className="rounded-[14px] border border-orange/30 bg-orange/10 p-3 text-sm text-brown">
                <p className="font-semibold">You&apos;ve reached your public event limit</p>
                <p className="mt-1 text-xs text-brown-muted">
                  You&apos;ve used all {publicCheck.limit} public event slots
                  {publicCheck.extraSlots > 0 &&
                    ` (${publicCheck.baseLimit} from your plan + ${publicCheck.extraSlots} purchased)`}
                  .
                </p>
                <p className="mt-2">
                  <HostAddSlotsLink prominent />
                </p>
              </div>
            )}

            {error && <p className="text-sm font-semibold text-maroon">{error}</p>}

            <GradientButton type="submit" fullWidth disabled={!!publicBlocked || !!privateBlocked}>
              {visibility === 'private' ? 'Create & Share' : 'Create Public Event'}
            </GradientButton>
          </form>
        </div>
      </div>

      <ShareEventModal
        open={!!shareEvent}
        event={shareEvent}
        publishedJustNow={sharePublishedJustNow}
        onClose={() => {
          setShareEvent(null)
          setSharePublishedJustNow(false)
        }}
      />
    </>
  )
}

function isPersonalLabel(
  postingAs: 'personal' | string,
  hostName: string | undefined,
  personalName: string,
): string {
  return postingAs === 'personal' ? personalName : (hostName ?? 'Host Account')
}

function VisibilityOption({
  selected,
  onSelect,
  icon,
  label,
  description,
  disabled,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  label: string
  description: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`${prefChoiceClasses(selected, 'p-3 text-left')} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        className={`pref-choice-label flex items-center gap-1.5 ${
          selected ? PREF_CHOICE_ACTIVE_TEXT : 'font-semibold text-brown'
        }`}
      >
        <span className={`pref-choice-icon ${selected ? '' : 'text-brown-muted'}`}>{icon}</span>
        {label}
      </span>
      <span className="mt-1 block text-[11px] leading-snug text-brown-muted">{description}</span>
    </button>
  )
}
