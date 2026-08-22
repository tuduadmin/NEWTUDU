import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Hash, Search, User, Building2, X } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FormField } from '../../components/FormFields'
import { EVENT_CATEGORIES, REPEAT_OPTIONS, getCategoryById, type EventCategoryId } from '../../data/eventCategories'
import type { HostEventFormData, TicketingMode, TicketTier } from '../../lib/account'
import { getFormAllPhotos, MAX_EVENT_PHOTOS_TOTAL } from '../../lib/account'
import type { HostEvent } from '../../lib/account'
import { defaultTicketTier } from '../../lib/account'
import {
  createAdminSeededEvent,
  defaultAdminSeedEventForm,
  getSeedTargets,
  resolveSeedTargetFromQuery,
  type SeedTarget,
} from '../../lib/adminSeed'
import {
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminBorderTypePicker,
  EventCardBorderLegend,
} from '../../components/admin/AdminUI'
import SharePublishModal from '../../components/SharePublishModal'
import type { EventCardBorderType } from '../../lib/eventCardColors'
import {
  getBorderLegendAccentStyle,
  getSeedBorderOptionLabel,
} from '../../lib/eventCardColors'
import { KEYWORD_SUGGESTIONS } from '../../lib/keywordAnalytics'
import type { SeedTargetType } from '../../lib/adminSeed'

const TICKETING_MODES: { id: TicketingMode; label: string }[] = [
  { id: 'free_rsvp', label: 'Free RSVP' },
  { id: 'free_donation', label: 'Free / Donation' },
  { id: 'sell', label: 'Sell tickets' },
  { id: 'external', label: 'External link' },
]

const EVENT_TYPES: { id: HostEventFormData['eventType']; label: string }[] = [
  { id: 'single', label: 'Single day' },
  { id: 'multi-day', label: 'Multi-day' },
  { id: 'seasonal', label: 'Seasonal range' },
]

