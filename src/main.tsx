import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppErrorBoundary from './components/AppErrorBoundary'
import './index.css'
import { applyAppTheme } from './lib/appThemes'
import { applyPwaIconsFromStorage } from './lib/pwaIcons'
import { purgeRemovedDemoEventsFromLocalStorage } from './lib/removedDemoEvents'

try {
  purgeRemovedDemoEventsFromLocalStorage()
} catch (err) {
  console.warn('[TUDU] Removed demo event purge failed:', err)
}

try {
  applyAppTheme()
} catch (err) {
  console.warn('[TUDU] Initial theme apply failed:', err)
}

try {
  applyPwaIconsFromStorage()
} catch (err) {
  console.warn('[TUDU] PWA icon apply failed:', err)
}

function showBootstrapFailure(message: string, detail?: string): void {
  const root = document.getElementById('root')
  if (!root || root.childElementCount > 0) return
  const detailHtml = detail
    ? `<p style="margin:0.5rem 0 0;font-size:0.8rem;font-family:ui-monospace,monospace;word-break:break-word">${detail.replace(/</g, '&lt;')}</p>`
    : ''
  root.innerHTML =
    '<div style="max-width:32rem;margin:2rem auto;padding:1.25rem 1.5rem;font-family:system-ui,sans-serif;color:#3d2c29;background:#faf6ef;border:1px solid rgba(61,44,41,0.15);border-radius:1rem;line-height:1.5">' +
    `<p style="margin:0 0 0.75rem;font-weight:700">${message.replace(/</g, '&lt;')}</p>` +
    '<p style="margin:0 0 0.5rem;font-size:0.9rem">Open DevTools → Console for errors. Confirm the dev server is running from the <strong>tudu</strong> project folder:</p>' +
    '<p style="margin:0;font-size:0.85rem;font-family:ui-monospace,monospace">npm run dev</p>' +
    '<p style="margin:0.75rem 0 0;font-size:0.85rem">Use <strong>http://</strong> (not https) unless you started <code>npm run dev:https</code>.</p>' +
    detailHtml +
    '</div>'
}

function runStartupSeed(label: string, fn: () => unknown): void {
  try {
    fn()
  } catch (err) {
    console.warn(`[TUDU] Startup seed skipped (${label}):`, err)
  }
}

async function runStartupSeeds(): Promise<void> {
  try {
    const [
      { seedDemoAccount, seedDemoOrgWithAdmin, seedDemoPendingOrg, repairStoredAccounts },
      { seedDemoUser, seedAdminUser, seedOrgAdminUser, repairStoredUsers },
      { seedDemoUserPreferences },
      { getPublicBucketLists, seedDemoBucketLists },
      { getCompletedStories },
      { seedTrustedPartnerOrgs },
    ] = await Promise.all([
      import('./lib/account'),
      import('./lib/auth'),
      import('./lib/preferences'),
      import('./lib/bucketLists'),
      import('./lib/completedStories'),
      import('./lib/trustedPartners'),
    ])

    runStartupSeed('repairStoredUsers', repairStoredUsers)
    runStartupSeed('repairStoredAccounts', repairStoredAccounts)
    runStartupSeed('seedDemoUser', seedDemoUser)
    runStartupSeed('seedAdminUser', seedAdminUser)
    runStartupSeed('seedOrgAdminUser', seedOrgAdminUser)
    runStartupSeed('seedDemoAccount', seedDemoAccount)
    runStartupSeed('seedDemoOrgWithAdmin', seedDemoOrgWithAdmin)
    runStartupSeed('seedDemoPendingOrg', seedDemoPendingOrg)
    runStartupSeed('seedTrustedPartnerOrgs', seedTrustedPartnerOrgs)
    runStartupSeed('seedDemoUserPreferences', seedDemoUserPreferences)
    runStartupSeed('seedDemoBucketLists', seedDemoBucketLists)
    runStartupSeed('getPublicBucketLists', getPublicBucketLists)
    runStartupSeed('getCompletedStories', getCompletedStories)
  } catch (err) {
    console.warn('[TUDU] Startup seed modules failed to load:', err)
  }

  try {
    purgeRemovedDemoEventsFromLocalStorage()
  } catch (err) {
    console.warn('[TUDU] Post-seed removed demo event purge failed:', err)
  }
}

function scheduleStartupSeeds(): void {
  const run = () => {
    void runStartupSeeds()
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run)
  } else {
    window.setTimeout(run, 0)
  }
}

function markBootstrapped(): void {
  try {
    window.dispatchEvent(new CustomEvent('tudu:bootstrapped'))
  } catch {
    /* ignore */
  }
}

async function bootstrap(): Promise<void> {
  const rootEl = document.getElementById('root')
  if (!rootEl) {
    showBootstrapFailure('App failed to load', 'Missing #root in index.html')
    markBootstrapped()
    return
  }

  /* Clears index.html watchdog while import('./App') (~1MB chunk) loads on slow links. */
  markBootstrapped()

  try {
    const { default: App } = await import('./App')
    createRoot(rootEl).render(
      <StrictMode>
        <AppErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppErrorBoundary>
      </StrictMode>,
    )
    scheduleStartupSeeds()
  } catch (err) {
    console.error('[TUDU] Bootstrap failed:', err)
    const detail = err instanceof Error ? err.message : String(err)
    showBootstrapFailure('App failed to load', detail)
  }
}

void bootstrap()
