import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { HostEventFormData, TicketTier, TicketingMode } from '../../lib/account'
import { getEffectiveOccurrences } from '../../lib/eventSchedule'
import {
  formatSessionAccordionSummary,
  getSyncedTicketSessions,
  hasMultipleTicketSessions,
  isSessionTicketConfigLocked,
  sessionTiersForMode,
} from '../../lib/ticketSessions'
import ChecklistBuilder from './ChecklistBuilder'
import { FieldLabel, FieldHelper, TextInput } from './CreateEventLayout'

type FinalStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
  updateSessionCapacity: (sessionIndex: number, capacity: number | null) => void
  updateSessionTier: (sessionIndex: number, tierId: string, partial: Partial<TicketTier>) => void
  addSessionTier: (sessionIndex: number) => void
  removeSessionTier: (sessionIndex: number, tierId: string) => void
  setSessionTiersLocked: (sessionIndex: number, locked: boolean) => void
}

const AGE_OPTIONS = [
  { id: 'all-ages' as const, label: 'All Ages' },
  { id: 'family-friendly' as const, label: 'Family Friendly' },
  { id: '18+' as const, label: '18+' },
]

const TICKETING_MODES: { id: TicketingMode; label: string; description: string }[] = [
  { id: 'free_rsvp', label: 'Free & RSVP only', description: 'Capacity and optional waitlist.' },
  {
    id: 'free_donation',
    label: 'Free + suggested donation',
    description: 'RSVP with optional donation tiers.',
  },
  { id: 'sell', label: 'Sell tickets', description: 'Multi-tier paid ticketing.' },
  { id: 'external', label: 'External tickets (link only)', description: 'Link out to your ticket vendor.' },
]

/** Raised panels on the cream page shell — not stark white. */
const TICKET_PANEL =
  'rounded-[14px] border border-app-subtle bg-cream-dark'

const TICKET_TILE_IDLE =
  'border-brown/10 bg-cream-dark text-brown hover:border-orange/30'

