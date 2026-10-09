import { Link, useNavigate } from 'react-router-dom'
import {
  Bookmark,
  Check,
  Copy,
  Eye,
  Globe,
  Lock,
  Pencil,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { HostEvent } from '../../lib/account'
import { getSeedApprovalStatus, resolveTicketingMode } from '../../lib/account'
import { getEventMetrics } from '../../lib/adminAnalytics'
import {
  cancelHostEvent,
  deleteDraftHostEvent,
  duplicateHostEvent,
  getEventViewPath,
  toggleHostEventVisibility,
} from '../../lib/hostEventActions'
import {
  formatCardDateTime,
  formatCardLocation,
  getEventCapacity,
  getEventDatePill,
  getEventSoldPercent,
  getGoingCount,
} from '../../lib/hostEventCardUtils'
import { ShareButton } from '../NavActionButtons'
import HostEventPromotionTools, { type PromotionToolAction } from './HostEventPromotionTools'

/** Event row — high contrast vs analytics gradient panel (solid card + strong shadow). */
const HOST_EVENT_CARD =
  'host-event-manager-card overflow-hidden rounded-[14px] border-2 border-brown/25 bg-white shadow-[0_10px_32px_-8px_rgba(61,44,41,0.22)] transition-[box-shadow,border-color,transform] hover:-translate-y-0.5 hover:border-orange/45 hover:shadow-[0_16px_40px_-10px_rgba(249,115,22,0.28)]'
const HOST_PANEL = 'rounded-[14px] border border-app-subtle bg-app-elevated'
const HOST_OUTLINE_BTN =
  'inline-flex items-center justify-center rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2 text-xs font-semibold text-brown transition hover:border-orange/30 hover:bg-orange/5'

const ACTION_BTN =
  'inline-flex flex-1 min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-[14px] border border-app-subtle bg-app-elevated px-2 py-2.5 text-[10px] font-bold uppercase tracking-wide text-brown transition hover:border-orange/30 hover:bg-orange/5'

const ACTION_ICON = 'text-brown-muted'
const ACTION_ICON_ACCENT = 'theme-accent-icon'
const ACTION_ICON_DANGER = 'text-maroon'

type HostEventManagerCardProps = {
  event: HostEvent
  userEmail: string
  showMarketplace?: boolean
  onReload: () => void
  onToast: (message: string) => void
  onShare: (eventId: string, defaultTab?: 'public' | 'private') => void
  onGuestList: (event: HostEvent) => void
  onBoost: (event: HostEvent) => void
  onApproveSeed?: (eventId: string) => void
  onRejectSeed?: (eventId: string) => void
}

export default function HostEventManagerCard({
  event,
  userEmail,
  showMarketplace = true,
  onReload,
  onToast,
  onShare,
  onGuestList,
  onBoost,
  onApproveSeed,
  onRejectSeed,
}: HostEventManagerCardProps) {
  const navigate = useNavigate()
  const seedStatus = event.seededByAdmin ? getSeedApprovalStatus(event) : undefined
  const showActions = seedStatus !== 'rejected' && seedStatus !== 'pending'
  const canEdit = !event.seededByAdmin || seedStatus === 'approved'
  const isPromotable = event.status === 'live' || event.status === 'upcoming'
  const isDraft = event.status === 'draft'
  const datePill = getEventDatePill(event)
  const goingCount = getGoingCount(event)
  const capacity = getEventCapacity(event)
  const soldPercent = getEventSoldPercent(event)
  const ticketingMode = resolveTicketingMode(event)
  const saves = getEventMetrics(event.id).saves ?? 0
  const isPublic = event.visibility === 'public'

  if (!showActions) {
    return (
      <li className={`${HOST_EVENT_CARD} px-4 py-3`}>
        <EventHeader
          event={event}
          seedStatus={seedStatus}
          datePill={datePill}
          goingCount={goingCount}
          capacity={capacity}
          soldPercent={soldPercent}
          ticketingMode={ticketingMode}
        />
        {seedStatus === 'pending' && event.status !== 'draft' && (
          <div className="app-notice-pending mt-3 px-3 py-2.5">
            <p className="text-xs font-semibold text-brown">
              TUDU created this — Approve to publish
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onApproveSeed?.(event.id)}
                className="flex-1 rounded-[14px] bg-orange py-2 text-xs font-bold text-white transition hover:brightness-110"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onRejectSeed?.(event.id)}
                className={`flex-1 ${HOST_OUTLINE_BTN} py-2 text-xs font-bold`}
              >
                Decline
              </button>
            </div>
          </div>
        )}
      </li>
    )
  }

  function handleCopy() {
    const result = duplicateHostEvent(event.id, userEmail)
    if (!result.ok) {
      onToast(result.error ?? 'Could not copy event.')
      return
    }
    onToast('Event copied as draft.')
    onReload()
  }

  function handleDelete() {
    if (!window.confirm(`Delete draft "${event.title}"? This cannot be undone.`)) return
    const result = deleteDraftHostEvent(event.id)
    if (!result.ok) {
      onToast(result.error ?? 'Could not delete draft.')
      return
    }
    onToast('Draft deleted.')
    onReload()
  }

  function handleCancel() {
    if (!window.confirm(`Cancel "${event.title}"? It will move to Past events.`)) return
    const result = cancelHostEvent(event.id)
    if (!result.ok) {
      onToast(result.error ?? 'Could not cancel event.')
      return
    }
    onToast('Event cancelled.')
    onReload()
  }

  function handleToggleVisibility() {
    const result = toggleHostEventVisibility(event.id, userEmail)
    if (!result.ok) {
      onToast(result.error ?? 'Could not update visibility.')
      return
    }
    onToast(isPublic ? 'Event is now private.' : 'Event is now public.')
    onReload()
  }

  function handlePromotionAction(action: PromotionToolAction) {
    switch (action) {
      case 'guests':
        onGuestList(event)
        break
      case 'posters':
        navigate(`/host/event/${event.id}/posters`)
        break
      case 'blast':
        onShare(event.id, 'private')
        break
      case 'boost':
        onBoost(event)
        break
    }
  }

  return (
    <li className={HOST_EVENT_CARD}>
      <div className="bg-gradient-to-br from-rose-600 via-orange to-amber-500 px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-2">
          {datePill ? (
            <span className="rounded-[14px] bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              {datePill}
            </span>
          ) : (
            <span />
          )}
          {!isDraft && isPublic && (
            <span className="inline-flex items-center gap-1 rounded-[14px] bg-success/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <Check size={10} aria-hidden />
              Published
            </span>
          )}
          {!isDraft && !isPublic && (
            <span className="inline-flex items-center gap-1 rounded-[14px] bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              <Lock size={10} aria-hidden />
              Private
            </span>
          )}
          {isDraft && (
            <span className="rounded-[14px] bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              Draft
            </span>
          )}
        </div>
        <p className="mt-2 text-center font-display text-lg font-extrabold">{event.title}</p>
        <p className="mt-1 text-center text-xs text-white/85">{formatCardLocation(event)}</p>
        <p className="mt-0.5 text-center text-xs text-white/70">{formatCardDateTime(event)}</p>
      </div>

      <div className="px-4 py-3">
        {!isDraft ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brown-muted">
            <span className="inline-flex items-center gap-1">
              <Users size={12} className="text-orange" aria-hidden />
              {goingCount.toLocaleString()} going
            </span>
            <span className="inline-flex items-center gap-1">
              <Bookmark size={12} className="text-orange" aria-hidden />
              {saves.toLocaleString()} saved
            </span>
            <button
              type="button"
              onClick={handleToggleVisibility}
              className={`inline-flex items-center gap-1 rounded-[14px] px-2 py-0.5 text-[10px] font-bold transition ${
                isPublic
                  ? 'bg-success/10 text-success hover:bg-success/15'
                  : 'bg-cream-dark text-brown-muted hover:bg-cream-dark/80'
              }`}
            >
              {isPublic ? <Globe size={10} aria-hidden /> : <Lock size={10} aria-hidden />}
              {isPublic ? 'Public' : 'Private'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-brown-muted">
            Draft copy — edit and publish as a new event. Sales and analytics start at zero.
          </p>
        )}

        {event.departmentName && (
          <span className="mt-2 inline-block rounded-[14px] bg-purple/10 px-2 py-0.5 text-[10px] font-bold text-purple">
            {event.departmentName}
          </span>
        )}

        {!isDraft && ticketingMode !== 'external' && soldPercent != null && capacity != null && (
          <p className="mt-2 text-[10px] font-semibold text-orange">
            {goingCount.toLocaleString()} / {capacity.toLocaleString()} sold · {soldPercent}%
          </p>
        )}

        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2">
          {!isDraft && (
            <Link to={getEventViewPath(event)} className={`${ACTION_BTN} no-underline`}>
              <Eye size={16} className={ACTION_ICON} aria-hidden />
              View
            </Link>
          )}
          {canEdit && (
            <Link
              to={`/host/create-event?edit=${encodeURIComponent(event.id)}`}
              className={`${ACTION_BTN} no-underline`}
            >
              <Pencil size={16} className={ACTION_ICON_ACCENT} aria-hidden />
              Edit
            </Link>
          )}
          {canEdit && (
            <button type="button" onClick={handleCopy} className={ACTION_BTN}>
              <Copy size={16} className={ACTION_ICON} aria-hidden />
              Copy
            </button>
          )}
          {isDraft && canEdit && (
            <button type="button" onClick={handleDelete} className={ACTION_BTN}>
              <Trash2 size={16} className={ACTION_ICON_DANGER} aria-hidden />
              Delete
            </button>
          )}
          {isPromotable && canEdit && (
            <button type="button" onClick={handleCancel} className={ACTION_BTN}>
              <X size={16} className={ACTION_ICON_ACCENT} aria-hidden />
              Cancel
            </button>
          )}
        </div>

        {!isDraft && showMarketplace && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              to={`/host/event/${event.id}/operations`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange no-underline"
            >
              <Users size={12} aria-hidden />
              Pick list & contacts
            </Link>
            <Link
              to={`/host/event/${event.id}/merch`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange no-underline"
            >
              <ShoppingBag size={12} aria-hidden />
              Marketplace
            </Link>
            {isPromotable && canEdit && (
              <ShareButton variant="inline" onClick={() => onShare(event.id)}>
                Promote
              </ShareButton>
            )}
          </div>
        )}

        {isPromotable && canEdit && (
          <HostEventPromotionTools onAction={handlePromotionAction} />
        )}
      </div>
    </li>
  )
}

