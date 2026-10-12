/**
 * App appearance themes — persisted ids map to `html[data-app-theme]` (see index.css).
 *
 * **SOL** is the brand name for the default dark theme; persisted id remains `dusk`.
 * Full spec: docs/design/SOL-theme.md
 *
 * | Token id   | Legacy name | Settings label | Notes                                |
 * |------------|-------------|----------------|--------------------------------------|
 * | dusk       | Dusk        | SOL            | Autumn evening — brand DUSK gradient   |
 * | dawn       | Dawn        | Lumi           | Soft sunrise — light warm shell        |
 * | midnight   | Winter Night| Nova           | Moonlit snow, frost glass (dark)       |
 * | evergreen  | Spring Dawn | Petal          | Cherry blossom morning (light)         |
 * | aurora     | Aurora      | Axis           | Arctic winter + aurora borealis (dark) |
 * | harvest    | High Summer | Marigold       | Blazing sun + pool haze (light)        |
 */
export type AppThemeId = 'dawn' | 'dusk' | 'midnight' | 'evergreen' | 'aurora' | 'harvest' | 'auto'

/** Fresh installs and missing localStorage — SOL (`dusk`). */
export const DEFAULT_APP_THEME_ID: AppThemeId = 'dusk'

/** When true, theme tiles are visible but not selectable in settings UI. */
export const APP_THEMES_LOCKED = false

export type AppThemeOption = {
  id: AppThemeId
  characterName: string
  legacyName: string
  icon: string
  preview: { bg: string; accent: string }
}

export const APP_THEME_OPTIONS: AppThemeOption[] = [
  {
    id: 'dawn',
    characterName: 'Lumi',
    legacyName: 'Dawn',
    icon: '☀️',
    preview: { bg: '#fff8f0', accent: '#f97316' },
  },
  {
    id: 'dusk',
    characterName: 'SOL',
    legacyName: 'Dusk',
    icon: '🌅',
    preview: { bg: '#0b0f1a', accent: '#c026a0' },
  },
  {
    id: 'midnight',
    characterName: 'Nova',
    legacyName: 'Winter Night',
    icon: '🌙',
    preview: { bg: '#06080f', accent: '#bae6fd' },
  },
  {
    id: 'evergreen',
    characterName: 'Petal',
    legacyName: 'Spring Dawn',
    icon: '🌸',
    preview: { bg: '#fdf2f8', accent: '#f472b6' },
  },
  {
    id: 'aurora',
    characterName: 'Axis',
    legacyName: 'Aurora',
    icon: '❄️',
    preview: { bg: '#050b14', accent: '#34d399' },
  },
  {
    id: 'harvest',
    characterName: 'Marigold',
    legacyName: 'High Summer',
    icon: '☀️',
    preview: { bg: '#fff7ed', accent: '#f59e0b' },
  },
]

const APP_THEME_KEY = 'tudu-app-theme'
/** Legacy keys from older builds — read once, normalize to APP_THEME_KEY. */
const LEGACY_APP_THEME_KEYS = ['tudu_app_theme'] as const

function isValidThemeId(raw: string | null): raw is AppThemeId {
  return raw === 'auto' || APP_THEME_OPTIONS.some((t) => t.id === raw)
}

function readStoredThemeId(): AppThemeId | null {
  const keysToTry = [APP_THEME_KEY, ...LEGACY_APP_THEME_KEYS]
  for (const key of keysToTry) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      let id = raw
      if (raw.startsWith('{') || raw.startsWith('"')) {
        try {
          const parsed: unknown = JSON.parse(raw)
          if (typeof parsed === 'string') id = parsed
          else if (parsed && typeof parsed === 'object' && 'id' in parsed) {
            const maybe = (parsed as { id?: unknown }).id
            if (typeof maybe === 'string') id = maybe
          }
        } catch {
          /* use raw string */
        }
      }
      if (isValidThemeId(id)) return id
    } catch {
      /* ignore corrupt storage */
    }
  }
  return null
}

export function getAppThemeId(): AppThemeId {
  try {
    const stored = readStoredThemeId()
    if (stored) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_APP_THEME_ID
}

export function saveAppThemeId(id: AppThemeId): void {
  try {
    localStorage.setItem(APP_THEME_KEY, id)
  } catch {
    /* ignore quota / privacy mode */
  }
  applyAppTheme(id)
}

function resolveTheme(id: AppThemeId): AppThemeId {
  if (id !== 'auto') return id
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 9) return 'dawn'
  if (hour >= 9 && hour < 12) return 'evergreen'
  if (hour >= 12 && hour < 17) return 'harvest'
  if (hour >= 17 && hour < 20) return 'dusk'
  if (hour >= 20 && hour < 23) return 'aurora'
  return 'midnight'
}

export function applyAppTheme(id: AppThemeId = getAppThemeId()): void {
  try {
    const resolved = resolveTheme(id)
    document.documentElement.dataset.appTheme = resolved
    document.documentElement.dataset.appThemeMode = id
  } catch (err) {
    console.warn('[TUDU] applyAppTheme failed, using default:', err)
    try {
      document.documentElement.dataset.appTheme = DEFAULT_APP_THEME_ID
      document.documentElement.dataset.appThemeMode = DEFAULT_APP_THEME_ID
    } catch {
      /* ignore */
    }
  }
}

export function getResolvedThemeOption(): AppThemeOption {
  const resolved = resolveTheme(getAppThemeId())
  return (
    APP_THEME_OPTIONS.find((t) => t.id === resolved) ??
    APP_THEME_OPTIONS.find((t) => t.id === DEFAULT_APP_THEME_ID)!
  )
}

/** Resolved theme id on `html[data-app-theme]` (never `auto`). */
export function getResolvedAppThemeId(): Exclude<AppThemeId, 'auto'> {
  return resolveTheme(getAppThemeId())
}

/** Dark consumer shells (SOL, Nova, Axis) vs light (Lumi, Petal, Marigold). */
export function isDarkConsumerTheme(id: Exclude<AppThemeId, 'auto'> = getResolvedAppThemeId()): boolean {
  return id === 'dusk' || id === 'midnight' || id === 'aurora'
}
