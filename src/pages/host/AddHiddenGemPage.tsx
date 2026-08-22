import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Clock,
  Copy,
  CircleDollarSign,
  Eye,
  Gem,
  Music,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import { BackLink } from '../../components/NavActionButtons'
import BottomNav from '../../components/BottomNav'
import EventPhotosEditor from '../../components/EventPhotosEditor'
import GradientButton from '../../components/GradientButton'
import SaveButton from '../../components/host/SaveButton'
import HiddenGemAddressFields from '../../components/HiddenGemAddressFields'
import HiddenGemContactsEditor from '../../components/HiddenGemContactsEditor'
import HiddenGemReviewLinksEditor from '../../components/HiddenGemReviewLinksEditor'
import EventAmenitiesPicker from '../../components/create-event/EventAmenitiesPicker'
import EventDoorPaymentPicker from '../../components/create-event/EventDoorPaymentPicker'
import HiddenGemHoursEditor, { createDefaultWeeklyHours } from '../../components/HiddenGemHoursEditor'
import HiddenGemPreviewOverlay from '../../components/HiddenGemPreviewOverlay'
import { getCurrentUser } from '../../lib/auth'
import {
  DEFAULT_HIDDEN_GEM_IMAGE,
  deleteOrgHiddenGem,
  formatHiddenGemTimestamp,
  getHiddenGemById,
  getHiddenGemUpdatedAt,
  hasPendingDeckUpdate,
  isHiddenGemOnDiscoverDeck,
  normalizeHiddenGemCategory,
  saveOrgHiddenGem,
  type HiddenGemReviewLink,
  AGE_POLICY_OPTIONS,
  HIDDEN_GEM_CATEGORIES,
  defaultHiddenGemLocation,
  getHiddenGemCategoryLabelById,
  type AgePolicy,
  type HiddenGemCategoryId,
  type HiddenGemContact,
  type HiddenGemLocation,
  type OrgHiddenGem,
  type WeeklyHours,
} from '../../lib/hiddenGems'
import { normalizeAmenityIds } from '../../lib/amenities'
import type { DoorPaymentMode } from '../../lib/eventDoorPayment'
import { useHostContext } from '../../hooks/useHostContext'
import { normalizeWebsiteUrl } from '../../lib/websiteUrl'
import { canCreateHiddenGem } from '../../lib/hiddenGemSlots'
import HostAddHiddenGemSlotsLink from '../../components/host/HostAddHiddenGemSlotsLink'
import {
  getHiddenGemDefaultsFromOrgProfile,
  orgProfileHasHiddenGemCopyData,
} from '../../lib/hiddenGemProfileCopy'

const HIDDEN_GEM_CATEGORY_ICONS: Record<HiddenGemCategoryId, React.ReactNode> = {
  food_drink: <UtensilsCrossed size={16} />,
  entertainment: <Music size={16} />,
}