function EventHeader({
  event,
  seedStatus,
  datePill,
  goingCount,
  capacity,
  soldPercent,
  ticketingMode,
}: {
  event: HostEvent
  seedStatus?: string
  datePill: string | null
  goingCount: number
  capacity: number | null
  soldPercent: number | null
  ticketingMode: string
}) {
  return (
    <>
      <p className="font-display text-sm font-bold text-brown">{event.title}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <p className="text-xs capitalize text-brown-muted">{event.status}</p>
        {datePill && (
          <span className="rounded-[14px] bg-orange/10 px-2 py-0.5 text-[10px] font-bold text-orange">
            {datePill}
          </span>
        )}
        {event.departmentName && (
          <span className="rounded-[14px] bg-purple/10 px-2 py-0.5 text-[10px] font-bold text-purple">
            {event.departmentName}
          </span>
        )}
        {seedStatus === 'approved' && (
          <span className="rounded-[14px] bg-electric-blue/15 px-2 py-0.5 text-[10px] font-bold text-electric-blue">
            Posted by TUDU
          </span>
        )}
        {seedStatus === 'rejected' && (
          <span className="rounded-[14px] bg-maroon/15 px-2 py-0.5 text-[10px] font-bold text-maroon">
            Declined
          </span>
        )}
        {ticketingMode !== 'external' && goingCount > 0 && (
          <span className="rounded-[14px] bg-orange/10 px-2 py-0.5 text-[10px] font-bold text-orange">
            {goingCount.toLocaleString()}
            {capacity != null ? ` / ${capacity.toLocaleString()}` : ''} sold
            {soldPercent != null ? ` · ${soldPercent}%` : ''}
          </span>
        )}
        {ticketingMode === 'external' && (
          <span className="rounded-[14px] bg-cream-dark px-2 py-0.5 text-[10px] font-bold text-brown-muted">
            External tickets
          </span>
        )}
      </div>
    </>
  )
}

export { HOST_OUTLINE_BTN }