export default function FinalStep({
  form,
  updateForm,
  updateSessionCapacity,
  updateSessionTier,
  addSessionTier,
  removeSessionTier,
  setSessionTiersLocked,
}: FinalStepProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(() => new Set([0]))
  const sessions = getSyncedTicketSessions(form)
  const occurrences = getEffectiveOccurrences(form)
  const multiSession = hasMultipleTicketSessions(form)

  function toggleSessionExpanded(index: number) {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function setTicketingMode(mode: TicketingMode) {
    const nextSessions = sessions.map((session) => ({
      ...session,
      tiers: sessionTiersForMode(mode, session.tiers),
    }))
    updateForm({
      ticketingMode: mode,
      ticketSessions: nextSessions,
      ticketTiers: nextSessions[0]?.tiers ?? form.ticketTiers,
      sellTicketsPerDay: nextSessions.length > 1,
      advancedTicketSales: nextSessions.length > 1,
    })
  }

  const showTierBuilder =
    form.ticketingMode === 'sell' || form.ticketingMode === 'free_donation'
  const showFreeRsvpFields = form.ticketingMode === 'free_rsvp'
  const multiSlotLabel = form.scheduleTimeSlots ? 'time slot' : 'schedule slot'

  function handleSessionCapacityChange(sessionIndex: number, raw: string) {
    if (isSessionTicketConfigLocked(sessions[sessionIndex], sessionIndex)) return
    if (raw === '') {
      updateSessionCapacity(sessionIndex, null)
      return
    }
    const num = parseInt(raw.replace(/\D/g, ''), 10)
    if (!Number.isNaN(num)) {
      updateSessionCapacity(sessionIndex, Math.min(5000, Math.max(1, num)))
    }
  }

  function renderMultiSessionTickets(showTiers: boolean) {
    return (
      <>
        <p className="text-[11px] leading-relaxed text-brown-muted">
          Fill out the <span className="font-semibold text-brown">first slot</span> — the others copy
          automatically while locked. Uncheck Locked to customize a slot.
        </p>
        <p className="text-[11px] text-brown-muted">
          {showTiers ? `Capacity and tiers per ${multiSlotLabel}` : `Capacity per ${multiSlotLabel}`}
        </p>
        {sessions.map((session, index) => {
          const locked = isSessionTicketConfigLocked(session, index)
          const isTemplate = index === 0
          return (
            <SessionAccordion
              key={`ticket-session-${index}`}
              expanded={expandedSessions.has(index)}
              summary={formatSessionAccordionSummary(session, occurrences[index], form.ticketingMode)}
              onToggle={() => toggleSessionExpanded(index)}
              isTemplate={isTemplate}
              showLockToggle={!isTemplate}
              locked={locked}
              onLockedChange={(nextLocked) => setSessionTiersLocked(index, nextLocked)}
            >
              <CapacityRow
                value={session.capacity}
                onChange={(raw) => handleSessionCapacityChange(index, raw)}
                disabled={locked}
              />
              {showTiers && (
                <>
                  <div className="space-y-3">
                    {session.tiers.map((tier, tierIndex) => (
                      <TierEditor
                        key={tier.id}
                        tier={tier}
                        index={tierIndex}
                        canRemove={session.tiers.length > 1}
                        donationMode={form.ticketingMode === 'free_donation'}
                        disabled={locked}
                        onUpdate={(partial) => updateSessionTier(index, tier.id, partial)}
                        onRemove={() => removeSessionTier(index, tier.id)}
                      />
                    ))}
                  </div>
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => addSessionTier(index)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-[14px] px-1 text-xs font-bold text-orange"
                    >
                      <Plus size={14} />
                      Add tier
                    </button>
                  )}
                </>
              )}
            </SessionAccordion>
          )
        })}
      </>
    )
  }

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">Ticketing</h2>
      <p className="mt-1 text-sm text-brown-muted">Age policy, ticket type, and optional checklists.</p>

      <div className="mt-5 space-y-5">
        <div>
          <h3 className="font-display text-sm font-bold text-brown">Age Restriction</h3>
          {!form.ageRestriction && (
            <p className="mt-1 text-xs font-semibold text-maroon">Required — pick one</p>
          )}
          <div className="mt-2 grid grid-cols-3 gap-2">
            {AGE_OPTIONS.map((opt) => {
              const selected = form.ageRestriction === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateForm({ ageRestriction: opt.id })}
                  className={`rounded-[14px] border-2 px-2 py-3 text-xs font-bold transition ${
                    selected
                      ? 'border-orange bg-orange/10 text-orange'
                      : `border-brown/10 ${TICKET_TILE_IDLE}`
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brown">How are people getting in?</h3>
          <div className="mt-2 space-y-2">
            {TICKETING_MODES.map((mode) => {
              const selected = form.ticketingMode === mode.id
              return (
                <label
                  key={mode.id}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[14px] border-2 px-3 py-2.5 transition ${
                    selected
                      ? 'border-orange bg-orange/10'
                      : TICKET_TILE_IDLE
                  }`}
                >
                  <input
                    type="radio"
                    name="ticketing-mode"
                    checked={selected}
                    onChange={() => setTicketingMode(mode.id)}
                    className="mt-1 accent-orange"
                  />
                  <span>
                    <span className={`block text-sm font-bold ${selected ? 'text-orange' : 'text-brown'}`}>
                      {mode.label}
                    </span>
                    <span className="block text-[10px] text-brown-muted">{mode.description}</span>
                  </span>
                </label>
              )
            })}
          </div>

          {form.ticketingMode === 'external' && (
            <div className="relative mt-3 h-11 w-full">
              <ExternalLink
                size={14}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-brown-muted"
              />
              <TextInput
                value={form.externalTicketUrl}
                onChange={(externalTicketUrl) => updateForm({ externalTicketUrl })}
                placeholder="https://tickets.example.com/your-event"
                className="pl-9"
              />
            </div>
          )}

          {showFreeRsvpFields && (
            <div className="mt-3 space-y-2">
              {multiSession && (
                <p className="text-[11px] leading-relaxed text-brown-muted">
                  Each {multiSlotLabel} has its own capacity pool — selling out 11–1 does not affect 2–4.
                </p>
              )}
              {!multiSession ? (
                <>
                  <CapacityRow
                    value={sessions[0]?.capacity ?? null}
                    onChange={(raw) => handleSessionCapacityChange(0, raw)}
                  />
                  <WaitlistToggle
                    checked={form.waitlistEnabled}
                    onChange={(waitlistEnabled) => updateForm({ waitlistEnabled })}
                  />
                </>
              ) : (
                <>
                  {renderMultiSessionTickets(false)}
                  <WaitlistToggle
                    checked={form.waitlistEnabled}
                    onChange={(waitlistEnabled) => updateForm({ waitlistEnabled })}
                  />
                </>
              )}
            </div>
          )}

          {showTierBuilder && (
            <div className="mt-3 space-y-3">
              {multiSession && (
                <p className="text-[11px] leading-relaxed text-brown-muted">
                  Set capacity and tiers for each {multiSlotLabel}. Adult and Child share seats within a slot —
                  e.g. 12 Adult + 8 Child = 20 for that seating only.
                </p>
              )}
              {!multiSession ? (
                <>
                  <CapacityRow
                    value={sessions[0]?.capacity ?? null}
                    onChange={(raw) => handleSessionCapacityChange(0, raw)}
                  />
                  <div className="space-y-3">
                    {(sessions[0]?.tiers ?? []).map((tier, tierIndex) => (
                      <TierEditor
                        key={tier.id}
                        tier={tier}
                        index={tierIndex}
                        canRemove={(sessions[0]?.tiers.length ?? 0) > 1}
                        donationMode={form.ticketingMode === 'free_donation'}
                        onUpdate={(partial) => updateSessionTier(0, tier.id, partial)}
                        onRemove={() => removeSessionTier(0, tier.id)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSessionTier(0)}
                    className="flex items-center gap-1 text-sm font-bold text-orange"
                  >
                    <Plus size={16} />
                    Add Another Price Tier
                  </button>
                </>
              ) : (
                renderMultiSessionTickets(true)
              )}
              {form.ticketingMode === 'free_donation' && (
                <ZeffyUrlField
                  value={form.externalTicketUrl}
                  onChange={(externalTicketUrl) => updateForm({ externalTicketUrl })}
                />
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brown">Attendee Checklist</h3>
          <div className="mt-2">
            <ChecklistBuilder
              checklist={form.checklist}
              onChange={(checklist) => updateForm({ checklist })}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function SessionAccordion({
  expanded,
  summary,
  onToggle,
  children,
  isTemplate,
  showLockToggle,
  locked,
  onLockedChange,
}: {
  expanded: boolean
  summary: string
  onToggle: () => void
  children: React.ReactNode
  isTemplate?: boolean
  showLockToggle?: boolean
  locked?: boolean
  onLockedChange?: (locked: boolean) => void
}) {
  return (
    <div className={`overflow-hidden ${TICKET_PANEL}`}>
      <div className="flex min-h-11 items-center gap-1 pr-1">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {isTemplate && (
              <span className="shrink-0 rounded-full bg-orange/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange">
                Template
              </span>
            )}
            <span
              className={`min-w-0 truncate text-xs ${expanded ? 'font-bold text-brown' : 'text-brown-muted'}`}
            >
              {summary}
            </span>
          </span>
          {expanded ? (
            <ChevronUp size={16} className="shrink-0 text-brown-muted" />
          ) : (
            <ChevronDown size={16} className="shrink-0 text-brown-muted" />
          )}
        </button>
        {showLockToggle && (
          <label
            className="flex shrink-0 cursor-pointer items-center gap-1.5 pr-2 text-xs font-medium text-brown"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={locked}
              onChange={(e) => onLockedChange?.(e.target.checked)}
              className="h-4 w-4 rounded accent-orange"
            />
            Locked
          </label>
        )}
      </div>
      {expanded && <div className="space-y-3 border-t border-brown/10 px-3 pb-3 pt-2">{children}</div>}
    </div>
  )
}

function CapacityRow({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (raw: string) => void
  disabled?: boolean
}) {
  const missing = value == null || value <= 0
  return (
    <div className={`flex items-center gap-2 ${disabled ? 'opacity-60' : ''}`}>
      <span className="w-16 shrink-0 text-xs font-semibold text-brown-muted">
        Capacity{missing && !disabled && <span className="text-maroon">*</span>}
      </span>
      <TextInput
        value={value == null ? '' : value.toString()}
        onChange={onChange}
        placeholder="20"
        className="max-w-[88px]"
        disabled={disabled}
      />
    </div>
  )
}

function WaitlistToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-xs font-medium text-brown">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-orange"
      />
      Waitlist when full
    </label>
  )
}

function TierEditor({
  tier,
  index,
  canRemove,
  donationMode,
  disabled,
  onUpdate,
  onRemove,
}: {
  tier: TicketTier
  index: number
  canRemove: boolean
  donationMode?: boolean
  disabled?: boolean
  onUpdate: (partial: Partial<TicketTier>) => void
  onRemove: () => void
}) {
  const priceDisplay = tier.priceCents === 0 ? 'FREE' : `$${(tier.priceCents / 100).toFixed(2)}`

  function handlePriceChange(raw: string) {
    const cleaned = raw.replace(/[^0-9.]/g, '')
    if (cleaned === '' || cleaned.toLowerCase() === 'free') {
      onUpdate({ priceCents: 0 })
      return
    }
    const dollars = parseFloat(cleaned)
    if (!Number.isNaN(dollars)) {
      onUpdate({ priceCents: Math.round(Math.min(dollars, 9999) * 100) })
    }
  }

  return (
    <div className={`${TICKET_PANEL} p-3 ${disabled ? 'opacity-60' : ''}`}>
      {index > 0 && !disabled && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="text-brown-muted disabled:opacity-30"
            aria-label="Remove tier"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      <div className="grid grid-cols-[1fr_5.75rem] grid-rows-[auto_auto] gap-x-2 gap-y-1.5">
        <FieldLabel required className="mb-0">
          Tier Name
        </FieldLabel>
        <FieldLabel required className="mb-0 whitespace-nowrap">
          {donationMode ? 'Suggested' : 'Price'}
        </FieldLabel>
        <TextInput
          value={tier.name}
          onChange={(name) => onUpdate({ name })}
          placeholder={donationMode ? 'Supporter' : 'e.g. General Admission'}
          disabled={disabled}
        />
        <TextInput
          value={tier.priceCents === 0 ? 'FREE' : (tier.priceCents / 100).toString()}
          onChange={handlePriceChange}
          placeholder={donationMode ? '5' : 'FREE'}
          disabled={disabled}
          className="px-2 text-center font-bold"
        />
      </div>
      <div className="mt-2">
        <TextInput
          value={tier.description}
          onChange={(description) => onUpdate({ description })}
          placeholder="Description (e.g. Includes 1 drink ticket)"
          disabled={disabled}
        />
      </div>
      {!donationMode && (
        <label className={`mt-2 flex items-center gap-2 text-xs font-medium text-brown ${disabled ? 'pointer-events-none' : ''}`}>
          <input
            type="checkbox"
            checked={tier.availableAtDoor}
            onChange={(e) => onUpdate({ availableAtDoor: e.target.checked })}
            disabled={disabled}
            className="h-4 w-4 rounded accent-orange"
          />
          Available at Door
        </label>
      )}
      {tier.priceCents === 0 && (
        <p className="mt-1 text-[10px] text-success-deep">
          Free tier — attendees will RSVP on the event card
        </p>
      )}
      {tier.priceCents > 0 && (
        <p className="mt-1 text-[10px] text-brown-muted">Current price: {priceDisplay}</p>
      )}
    </div>
  )
}

function ZeffyUrlField({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  return (
    <div className={`${TICKET_PANEL} p-3`}>
      <FieldLabel htmlFor="zeffy-donation-url">Zeffy donation page</FieldLabel>
      <FieldHelper className="mb-2">
        Optional — paste your Zeffy campaign link. Guests will see an RSVP &amp; donate button on
        Discover.
      </FieldHelper>
      <div className="relative">
        <ExternalLink
          size={14}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-brown-muted"
          aria-hidden
        />
        <TextInput
          value={value}
          onChange={onChange}
          placeholder="https://www.zeffy.com/en-CA/your-event"
          className="pl-9"
        />
      </div>
    </div>
  )
}
