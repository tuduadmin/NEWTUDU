import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { HostEventFormData } from '../../lib/account'
import { canCreatePublicEvent, countFilledAdditionalPhotos, getAgeRestrictionLabel } from '../../lib/account'
import { getChecklistSummary } from '../../lib/checklist'
import { createEventFormToDiscoverPreview } from '../../lib/createEventPreview'
import { isMarketplaceStepComplete, isScheduleStepComplete } from '../../lib/createEventValidation'
import { formatMerchMoney } from '../../lib/eventMerch'
import { MERCH_FEE_MODE_OPTIONS } from '../../lib/merchFeeMode'
import { formatScheduleSummary, getEffectiveOccurrences } from '../../lib/eventSchedule'
import { areTicketSessionsValid, formatTicketSummary, getSyncedTicketSessions } from '../../lib/ticketSessions'
import { formatDoorPayment } from '../../lib/eventDoorPayment'
import { eventCategoriesComplete, getCategoryById, type EventCategoryId } from '../../data/eventCategories'
import { formatStructuredAddress } from '../../lib/structuredAddress'
import { getEventCoverLabel, isEventCoverGradient } from '../../lib/eventCoverImage'
import type { EventSlotBudget } from '../../lib/eventSlotBudget'
import DiscoverEventCard from '../DiscoverEventCard'
import EventSlotTally from './EventSlotTally'
import PrivateInvitePicker from './PrivateInvitePicker'
import { resolvePrivateInviteEmails } from '../../lib/shareLists'
import { appFieldClass } from '../../lib/formFieldClasses'

const REVIEW_PANEL = 'rounded-[14px] border border-app-subtle bg-cream-dark'
const VISIBILITY_SELECTED = 'border-success-deep bg-success/10'

type ReviewStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
  hostName: string
  onEditStep: (step: number) => void
  slotBudget?: EventSlotBudget | null
  isPhoneVerified?: boolean
  publicCheck?: ReturnType<typeof canCreatePublicEvent> | null
  hasHostAccount?: boolean
  hostAccountId?: string | null
  createdBy?: string
}

