export type ModeHeroId = 'road-trip' | 'bucket-list'

export type ModeHeroBranding = {
  heroImageUrl: string
  updatedAt: string
  label?: string
}

export const MODE_HERO_CHANGED_EVENT = 'tudu-mode-hero-changed'

export const MODE_HERO_SHARED_CONFIG_PATH = '/config/mode-heroes.json'

export const MODE_HERO_DEFAULTS: Record<ModeHeroId, string> = {
  'road-trip': '/themes/road-trip-hero-live.png',
  'bucket-list': '/themes/bucket-list-panorama.jpg',
}

export const MODE_HERO_CONSUMER_PATH: Record<ModeHeroId, string> = {
  'road-trip': '/road-trip',
  'bucket-list': '/bucket-list',
}

const STORAGE_KEY: Record<ModeHeroId, string> = {
  'road-trip': 'tudu-mode-hero-road-trip-v1',
  'bucket-list': 'tudu-mode-hero-bucket-list-v1',
}

const LIVE_BASENAME: Record<ModeHeroId, string> = {
  'road-trip': 'road-trip-hero-live',
  'bucket-list': 'bucket-list-hero-live',
}

const sharedByMode: Partial<Record<ModeHeroId, ModeHeroBranding>> = {}

export function getSharedModeHeroBranding(mode: ModeHeroId): ModeHeroBranding | null {
  return sharedByMode[mode] ?? null
}

export function getModeHeroBranding(mode: ModeHeroId): ModeHeroBranding | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY[mode])
    if (!raw) return null
    const parsed = JSON.parse(raw) as ModeHeroBranding
    if (!parsed.heroImageUrl?.trim()) return null
    return parsed
  } catch {
    return null
  }
}

export function getModeHeroRevision(mode: ModeHeroId): string {
  if (sharedByMode[mode]?.updatedAt) return sharedByMode[mode]!.updatedAt
  return getModeHeroBranding(mode)?.updatedAt ?? 'default'
}

function withCacheBust(url: string, updatedAt: string): string {
  if (url.startsWith('data:')) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${encodeURIComponent(updatedAt)}`
}

export function getModeHeroUrl(mode: ModeHeroId): string {
  const shared = sharedByMode[mode]
  if (shared?.heroImageUrl?.trim()) {
    return withCacheBust(shared.heroImageUrl, shared.updatedAt)
  }
  const local = getModeHeroBranding(mode)
  if (local?.heroImageUrl?.trim()) {
    return withCacheBust(local.heroImageUrl, local.updatedAt)
  }
  return MODE_HERO_DEFAULTS[mode]
}

function notifyModeHeroChanged(mode: ModeHeroId): void {
  window.dispatchEvent(new CustomEvent(MODE_HERO_CHANGED_EVENT, { detail: { mode } }))
  try {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY[mode],
        newValue: localStorage.getItem(STORAGE_KEY[mode]),
        storageArea: localStorage,
      }),
    )
  } catch {
    /* ignore */
  }
}

export async function refreshSharedModeHeroes(): Promise<void> {
  try {
    const res = await fetch(`${MODE_HERO_SHARED_CONFIG_PATH}?t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      for (const mode of Object.keys(MODE_HERO_DEFAULTS) as ModeHeroId[]) {
        sharedByMode[mode] = undefined
        notifyModeHeroChanged(mode)
      }
      return
    }
    const parsed = (await res.json()) as Partial<
      Record<ModeHeroId, Partial<ModeHeroBranding>>
    >
    for (const mode of Object.keys(MODE_HERO_DEFAULTS) as ModeHeroId[]) {
      const entry = parsed[mode]
      if (entry?.heroImageUrl?.trim()) {
        sharedByMode[mode] = {
          heroImageUrl: entry.heroImageUrl.trim(),
          updatedAt: entry.updatedAt ?? new Date().toISOString(),
          label: entry.label,
        }
      } else {
        sharedByMode[mode] = undefined
      }
      notifyModeHeroChanged(mode)
    }
  } catch {
    for (const mode of Object.keys(MODE_HERO_DEFAULTS) as ModeHeroId[]) {
      sharedByMode[mode] = undefined
      notifyModeHeroChanged(mode)
    }
  }

  await refreshLegacyRoadTripSharedConfig()
}

