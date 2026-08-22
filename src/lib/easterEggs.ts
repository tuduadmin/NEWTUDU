export interface EasterEggsConfig {
  /** Fallback display name when a personal host profile has no custom name. */
  defaultHostDisplayName: string
  /** Placeholder for future city-related jokes. */
  defaultCityJoke: string
  /** Placeholder for a hidden message easter egg. */
  hiddenMessage: string
}

export const EASTER_EGGS_KEY = 'tudu-admin-easter-eggs'
export const EASTER_EGGS_CHANGED_EVENT = 'tudu-easter-eggs-changed'

export const DEFAULT_EASTER_EGGS: EasterEggsConfig = {
  defaultHostDisplayName: 'Johnny Utah',
  defaultCityJoke: '',
  hiddenMessage: '',
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}

export function getEasterEggsConfig(): EasterEggsConfig {
  return readJson(EASTER_EGGS_KEY, DEFAULT_EASTER_EGGS)
}

export function saveEasterEggsConfig(config: EasterEggsConfig): void {
  localStorage.setItem(EASTER_EGGS_KEY, JSON.stringify(config))
  window.dispatchEvent(new Event(EASTER_EGGS_CHANGED_EVENT))
}

export function resetEasterEggsConfig(): EasterEggsConfig {
  localStorage.removeItem(EASTER_EGGS_KEY)
  window.dispatchEvent(new Event(EASTER_EGGS_CHANGED_EVENT))
  return { ...DEFAULT_EASTER_EGGS }
}

/** Easter egg fallback when a personal host has no saved name and no account first + last name. */
export function getDefaultHostDisplayName(): string {
  const name = getEasterEggsConfig().defaultHostDisplayName.trim()
  return name || DEFAULT_EASTER_EGGS.defaultHostDisplayName
}