export default function ReviewStep({
  form,
  updateForm,
  hostName,
  onEditStep,
  slotBudget = null,
  isPhoneVerified = false,
  publicCheck = null,
  hasHostAccount = false,
  hostAccountId = null,
  createdBy = '',
}: ReviewStepProps) {
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [delayedPostingOpen, setDelayedPostingOpen] = useState(false)
  const [inviteListOpen, setInviteListOpen] = useState(false)
  const primary = getCategoryById(form.primaryCategory as EventCategoryId)
  const secondary = getCategoryById(form.secondaryCategory as EventCategoryId)
  const categoriesComplete = eventCategoriesComplete(form)

  const missingTitle = !form.title.trim()
  const missingAddress = !form.streetAddress.trim() || !form.city.trim()
  const missingAbout = !form.description.trim()
  const missingCover = !form.coverImage.trim()
  const missingSchedule = !isScheduleStepComplete(form)
  const missingAge = !form.ageRestriction
  const ticketSummaryLines = formatTicketSummary(form)
  const missingTickets =
    (form.ticketingMode === 'free_rsvp' ||
      form.ticketingMode === 'sell' ||
      form.ticketingMode === 'free_donation') &&
    !areTicketSessionsValid(form)
  const missingExternalUrl =
    form.ticketingMode === 'external' && !form.externalTicketUrl.trim()
  const missingMarketplace =
    form.marketplaceEnabled && !isMarketplaceStepComplete(form)
  const sessions = getSyncedTicketSessions(form)
  const allTiers = sessions.flatMap((s) => s.tiers)

  const previewLabel =
    form.ticketingMode === 'external'
      ? 'Get Tickets'
      : form.ticketingMode === 'sell'
        ? (() => {
            const paid = allTiers.filter((t) => t.priceCents > 0)
            if (paid.length === 0) return 'Get Tickets'
            const lowest = Math.min(...paid.map((t) => t.priceCents))
            return `$${(lowest / 100).toFixed(0)}`
          })()
        : form.waitlistEnabled && sessions[0]?.capacity != null
          ? 'Waitlist when full'
          : 'RSVP'

  const scheduledPublishLabel = form.scheduledPublishAt
    ? new Date(form.scheduledPublishAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Publish immediately when live'

  const addressLine = formatStructuredAddress(form) || 'Address not set'

  const publicLocked = publicCheck != null && !publicCheck.allowed
  const visibilityChosen = form.visibility === 'public' || form.visibility === 'private'
  const inviteCount = resolvePrivateInviteEmails(
    form.privateInviteEmails,
    form.privateShareListIds,
  ).length

  const previewEvent = useMemo(
    () =>
      createEventFormToDiscoverPreview(form, hostName, {
        isVerified: isPhoneVerified,
        hasHostAccount,
        hostAccountId: hostAccountId ?? undefined,
        createdBy,
      }),
    [form, hostName, isPhoneVerified, hasHostAccount, hostAccountId, createdBy],
  )

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">Review &amp; Publish</h2>
      <p className="mt-1 text-sm text-brown-muted">Double-check everything before going live.</p>

      {slotBudget && (
        <div className="mt-4">
          <EventSlotTally budget={slotBudget} />
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
          Phone preview
        </p>
        <DiscoverEventCard event={previewEvent} showHostRow iconVariant="solid" />
      </div>

      <div className={`mt-4 overflow-hidden ${REVIEW_PANEL}`}>
        <button
          type="button"
          onClick={() => setChecklistOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 font-display text-sm font-bold text-brown">
            <CheckCircle2 size={18} className="text-brown" />
            Review Checklist
          </span>
          {checklistOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {checklistOpen && (
          <div className="space-y-4 border-t border-brown/10 px-4 pb-4 pt-3">
            <ChecklistSection
              title="Event Details"
              hasIssue={missingTitle || missingAddress || missingAbout || missingCover}
              onEdit={() => onEditStep(1)}
            >
              <CheckItem label="Title" value={form.title.trim() || 'Missing'} missing={missingTitle} />
              <CheckItem label="Venue" value={form.venueName.trim() || 'Not set'} />
              <CheckItem label="Address" value={addressLine} missing={missingAddress} />
              <CheckItem label="About" value={form.description.trim() ? `${form.description.slice(0, 40)}â€¦` : 'Missing'} missing={missingAbout} />
              <CheckItem
                label="Card deck photo"
                value={
                  form.coverImage
                    ? isEventCoverGradient(form.coverImage)
                      ? getEventCoverLabel(form.coverImage)
                      : 'Cover set'
                    : 'Missing'
                }
                missing={missingCover}
              />
              {countFilledAdditionalPhotos(form.additionalPhotos) > 0 && (
                <CheckItem
                  label="Additional photos"
                  value={`${countFilledAdditionalPhotos(form.additionalPhotos)} photo(s)`}
                />
              )}
            </ChecklistSection>

            <ChecklistSection
              title="Categories"
              hasIssue={!categoriesComplete || form.customTags.length < 2}
              onEdit={() => onEditStep(2)}
              ok={categoriesComplete && form.customTags.length >= 2}
            >
              {categoriesComplete && primary && secondary ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <CategoryPill label={primary.label} />
                    <CategoryPill label={secondary.label} muted />
                  </div>
                  {form.customTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.customTags.map((word) => (
                        <span
                          key={word}
                          className="rounded-full bg-orange/10 px-2 py-0.5 text-xs font-medium text-orange"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm italic text-maroon">Categories not complete</p>
              )}
              {formatDoorPayment(form.doorPayment) && (
                <p className="mt-2 text-sm text-brown-muted">
                  {formatDoorPayment(form.doorPayment)}
                  {form.atmOnSite ? ' · ATM on site' : ''}
                </p>
              )}
              {form.amenities.length > 0 && (
                <p className="mt-2 text-sm text-brown-muted">
                  {form.amenities.length} included feature{form.amenities.length === 1 ? '' : 's'}
                </p>
              )}
            </ChecklistSection>

            <ChecklistSection title="Schedule" hasIssue={missingSchedule} onEdit={() => onEditStep(3)}>
              <CheckItem label="Summary" value={formatScheduleSummary(form)} missing={missingSchedule} />
              {getEffectiveOccurrences(form).length > 0 && (
                <CheckItem
                  label="Dates"
                  value={getEffectiveOccurrences(form)
                    .map((o) =>
                      o.dateEnd && o.dateEnd !== o.date
                        ? `${o.date} â†’ ${o.dateEnd}`
                        : o.date,
                    )
                    .join(', ')}
                />
              )}
              {sessions.length > 1 && (
                <CheckItem label="Ticketing" value="Per schedule slot â€” guest picks at checkout" />
              )}
              {form.repeats !== 'none' && form.scheduleRepeatMode === 'pattern' && (
                <CheckItem
                  label="On deck"
                  value={`${form.weeksOnDeck} time${form.weeksOnDeck === 1 ? '' : 's'}, repeats ${form.repeats === 'biweekly' ? 'biweekly' : form.repeats}`}
                />
              )}
            </ChecklistSection>

            <ChecklistSection
              title="Ticketing"
              hasIssue={missingAge || missingTickets || missingExternalUrl}
              onEdit={() => onEditStep(4)}
            >
              <CheckItem
                label="Mode"
                value={
                  form.ticketingMode === 'free_rsvp'
                    ? 'Free & RSVP only'
                    : form.ticketingMode === 'free_donation'
                      ? 'Free + donation'
                      : form.ticketingMode === 'sell'
                        ? 'Sell tickets'
                        : 'External link'
                }
              />
              {form.ticketingMode === 'external' && (
                <CheckItem
                  label="Ticket URL"
                  value={form.externalTicketUrl.trim() || 'Missing'}
                  missing={missingExternalUrl}
                />
              )}
              {form.ticketingMode === 'free_donation' && form.externalTicketUrl.trim() && (
                <CheckItem label="Zeffy page" value={form.externalTicketUrl.trim()} />
              )}
              {(form.ticketingMode === 'free_rsvp' ||
                form.ticketingMode === 'sell' ||
                form.ticketingMode === 'free_donation') && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Tickets</p>
                  {ticketSummaryLines.map((line) => (
                    <p
                      key={line}
                      className={`text-sm ${missingTickets ? 'text-maroon' : 'text-brown-muted'}`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
              <CheckItem
                label="Attendee checklist"
                value={getChecklistSummary(form.checklist)}
                warning={form.checklist.enabled && form.checklist.items.length === 0}
              />
              {form.checklist.enabled && form.checklist.items.some((i) => i.type === 'single_pick') && (
                <ul className="mt-2 space-y-1">
                  {form.checklist.items
                    .filter((i) => i.type === 'single_pick' && i.label.trim())
                    .map((item) => (
                      <li key={item.id} className="text-xs text-brown-muted">
                        {item.label} Â· max {(item.maxClaims ?? 1)} signup{(item.maxClaims ?? 1) === 1 ? '' : 's'}
                        {(item.allowNote ?? false) ? ' Â· notes allowed' : ''}
                      </li>
                    ))}
                </ul>
              )}
              <p className="mt-2 text-sm text-brown-muted">
                {form.ageRestriction ? getAgeRestrictionLabel(form.ageRestriction) : 'Not set'} Â· Preview:{' '}
                {previewLabel}
              </p>
            </ChecklistSection>

            <ChecklistSection
              title="Marketplace"
              hasIssue={missingMarketplace}
              onEdit={() => onEditStep(5)}
            >
              {!form.marketplaceEnabled ? (
                <CheckItem label="Merch" value="Off — skip or enable on the Merch step" />
              ) : (
                <>
                  <CheckItem
                    label="Buyer pricing"
                    value={
                      MERCH_FEE_MODE_OPTIONS.find((o) => o.id === form.marketplaceFeeMode)?.label ??
                      'List price + fees'
                    }
                  />
                  <CheckItem
                    label="Products"
                    value={
                      form.marketplaceDraftProducts.length === 0
                        ? 'Add at least one product'
                        : `${form.marketplaceDraftProducts.length} product${form.marketplaceDraftProducts.length === 1 ? '' : 's'}`
                    }
                    missing={missingMarketplace}
                  />
                  {form.marketplaceDraftProducts.map((p) => (
                    <CheckItem
                      key={p.id}
                      label={p.name}
                      value={`${formatMerchMoney(p.priceCents)} · ${p.fulfillment === 'ship_ahead' ? 'Ship ahead' : 'Event pickup'}`}
                    />
                  ))}
                </>
              )}
            </ChecklistSection>
          </div>
        )}
      </div>

      <div className={`mt-4 overflow-hidden ${REVIEW_PANEL}`}>
        <button
          type="button"
          onClick={() => setDelayedPostingOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 font-display text-sm font-bold text-brown">
            <CalendarClock size={18} className="text-brown" />
            Delayed Posting
          </span>
          {delayedPostingOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {delayedPostingOpen && (
          <div className="border-t border-brown/10 px-4 pb-4 pt-3">
            <p className="mb-3 text-xs text-brown-muted">
              Optional - schedule when this card appears in Discover. Until then it stays saved but hidden
              from the public deck.
            </p>
            <label className="block text-xs font-semibold text-brown-muted">Go live on</label>
            <input
              type="datetime-local"
              value={form.scheduledPublishAt}
              onChange={(e) => updateForm({ scheduledPublishAt: e.target.value })}
              className={`mt-1 w-full ${appFieldClass} text-sm`}
            />
            <p className="mt-2 text-xs text-brown-muted">{scheduledPublishLabel}</p>
            {form.scheduledPublishAt && (
              <button
                type="button"
                onClick={() => updateForm({ scheduledPublishAt: '' })}
                className="mt-2 text-xs font-bold text-orange"
              >
                Clear - publish immediately
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`mt-4 p-4 ${REVIEW_PANEL}`}>
        <div className="mb-3 flex items-center gap-2">
          <Globe size={16} className="text-brown" />
          <h3 className="font-display text-sm font-bold text-brown">Visibility</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <VisibilityOption
            selected={form.visibility === 'public'}
            disabled={publicLocked}
            onSelect={() => {
              if (!publicLocked) updateForm({ visibility: 'public' })
            }}
            icon={<Globe size={16} />}
            label="Public"
            description="Visible to everyone in discovery feeds"
          />
          <VisibilityOption
            selected={form.visibility === 'private'}
            onSelect={() => updateForm({ visibility: 'private' })}
            icon={<Lock size={16} />}
            label="Private"
            description="Invite-only — hidden from Discover, shared by link"
          />
        </div>

        {!visibilityChosen && (
          <p className="mt-2 text-xs text-brown-muted">Choose public or private before publishing.</p>
        )}

        {publicLocked && publicCheck?.reason === 'verify' && (
          <div className="mt-3 rounded-[14px] border border-orange/30 bg-orange/10 p-3 text-sm text-brown">
            <p className="font-semibold">Verify phone to post public events</p>
            <p className="mt-1 text-xs text-brown-muted">
              Unverified hosts can publish private events only. Public events unlock after SMS verification.
            </p>
            <Link to="/verify-phone" className="mt-2 inline-block text-xs font-bold text-orange no-underline">
              Verify phone
            </Link>
          </div>
        )}

        {form.visibility === 'private' && (
          <div className="mt-3 border-t border-brown/10 pt-3">
            <button
              type="button"
              onClick={() => setInviteListOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2"
            >
              <span className="text-xs font-bold text-brown">
                Invite list
                <span className="ml-2 font-normal text-brown-muted">
                  ({inviteCount} selected)
                </span>
              </span>
              {inviteListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {inviteListOpen && (
              <PrivateInvitePicker
                inviteEmails={form.privateInviteEmails}
                shareListIds={form.privateShareListIds}
                onChange={(patch) => updateForm(patch)}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
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
      className={`flex min-h-[5.5rem] flex-col rounded-[14px] border-2 px-3 py-3 text-left transition ${
        selected ? VISIBILITY_SELECTED : 'border-brown/10 bg-cream-dark'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        className={`flex items-center gap-1.5 text-sm font-bold ${
          selected ? 'text-success-deep' : 'text-brown'
        }`}
      >
        {icon}
        {label}
      </span>
      <p className="mt-1 flex-1 text-[10px] leading-snug text-brown-muted">{description}</p>
    </button>
  )
}

function ChecklistSection({
  title,
  hasIssue,
  ok,
  onEdit,
  children,
}: {
  title: string
  hasIssue?: boolean
  ok?: boolean
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-bold text-brown">
          {ok ? (
            <CheckCircle2 size={16} className="text-success-deep" />
          ) : hasIssue ? (
            <AlertTriangle size={16} className="text-maroon" />
          ) : (
            <CheckCircle2 size={16} className="text-success-deep" />
          )}
          {title}
        </span>
        <button type="button" onClick={onEdit} className="text-xs font-bold text-orange">
          EDIT
        </button>
      </div>
      <div className="mt-2 pl-5">{children}</div>
    </div>
  )
}

function CheckItem({
  label,
  value,
  missing,
  warning,
}: {
  label: string
  value: string
  missing?: boolean
  warning?: boolean
}) {
  return (
    <p className="text-sm">
      <span className="font-semibold text-brown">{label}:</span>{' '}
      <span
        className={
          missing
            ? 'italic text-maroon'
            : warning
              ? 'text-orange'
              : 'text-brown-muted'
        }
      >
        {value}
        {warning && !missing && ' âš '}
      </span>
    </p>
  )
}

function CategoryPill({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`rounded-[14px] px-2.5 py-1 text-[11px] font-semibold ${
        muted ? 'bg-cream-dark text-brown-muted' : 'bg-electric-blue/10 text-electric-blue'
      }`}
    >
      {label}
    </span>
  )
}