/** Merge old single-mode config until everyone republishes. */
async function refreshLegacyRoadTripSharedConfig(): Promise<void> {
  if (sharedByMode['road-trip']?.heroImageUrl) return
  try {
    const res = await fetch(`/config/road-trip-hero.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return
    const parsed = (await res.json()) as Partial<ModeHeroBranding>
    if (!parsed.heroImageUrl?.trim()) return
    sharedByMode['road-trip'] = {
      heroImageUrl: parsed.heroImageUrl.trim(),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      label: parsed.label,
    }
    notifyModeHeroChanged('road-trip')
  } catch {
    /* ignore */
  }
}

export async function publishModeHeroFileToDevServer(
  mode: ModeHeroId,
  file: File,
  label?: string,
): Promise<ModeHeroBranding> {
  const headers: Record<string, string> = {
    'Content-Type': file.type || 'application/octet-stream',
    'X-Hero-Mode': mode,
  }
  if (label?.trim()) headers['X-Hero-Label'] = encodeURIComponent(label.trim())

  const res = await fetch('/api/dev/mode-hero', {
    method: 'POST',
    headers,
    body: file,
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null
    if (res.status === 404) {
      throw new Error(
        'Publish API missing — stop the app, run npm run dev again, then Save once more.',
      )
    }
    throw new Error(err?.error ?? 'Could not publish hero for other devices.')
  }
  const config = (await res.json()) as ModeHeroBranding
  sharedByMode[mode] = config
  notifyModeHeroChanged(mode)
  return config
}

export async function publishModeHeroFromDataUrl(
  mode: ModeHeroId,
  dataUrl: string,
  label?: string,
): Promise<ModeHeroBranding> {
  const blob = await fetch(dataUrl).then((r) => r.blob())
  const type = blob.type || 'image/jpeg'
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
  const file = new File([blob], `${LIVE_BASENAME[mode]}.${ext}`, { type })
  return publishModeHeroFileToDevServer(mode, file, label)
}

export async function clearSharedModeHeroOnDevServer(mode: ModeHeroId): Promise<void> {
  const res = await fetch('/api/dev/mode-hero', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, clear: true }),
  })
  if (!res.ok) throw new Error('Could not clear shared hero on dev server.')
  sharedByMode[mode] = undefined
  notifyModeHeroChanged(mode)
}

export function saveModeHeroBranding(
  mode: ModeHeroId,
  input: { heroImageUrl: string; label?: string },
): ModeHeroBranding {
  const next: ModeHeroBranding = {
    heroImageUrl: input.heroImageUrl,
    label: input.label?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  }
  const payload = JSON.stringify(next)
  try {
    localStorage.setItem(STORAGE_KEY[mode], payload)
  } catch {
    throw new Error('Could not save hero (browser storage full). Try a smaller image.')
  }
  const readBack = localStorage.getItem(STORAGE_KEY[mode])
  if (readBack !== payload) {
    localStorage.removeItem(STORAGE_KEY[mode])
    throw new Error('Hero did not save completely — image is too large for this browser.')
  }
  notifyModeHeroChanged(mode)
  return next
}

export function clearModeHeroBranding(mode: ModeHeroId): void {
  localStorage.removeItem(STORAGE_KEY[mode])
  notifyModeHeroChanged(mode)
}

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image.'))
    }
    img.src = url
  })
}

export async function fileToModeHeroDataUrl(file: File): Promise<string> {
  const img = await loadImageFile(file)
  const maxStoredChars = 1_200_000
  let maxWidth = 1024

  while (maxWidth >= 480) {
    const scale = img.width > maxWidth ? maxWidth / img.width : 1
    const width = Math.round(img.width * scale)
    const height = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not process image.')
    ctx.drawImage(img, 0, 0, width, height)

    let quality = 0.82
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > maxStoredChars && quality > 0.42) {
      quality -= 0.07
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }
    if (dataUrl.length <= maxStoredChars) return dataUrl
    maxWidth = Math.round(maxWidth * 0.82)
  }

  throw new Error('Image is still too large after compression. Try a smaller photo.')
}

export function subscribeModeHero(onChange: () => void, mode?: ModeHeroId): () => void {
  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ mode?: ModeHeroId }>).detail
    if (!mode || detail?.mode === mode) onChange()
  }
  const onStorage = (event: StorageEvent) => {
    if (!mode) {
      onChange()
      return
    }
    if (event.key === STORAGE_KEY[mode] || event.key === null) onChange()
  }
  const onFocus = () => onChange()

  window.addEventListener(MODE_HERO_CHANGED_EVENT, onCustom as EventListener)
  window.addEventListener('storage', onStorage)
  window.addEventListener('focus', onFocus)

  return () => {
    window.removeEventListener(MODE_HERO_CHANGED_EVENT, onCustom as EventListener)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('focus', onFocus)
  }
}
