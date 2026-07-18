import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Lock, X } from 'lucide-react'
import GradientButton from './GradientButton'
import ShareEventModal from './ShareEventModal'
import {
  canCreatePublicEvent,
  createHostEvent,
  getCurrentAccount,
  getHostAccount,
  getPostingAs,
  publishHostEvent,
  type EventVisibility,
  type HostEvent,
} from '../lib/account'
import { getCurrentUser } from '../lib/auth'

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
  const publicCheck = account ? canCreatePublicEvent(account) : null

  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState<EventVisibility>('private')
  const [error, setError] = useState('')
  const [shareEvent, setShareEvent] = useState<HostEvent | null>(null)

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
      setShareEvent(result.event)
      return
    }

    const published = publishHostEvent(result.event.id)
    if (published.ok) {
      onClose()
      return
    }

    onClose()
  }

  const publicBlocked = visibility === 'public' && publicCheck && !publicCheck.allowed

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div
          className="w-full max-w-lg rounded-[var(--radius-xl)] bg-white p-5 shadow-xl"
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
                className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
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
                  description="House party, invite-only — share link, won't appear in TUDU discover"
                />
                <VisibilityOption
                  selected={visibility === 'public'}
                  onSelect={() => setVisibility('public')}
                  icon={<Globe size={16} />}
                  label="Public"
                  description="Garage sale, community event — appears in card deck when live"
                  disabled={publicCheck?.limit === 0}
                />
              </div>
            </div>

            {account && publicCheck && visibility === 'public' && (
              <p className="text-xs text-brown-muted">
                Public events: {account.publicEventCount} / {publicCheck.limit} used
                {publicCheck.remaining > 0 &&
                  ` · ${publicCheck.remaining} slot${publicCheck.remaining === 1 ? '' : 's'} left`}
              </p>
            )}

            {publicBlocked && publicCheck?.reason === 'verify' && (
              <div className="rounded-[var(--radius-lg)] border border-orange/30 bg-orange/10 p-3 text-sm text-brown">
                <p className="font-semibold">Verify phone to post public events</p>
                <p className="mt-1 text-xs text-brown-muted">
                  Private events are always unlimited. Public events need SMS verification.
                </p>
                <Link
                  to="/verify-phone"
                  className="mt-2 inline-block text-xs font-bold text-orange no-underline"
                >
                  Verify phone →
                </Link>
              </div>
            )}

            {publicBlocked && publicCheck?.reason === 'upgrade' && (
              <div className="rounded-[var(--radius-lg)] border border-purple/30 bg-purple/10 p-3 text-sm text-brown">
                <p className="font-semibold">Upgrade for more public events</p>
                <p className="mt-1 text-xs text-brown-muted">
                  You&apos;ve used all {publicCheck.limit} public event slots on your current plan.
                </p>
              </div>
            )}

            {error && <p className="text-sm font-semibold text-maroon">{error}</p>}

            <GradientButton type="submit" fullWidth disabled={!!publicBlocked}>
              {visibility === 'private' ? 'Create & Share' : 'Create Public Event'}
            </GradientButton>
          </form>
        </div>
      </div>

      <ShareEventModal
        open={!!shareEvent}
        event={shareEvent}
        onClose={() => setShareEvent(null)}
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
      className={`rounded-[var(--radius-lg)] border-2 p-3 text-left transition ${
        selected
          ? 'border-orange bg-orange/10'
          : 'border-brown/10 bg-white hover:border-orange/30'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className={`flex items-center gap-1.5 font-semibold ${selected ? 'text-orange' : 'text-brown'}`}>
        {icon}
        {label}
      </span>
      <span className="mt-1 block text-[11px] leading-snug text-brown-muted">{description}</span>
    </button>
  )
}
