import { Link, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Lock, MapPin } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import PrivateEventChatPanel, {
  PrivateEventChatLink,
} from '../components/private-event/PrivateEventChatPanel'
import { useFeatureFlags } from '../hooks/useFeatureFlags'
import {
  getEventActionLabel,
  getHostAccount,
  getHostEventById,
  getHostEventByShareToken,
} from '../lib/account'
import { getHostProfileUrlFromEvent } from '../lib/publicHostProfile'

export default function PrivateEventPage() {
  const { id, shareToken } = useParams<{ id?: string; shareToken?: string }>()
  const navigate = useNavigate()
  const flags = useFeatureFlags()
  const chatEnabled = flags.privateEventChatEnabled

  const event = shareToken
    ? getHostEventByShareToken(shareToken)
    : id
      ? getHostEventById(id)
      : undefined

  if (!event || event.visibility !== 'private') {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar />
        <main className="px-4 pt-10 text-center">
          <Lock size={40} className="mx-auto text-brown-muted" />
          <h1 className="mt-4 font-display text-xl font-bold text-brown">Private event not found</h1>
          <p className="mt-2 text-sm text-brown-muted">
            This invite link may have expired or the event was removed.
          </p>
          <Link to="/discover" className="mt-6 inline-block font-semibold text-orange no-underline">
            {'Browse public events ->'}
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  const hostAccount = event.hostAccountId ? getHostAccount(event.hostAccountId) : null
  const hostLabel = hostAccount?.name ?? event.displayName ?? 'A friend'
  const hostProfileUrl = getHostProfileUrlFromEvent(event)
  const actionLabel = getEventActionLabel(event)

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar />

      <main className="px-4 pt-4">
        <div className="rounded-[14px] border border-brown/10 bg-white p-6 shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-orange/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-orange">
            <Lock size={12} />
            Private | Invite only
          </span>

          <h1 className="mt-4 font-display text-2xl font-extrabold text-brown">{event.title}</h1>
          <p className="mt-2 text-sm text-brown-muted">
            Hosted by{' '}
            {hostProfileUrl ? (
              <Link to={hostProfileUrl} className="font-semibold text-orange no-underline">
                {hostLabel}
              </Link>
            ) : (
              hostLabel
            )}
          </p>

          <div className="mt-5 space-y-3 text-sm text-brown-muted">
            <p className="flex items-center gap-2">
              <Calendar size={16} className="text-orange" />
              Date & time - set by host
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={16} className="text-orange" />
              Location shared with invitees
            </p>
          </div>

          <p className="mt-5 rounded-[14px] border border-brown/10 bg-cream/40 p-3 text-xs text-brown-muted">
            This is a private house-party style event. It won&apos;t appear in TUDU Discover - you&apos;re here
            because someone shared this link with you.
          </p>

          <GradientButton fullWidth className="mt-5" onClick={() => navigate(`/event/${event.id}/rsvp`)}>
            {actionLabel}
          </GradientButton>

          {chatEnabled && (
            <div className="mt-5 space-y-3">
              <PrivateEventChatLink event={event} className="w-full" />
              <PrivateEventChatPanel event={event} compact className="mt-1" />
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
