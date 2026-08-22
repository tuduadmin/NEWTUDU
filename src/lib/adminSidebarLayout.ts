import { useCallback, useState } from 'react'

export const ADMIN_SIDEBAR_COLLAPSED_KEY = 'tudu-admin-sidebar-collapsed'
export const ADMIN_SIDEBAR_COLLAPSED_CHANGED_EVENT = 'tudu-admin-sidebar-collapsed-changed'

export function getAdminSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function setAdminSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(ADMIN_SIDEBAR_COLLAPSED_CHANGED_EVENT))
}

export function useAdminSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(() => getAdminSidebarCollapsed())

  const setCollapsed = useCallback((next: boolean) => {
    setAdminSidebarCollapsed(next)
    setCollapsedState(next)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev
      setAdminSidebarCollapsed(next)
      return next
    })
  }, [])

  return { collapsed, setCollapsed, toggleCollapsed }
}
