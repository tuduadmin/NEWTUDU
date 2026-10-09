import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminButton, AdminInput, AdminPanel } from './AdminUI'
import {
  clearModeHeroBranding,
  clearSharedModeHeroOnDevServer,
  fileToModeHeroDataUrl,
  getModeHeroBranding,
  getModeHeroUrl,
  getSharedModeHeroBranding,
  MODE_HERO_CONSUMER_PATH,
  MODE_HERO_DEFAULTS,
  publishModeHeroFileToDevServer,
  publishModeHeroFromDataUrl,
  refreshSharedModeHeroes,
  saveModeHeroBranding,
  type ModeHeroId,
} from '../../lib/modeHeroBranding'

const MODE_LABEL: Record<ModeHeroId, string> = {
  'road-trip': 'Road Trip',
  'bucket-list': 'Bucket List',
}

type AdminModeHeroBrandingPanelProps = {
  mode: ModeHeroId
}

export default function AdminModeHeroBrandingPanel({ mode }: AdminModeHeroBrandingPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stored, setStored] = useState(() => getModeHeroBranding(mode))
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
    void refreshSharedModeHeroes()
  }, [])

  const sharedBranding = getSharedModeHeroBranding(mode)
  const liveBranding = getModeHeroBranding(mode)
  const preview = pendingHero ?? getModeHeroUrl(mode)
  const hasUnsaved = pendingFile != null
  const consumerPath = MODE_HERO_CONSUMER_PATH[mode]
  const modeLabel = MODE_LABEL[mode]

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
      const heroImageUrl = await fileToModeHeroDataUrl(file)
      setPendingFile(file)
      setPendingHero(heroImageUrl)
      setNote('Preview ready — click Save & apply everywhere below.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  async function publishCurrentHero(source: {
    file?: File | null
    imageUrl?: string | null
  }): Promise<string> {
    const labelOpt = label.trim() || undefined
    if (source.file) {
      const published = await publishModeHeroFileToDevServer(mode, source.file, labelOpt)
      return published.heroImageUrl
    }
    const imageUrl = source.imageUrl?.trim()
    if (!imageUrl) throw new Error('Choose an image first.')
    if (imageUrl.startsWith('data:')) {
      const published = await publishModeHeroFromDataUrl(mode, imageUrl, labelOpt)
      return published.heroImageUrl
    }
    const path = imageUrl.split('?')[0]
    const blob = await fetch(path).then((r) => {
      if (!r.ok) throw new Error('Could not read hero image from app.')
      return r.blob()
    })
    const type = blob.type || 'image/jpeg'
    const file = new File([blob], `${mode}-hero.jpg`, { type })
    const published = await publishModeHeroFileToDevServer(mode, file, labelOpt)
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
      const toStore = await publishCurrentHero({
        file: pendingFile,
        imageUrl: dataUrl,
      })

      const next = saveModeHeroBranding(mode, {
        heroImageUrl: toStore,
        label: label.trim() || undefined,
      })
      setStored(next)
      setPendingFile(null)
      setPendingHero(null)
      await refreshSharedModeHeroes()
      setNote(
        `${modeLabel} hero saved. Refresh ${consumerPath} on any open tab (phone or desktop).`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (!window.confirm(`Revert ${modeLabel} hero to the default image?`)) return
    setBusy(true)
    try {
      try {
        await clearSharedModeHeroOnDevServer(mode)
      } catch {
        /* dev API optional */
      }
      clearModeHeroBranding(mode)
      setStored(null)
      setPendingFile(null)
      setPendingHero(null)
      await refreshSharedModeHeroes()
      setNote(`Reverted to default. Refresh ${consumerPath}.`)
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
      <p className="admin-label mb-2">{modeLabel} hero banner</p>
      <p className="mb-3 text-xs leading-relaxed text-[var(--admin-text-muted)]">
        Shown at the top of{' '}
        <Link to={consumerPath} className="text-[var(--admin-accent)] no-underline">
          {consumerPath}
        </Link>
        . Save publishes for every device on{' '}
        <code className="text-[var(--admin-text)]">{appOrigin}</code>.
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
          placeholder="e.g. Summer campaign"
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
        {sharedBranding
          ? `Shared: ${sharedBranding.heroImageUrl} · ${new Date(sharedBranding.updatedAt).toLocaleString()}`
          : liveBranding
            ? `This browser only until Save — default is ${MODE_HERO_DEFAULTS[mode]}`
            : `Default: ${MODE_HERO_DEFAULTS[mode]}`}
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
