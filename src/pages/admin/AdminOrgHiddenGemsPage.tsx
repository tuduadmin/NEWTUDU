import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import EventPhotosEditor from '../../components/EventPhotosEditor'
import { FormField } from '../../components/FormFields'
import HiddenGemAddressFields from '../../components/HiddenGemAddressFields'
import HiddenGemContactsEditor from '../../components/HiddenGemContactsEditor'
import EventAmenitiesPicker from '../../components/create-event/EventAmenitiesPicker'
import EventDoorPaymentPicker from '../../components/create-event/EventDoorPaymentPicker'
import HiddenGemReviewLinksEditor from '../../components/HiddenGemReviewLinksEditor'
import HiddenGemPreviewOverlay from '../../components/HiddenGemPreviewOverlay'
import {
  AdminBadge,
  AdminButton,
  AdminPanel,
  AdminTable,
} from '../../components/admin/AdminUI'
import { getEventMetrics } from '../../lib/adminAnalytics'
import { getOrganization } from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'
import { getDistantSavesForEvent } from '../../lib/distantSaves'
import {
  AGE_POLICY_OPTIONS,
  DEFAULT_HIDDEN_GEM_IMAGE,
  deleteOrgHiddenGem,
  defaultHiddenGemLocation,
  formatFullAddress,
  getHiddenGemById,
  HIDDEN_GEM_CATEGORIES,
  listHiddenGemsForOrg,
  normalizeHiddenGemCategory,
  saveOrgHiddenGem,
  setOrgHiddenGemFeatured,
  setOrgHiddenGemPublished,
  type AgePolicy,
  type HiddenGemListItem,
  type HiddenGemVisibility,
  type HiddenGemContact,
  type HiddenGemReviewLink,
  type WeeklyHours,
} from '../../lib/hiddenGems'
import { normalizeWebsiteUrl } from '../../lib/websiteUrl'
import type { DoorPaymentMode } from '../../lib/eventDoorPayment'

function emptyForm(orgId: string) {
  return {
    organizationId: orgId,
    title: '',
    description: '',
    images: [] as string[],
    location: defaultHiddenGemLocation(),
    category: '',
    tags: [] as string[],
    visibility: 'public' as HiddenGemVisibility,
    published: false,
    featured: false,
    promoCode: '',
    amenities: [] as string[],
    doorPayment: '' as DoorPaymentMode,
    priceLabel: '',
    atmOnSite: false,
    weeklyHours: createDefaultWeeklyHours() as WeeklyHours,
    hoursDescription: '',
    contacts: [] as HiddenGemContact[],
    reviewLinks: [] as HiddenGemReviewLink[],
    website: '',
    agePolicy: 'all_ages' as AgePolicy,
  }
}

