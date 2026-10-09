import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { AdminButton, AdminInput, AdminPanel } from './AdminUI'
import {
  clearRoadTripBranding,
  clearSharedRoadTripHeroOnDevServer,
  DEFAULT_ROAD_TRIP_HERO,
  fileToRoadTripHeroDataUrl,
  getRoadTripBranding,
  getRoadTripHeroUrl,
  getSharedRoadTripBranding,
  publishRoadTripHeroFileToDevServer,
  publishRoadTripHeroFromDataUrl,
  refreshSharedRoadTripBranding,
  saveRoadTripBranding,
} from '../../lib/roadTripBranding'

export default function AdminRoadTripBrandingPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stored, setStored] = useState(() => getRoadTripBranding())
  const [label, setLabel] = useState(stored?.label ?? '')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingHero, setPendingHero] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [appOrigin] = useState(() =>
    typeof window !== 'undefined' ? window.location.origin : '',
  )

  useEffect(() => {
    void refreshSharedRoadTripBranding()
  }, [])

  const sharedBranding = getSharedRoadTripBranding()
  const liveBranding = getRoadTripBranding()
  const preview = pendingHero ?? getRoadTripHeroUrl()
  const hasUnsaved = pendingFile != null
  const liveLabel = sharedBranding
    ? `Shared hero (all devices on ${appOrigin}): ${sharedBranding.heroImageUrl}`
    : liveBranding
      ? `This device only — phone will not match until Save publishes shared hero`
      : `Default hero (${DEFAULT_ROAD_TRIP_HERO})`

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose a JPEG or PNG image.')
      return
    }
    setBusy(true)
    setError(null)
    setNote(null)
    try {
      const heroImageUrl = await fileToRoadTripHeroDataUrl(file)
      setPendingFile(file)
      setPendingHero(heroImageUrl)
      setNote('Preview ready — click Save to Road Trip to publish to phone + desktop.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  async function publishCurrentHeroForPhone(source: {
    file?: File | null
    imageUrl?: string | null
  }): Promise<string> {
    const labelOpt = label.trim() || undefined
    if (source.file) {
      const published = await publishRoadTripHeroFileToDevServer(source.file, labelOpt)
      return published.heroImageUrl
    }
    const imageUrl = source.imageUrl?.trim()
    if (!imageUrl) throw new Error('Choose an image first.')
    if (imageUrl.startsWith('data:')) {
      const published = await publishRoadTripHeroFromDataUrl(imageUrl, labelOpt)
      return published.heroImageUrl
    }
    const path = imageUrl.split('?')[0]
    const blob = await fetch(path).then((r) => {
      if (!r.ok) throw new Error('Could not read hero image from app.')
      return r.blob()
    })
    const type = blob.type || 'image/jpeg'
    const file = new File([blob], 'road-trip-hero.jpg', { type })
    const published = await publishRoadTripHeroFileToDevServer(file, labelOpt)
    return published.heroImageUrl
  }

  async function handleSave() {
    setError(null)
    setNote(null)
    const dataUrl = pendingHero ?? stored?.heroImageUrl ?? null
    if (!pendingFile && !dataUrl) {
      setError('Choose an image first, then Save.')
      return
    }
    setBusy(true)
    try {
      const toStore = await publishCurrentHeroForPhone({
        file: pendingFile,
        imageUrl: dataUrl,
      })

      const next = saveRoadTripBranding({
        heroImageUrl: toStore,
        label: label.trim() || undefined,
      })
      setStored(next)
      setPendingFile(null)
      setPendingHero(null)
      await refreshSharedRoadTripBranding()
      setNote('Saved. The Road Trip banner is updated — refresh /road-trip if that tab was already open.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (!window.confirm('Revert Road Trip hero to the default image?')) return
    setBusy(true)
    try {
      try {
        await clearSharedRoadTripHeroOnDevServer()
      } catch {
        /* dev API optional */
      }
      clearRoadTripBranding()
      setStored(null)
      setPendingFile(null)
      setPendingHero(null)
      await refreshSharedRoadTripBranding()
      setNote('Reverted to default hero. Refresh /road-trip on phone and desktop.')
    } finally {
      setBusy(false)
    }
  }

  function handleDiscardPending() {
    setPendingFile(null)
    setPendingHero(null)
    setNote('Discarded unsaved preview.')
  }

  return (
    <AdminPanel className="mb-4">
      <p className="admin-label mb-2">Road Trip landing hero</p>
      <p className="mb-3 text-xs leading-relaxed text-[var(--admin-text-muted)]">
        One save here updates the <code>/road-trip</code> banner on every device using{' '}
        <code className="text-[var(--admin-text)]">{appOrigin}</code> (your phone included). No second
        step or special link — same as changing anything else in Control Room.
      </p>
      <div className="mb-4 overflow-hidden rounded-md border border-[var(--admin-border)]">
        <img src={preview} alt="" className="max-h-40 w-full object-cover" />
        {hasUnsaved && (
          <p className="border-t border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-2 py-1 text-[10px] text-[var(--admin-warning)]">
            Unsaved preview — click Save below
          </p>
        )}
      </div>
      <div className="mb-3 max-w-sm">
        <p className="admin-label mb-1.5">Label (optional)</p>
        <AdminInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Fall 2025 campaign"
        />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      <div className="flex flex-wrap gap-2">
        <AdminButton type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Processing…' : 'Choose image'}
        </AdminButton>
        <AdminButton
          type="button"
          variant="primary"
          disabled={busy || (!pendingFile && !stored && !pendingHero)}
          onClick={() => void handleSave()}
        >
          Save & apply everywhere
        </AdminButton>
        {hasUnsaved && (
          <AdminButton type="button" variant="secondary" onClick={handleDiscardPending}>
            Discard preview
          </AdminButton>
        )}
        <AdminButton type="button" variant="secondary" disabled={busy} onClick={() => void handleReset()}>
          Use default
        </AdminButton>
      </div>
      <p className="mt-2 text-[10px] text-[var(--admin-text-dim)]">
        {liveLabel}
        {sharedBranding
          ? ` · ${new Date(sharedBranding.updatedAt).toLocaleString()}`
          : liveBranding
            ? ` · saved ${new Date(liveBranding.updatedAt).toLocaleString()}`
            : ''}
      </p>
      {error && (
        <p className="mt-2 text-xs text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      )}
      {note && (
        <p className="mt-2 text-xs text-[var(--admin-success)]" role="status">
          {note}
        </p>
      )}
    </AdminPanel>
  )
}
