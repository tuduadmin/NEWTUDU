import { useRef, useState, type ChangeEvent } from 'react'
import {
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from '../../components/admin/AdminUI'
import {
  clearStoredPwaIcons,
  DEFAULT_PWA_ICON_192,
  DEFAULT_PWA_ICON_512,
  getStoredPwaIcons,
  pwaIconsFromUpload,
  type PwaIconSet,
} from '../../lib/pwaIcons'

export default function AdminAppIconPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stored, setStored] = useState<PwaIconSet | null>(() => getStoredPwaIcons())
  const [themeLabel, setThemeLabel] = useState(stored?.label ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedNote, setSavedNote] = useState<string | null>(null)

  const preview192 = stored?.icon192 ?? DEFAULT_PWA_ICON_192
  const preview512 = stored?.icon512 ?? DEFAULT_PWA_ICON_512

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose a PNG or JPEG image.')
      return
    }

    setBusy(true)
    setError(null)
    setSavedNote(null)
    try {
      const next = await pwaIconsFromUpload(file, themeLabel.trim() || undefined)
      setStored(next)
      setSavedNote('Icons saved for this browser. Reload signup on a phone to test install.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  function handleReset() {
    if (!window.confirm('Remove seasonal override and revert to default TUDU icons?')) return
    clearStoredPwaIcons()
    setStored(null)
    setSavedNote('Reverted to default manifest icons.')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        title="PWA app icon"
        subtitle="Seasonal home-screen icon for install prompts (St. Patrick's, holidays, etc.)."
      />

      <AdminPanel className="mb-4">
        <p className="admin-label mb-2">Current preview</p>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--admin-text-muted)]">192</p>
            <img
              src={preview192}
              alt=""
              className="h-24 w-24 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] object-cover"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--admin-text-muted)]">512</p>
            <img
              src={preview512}
              alt=""
              className="h-24 w-24 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] object-cover"
            />
          </div>
        </div>
        {stored?.updatedAt && (
          <p className="mt-3 text-xs text-[var(--admin-text-muted)]">
            Override active since {new Date(stored.updatedAt).toLocaleString()}
            {stored.label ? ` · ${stored.label}` : ''}
          </p>
        )}
      </AdminPanel>

      <AdminPanel className="mb-4 space-y-3">
        <div>
          <label className="admin-label mb-1 block" htmlFor="pwa-theme-label">
            Theme label (optional)
          </label>
          <AdminInput
            id="pwa-theme-label"
            value={themeLabel}
            onChange={(e) => setThemeLabel(e.target.value)}
            placeholder="e.g. St. Patrick's 2026"
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap gap-2">
          <AdminButton variant="primary" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'Processing…' : 'Upload square artwork'}
          </AdminButton>
          {stored && (
            <AdminButton variant="ghost" onClick={handleReset}>
              Reset to default
            </AdminButton>
          )}
        </div>

        {error && <p className="text-xs text-[var(--admin-danger)]">{error}</p>}
        {savedNote && <p className="text-xs text-[var(--admin-success)]">{savedNote}</p>}

        <p className="text-xs text-[var(--admin-text-muted)]">
          One upload is cropped to square and resized to 192×192 and 512×512 PNG. Stored in{' '}
          <code className="text-[var(--admin-text-dim)]">localStorage</code> for this demo; production
          should deploy files to <code className="text-[var(--admin-text-dim)]">public/icons/pwa/</code>{' '}
          or a CDN and update{' '}
          <code className="text-[var(--admin-text-dim)]">manifest.webmanifest</code> (see{' '}
          <code className="text-[var(--admin-text-dim)]">public/icons/pwa/README.md</code>).
        </p>
      </AdminPanel>
    </div>
  )
}