export default function AdminSeedEventCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefilledTarget = useMemo(
    () => resolveSeedTargetFromQuery(searchParams),
    [searchParams],
  )
  const targets = useMemo(() => getSeedTargets(), [])
  const [targetKind, setTargetKind] = useState<SeedTargetType>(
    () => prefilledTarget?.type ?? 'personal',
  )
  const [targetSearch, setTargetSearch] = useState('')
  const eventPanelRef = useRef<HTMLDivElement>(null)
  const kindTargets = useMemo(
    () => targets.filter((t) => t.type === targetKind),
    [targets, targetKind],
  )
  const filteredTargets = useMemo(() => {
    const q = targetSearch.trim().toLowerCase()
    if (!q) return kindTargets
    return kindTargets.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.tierLabel.toLowerCase().includes(q),
    )
  }, [kindTargets, targetSearch])

  const [targetKey, setTargetKey] = useState(() =>
    prefilledTarget ? `${prefilledTarget.type}:${prefilledTarget.id}` : '',
  )

  const [form, setForm] = useState<HostEventFormData>(defaultAdminSeedEventForm)
  const [publishLive, setPublishLive] = useState(true)
  const [saveAsDraft, setSaveAsDraft] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [discoverBorderType, setDiscoverBorderType] = useState<EventCardBorderType>('green')
  const [borderOverrideOpen, setBorderOverrideOpen] = useState(false)
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [shareEvent, setShareEvent] = useState<HostEvent | null>(null)

  const selectedTarget = useMemo((): SeedTarget | null => {
    const [type, ...rest] = targetKey.split(':')
    const id = rest.join(':')
    return targets.find((t) => t.type === type && t.id === id) ?? null
  }, [targetKey, targets])

  useEffect(() => {
    if (!prefilledTarget) return
    setTargetKind(prefilledTarget.type)
    setTargetKey(`${prefilledTarget.type}:${prefilledTarget.id}`)
    setTargetSearch('')
  }, [prefilledTarget])

  function selectTarget(target: SeedTarget) {
    setTargetKind(target.type)
    setTargetKey(`${target.type}:${target.id}`)
    setTargetSearch('')
    window.requestAnimationFrame(() => {
      eventPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function clearTarget() {
    setTargetKey('')
    setTargetSearch('')
  }

  const showTargetResults = targetSearch.trim().length > 0 || !selectedTarget

  useEffect(() => {
    if (selectedTarget?.suggestedBorderType) {
      setDiscoverBorderType(selectedTarget.suggestedBorderType)
      setBorderOverrideOpen(false)
    }
  }, [selectedTarget])

  const matchedBorderSwatch = getBorderLegendAccentStyle(discoverBorderType).swatch
  const matchedBorderLabel = getSeedBorderOptionLabel(discoverBorderType)

  const primaryCategory = getCategoryById(form.primaryCategory as EventCategoryId)
  const secondaryCategory = getCategoryById(form.secondaryCategory as EventCategoryId)
  const subcategoryOptions = [
    ...(primaryCategory?.subcategories ?? []),
    ...(secondaryCategory?.subcategories ?? []),
  ]

  function updateForm(partial: Partial<HostEventFormData>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function addPhotoUrl() {
    const url = photoUrl.trim()
    const allPhotos = getFormAllPhotos(form)
    if (!url || allPhotos.length >= MAX_EVENT_PHOTOS_TOTAL) return
    if (!form.coverImage) {
      updateForm({ coverImage: url })
    } else {
      updateForm({ additionalPhotos: [...form.additionalPhotos, url] })
    }
    setPhotoUrl('')
  }

  function toggleSubCategory(tag: string) {
    const current = form.subCategories
    if (current.includes(tag)) {
      updateForm({ subCategories: current.filter((t) => t !== tag) })
    } else if (current.length < 3) {
      updateForm({ subCategories: [...current, tag] })
    }
  }

  function addCustomTag(value?: string) {
    const trimmed = (value ?? tagInput).trim().toLowerCase().replace(/\s+/g, '-')
    if (!trimmed || form.customTags.includes(trimmed)) return
    updateForm({ customTags: [...form.customTags, trimmed] })
    setTagInput('')
  }

  function updateTicketTier(index: number, partial: Partial<TicketTier>) {
    const tiers = [...form.ticketTiers]
    tiers[index] = { ...tiers[index], ...partial }
    updateForm({ ticketTiers: tiers })
  }

  function addTicketTier() {
    if (form.ticketTiers.length >= 5) return
    updateForm({ ticketTiers: [...form.ticketTiers, defaultTicketTier()] })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedTarget) {
      setError('Select a target user or host organization.')
      return
    }
    if (!form.title.trim()) {
      setError('Event title is required.')
      return
    }

    const result = createAdminSeededEvent({
      target: selectedTarget,
      form,
      publishLive: form.visibility === 'public' && publishLive && !saveAsDraft,
      saveAsDraft,
      promoCode: promoCode.trim() || undefined,
      discoverBorderType,
    })

    if (!result.ok) {
      setError(result.error ?? 'Could not create event.')
      return
    }

    if (result.event && form.visibility === 'public' && publishLive && !saveAsDraft) {
      setShareEvent(result.event)
      return
    }

    navigate('/admin/content?view=seed-events')
  }

  const tagSuggestions = KEYWORD_SUGGESTIONS.filter(
    (s) => !form.customTags.includes(s) && s.includes(tagInput.toLowerCase()),
  ).slice(0, 6)

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        title="Create seed event"
        subtitle="Post on behalf of a user or host org. Tier limits are bypassed for platform-seeded content."
        actions={
          <Link to="/admin/content?view=seed-events" className="admin-btn admin-btn-ghost no-underline">
            ← Back
          </Link>
        }
      />

      {targets.length === 0 && (
        <AdminPanel className="mb-4 border-[var(--admin-warning)]/30 bg-[rgba(245,158,11,0.08)]">
          <p className="text-xs text-[var(--admin-warning)]">
            No users or host accounts in localStorage yet. Sign up a demo user or create a host org first.
          </p>
        </AdminPanel>
      )}

      {prefilledTarget && selectedTarget && (
        <AdminPanel className="mb-4 border-[var(--admin-accent)]/25 bg-[var(--admin-accent-muted)]">
          <p className="text-xs text-[var(--admin-text-muted)]">
            Linked from profile — posting as{' '}
            <span className="font-semibold text-[var(--admin-text)]">{selectedTarget.label}</span>
          </p>
        </AdminPanel>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AdminPanel className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-accent)]">
              Step 1
            </p>
            <h2 className="mt-1 text-sm font-semibold text-[var(--admin-text)]">Post on behalf of</h2>
            <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
              Search for a user or org, then click a name to load the event form below.
            </p>
          </div>

          <div>
            <span className="admin-label">Host type</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'personal' as const, label: 'User', icon: User },
                  { id: 'org' as const, label: 'Org', icon: Building2 },
                ] as const
              ).map((kind) => {
                const Icon = kind.icon
                return (
                  <button
                    key={kind.id}
                    type="button"
                    onClick={() => {
                      setTargetKind(kind.id)
                      if (selectedTarget && selectedTarget.type !== kind.id) {
                        clearTarget()
                      }
                    }}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-[var(--admin-radius)] border px-2 py-2 text-xs font-semibold transition ${
                      targetKind === kind.id
                        ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-muted)] text-[var(--admin-accent)]'
                        : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-text-dim)]'
                    }`}
                  >
                    <Icon size={14} />
                    {kind.label}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedTarget ? (
            <div className="rounded-[var(--admin-radius)] border border-[var(--admin-accent)]/35 bg-[var(--admin-accent-muted)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-accent)]">
                    Selected {selectedTarget.type === 'personal' ? 'user' : 'org'}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--admin-text)]">
                    {selectedTarget.label}
                  </p>
                  {selectedTarget.email ? (
                    <p className="truncate text-xs text-[var(--admin-text-dim)]">
                      {selectedTarget.email}
                    </p>
                  ) : null}
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--admin-text-muted)]">
                    <span
                      className="inline-block h-2 w-2 rounded-full ring-1 ring-[var(--admin-border-subtle)]"
                      style={{ backgroundColor: selectedTarget.tierColor }}
                      aria-hidden
                    />
                    {selectedTarget.tierLabel}
                  </span>
                </div>
                <AdminButton type="button" variant="ghost" className="shrink-0 px-2 py-1 text-[11px]" onClick={clearTarget}>
                  Change
                </AdminButton>
              </div>
            </div>
          ) : null}

          {showTargetResults ? (
            <div>
              <label htmlFor="seed-target-search" className="admin-label">
                Search {targetKind === 'personal' ? 'users' : 'organizations'}
              </label>
              <div className="relative mt-2">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[var(--admin-text-dim)]"
                  aria-hidden
                />
                <AdminInput
                  id="seed-target-search"
                  value={targetSearch}
                  onChange={(e) => setTargetSearch(e.target.value)}
                  placeholder={
                    targetKind === 'personal'
                      ? 'Name, email, or user id…'
                      : 'Org name or id…'
                  }
                  className="admin-input-search"
                  autoFocus={!selectedTarget}
                />
              </div>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-[var(--admin-radius)] border border-[var(--admin-border)]">
                {filteredTargets.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-[var(--admin-text-dim)]">
                    No {targetKind === 'personal' ? 'users' : 'orgs'} match — try a different search
                  </p>
                ) : (
                  filteredTargets.map((t) => (
                    <button
                      key={`${t.type}:${t.id}`}
                      type="button"
                      onClick={() => selectTarget(t)}
                      className="flex w-full items-start justify-between gap-3 border-b border-[var(--admin-border-subtle)] px-3 py-2.5 text-left last:border-b-0 hover:bg-[var(--admin-bg)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--admin-text)]">
                          {t.label}
                        </p>
                        {t.email ? (
                          <p className="truncate text-[10px] text-[var(--admin-text-dim)]">
                            {t.email}
                          </p>
                        ) : null}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-[var(--admin-text-muted)]">
                        <span
                          className="inline-block h-2 w-2 rounded-full ring-1 ring-[var(--admin-border-subtle)]"
                          style={{ backgroundColor: t.tierColor }}
                          aria-hidden
                        />
                        {t.tierLabel}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {!targetSearch.trim() && filteredTargets.length > 0 ? (
                <p className="mt-2 text-[10px] text-[var(--admin-text-dim)]">
                  Showing all {targetKind === 'personal' ? 'users' : 'orgs'} — type to narrow results
                </p>
              ) : null}
            </div>
          ) : null}
        </AdminPanel>

        {!selectedTarget ? (
          <AdminPanel className="border-dashed py-10 text-center">
            <p className="text-sm font-medium text-[var(--admin-text-muted)]">
              Select a user or org above to create an event
            </p>
            <p className="mt-1 text-xs text-[var(--admin-text-dim)]">
              Event details, schedule, and ticketing unlock after you pick a host.
            </p>
          </AdminPanel>
        ) : (
          <>
        <div ref={eventPanelRef}>
        <AdminPanel className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-accent)]">
              Step 2
            </p>
            <h2 className="mt-1 text-sm font-semibold text-[var(--admin-text)]">Create event</h2>
            <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
              Posting as{' '}
              <span className="font-semibold text-[var(--admin-text)]">{selectedTarget.label}</span>
              {selectedTarget.email ? (
                <span className="text-[var(--admin-text-dim)]"> ({selectedTarget.email})</span>
              ) : null}
            </p>
          </div>

          <details className="rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] px-3 py-2">
            <summary className="cursor-pointer text-[11px] font-medium text-[var(--admin-text-muted)]">
              Border color reference
            </summary>
            <EventCardBorderLegend className="mt-3" />
          </details>

          <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="admin-label mb-1">Deck border</p>
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--admin-text)]">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-[var(--admin-border-subtle)]"
                    style={matchedBorderSwatch}
                    aria-hidden
                  />
                  {matchedBorderLabel}
                  <span className="text-[var(--admin-text-dim)]">· auto-matched to host tier</span>
                </span>
              </div>
              <AdminButton
                type="button"
                variant="ghost"
                className="px-2 py-1 text-[11px]"
                onClick={() => {
                  if (borderOverrideOpen && selectedTarget?.suggestedBorderType) {
                    setDiscoverBorderType(selectedTarget.suggestedBorderType)
                  }
                  setBorderOverrideOpen((open) => !open)
                }}
              >
                {borderOverrideOpen ? 'Use auto-match' : 'Override'}
              </AdminButton>
            </div>
            {borderOverrideOpen ? (
              <AdminBorderTypePicker
                className="mt-3 border-t border-[var(--admin-border-subtle)] pt-3"
                value={discoverBorderType}
                onChange={setDiscoverBorderType}
              />
            ) : null}
          </div>

          <FormField id="title" label="Event title" variant="dark">
            <AdminInput
              id="title"
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              required
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="venue" label="Venue name" variant="dark">
              <AdminInput
                id="venue"
                value={form.venueName}
                onChange={(e) => updateForm({ venueName: e.target.value })}
              />
            </FormField>
            <FormField id="city" label="City" variant="dark">
              <AdminInput
                id="city"
                value={form.city}
                onChange={(e) => updateForm({ city: e.target.value })}
                required
              />
            </FormField>
          </div>

          <FormField id="address" label="Street address" variant="dark">
            <AdminInput
              id="address"
              value={form.streetAddress}
              onChange={(e) => updateForm({ streetAddress: e.target.value })}
            />
          </FormField>

          <FormField id="description" label="Description" variant="dark">
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              className="admin-input min-h-[96px] resize-y"
            />
          </FormField>
        </AdminPanel>

        <AdminPanel className="space-y-4">
          <p className="admin-label">Schedule</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => updateForm({ eventType: type.id })}
                className={`rounded-[var(--admin-radius)] border px-2 py-2 text-xs font-semibold transition ${
                  form.eventType === type.id
                    ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-muted)] text-[var(--admin-accent)]'
                    : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-text-dim)]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="eventDate" label="Start date" variant="dark">
              <AdminInput
                id="eventDate"
                type="date"
                value={form.eventDate}
                onChange={(e) => updateForm({ eventDate: e.target.value })}
              />
            </FormField>
            <FormField id="repeats" label="Repeats" variant="dark">
              <AdminSelect
                id="repeats"
                value={form.repeats}
                onChange={(e) => updateForm({ repeats: e.target.value as HostEventFormData['repeats'] })}
              >
                {REPEAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </AdminSelect>
            </FormField>
          </div>

          {form.eventType === 'multi-day' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="recurrenceEnd" label="End date" variant="dark">
                <AdminInput
                  id="recurrenceEnd"
                  type="date"
                  value={form.recurrenceEndDate || form.eventDate}
                  onChange={(e) => updateForm({ recurrenceEndDate: e.target.value })}
                />
              </FormField>
            </div>
          )}

          {form.eventType === 'seasonal' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="seasonStart" label="Season start" variant="dark">
                <AdminInput
                  id="seasonStart"
                  type="date"
                  value={form.recurrenceStartDate}
                  onChange={(e) => updateForm({ recurrenceStartDate: e.target.value })}
                />
              </FormField>
              <FormField id="seasonEnd" label="Season end" variant="dark">
                <AdminInput
                  id="seasonEnd"
                  type="date"
                  value={form.recurrenceEndDate}
                  onChange={(e) => updateForm({ recurrenceEndDate: e.target.value })}
                />
              </FormField>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => updateForm({ allDay: e.target.checked })}
              className="h-4 w-4 accent-[var(--admin-accent)]"
            />
            <span className="text-xs text-[var(--admin-text-muted)]">All day event</span>
          </label>

          {!form.allDay && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="admin-label mb-1">Start time</p>
                <div className="flex gap-2">
                  <AdminInput
                    value={form.startHour}
                    onChange={(e) => updateForm({ startHour: e.target.value })}
                    placeholder="12"
                    className="w-16"
                  />
                  <span className="self-center text-[var(--admin-text-dim)]">:</span>
                  <AdminInput
                    value={form.startMinute}
                    onChange={(e) => updateForm({ startMinute: e.target.value })}
                    placeholder="00"
                    className="w-16"
                  />
                  <AdminSelect
                    value={form.startPeriod}
                    onChange={(e) => updateForm({ startPeriod: e.target.value as 'AM' | 'PM' })}
                    className="w-20"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </AdminSelect>
                </div>
              </div>
              <div>
                <p className="admin-label mb-1">End time</p>
                <div className="flex gap-2">
                  <AdminInput
                    value={form.endHour}
                    onChange={(e) => updateForm({ endHour: e.target.value })}
                    placeholder="02"
                    className="w-16"
                  />
                  <span className="self-center text-[var(--admin-text-dim)]">:</span>
                  <AdminInput
                    value={form.endMinute}
                    onChange={(e) => updateForm({ endMinute: e.target.value })}
                    placeholder="00"
                    className="w-16"
                  />
                  <AdminSelect
                    value={form.endPeriod}
                    onChange={(e) => updateForm({ endPeriod: e.target.value as 'AM' | 'PM' })}
                    className="w-20"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </AdminSelect>
                </div>
              </div>
            </div>
          )}
        </AdminPanel>

        <AdminPanel className="space-y-4">
          <p className="admin-label">Categories & keywords</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="category" label="Primary category" variant="dark">
              <AdminSelect
                id="category"
                value={form.primaryCategory}
                onChange={(e) =>
                  updateForm({
                    primaryCategory: e.target.value,
                    secondaryCategory: '',
                    subCategories: [],
                  })
                }
              >
                <option value="">Select category</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </AdminSelect>
            </FormField>
            <FormField id="secondaryCategory" label="Secondary category" variant="dark">
              <AdminSelect
                id="secondaryCategory"
                value={form.secondaryCategory}
                onChange={(e) => updateForm({ secondaryCategory: e.target.value, subCategories: [] })}
                disabled={!form.primaryCategory}
              >
                <option value="">Optional</option>
                {EVENT_CATEGORIES.filter((c) => c.id !== form.primaryCategory).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </AdminSelect>
            </FormField>
          </div>

          {subcategoryOptions.length > 0 && (
            <div>
              <p className="admin-label mb-2">Subcategories (max 3)</p>
              <div className="flex flex-wrap gap-2">
                {subcategoryOptions.map((sub) => {
                  const selected = form.subCategories.includes(sub)
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubCategory(sub)}
                      className={`rounded-[var(--admin-radius)] border px-2 py-1 text-[11px] font-medium transition ${
                        selected
                          ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-muted)] text-[var(--admin-accent)]'
                          : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-text-dim)]'
                      }`}
                    >
                      {sub}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Hash size={12} className="text-[var(--admin-accent)]" />
              <span className="admin-label">Keywords / hashtags</span>
            </div>
            <p className="mb-2 text-[10px] text-[var(--admin-text-dim)]">
              e.g. wing-night, cheap-wings — powers discover search
            </p>
            <div className="flex gap-2">
              <AdminInput
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomTag()
                  }
                }}
                placeholder="Add keyword…"
                className="flex-1"
              />
              <AdminButton type="button" variant="secondary" onClick={() => addCustomTag()}>
                Add
              </AdminButton>
            </div>
            {tagInput && tagSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tagSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addCustomTag(s)}
                    className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-2 py-0.5 text-[10px] text-[var(--admin-text-muted)] hover:border-[var(--admin-accent)]"
                  >
                    #{s}
                  </button>
                ))}
              </div>
            )}
            {form.customTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.customTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-[var(--admin-radius)] bg-[var(--admin-accent-muted)] px-2 py-0.5 text-[11px] text-[var(--admin-accent)]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => updateForm({ customTags: form.customTags.filter((t) => t !== tag) })}
                      aria-label={`Remove ${tag}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel className="space-y-4">
          <p className="admin-label">Ticketing</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="visibility" label="Visibility" variant="dark">
              <AdminSelect
                id="visibility"
                value={form.visibility}
                onChange={(e) => updateForm({ visibility: e.target.value as 'public' | 'private' })}
              >
                <option value="public">Public — discover deck</option>
                <option value="private">Private — invite link only</option>
              </AdminSelect>
            </FormField>
            <FormField id="ticketing" label="Ticketing mode" variant="dark">
              <AdminSelect
                id="ticketing"
                value={form.ticketingMode}
                onChange={(e) => updateForm({ ticketingMode: e.target.value as TicketingMode })}
              >
                {TICKETING_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </AdminSelect>
            </FormField>
          </div>

          {form.ticketingMode === 'external' && (
            <FormField id="externalUrl" label="External ticket URL" variant="dark">
              <AdminInput
                id="externalUrl"
                value={form.externalTicketUrl}
                onChange={(e) => updateForm({ externalTicketUrl: e.target.value })}
                placeholder="https://tickets.example.com/..."
              />
            </FormField>
          )}

          {(form.ticketingMode === 'sell' || form.ticketingMode === 'free_donation') && (
            <div className="space-y-3">
              {form.ticketTiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="grid gap-2 rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] p-2 sm:grid-cols-4"
                >
                  <AdminInput
                    value={tier.name}
                    onChange={(e) => updateTicketTier(index, { name: e.target.value })}
                    placeholder="Tier name"
                  />
                  <AdminInput
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.priceCents / 100 || ''}
                    onChange={(e) =>
                      updateTicketTier(index, {
                        priceCents: Math.round(parseFloat(e.target.value || '0') * 100),
                      })
                    }
                    placeholder="Price ($)"
                  />
                  <AdminInput
                    type="number"
                    min={1}
                    value={tier.quantity ?? ''}
                    onChange={(e) =>
                      updateTicketTier(index, {
                        quantity: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    placeholder="Capacity"
                  />
                </div>
              ))}
              <AdminButton type="button" variant="ghost" onClick={addTicketTier}>
                + Add tier
              </AdminButton>
            </div>
          )}

          {(form.ticketingMode === 'free_rsvp' || form.ticketingMode === 'free_donation') && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="capacity" label="RSVP capacity" variant="dark">
                <AdminInput
                  id="capacity"
                  type="number"
                  min={1}
                  value={form.capacity ?? ''}
                  onChange={(e) =>
                    updateForm({
                      capacity: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder="Unlimited"
                />
              </FormField>
              <label className="flex cursor-pointer items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={form.waitlistEnabled}
                  onChange={(e) => updateForm({ waitlistEnabled: e.target.checked })}
                  className="h-4 w-4 accent-[var(--admin-accent)]"
                />
                <span className="text-xs text-[var(--admin-text-muted)]">Enable waitlist</span>
              </label>
            </div>
          )}
        </AdminPanel>

        <AdminPanel className="space-y-4">
          <FormField id="photos" label="Photos (image URLs, up to 3)" variant="dark">
            <div className="flex gap-2">
              <AdminInput
                id="photos"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
              <AdminButton
                type="button"
                variant="secondary"
                onClick={addPhotoUrl}
                disabled={getFormAllPhotos(form).length >= MAX_EVENT_PHOTOS_TOTAL}
              >
                Add
              </AdminButton>
            </div>
          </FormField>
          {getFormAllPhotos(form).length > 0 && (
            <ul className="flex gap-2">
              {getFormAllPhotos(form).map((url, i) => (
                <li key={url} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded-[var(--admin-radius)] object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      if (i === 0) {
                        updateForm({
                          coverImage: form.additionalPhotos[0] ?? '',
                          additionalPhotos: form.additionalPhotos.slice(1),
                        })
                      } else {
                        updateForm({
                          additionalPhotos: form.additionalPhotos.filter((_, idx) => idx !== i - 1),
                        })
                      }
                    }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-[var(--admin-radius)] bg-[var(--admin-danger)] text-[10px] text-white"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {form.visibility === 'public' && (
            <>
              <label className="flex cursor-pointer items-center gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-3 py-2">
                <input
                  type="checkbox"
                  checked={saveAsDraft}
                  onChange={(e) => {
                    setSaveAsDraft(e.target.checked)
                    if (e.target.checked) setPublishLive(false)
                  }}
                  className="h-4 w-4 accent-[var(--admin-accent)]"
                />
                <span className="text-xs text-[var(--admin-text-muted)]">
                  Save as draft — stays in Seed events until you send it to the host for review
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-3 py-2">
                <input
                  type="checkbox"
                  checked={publishLive}
                  disabled={saveAsDraft}
                  onChange={(e) => setPublishLive(e.target.checked)}
                  className="h-4 w-4 accent-[var(--admin-accent)]"
                />
                <span className="text-xs text-[var(--admin-text-muted)]">
                  Set status to live when created — still requires host or admin approval before Discover
                </span>
              </label>
            </>
          )}

          <FormField id="promoCode" label="Promo code (optional)" variant="dark">
            <AdminInput
              id="promoCode"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="FARAWAY10"
            />
          </FormField>

          {error && (
            <p className="text-xs text-[var(--admin-danger)]" role="alert">
              {error}
            </p>
          )}
        </AdminPanel>
        </div>
          </>
        )}

        <AdminButton
          type="submit"
          variant="primary"
          className="w-full py-2"
          disabled={!selectedTarget || targets.length === 0}
        >
          Create seeded event
        </AdminButton>
      </form>

      <SharePublishModal
        open={!!shareEvent}
        event={shareEvent}
        onClose={() => {
          setShareEvent(null)
          navigate('/admin/content?view=seed-events')
        }}
        variant="admin"
        publishedJustNow
      />
    </div>
  )
}
