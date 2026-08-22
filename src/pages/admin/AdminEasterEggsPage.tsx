import { useState, type FormEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from '../../components/admin/AdminUI'
import {
  DEFAULT_EASTER_EGGS,
  getEasterEggsConfig,
  resetEasterEggsConfig,
  saveEasterEggsConfig,
  type EasterEggsConfig,
} from '../../lib/easterEggs'

export default function AdminEasterEggsPage() {
  const [config, setConfig] = useState<EasterEggsConfig>(() => getEasterEggsConfig())
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    saveEasterEggsConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    if (!window.confirm('Reset easter egg settings to defaults?')) return
    setConfig(resetEasterEggsConfig())
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        title="Easter Eggs"
        subtitle="Fun defaults and hidden surprises — stored in localStorage for this browser."
        actions={
          <>
            <a
              href="/host"
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-secondary inline-flex items-center gap-1.5 text-xs no-underline"
            >
              Event Manager
              <ExternalLink size={14} />
            </a>
            <AdminButton type="button" variant="ghost" onClick={handleReset}>
              Reset defaults
            </AdminButton>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AdminPanel>
          <p className="admin-label mb-1 text-[var(--admin-accent)]">Host profiles</p>
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">Default host display name</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--admin-text-muted)]">
            Placeholder on the edit profile form, and fallback on Event Manager / public profile when
            a personal host has no custom display name and no account first + last name. Fallback
            chain: saved name → user first + last → easter egg default → &ldquo;Host&rdquo;.
          </p>
          <div className="mt-3">
            <label className="block">
              <span className="admin-label">Default host display name</span>
              <AdminInput
                value={config.defaultHostDisplayName}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, defaultHostDisplayName: e.target.value }))
                  setSaved(false)
                }}
                placeholder={DEFAULT_EASTER_EGGS.defaultHostDisplayName}
                className="mt-1 w-full"
              />
            </label>
          </div>
        </AdminPanel>

        <AdminPanel>
          <p className="admin-label mb-1 text-[#eab308]">Coming soon</p>
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">Future easter eggs</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--admin-text-muted)]">
            Placeholder fields for upcoming fun defaults. Not wired to the app yet.
          </p>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="admin-label">Default city joke</span>
              <AdminInput
                value={config.defaultCityJoke}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, defaultCityJoke: e.target.value }))
                  setSaved(false)
                }}
                placeholder="e.g. Regina — where the flat land meets flat beer"
                className="mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="admin-label">Hidden message</span>
              <AdminInput
                value={config.hiddenMessage}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, hiddenMessage: e.target.value }))
                  setSaved(false)
                }}
                placeholder="Secret copy for a future surprise…"
                className="mt-1 w-full"
              />
            </label>
          </div>
        </AdminPanel>

        <div className="flex items-center gap-3">
          <AdminButton type="submit">{saved ? 'Saved!' : 'Save easter eggs'}</AdminButton>
          {saved && (
            <span className="text-xs text-emerald-400">Settings applied — refresh /host to preview.</span>
          )}
        </div>
      </form>
    </div>
  )
}
