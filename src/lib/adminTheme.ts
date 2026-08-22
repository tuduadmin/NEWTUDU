import { useCallback, useState } from 'react'

export type AdminTheme = 'light' | 'dark'

/** Persisted `dark` = Dusk UI; `light` = Dawn UI (see admin.css). */
export const ADMIN_THEME_MODE_LABEL: Record<AdminTheme, 'Dusk' | 'Dawn'> = {
  dark: 'Dusk',
  light: 'Dawn',
}

export function getAdminThemeModeLabel(theme: AdminTheme): 'Dusk' | 'Dawn' {
  return ADMIN_THEME_MODE_LABEL[theme]
}

export function getAdminThemeSwitchTargetLabel(theme: AdminTheme): 'Dusk' | 'Dawn' {
  return ADMIN_THEME_MODE_LABEL[theme === 'dark' ? 'light' : 'dark']
}

export function getAdminThemeSwitchTitle(theme: AdminTheme): string {
  return `Switch to ${getAdminThemeSwitchTargetLabel(theme)} mode`
}

export const ADMIN_THEME_STORAGE_KEY = 'tudu_admin_theme'

export function getStoredAdminTheme(): AdminTheme {
  try {
    const value = localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function setStoredAdminTheme(theme: AdminTheme): void {
  try {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function useAdminTheme() {
  const [theme, setThemeState] = useState<AdminTheme>(() => getStoredAdminTheme())

  const setTheme = useCallback((next: AdminTheme) => {
    setStoredAdminTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}
