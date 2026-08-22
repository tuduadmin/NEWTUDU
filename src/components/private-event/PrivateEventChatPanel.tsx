import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Trash2, VolumeX } from 'lucide-react'
import type { HostEvent } from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'
import {
  deletePrivateEventChatMessage,
  getPrivateEventChatAccess,
  getVisibleChatMessages,
  mutePrivateEventChatParticipant,
  postPrivateEventChatMessage,
  PRIVATE_EVENT_CHAT_CHANGED_EVENT,
  type PrivateEventChatMessage,
} from '../../lib/privateEventChat'

type PrivateEventChatPanelProps = {
  event: HostEvent
  compact?: boolean
  className?: string
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function PrivateEventChatPanel({
  event,
  compact = false,
  className = '',
}: PrivateEventChatPanelProps) {
  const user = getCurrentUser()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function refresh() {
      setTick((value) => value + 1)
    }

    window.addEventListener(PRIVATE_EVENT_CHAT_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(PRIVATE_EVENT_CHAT_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const access = useMemo(() => {
    void tick
    return getPrivateEventChatAccess(event, user?.email)
  }, [event, tick, user?.email])

  const messages = useMemo(() => {
    void tick
    return getVisibleChatMessages(event.id)
  }, [event.id, tick])

  useEffect(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages.length])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!user?.email) {
      setError('Sign in to send messages.')
      return
    }

    const result = postPrivateEventChatMessage(event, user.email, draft)
    if (!result.ok) {
      setError(result.error ?? 'Unable to send message.')
      return
    }

    setDraft('')
  }

  function handleDelete(message: PrivateEventChatMessage) {
    if (!user?.email) return
    const result = deletePrivateEventChatMessage(event, message.id, user.email)
    if (!result.ok) setError(result.error ?? 'Unable to delete message.')
  }

  function handleMute(message: PrivateEventChatMessage) {
    if (!user?.email) return
    const result = mutePrivateEventChatParticipant(event, message.authorEmail, user.email)
    if (!result.ok) setError(result.error ?? 'Unable to mute guest.')
  }

  if (!user) {
    return (
      <div className={`rounded-[14px] border border-brown/10 bg-cream/40 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-brown">
          <MessageSquare size={18} className="text-orange" />
          <p className="text-sm font-semibold">Event chat</p>
        </div>
        <p className="mt-2 text-sm text-brown-muted">
          Sign in to join the group thread with other invitees and the host.
        </p>
        <Link
          to="/signin"
          className="mt-3 inline-flex text-sm font-semibold text-orange no-underline"
        >
          Sign in →
        </Link>
      </div>
    )
  }

  if (!access.canView) {
    return (
      <div className={`rounded-[14px] border border-brown/10 bg-cream/40 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-brown">
          <MessageSquare size={18} className="text-orange" />
          <p className="text-sm font-semibold">Event chat</p>
        </div>
        <p className="mt-2 text-sm text-brown-muted">
          {access.reason ?? 'You do not have access to this chat yet.'}
        </p>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[14px] border border-brown/10 bg-white shadow-sm ${
        compact ? 'max-h-[420px]' : 'min-h-[420px] max-h-[min(70vh,560px)]'
      } ${className}`}
    >
      <div className="border-b border-brown/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-orange" />
          <div>
            <p className="text-sm font-semibold text-brown">Event chat</p>
            <p className="text-[11px] text-brown-muted">
              {access.isLocked
                ? 'Read-only — event ended'
                : access.opensAt
                  ? `Opens ${new Date(access.opensAt).toLocaleString()}`
                  : 'Invitees, RSVPs, and host'}
            </p>
          </div>
        </div>
        {access.reason && !access.canPost && (
          <p className="mt-2 rounded-[10px] bg-cream/60 px-3 py-2 text-xs text-brown-muted">
            {access.reason}
          </p>
        )}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-brown-muted">
            No messages yet. Say hi to coordinate with the group.
          </p>
        ) : (
          messages.map((message) => {
            const isSelf = user.email.toLowerCase() === message.authorEmail.toLowerCase()
            return (
              <div
                key={message.id}
                className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-[14px] px-3 py-2 ${
                    isSelf ? 'bg-orange/15 text-brown' : 'bg-cream/70 text-brown'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-brown-muted">
                        {isSelf ? 'You' : message.authorLabel}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{message.body}</p>
                      <p className="mt-1 text-[10px] text-brown-muted">
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                    {access.isHost && !isSelf && !access.isLocked && (
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(message)}
                          className="rounded-full p-1 text-brown-muted transition hover:bg-white hover:text-maroon"
                          aria-label="Delete message"
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMute(message)}
                          className="rounded-full p-1 text-brown-muted transition hover:bg-white hover:text-maroon"
                          aria-label="Mute guest"
                          title="Mute guest"
                        >
                          <VolumeX size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {access.canPost ? (
        <form onSubmit={handleSubmit} className="border-t border-brown/10 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message the group..."
              maxLength={500}
              className="min-w-0 flex-1 rounded-[14px] border border-brown/10 bg-cream/30 px-3 py-2 text-sm text-brown outline-none transition focus:border-orange/40"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-[14px] bg-orange px-4 py-2 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:opacity-40"
            >
              Send
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs font-semibold text-maroon" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        error && (
          <p className="border-t border-brown/10 px-3 py-2 text-xs font-semibold text-maroon" role="alert">
            {error}
          </p>
        )
      )}
    </div>
  )
}

export function PrivateEventChatLink({
  event,
  className = '',
}: {
  event: HostEvent
  className?: string
}) {
  const chatPath = `/event/private/${event.id}/chat`
  return (
    <Link
      to={chatPath}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] border border-brown/10 bg-white px-4 py-3 text-sm font-semibold text-brown no-underline transition hover:border-orange/30 hover:text-orange ${className}`}
    >
      <MessageSquare size={16} className="text-orange" />
      Open event chat
    </Link>
  )
}