export default function AddHiddenGemPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editingId = searchParams.get('edit')
  const { activeOrg, isPersonal } = useHostContext()
  const user = getCurrentUser()
  const [selectedCategory, setSelectedCategory] = useState<HiddenGemCategoryId | null>(null)
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(() => createDefaultWeeklyHours())
  const [hoursDescription, setHoursDescription] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState<HiddenGemLocation>(() => defaultHiddenGemLocation())
  const [contacts, setContacts] = useState<HiddenGemContact[]>([])
  const [description, setDescription] = useState('')
  const [menu, setMenu] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [doorPayment, setDoorPayment] = useState<DoorPaymentMode>('')
  const [priceLabel, setPriceLabel] = useState('')
  const [atmOnSite, setAtmOnSite] = useState(false)
  const [website, setWebsite] = useState('')
  const [reviewLinks, setReviewLinks] = useState<HiddenGemReviewLink[]>([])
  const [agePolicy, setAgePolicy] = useState<AgePolicy>('all_ages')
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMode, setSaveMode] = useState<'save' | 'publish'>('publish')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loadedEditId, setLoadedEditId] = useState<string | null>(null)
  const [loadedGem, setLoadedGem] = useState<OrgHiddenGem | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  const canCopyFromProfile = Boolean(activeOrg && !isPersonal && orgProfileHasHiddenGemCopyData(activeOrg.id))

  function handleCopyFromProfile() {
    if (!activeOrg) return

    const hasExistingContent =
      title.trim() ||
      description.trim() ||
      location.street1.trim() ||
      location.city.trim() ||
      contacts.some((c) => c.phone?.trim() || c.email?.trim()) ||
      website.trim() ||
      photos.length > 0

    if (
      hasExistingContent &&
      !window.confirm(
        'Replace the current form with details from your organization profile? Unsaved changes will be overwritten.',
      )
    ) {
      return
    }

    const payload = getHiddenGemDefaultsFromOrgProfile(activeOrg.id)
    if (!payload) {
      setCopyMessage('Could not load organization profile.')
      return
    }

    setTitle(payload.title)
    setDescription(payload.description)
    setLocation(payload.location)
    setContacts(payload.contacts)
    setWebsite(payload.website)
    if (payload.photos.length > 0) {
      setPhotos(payload.photos)
    }
    markDirty()
    setCopyMessage('Copied from your organization profile.')
  }

  function markDirty() {
    setJustSaved(false)
    setError('')
    setCopyMessage(null)
  }

  useEffect(() => {
    if (!editingId || !activeOrg) return
    const gem = getHiddenGemById(editingId)
    if (!gem || gem.organizationId !== activeOrg.id) {
      setError('Hidden Gem not found for this organization.')
      return
    }

    const categoryLabel = normalizeHiddenGemCategory(gem.category)
    const categoryMatch = HIDDEN_GEM_CATEGORIES.find((c) => c.label === categoryLabel)

    setTitle(gem.title)
    setDescription(gem.description)
    setMenu(gem.menu ?? '')
    setPhotos([...gem.images])
    setLocation({ ...gem.location })
    setContacts(gem.contacts ? [...gem.contacts] : [])
    setAmenities(normalizeAmenityIds(gem.amenities))
    setDoorPayment(gem.doorPayment ?? '')
    setPriceLabel(gem.priceLabel ?? '')
    setAtmOnSite(gem.atmOnSite ?? false)
    setWebsite(gem.website ?? '')
    setReviewLinks(gem.reviewLinks ? [...gem.reviewLinks] : [])
    setAgePolicy(gem.agePolicy ?? 'all_ages')
    setWeeklyHours(gem.weeklyHours ?? createDefaultWeeklyHours())
    setHoursDescription(gem.hoursDescription ?? '')
    setSelectedCategory(categoryMatch?.id ?? null)
    setLoadedEditId(gem.id)
    setLoadedGem(gem)
    setError('')
    setJustSaved(false)
  }, [editingId, activeOrg?.id])

  const previewForm = useMemo(
    () => ({
      title,
      description,
      menu,
      images: photos,
      location,
      category: selectedCategory,
      amenities,
      doorPayment,
      atmOnSite,
      priceLabel,
      contacts,
      reviewLinks,
      website,
      agePolicy,
      weeklyHours,
      hoursDescription,
      organizationId: activeOrg?.id,
    }),
    [
      title,
      description,
      menu,
      photos,
      location,
      selectedCategory,
      amenities,
      doorPayment,
      atmOnSite,
      priceLabel,
      contacts,
      reviewLinks,
      website,
      agePolicy,
      weeklyHours,
      hoursDescription,
      activeOrg?.id,
    ],
  )

  const slotCheck = activeOrg && !isPersonal ? canCreateHiddenGem(activeOrg.id) : null
  const atDeckSlotLimit = slotCheck ? slotCheck.remaining <= 0 : false

  function validateForm(): boolean {
    setError('')

    if (isPersonal || !activeOrg) {
      setError('Switch to an organization host profile to save a Hidden Gem.')
      return false
    }
    if (!user?.email) {
      setError('Sign in to save a Hidden Gem.')
      return false
    }
    if (!selectedCategory) {
      setError('Choose a category.')
      return false
    }
    return true
  }

  function buildGemInput(publishToDeck: boolean) {
    const categoryLabel = getHiddenGemCategoryLabelById(selectedCategory!)
    const existingGem = loadedEditId ? getHiddenGemById(loadedEditId) : undefined
    const deckState = publishToDeck
      ? true
      : existingGem
        ? isHiddenGemOnDiscoverDeck(existingGem)
        : false

    return {
      id: loadedEditId ?? undefined,
      organizationId: activeOrg!.id,
      title,
      description,
      menu: menu.trim() ? menu : undefined,
      images: photos.length > 0 ? photos : [DEFAULT_HIDDEN_GEM_IMAGE],
      location,
      category: categoryLabel,
      tags: [],
      visibility: 'public' as const,
      published: deckState,
      publishedToDeck: deckState,
      featured: false,
      amenities,
      doorPayment: doorPayment || undefined,
      priceLabel: priceLabel.trim() || undefined,
      atmOnSite: doorPayment && atmOnSite ? true : undefined,
      contacts: contacts.filter((c) => c.label.trim() || c.phone?.trim()),
      website: normalizeWebsiteUrl(website) || website.trim() || undefined,
      reviewLinks,
      agePolicy,
      weeklyHours,
      hoursDescription: hoursDescription || undefined,
    }
  }

  function handleSubmit(e: FormEvent, mode: 'save' | 'publish') {
    e.preventDefault()
    if (!validateForm()) return

    setSaveMode(mode)
    setSaving(true)
    const result = saveOrgHiddenGem(buildGemInput(mode === 'publish'), user!.email, {
      deckAction: mode,
    })
    setSaving(false)

    if (!result.ok) {
      setError(result.error ?? 'Could not save Hidden Gem.')
      return
    }

    if (mode === 'publish') {
      navigate('/host')
      return
    }

    if (result.gem) {
      setLoadedEditId(result.gem.id)
      setLoadedGem(result.gem)
      if (!editingId) {
        navigate(`/host/hidden-gem?edit=${result.gem.id}`, { replace: true })
      }
    }
    setJustSaved(true)
  }

  function handlePublish(e: FormEvent) {
    handleSubmit(e, 'publish')
  }

  function handleSave(e: FormEvent) {
    handleSubmit(e, 'save')
  }

  function handleDelete() {
    if (!loadedEditId) return
    if (
      !window.confirm(
        'Delete this Hidden Gem? It will be removed from Discover and Permanent Locations.',
      )
    ) {
      return
    }
    const result = deleteOrgHiddenGem(loadedEditId)
    if (!result.ok) {
      setError(result.error ?? 'Could not delete Hidden Gem.')
      return
    }
    navigate('/host')
  }

  const showPendingBanner = loadedGem ? hasPendingDeckUpdate(loadedGem) : false

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <div className="mb-4 flex items-center justify-between gap-2">
          <BackLink to="/host" className="shrink-0 text-sm" />
          <h1 className="truncate font-display text-base font-extrabold tracking-tight text-brown">
            {editingId ? 'Edit Hidden Gem' : 'Add Hidden Gem'}
          </h1>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[14px] border border-brown/15 bg-white px-3 py-1.5 text-xs font-semibold text-brown-muted shadow-sm transition hover:border-purple/25 hover:text-brown"
          >
            <Eye size={14} aria-hidden />
            View
          </button>
        </div>

        {showPendingBanner && (
          <div className="mb-4 rounded-[14px] border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            You have unpublished changes. Publish update to refresh Discover.
          </div>
        )}

        {loadedGem && (
          <p className="mb-4 text-center text-[11px] leading-relaxed text-brown-muted">
            Last updated {formatHiddenGemTimestamp(getHiddenGemUpdatedAt(loadedGem))}
            {loadedGem.publishedToDeckAt && (
              <>
                {' · '}
                Last published {formatHiddenGemTimestamp(loadedGem.publishedToDeckAt)}
              </>
            )}
          </p>
        )}

        <form onSubmit={handlePublish}>
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[14px] bg-orange/10">
              <Gem size={28} className="text-orange" />
            </div>
            <p className="text-sm leading-relaxed text-brown-muted">
              Showcase your restaurant or experience. A permanent place the community should know about year-round.
            </p>
          </div>

          {/* Category */}
          <section className="mb-4 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-display text-base font-bold text-brown">
              Category <span className="text-orange">*</span>
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {HIDDEN_GEM_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    markDirty()
                  }}
                  className={`flex items-center gap-2 rounded-[14px] border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    selectedCategory === cat.id
                      ? 'border-orange bg-orange/10 text-orange'
                      : 'border-brown/10 bg-cream/30 text-brown'
                  }`}
                >
                  <span className="text-orange">{HIDDEN_GEM_CATEGORY_ICONS[cat.id]}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Business Details */}
          <section className="mb-4 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-base font-bold text-brown">Business Details</h2>
              {canCopyFromProfile && (
                <button
                  type="button"
                  onClick={handleCopyFromProfile}
                  className="inline-flex items-center gap-1.5 rounded-[14px] border border-orange/25 bg-orange/5 px-3 py-1.5 text-xs font-semibold text-orange transition hover:border-orange/40 hover:bg-orange/10"
                >
                  <Copy size={14} aria-hidden />
                  Copy from profile
                </button>
              )}
            </div>

            {copyMessage && (
              <p className="mb-4 text-xs font-medium text-orange">{copyMessage}</p>
            )}

            <label htmlFor="business-name" className="mb-1 block text-sm font-medium text-brown">
              Business name <span className="text-orange">*</span>
            </label>
            <input
              id="business-name"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                markDirty()
              }}
              placeholder="e.g. Emerald Lounge"
              required
              className="mb-4 w-full rounded-[14px] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
            />

            <HiddenGemAddressFields
              value={location}
              onChange={(next) => {
                setLocation(next)
                markDirty()
              }}
            />

            <div className="mb-4 mt-4">
              <HiddenGemContactsEditor
                value={contacts}
                onChange={(next) => {
                  setContacts(next)
                  markDirty()
                }}
              />
            </div>

            <label htmlFor="website" className="mb-1 block text-sm font-medium text-brown">
              Website
            </label>
            <input
              id="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={website}
              onChange={(e) => {
                setWebsite(e.target.value)
                markDirty()
              }}
              placeholder="www.emerald.com"
              className="mb-4 w-full rounded-[14px] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
            />

            <div className="mb-4">
              <HiddenGemReviewLinksEditor
                value={reviewLinks}
                onChange={(next) => {
                  setReviewLinks(next)
                  markDirty()
                }}
              />
            </div>

            <label htmlFor="about-us" className="mb-1 block text-sm font-medium text-brown">
              About us <span className="text-orange">*</span>
            </label>
            <textarea
              id="about-us"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                markDirty()
              }}
              placeholder="Tell people what makes this place special..."
              required
              className="mb-4 w-full resize-none rounded-[14px] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
            />

            <label htmlFor="menu" className="mb-1 block text-sm font-medium text-brown">
              Venue details
            </label>
            <p className="mb-2 text-xs text-brown-muted">
              Menus, showtimes, pricing, or other venue info. Line breaks and spacing show exactly as entered.
            </p>
            <textarea
              id="menu"
              rows={8}
              value={menu}
              onChange={(e) => {
                setMenu(e.target.value)
                markDirty()
              }}
              placeholder={'Menus, showtimes, pricing, or other details for your venue...'}
              spellCheck={false}
              className="mb-4 w-full resize-y rounded-[14px] border border-brown/15 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </section>

          {/* Business Hours */}
          <section className="mb-4 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} className="text-orange" />
              <h2 className="font-display text-base font-bold text-brown">Business hours</h2>
            </div>
            <HiddenGemHoursEditor
              value={weeklyHours}
              onChange={(next) => {
                setWeeklyHours(next)
                markDirty()
              }}
              hoursDescription={hoursDescription}
              onHoursDescriptionChange={(next) => {
                setHoursDescription(next)
                markDirty()
              }}
            />
          </section>

          {/* Age policy */}
          <section className="mb-4 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
            <label htmlFor="age-policy" className="mb-2 block font-display text-base font-bold text-brown">
              Age policy
            </label>
            <select
              id="age-policy"
              value={agePolicy}
              onChange={(e) => {
                setAgePolicy(e.target.value as AgePolicy)
                markDirty()
              }}
              className="w-full rounded-[14px] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            >
              {AGE_POLICY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          {/* Amenities & payment */}
          <section className="mb-4 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
            <label htmlFor="price-label" className="mb-2 block font-display text-base font-bold text-brown">
              Typical price
            </label>
            <input
              id="price-label"
              value={priceLabel}
              onChange={(e) => {
                setPriceLabel(e.target.value)
                markDirty()
              }}
              className="mb-1 w-full rounded-[14px] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
              placeholder="From $35"
            />
            <p className="mb-4 text-xs text-brown-muted">
              Shown on Discover cards — e.g. $25, From $15, or Free
            </p>
            <EventDoorPaymentPicker
              doorPayment={doorPayment}
              atmOnSite={atmOnSite}
              onChange={(partial) => {
                setDoorPayment(partial.doorPayment)
                setAtmOnSite(partial.atmOnSite)
                markDirty()
              }}
            />
            <EventAmenitiesPicker
              amenities={amenities}
              onChange={(next) => {
                setAmenities(next)
                markDirty()
              }}
            />
          </section>

          {/* Photos */}
          <section className="mb-5 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-display text-base font-bold text-brown">Photos</h2>
            <EventPhotosEditor
              photos={photos}
              onChange={(next) => {
                setPhotos(next)
                markDirty()
              }}
              variant="host"
            />
          </section>

          {error && <p className="mb-3 text-sm text-error">{error}</p>}

          <div className="space-y-2">
            <GradientButton
              type="submit"
              fullWidth
              className="py-3.5"
              disabled={saving}
            >
              {saving && saveMode === 'publish'
                ? 'Publishing...'
                : editingId
                  ? 'Publish update'
                  : 'Publish'}
            </GradientButton>

            <SaveButton
              type="button"
              variant="secondary"
              fullWidth
              className="py-3.5"
              label={editingId ? 'Save update' : 'Save Hidden Gem'}
              savedLabel="Saved"
              justSaved={justSaved}
              saving={saving && saveMode === 'save'}
              disabled={saving}
              onClick={handleSave}
            />
          </div>

          <p className="mt-2 text-center text-[11px] leading-relaxed text-brown-muted">
            <span className="font-semibold text-brown">Publish</span> adds your listing to the Discover card deck.{' '}
            <span className="font-semibold text-brown">Save</span> keeps it in Permanent Locations only.
          </p>

          {slotCheck && atDeckSlotLimit && (
            <p className="mt-3 text-center text-xs text-brown-muted">
              All Discover slots in use.{' '}
              <HostAddHiddenGemSlotsLink
                remaining={slotCheck.remaining}
                prominent
                label="Buy another Hidden Gem â†’"
              />
            </p>
          )}

          {loadedEditId && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-brown/15 bg-white py-3 text-sm font-semibold text-brown transition hover:border-orange/30"
              >
                <Eye size={16} />
                View
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </form>
      </main>

      <HiddenGemPreviewOverlay
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        form={previewForm}
      />

      <BottomNav />
    </div>
  )
}
