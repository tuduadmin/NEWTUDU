import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { FormField } from '../../components/FormFields'
import EventPhotosEditor from '../../components/EventPhotosEditor'
import GeoCoordinatesFields from '../../components/GeoCoordinatesFields'
import { EVENT_CATEGORIES } from '../../data/eventCategories'
import {
  ATTRACTION_CARD_TYPES,
  ATTRACTION_POSTING_OPTIONS,
  DEFAULT_ATTRACTION_IMAGE,
  deleteAttraction,
  formatAttractionPostedDate,
  getAttractionPostingLabel,
  getAttractionVisibilityLabel,
  getAttractions,
  getAttractionDiscoverBorderColor,
  isAttractionStale,
  MAX_ATTRACTION_PHOTOS,
  saveAttraction,
  type Attraction,
  type AttractionCardType,
  type AttractionPosting,
  type AttractionVisibility,
} from '../../lib/attractions'
import { getCurrentUser } from '../../lib/auth'
import {
  AdminBadge,
  AdminButton,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
} from '../../components/admin/AdminUI'
import { ADMIN_ATTRACTION_BORDER_COLOR, ADMIN_SECRET_LIST_BORDER_COLOR } from '../../lib/eventCardColors'

function emptyForm(): Omit<Attraction, 'id' | 'createdAt' | 'seededByAdmin'> {
  return {
    title: '',
    subtitle: '',
    description: '',
    images: [],
    location: { city: 'Saskatoon', venue: '' },
    category: '',
    tags: [],
    cardType: 'attraction',
    posting: 'deck',
    visibility: 'public',
    featured: false,
    promoCode: '',
  }
}

type AdminAttractionsPageProps = {
  embedded?: boolean
}

