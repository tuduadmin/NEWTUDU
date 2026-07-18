import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  MapPin,
  User,
} from 'lucide-react'
import { useState } from 'react'
import type { HostEventFormData } from '../../lib/account'
import { getAgeRestrictionLabel } from '../../lib/account'
import { getCategoryById, type EventCategoryId } from '../../data/eventCategories'

type ReviewStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
  hostName: string
  onEditStep: (step: number) => void
}

export default function ReviewStep({ form, updateForm, hostName, onEditStep }: ReviewStepProps) {
  const [checklistOpen, setChecklistOpen] = useState(true)
  const primary = getCategoryById(form.primaryCategory as EventCategoryId)
  const secondary = getCategoryById(form.secondaryCategory as EventCategoryId)

  const missingTitle = !form.title.trim()
  const missingVenue = !form.venueName.trim()
  const missingAbout = !form.description.trim()
  const missingDate = !form.eventDate
  const missingAge = !form.ageRestriction

  const lowestPrice = form.ticketTiers.reduce(
    (min, t) => (t.priceCents < min ? t.priceCents : min),
    form.ticketTiers[0]?.priceCents ?? 0,
  )
  const costLabel = lowestPrice === 0 ? 'RSVP' : `$${(lowestPrice / 100).toFixed(0)}`

  const formattedDate = form.eventDate
    ? new Date(form.eventDate + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No date selected'

  const locationLine = [form.venueName, form.city].filter(Boolean).join(', ') || 'Location TBD'

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">Review &amp; Publish</h2>
      <p className="mt-1 text-sm text-brown-muted">Double-check everything before going live.</p>

      <article className="shadow-event-blue mt-5 overflow-hidden rounded-[var(--radius-xl)] bg-white">
        <div className="aspect-[3/4] max-h-48 w-full overflow-hidden bg-gradient-to-br from-maroon to-orange">
          {form.photos[0] ? (
            <img src={form.photos[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">
              <span className="text-sm">No poster</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple text-xs font-bold text-white">
              {hostName.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-sm font-bold text-brown">{hostName}</span>
            <BadgeCheck size={16} className="text-electric-blue" />
          </div>
          <p className="mt-2 font-display text-sm font-bold text-orange">{formattedDate}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-brown-muted">
            <MapPin size={12} className="text-maroon" />
            {locationLine}
          </p>
          <hr className="my-3 border-brown/10" />
          <div className="flex items-center gap-3 text-xs text-brown-muted">
            <span>{costLabel === 'RSVP' ? '💲 RSVP' : `💲 ${costLabel}`}</span>
            <span className="flex items-center gap-1">
              <User size={12} />
              {form.ageRestriction ? getAgeRestrictionLabel(form.ageRestriction) : 'Not set'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {primary && <CategoryPill label={primary.label} />}
            {secondary && <CategoryPill label={secondary.label} muted />}
          </div>
        </div>
      </article>

      <div className="mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-brown/10 bg-white">
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
              hasIssue={missingTitle || missingVenue || missingAbout}
              onEdit={() => onEditStep(1)}
            >
              <CheckItem label="Title" value={form.title.trim() || 'Missing'} missing={missingTitle} />
              <CheckItem label="Venue" value={form.venueName.trim() || 'Missing'} missing={missingVenue} />
              <CheckItem label="About" value={form.description.trim() ? `${form.description.slice(0, 40)}…` : 'Missing'} missing={missingAbout} />
              <CheckItem
                label="Poster"
                value={form.photos.length ? `${form.photos.length} photo(s)` : 'No poster (optional)'}
                warning={form.photos.length === 0}
              />
            </ChecklistSection>

            <ChecklistSection title="Schedule" hasIssue={missingDate} onEdit={() => onEditStep(2)}>
              <CheckItem
                label="Date"
                value={form.eventDate ? formattedDate : 'No date selected'}
                missing={missingDate}
              />
              {form.repeats !== 'none' && (
                <CheckItem
                  label="Recurrence"
                  value={`${form.recurrenceStartDate || '?'} → ${form.recurrenceEndDate || '?'}`}
                  warning={!form.recurrenceStartDate || !form.recurrenceEndDate}
                />
              )}
            </ChecklistSection>

            <ChecklistSection
              title="Categories"
              hasIssue={!primary || !secondary}
              onEdit={() => onEditStep(3)}
              ok={!!primary && !!secondary}
            >
              {primary && secondary ? (
                <div className="flex flex-wrap gap-2">
                  <CategoryPill label={primary.label} />
                  <CategoryPill label={secondary.label} muted />
                </div>
              ) : (
                <p className="text-sm italic text-maroon">Categories not complete</p>
              )}
            </ChecklistSection>

            <ChecklistSection title="Ticketing & Details" hasIssue={missingAge} onEdit={() => onEditStep(4)}>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Pricing</p>
                {form.ticketTiers.map((tier) => (
                  <p key={tier.id} className="text-sm text-brown">
                    <span className={!tier.name.trim() ? 'italic text-maroon' : ''}>
                      {tier.name.trim() || 'Unnamed tier'}
                    </span>
                    {' · '}
                    <span className="font-bold text-success-deep">
                      {tier.priceCents === 0 ? 'FREE' : `$${(tier.priceCents / 100).toFixed(0)}`}
                    </span>
                    {' · '}
                    {tier.quantity == null ? '∞' : tier.quantity}
                  </p>
                ))}
              </div>
              <p className="mt-2 text-sm text-brown-muted">
                {form.ageRestriction ? getAgeRestrictionLabel(form.ageRestriction) : 'Not set'} ·{' '}
                {form.amenities.length} amenities
              </p>
            </ChecklistSection>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe size={16} className="text-brown" />
          <h3 className="font-display text-sm font-bold text-brown">Visibility</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateForm({ visibility: 'public' })}
            className={`rounded-[var(--radius-lg)] border-2 px-3 py-3 text-left transition ${
              form.visibility === 'public'
                ? 'border-success-deep bg-success/10'
                : 'border-brown/10 bg-white'
            }`}
          >
            <span className={`flex items-center gap-1.5 text-sm font-bold ${form.visibility === 'public' ? 'text-success-deep' : 'text-brown'}`}>
              <Globe size={16} />
              Public
            </span>
            {form.visibility === 'public' && (
              <p className="mt-1 text-[10px] text-brown-muted">Visible to everyone in discovery feeds</p>
            )}
          </button>
          <button
            type="button"
            onClick={() => updateForm({ visibility: 'private' })}
            className={`rounded-[var(--radius-lg)] border-2 px-3 py-3 text-left transition ${
              form.visibility === 'private'
                ? 'border-brown/30 bg-cream-dark'
                : 'border-brown/10 bg-white'
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-bold text-brown">
              <Lock size={16} />
              Private
            </span>
          </button>
        </div>
      </div>
    </section>
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
        {warning && !missing && ' ⚠'}
      </span>
    </p>
  )
}

function CategoryPill({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        muted ? 'bg-cream-dark text-brown-muted' : 'bg-orange/10 text-orange'
      }`}
    >
      {label}
    </span>
  )
}
