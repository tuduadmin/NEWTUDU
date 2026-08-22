const STORAGE_KEY = 'tudu-pwa-icons-v1'
const MANIFEST_LINK_ID = 'tudu-dynamic-manifest'

export type PwaIconSet = {
  icon192: string
  icon512: string
  updatedAt: string
  label?: string
}

export const DEFAULT_PWA_ICON_192 = '/tudu-icon.png'
export const DEFAULT_PWA_ICON_512 = '/tudu-icon.png'

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

/** Center-crop to square and export PNG at exact PWA size. */
export async function fileToSquarePngDataUrl(file: File, size: number): Promise<string> {
  const img = await loadImageFile(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image.')

  const crop = Math.min(img.width, img.height)
  const sx = (img.width - crop) / 2
  const sy = (img.height - crop) / 2
  ctx.drawImage(img, sx, sy, crop, crop, 0, 0, size, size)
  return canvas.toDataURL('image/png')
}

export function getStoredPwaIcons(): PwaIconSet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PwaIconSet
    if (!parsed.icon192 || !parsed.icon512) return null
    return parsed
  } catch {
    return null
  }
}

export function savePwaIcons(icons: Omit<PwaIconSet, 'updatedAt'> & { updatedAt?: string }): PwaIconSet {
  const next: PwaIconSet = {
    icon192: icons.icon192,
    icon512: icons.icon512,
    label: icons.label,
    updatedAt: icons.updatedAt ?? new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  applyPwaIconsFromStorage()
  return next
}

export function clearStoredPwaIcons(): void {
  localStorage.removeItem(STORAGE_KEY)
  applyPwaIconsFromStorage()
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>): void {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.appendChild(link)
  }
  link.href = href
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      link.setAttribute(key, value)
    }
  }
}

function buildManifest(icon192: string, icon512: string): string {
  const manifest = {
    name: 'TUDU — Find something to do',
    short_name: 'TUDU',
    description: 'Swipe to discover local events. Host what you love.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#7c2942',
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  return URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }))
}

/** Apply stored overrides to manifest + apple-touch-icon (call on startup and after admin save). */
export function applyPwaIconsFromStorage(): void {
  if (typeof document === 'undefined') return

  const stored = getStoredPwaIcons()
  const icon192 = stored?.icon192 ?? DEFAULT_PWA_ICON_192
  const icon512 = stored?.icon512 ?? DEFAULT_PWA_ICON_512

  upsertLink('apple-touch-icon', icon512)

  const existing = document.getElementById(MANIFEST_LINK_ID) as HTMLLinkElement | null
  if (existing?.href.startsWith('blob:')) {
    URL.revokeObjectURL(existing.href)
  }

  if (stored) {
    const href = buildManifest(icon192, icon512)
    let link = document.getElementById(MANIFEST_LINK_ID) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = MANIFEST_LINK_ID
      link.rel = 'manifest'
      document.head.appendChild(link)
    }
    link.href = href
  } else if (existing) {
    existing.remove()
  }
}

export async function pwaIconsFromUpload(file: File, label?: string): Promise<PwaIconSet> {
  const [icon192, icon512] = await Promise.all([
    fileToSquarePngDataUrl(file, 192),
    fileToSquarePngDataUrl(file, 512),
  ])
  return savePwaIcons({ icon192, icon512, label })
}