export default function AdminAttractionsPage({ embedded = false }: AdminAttractionsPageProps) {
  const admin = getCurrentUser()
  const [refreshKey, setRefreshKey] = useState(0)
  const attractions = useMemo(() => getAttractions(), [refreshKey])
  const [editing, setEditing] = useState<Attraction | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
    setError('')
  }

  function openEdit(attraction: Attraction) {
    setEditing(attraction)
    setForm({
      title: attraction.title,
      subtitle: attraction.subtitle ?? '',
      description: attraction.description,
      images: [...attraction.images],
      location: { ...attraction.location },
      category: attraction.category,
      tags: [...attraction.tags],
      cardType: attraction.cardType,
      posting: attraction.posting ?? 'deck',
      visibility: attraction.visibility,
      featured: attraction.featured,
      promoCode: attraction.promoCode ?? '',
    })
    setShowForm(true)
    setError('')
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this attraction?')) return
    deleteAttraction(id)
    refresh()
    if (editing?.id === id) {
      setShowForm(false)
      setEditing(null)
    }
  }

  function addTag() {
    const tag = tagInput.trim()
    if (!tag || form.tags.includes(tag)) return
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
    setTagInput('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!admin) {
      setError('You must be signed in as a platform admin to save attractions.')
      return
    }

    setSaving(true)
    try {
      const result = saveAttraction(
        {
          ...form,
          id: editing?.id,
          images: form.images.length > 0 ? form.images : [DEFAULT_ATTRACTION_IMAGE],
        },
        admin.email,
      )

      if (!result.ok) {
        setError(result.error ?? 'Could not save.')
        return
      }

      setShowForm(false)
      setEditing(null)
      setForm(emptyForm())
      refresh()
    } catch {
      setError('Something went wrong while saving. Try fewer photos or use image URLs.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'admin-input'

  return (
    <div className={embedded ? undefined : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <AdminPageHeader
          title="Attractions"
          subtitle="Partner-pink border deck cards for places and hidden gems. Admin-only seeding."
          actions={
            !showForm ? (
              <AdminButton type="button" variant="primary" onClick={openCreate}>
                <Plus size={16} />
                Add card
              </AdminButton>
            ) : undefined
          }
        />
      )}

      {embedded && !showForm && (
        <div className="mb-4 flex justify-end">
          <AdminButton type="button" variant="primary" onClick={openCreate}>
            <Plus size={16} />
            Add card
          </AdminButton>
        </div>
      )}

      {!showForm && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <AdminPanel style={{ borderColor: `${ADMIN_ATTRACTION_BORDER_COLOR}4d` }}>
            <p className="admin-label" style={{ color: ADMIN_ATTRACTION_BORDER_COLOR }}>
              Card deck
            </p>
            <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
              Partner-pink border in the swipe deck. Posted date turns yellow after 3 months — border
              stays pink. Hero images rotate weekly.
            </p>
          </AdminPanel>
          <AdminPanel style={{ borderColor: `${ADMIN_SECRET_LIST_BORDER_COLOR}4d` }}>
            <p className="admin-label" style={{ color: ADMIN_SECRET_LIST_BORDER_COLOR }}>
              Secret list
            </p>
            <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
              Secret-border cards. Public entries appear in the deck; hidden entries unlock only when
              users search a matching keyword.
            </p>
          </AdminPanel>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminPanel className="space-y-4 border-[var(--admin-accent)]/25">
          <h2 className="text-sm font-semibold text-[var(--admin-accent)]">
            {editing ? 'Edit card' : 'New card'}
          </h2>

          <div>
            <span className="admin-label">Posting</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ATTRACTION_POSTING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setForm((prev) => {
                      const nextPosting = option.id as AttractionPosting
                      let visibility = prev.visibility
                      if (nextPosting === 'deck' && visibility === 'hidden') {
                        visibility = 'public'
                      }
                      if (nextPosting === 'secret' && visibility === 'private') {
                        visibility = 'hidden'
                      }
                      return { ...prev, posting: nextPosting, visibility }
                    })
                  }}
                  className={`rounded-[var(--admin-radius)] border px-2 py-2 text-xs font-semibold transition ${
                    form.posting === option.id
                      ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-muted)] text-[var(--admin-accent)]'
                      : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-text-dim)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[var(--admin-text-dim)]">
              {form.posting === 'deck'
                ? 'Shows in the discover swipe deck with a partner-pink border.'
                : 'Secret-border cards — choose public (deck) or hidden (keyword search only) below.'}
            </p>
          </div>

          <FormField id="attr-title" label="Title" variant="dark">
            <input
              id="attr-title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className={inputClass}
              required
            />
          </FormField>

          <FormField id="attr-subtitle" label="Subtitle (optional)" variant="dark">
            <input
              id="attr-subtitle"
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              className={inputClass}
            />
          </FormField>

          <FormField id="attr-desc" label="Description" variant="dark">
            <textarea
              id="attr-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className={inputClass}
              required
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="attr-city" label="City" variant="dark">
              <input
                id="attr-city"
                value={form.location.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: { ...p.location, city: e.target.value } }))
                }
                className={inputClass}
                required
              />
            </FormField>
            <FormField id="attr-venue" label="Venue / place name" variant="dark">
              <input
                id="attr-venue"
                value={form.location.venue ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: { ...p.location, venue: e.target.value } }))
                }
                className={inputClass}
              />
            </FormField>
          </div>

          <GeoCoordinatesFields
            variant="dark"
            natureHint
            lat={form.location.lat}
            lng={form.location.lng}
            onChange={({ lat, lng }) =>
              setForm((p) => ({
                ...p,
                location: { ...p.location, lat, lng },
              }))
            }
          />
          <p className="text-[11px] text-[var(--admin-text-dim)]">
            Leave both latitude and longitude empty if unknown, or fill in both for pin-accurate maps.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="attr-category" label="Category" variant="dark">
              <select
                id="attr-category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="attr-type" label="Card type" variant="dark">
              <select
                id="attr-type"
                value={form.cardType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cardType: e.target.value as AttractionCardType }))
                }
                className={inputClass}
              >
                {ATTRACTION_CARD_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="attr-vis" label="Visibility" variant="dark">
              <select
                id="attr-vis"
                value={form.visibility}
                onChange={(e) =>
                  setForm((p) => ({ ...p, visibility: e.target.value as AttractionVisibility }))
                }
                className={inputClass}
              >
                {form.posting === 'deck' ? (
                  <>
                    <option value="public">Public — swipe deck</option>
                    <option value="private">Private — admin only</option>
                  </>
                ) : (
                  <>
                    <option value="public">Public — swipe deck</option>
                    <option value="hidden">Hidden — keyword search only</option>
                  </>
                )}
              </select>
            </FormField>
          </div>

          <div>
            <FormField
              id="attr-tags"
              label={form.posting === 'secret' ? 'Search keywords' : 'Tags'}
              variant="dark"
            >
              <div className="flex gap-2">
                <input
                  id="attr-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder={form.posting === 'secret' ? 'e.g. speakeasy, wings' : 'Add tag'}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="admin-btn admin-btn-secondary shrink-0"
                >
                  Add
                </button>
              </div>
            </FormField>
            {form.posting === 'secret' && form.visibility === 'hidden' && (
              <p className="mt-1 text-[11px] text-[var(--admin-text-dim)]">
                Required for hidden secret-list cards — users must search one of these words to unlock
                the card.
              </p>
            )}
            {form.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))}
                    className="admin-btn admin-btn-secondary px-2 py-1 text-xs"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <FormField id="attr-photos" label={`Photos (up to ${MAX_ATTRACTION_PHOTOS})`} variant="dark">
            <EventPhotosEditor
              photos={form.images}
              onChange={(images) => setForm((p) => ({ ...p, images }))}
              maxPhotos={MAX_ATTRACTION_PHOTOS}
              variant="admin"
            />
          </FormField>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
              className="h-4 w-4 accent-[var(--admin-accent)]"
            />
            <span className="text-xs text-[var(--admin-text-muted)]">Featured (prioritize in deck mix)</span>
          </label>

          <FormField id="attr-promo" label="Promo code (optional)" variant="dark">
            <input
              id="attr-promo"
              value={form.promoCode ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, promoCode: e.target.value }))}
              className={inputClass}
              placeholder="VISIT10"
            />
          </FormField>

          {error && (
            <p className="rounded-[var(--admin-radius)] border border-[var(--admin-danger)]/30 bg-[var(--admin-danger)]/10 px-3 py-2 text-sm font-medium text-[var(--admin-danger)]">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <AdminButton type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create card'}
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false)
                setEditing(null)
              }}
            >
              Cancel
            </AdminButton>
          </div>
          </AdminPanel>
        </form>
      ) : (
        <>
        {attractions.length === 0 ? (
          <AdminPanel className="py-10 text-center text-sm text-[var(--admin-text-dim)]">
            No cards yet. Add a card-deck or secret-list entry to fill Discover.
          </AdminPanel>
        ) : (
        <AdminTable columns={['Card', 'Posted', 'Location', 'Posting', 'Visibility', '']}>
          {attractions.map((a) => {
            const borderColor =
              getAttractionDiscoverBorderColor(a) === 'secret'
                ? ADMIN_SECRET_LIST_BORDER_COLOR
                : ADMIN_ATTRACTION_BORDER_COLOR
            return (
            <tr key={a.id}>
              <td>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: borderColor }}
                    title={a.posting === 'secret' ? 'Secret list border' : 'Partner pink deck border'}
                  />
                  <img
                    src={a.images[0] ?? DEFAULT_ATTRACTION_IMAGE}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-[var(--admin-radius)] object-cover"
                  />
                  <div>
                    <p className="font-medium">{a.title}</p>
                    {a.featured && <AdminBadge tone="amber">Featured</AdminBadge>}
                  </div>
                </div>
              </td>
              <td className="text-xs">
                <p
                  className={
                    isAttractionStale(a.createdAt)
                      ? 'font-medium text-amber-400'
                      : 'text-[var(--admin-text-muted)]'
                  }
                >
                  {formatAttractionPostedDate(a.createdAt)}
                </p>
                {isAttractionStale(a.createdAt) && (
                  <p className="mt-0.5 text-[10px] text-amber-400/80">Refresh photos</p>
                )}
              </td>
              <td className="text-xs text-[var(--admin-text-muted)]">
                {a.location.city}
                {a.location.venue ? ` · ${a.location.venue}` : ''}
                {a.location.lat != null && a.location.lng != null && (
                  <span className="mt-0.5 block font-mono text-[10px] text-[var(--admin-text-dim)]">
                    {a.location.lat.toFixed(4)}, {a.location.lng.toFixed(4)}
                  </span>
                )}
              </td>
              <td>
                <AdminBadge tone={a.posting === 'secret' ? 'purple' : 'cyan'}>
                  {getAttractionPostingLabel(a.posting ?? 'deck')}
                </AdminBadge>
              </td>
              <td>
                <AdminBadge tone={a.visibility === 'hidden' ? 'purple' : 'neutral'}>
                  {getAttractionVisibilityLabel(a)}
                </AdminBadge>
              </td>
              <td>
                <div className="flex gap-1">
                  <AdminButton type="button" variant="ghost" onClick={() => openEdit(a)} aria-label="Edit">
                    <Pencil size={14} />
                  </AdminButton>
                  <AdminButton type="button" variant="ghost" onClick={() => handleDelete(a.id)} aria-label="Delete">
                    <Trash2 size={14} className="text-[var(--admin-danger)]" />
                  </AdminButton>
                </div>
              </td>
            </tr>
            )
          })}
        </AdminTable>
        )}
        </>
      )}
    </div>
  )
}