export default function AdminOrgHiddenGemsPage() {
  const { orgId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const org = getOrganization(orgId)
  const admin = getCurrentUser()
  const [refreshKey, setRefreshKey] = useState(0)
  const gems = useMemo(() => listHiddenGemsForOrg(orgId), [orgId, refreshKey])
  const [editing, setEditing] = useState<HiddenGemListItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(() => emptyForm(orgId))
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  const previewForm = useMemo(
    () => ({
      title: form.title,
      description: form.description,
      images: form.images,
      location: form.location,
      category: form.category,
      amenities: form.amenities,
      doorPayment: form.doorPayment,
      atmOnSite: form.atmOnSite,
      priceLabel: form.priceLabel,
      contacts: form.contacts,
      reviewLinks: form.reviewLinks,
      website: form.website,
      agePolicy: form.agePolicy,
      weeklyHours: form.weeklyHours,
      hoursDescription: form.hoursDescription,
      organizationId: orgId,
    }),
    [form, orgId],
  )

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (!editId || !org) return

    const gem = listHiddenGemsForOrg(orgId).find((row) => row.id === editId)
    if (!gem || gem.source !== 'org-hidden-gem') return

    setEditing(gem)
    setForm({
      organizationId: orgId,
      title: gem.title,
      description: gem.description,
      images: [...gem.images],
      location: { ...gem.location },
      category: normalizeHiddenGemCategory(gem.category),
      tags: [...gem.tags],
      visibility: gem.visibility,
      published: gem.published,
      featured: gem.featured,
      promoCode: gem.promoCode ?? '',
      amenities: [...(gem.amenities ?? [])],
      doorPayment: gem.doorPayment ?? '',
      priceLabel: gem.priceLabel ?? '',
      atmOnSite: gem.atmOnSite ?? false,
      weeklyHours: gem.weeklyHours ?? createDefaultWeeklyHours(),
      hoursDescription: gem.hoursDescription ?? '',
      contacts: [...(gem.contacts ?? [])],
      reviewLinks: [...(gem.reviewLinks ?? [])],
      website: gem.website ?? '',
      agePolicy: gem.agePolicy ?? 'all_ages',
    })
    setShowForm(true)
    setError('')

    const next = new URLSearchParams(searchParams)
    next.delete('edit')
    setSearchParams(next, { replace: true })
  }, [org, orgId, searchParams, setSearchParams])

  if (!org) return null

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm(orgId))
    setShowForm(true)
    setError('')
  }

  function openEdit(gem: HiddenGemListItem) {
    if (gem.source !== 'org-hidden-gem') {
      setError('Legacy host events and attractions must be edited in their source admin screens.')
      return
    }
    setEditing(gem)
    setForm({
      organizationId: orgId,
      title: gem.title,
      description: gem.description,
      images: [...gem.images],
      location: { ...gem.location },
      category: normalizeHiddenGemCategory(gem.category),
      tags: [...gem.tags],
      visibility: gem.visibility,
      published: gem.published,
      featured: gem.featured,
      promoCode: gem.promoCode ?? '',
      amenities: [...(gem.amenities ?? [])],
      doorPayment: gem.doorPayment ?? '',
      priceLabel: gem.priceLabel ?? '',
      atmOnSite: gem.atmOnSite ?? false,
      weeklyHours: gem.weeklyHours ?? createDefaultWeeklyHours(),
      hoursDescription: gem.hoursDescription ?? '',
      contacts: gem.contacts ?? (gem.phone ? [{ id: 'legacy', label: 'General', phone: gem.phone }] : []),
      reviewLinks: gem.reviewLinks ? [...gem.reviewLinks] : [],
      website: gem.website ?? '',
      agePolicy: gem.agePolicy ?? 'all_ages',
    })
    setShowForm(true)
    setError('')
  }

  function handleDelete(id: string, source: HiddenGemListItem['source']) {
    if (source !== 'org-hidden-gem') {
      window.alert('Delete legacy items from Events or Attractions admin.')
      return
    }
    if (!window.confirm('Delete this hidden gem?')) return
    deleteOrgHiddenGem(id)
    refresh()
    if (editing?.id === id) {
      setShowForm(false)
      setEditing(null)
    }
  }

  function togglePublish(id: string) {
    const gem = getHiddenGemById(id)
    if (!gem) return
    setOrgHiddenGemPublished(id, !gem.published)
    refresh()
  }

  function toggleFeatured(id: string) {
    const gem = getHiddenGemById(id)
    if (!gem) return
    setOrgHiddenGemFeatured(id, !gem.featured)
    refresh()
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
    if (!admin) return

    const websiteRaw = form.website.trim()
    const result = saveOrgHiddenGem(
      {
        ...form,
        id: editing?.id,
        images: form.images.length > 0 ? form.images : [DEFAULT_HIDDEN_GEM_IMAGE],
        website: normalizeWebsiteUrl(websiteRaw) || websiteRaw || undefined,
      },
      admin.email,
    )

    if (!result.ok) {
      setError(result.error ?? 'Could not save.')
      return
    }

    setShowForm(false)
    setEditing(null)
    setForm(emptyForm(orgId))
    refresh()
  }

  const inputClass = 'admin-input'

  return (
    <div>
      {!showForm && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--admin-text-muted)]">
              Ongoing places and businesses for {org.name}. Gold thin border on Discover.
            </p>
          </div>
          <AdminButton type="button" variant="primary" onClick={openCreate}>
            <Plus size={16} />
            Add hidden gem
          </AdminButton>
        </div>
      )}

      {!showForm && (
        <AdminPanel className="mb-4 border-[#fbbf24]/30">
          <p className="admin-label text-[#fbbf24]">Gold deck border</p>
          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
            Public, published hidden gems appear on Discover with a thin 1px gold border.
          </p>
        </AdminPanel>
      )}

      {error && !showForm && (
        <p className="mb-3 text-xs text-[var(--admin-danger)]">{error}</p>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminPanel className="space-y-4 border-[#fbbf24]/25">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-8 w-1 shrink-0 rounded-full bg-[#fbbf24]"
                  title="Gold deck border preview"
                />
                <h2 className="text-sm font-semibold text-[#fbbf24]">
                  {editing ? 'Edit hidden gem' : 'New hidden gem'}
                </h2>
              </div>
              <AdminButton type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
                <Eye size={14} />
                Preview
              </AdminButton>
            </div>

            <FormField id="hg-title" label="Business name" variant="dark">
              <input
                id="hg-title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className={inputClass}
                required
              />
            </FormField>

            <HiddenGemAddressFields
              variant="dark"
              value={form.location}
              onChange={(location) => setForm((p) => ({ ...p, location }))}
            />

            <div>
              <HiddenGemContactsEditor
                variant="dark"
                value={form.contacts}
                onChange={(contacts) => setForm((p) => ({ ...p, contacts }))}
              />
            </div>

            <FormField id="hg-website" label="Website" variant="dark">
              <input
                id="hg-website"
                type="text"
                inputMode="url"
                autoComplete="url"
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                className={inputClass}
                placeholder="www.emerald.com"
              />
            </FormField>

            <HiddenGemReviewLinksEditor
              variant="dark"
              value={form.reviewLinks}
              onChange={(reviewLinks) => setForm((p) => ({ ...p, reviewLinks }))}
            />

            <FormField id="hg-desc" label="About us" variant="dark">
              <textarea
                id="hg-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className={inputClass}
                required
              />
            </FormField>

            <div>
              <p className="admin-label mb-2">Business hours</p>
              <p className="mb-3 text-xs text-[var(--admin-text-muted)]">
                Drives Open / Closed status on Discover cards (45 min soon threshold).
              </p>
              <HiddenGemHoursEditor
                variant="dark"
                value={form.weeklyHours}
                onChange={(weeklyHours) => setForm((p) => ({ ...p, weeklyHours }))}
                hoursDescription={form.hoursDescription}
                onHoursDescriptionChange={(hoursDescription) =>
                  setForm((p) => ({ ...p, hoursDescription }))
                }
              />
            </div>

            <FormField id="hg-age" label="Age policy" variant="dark">
              <select
                id="hg-age"
                value={form.agePolicy}
                onChange={(e) =>
                  setForm((p) => ({ ...p, agePolicy: e.target.value as AgePolicy }))
                }
                className={inputClass}
              >
                {AGE_POLICY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="hg-category" label="Category" variant="dark">
              <select
                id="hg-category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className={inputClass}
                required
              >
                <option value="">Select</option>
                {HIDDEN_GEM_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>

            <div>
              <p className="admin-label mb-2">Payment & amenities</p>
              <p className="mb-3 text-xs text-[var(--admin-text-muted)]">
                Same options as event creation — shown on the Discover card and detail panel.
              </p>
              <FormField id="hg-price" label="Typical price" variant="dark">
                <input
                  id="hg-price"
                  value={form.priceLabel}
                  onChange={(e) => setForm((p) => ({ ...p, priceLabel: e.target.value }))}
                  className={inputClass}
                  placeholder="From $35"
                />
              </FormField>
              <EventDoorPaymentPicker
                doorPayment={form.doorPayment}
                atmOnSite={form.atmOnSite}
                onChange={(partial) =>
                  setForm((p) => ({
                    ...p,
                    doorPayment: partial.doorPayment,
                    atmOnSite: partial.atmOnSite,
                  }))
                }
              />
              <EventAmenitiesPicker
                embedded
                amenities={form.amenities}
                onChange={(amenities) => setForm((p) => ({ ...p, amenities }))}
              />
            </div>

            <FormField id="hg-promo" label="Promo code (optional)" variant="dark">
              <input
                id="hg-promo"
                value={form.promoCode}
                onChange={(e) => setForm((p) => ({ ...p, promoCode: e.target.value }))}
                className={inputClass}
                placeholder="VISIT10"
              />
            </FormField>

            <div>
              <p className="admin-label mb-2">Photos (up to 6)</p>
              <EventPhotosEditor
                photos={form.images}
                onChange={(images) => setForm((p) => ({ ...p, images }))}
                variant="admin"
              />
            </div>

            <FormField id="hg-vis" label="Visibility" variant="dark">
              <select
                id="hg-vis"
                value={form.visibility}
                onChange={(e) =>
                  setForm((p) => ({ ...p, visibility: e.target.value as HiddenGemVisibility }))
                }
                className={inputClass}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </FormField>

            <div>
              <FormField id="hg-tags" label="Keywords / tags" variant="dark">
                <div className="flex gap-2">
                  <input
                    id="hg-tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Add tag"
                    className={inputClass}
                  />
                  <AdminButton type="button" variant="secondary" onClick={addTag}>
                    Add
                  </AdminButton>
                </div>
              </FormField>
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

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                className="h-4 w-4 accent-[#fbbf24]"
              />
              <span className="text-xs text-[var(--admin-text-muted)]">Feature on deck</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                className="h-4 w-4 accent-[var(--admin-accent)]"
              />
              <span className="text-xs text-[var(--admin-text-muted)]">Published to Discover</span>
            </label>

            {error && <p className="text-xs text-[var(--admin-danger)]">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <AdminButton type="submit" variant="primary">
                {editing ? 'Save changes' : 'Create hidden gem'}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                  setError('')
                }}
              >
                Cancel
              </AdminButton>
            </div>
          </AdminPanel>
        </form>
      ) : gems.length === 0 ? (
        <AdminPanel className="py-10 text-center text-sm text-[var(--admin-text-dim)]">
          No hidden gems for this organization yet.
        </AdminPanel>
      ) : (
        <AdminTable
          columns={['Hidden gem', 'Location', 'Status', 'Metrics', '']}
        >
          {gems.map((gem) => {
            const metrics = getEventMetrics(gem.id)
            const distantSaves = getDistantSavesForEvent(gem.id)
            const isManaged = gem.source === 'org-hidden-gem'

            return (
              <tr key={`${gem.source}-${gem.id}`}>
                <td>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-8 w-1 shrink-0 rounded-full bg-[#fbbf24]"
                      title="Gold deck border"
                    />
                    <img
                      src={gem.images[0] ?? DEFAULT_HIDDEN_GEM_IMAGE}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-[var(--admin-radius)] object-cover"
                    />
                    <div>
                      <p className="font-medium">{gem.title}</p>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {gem.featured && <AdminBadge tone="amber">Featured</AdminBadge>}
                        {gem.published ? (
                          <AdminBadge tone="emerald">Published</AdminBadge>
                        ) : (
                          <AdminBadge tone="neutral">Draft</AdminBadge>
                        )}
                        {!isManaged && (
                          <AdminBadge tone="cyan">{gem.source.replace('-', ' ')}</AdminBadge>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-xs text-[var(--admin-text-muted)]">
                  {formatFullAddress(gem.location) || gem.location.city}
                  {!formatFullAddress(gem.location) && gem.location.venue ? ` · ${gem.location.venue}` : ''}
                </td>
                <td>
                  <AdminBadge tone={gem.visibility === 'public' ? 'emerald' : 'neutral'}>
                    {gem.visibility}
                  </AdminBadge>
                </td>
                <td className="text-xs text-[var(--admin-text-muted)]">
                  <span className="admin-tabular">{metrics.views}</span> views ·{' '}
                  <span className="admin-tabular">{metrics.saves}</span> saves ·{' '}
                  <span className="admin-tabular">{distantSaves.length}</span> distant
                </td>
                <td>
                  <div className="flex gap-1">
                    {isManaged && (
                      <>
                        <AdminButton
                          type="button"
                          variant="ghost"
                          onClick={() => openEdit(gem)}
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="ghost"
                          onClick={() => togglePublish(gem.id)}
                          aria-label={gem.published ? 'Unpublish' : 'Publish'}
                        >
                          {gem.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="ghost"
                          onClick={() => toggleFeatured(gem.id)}
                          aria-label="Toggle featured"
                        >
                          <Star
                            size={14}
                            className={gem.featured ? 'text-[#fbbf24]' : undefined}
                          />
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="ghost"
                          onClick={() => handleDelete(gem.id, gem.source)}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} className="text-[var(--admin-danger)]" />
                        </AdminButton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </AdminTable>
      )}

      <HiddenGemPreviewOverlay
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        form={previewForm}
      />
    </div>
  )
}
