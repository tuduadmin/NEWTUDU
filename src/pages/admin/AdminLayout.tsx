import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import {
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Sun,
  X,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import {
  getAdminThemeModeLabel,
  getAdminThemeSwitchTitle,
  useAdminTheme,
} from '../../lib/adminTheme'
import { getCurrentUser, hasControlRoomAccess, signOut } from '../../lib/auth'
import { getControlRoomSignInPath } from '../../lib/controlRoomRoutes'
import { ADMIN_MESSAGES_CHANGED_EVENT } from '../../lib/adminMessages'
import { logActivity } from '../../lib/adminAnalytics'
import { getSupportQueueTotal } from '../../lib/adminSupportQueue'
import {
  getOrderedNavItems,
  groupNavItemsBySection,
  SIDEBAR_ORDER_CHANGED_EVENT,
  ADMIN_NAV_MORE_SECTION,
  isPathInMoreSection,
  type AdminNavBadgeKey,
} from '../../lib/adminSidebarNav'
import {
  getPendingOrgVerificationCount,
  ORG_VERIFICATION_CHANGED_EVENT,
} from '../../lib/orgVerificationRequests'
import {
  EVENT_REPORT_ESCALATION_CHANGED_EVENT,
} from '../../lib/adminFeedback'
import { useAdminSidebarCollapsed } from '../../lib/adminSidebarLayout'
import { useNoIndexPage } from '../../hooks/useNoIndexPage'

function getNavBadgeCount(key: AdminNavBadgeKey): number {
  switch (key) {
    case 'messages':
      return getSupportQueueTotal()
    case 'orgVerification':
      return getPendingOrgVerificationCount()
    default:
      return 0
  }
}

export default function AdminLayout() {
  useNoIndexPage()
  const location = useLocation()
  const { theme, toggleTheme } = useAdminTheme()
  const { collapsed: sidebarCollapsed, toggleCollapsed: toggleSidebarCollapsed } =
    useAdminSidebarCollapsed()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navItems, setNavItems] = useState(() => getOrderedNavItems())
  const [moreNavOpen, setMoreNavOpen] = useState(() => isPathInMoreSection(location.pathname, getOrderedNavItems()))
  const [badgeTick, setBadgeTick] = useState(0)
  const admin = getCurrentUser()
  void badgeTick

  useEffect(() => {
    function refreshNav() {
      setNavItems(getOrderedNavItems())
      setBadgeTick((t) => t + 1)
    }

    window.addEventListener(SIDEBAR_ORDER_CHANGED_EVENT, refreshNav)
    window.addEventListener(ORG_VERIFICATION_CHANGED_EVENT, refreshNav)
    window.addEventListener(EVENT_REPORT_ESCALATION_CHANGED_EVENT, refreshNav)
    window.addEventListener('tudu-feedback-changed', refreshNav)
    window.addEventListener(ADMIN_MESSAGES_CHANGED_EVENT, refreshNav)
    window.addEventListener('storage', refreshNav)
    return () => {
      window.removeEventListener(SIDEBAR_ORDER_CHANGED_EVENT, refreshNav)
      window.removeEventListener(ORG_VERIFICATION_CHANGED_EVENT, refreshNav)
      window.removeEventListener(EVENT_REPORT_ESCALATION_CHANGED_EVENT, refreshNav)
      window.removeEventListener('tudu-feedback-changed', refreshNav)
      window.removeEventListener(ADMIN_MESSAGES_CHANGED_EVENT, refreshNav)
      window.removeEventListener('storage', refreshNav)
    }
  }, [])

  useEffect(() => {
    if (isPathInMoreSection(location.pathname, navItems)) {
      setMoreNavOpen(true)
    }
  }, [location.pathname, navItems])

  function renderNavLink(item: (typeof navItems)[number], compact = false) {
    const { to, label, icon: Icon, end, badge } = item
    const badgeCount = badge ? getNavBadgeCount(badge) : 0
    return (
      <NavLink
        to={to}
        end={end}
        title={compact ? label : undefined}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) =>
          `admin-nav-link ${compact ? 'md:admin-nav-link-compact' : ''} ${isActive ? 'admin-nav-link-active' : ''}`
        }
      >
        <Icon size={15} className="shrink-0" />
        <span className={`flex-1 truncate ${compact ? 'md:hidden' : ''}`}>{label}</span>
        {badge && badgeCount > 0 && (
          <span className={`admin-badge admin-badge-cyan ${compact ? 'md:hidden' : ''}`}>{badgeCount}</span>
        )}
        {compact && badge && badgeCount > 0 && (
          <span className="admin-nav-badge-dot hidden md:block" aria-label={`${badgeCount} pending`} />
        )}
      </NavLink>
    )
  }

  if (!hasControlRoomAccess(admin?.email)) {
    return <Navigate to="/" replace />
  }

  function handleSignOut() {
    signOut()
    window.location.href = getControlRoomSignInPath()
  }

  function handleSync() {
    logActivity({ type: 'sync', label: 'Manual data sync' })
  }

  return (
    <div
      className="admin-shell flex min-h-svh"
      data-admin-theme={theme}
      data-admin-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
    >
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] transition-[width,transform] duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'md:w-[4.25rem]' : 'md:w-56'}`}
      >
        <div
          className={`flex items-center border-b border-[var(--admin-border)] px-2 py-3 ${
            sidebarCollapsed ? 'md:justify-center md:px-1' : 'justify-between px-3'
          }`}
        >
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={`flex min-w-0 items-center gap-2.5 no-underline transition hover:opacity-90 ${
              sidebarCollapsed ? 'md:justify-center' : 'flex-1'
            }`}
            title={sidebarCollapsed ? 'Control Room' : undefined}
          >
            <img
              src="/tudu-icon-transparent.png"
              alt=""
              className="h-8 w-8 shrink-0 object-contain"
            />
            <div className={`min-w-0 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
              <p className="admin-label admin-brand-label">Control Room</p>
              <h1 className="truncate text-sm font-bold tracking-tight text-[var(--admin-text)]">
                TUDU Control
              </h1>
            </div>
          </Link>
          <button
            type="button"
            className={`admin-btn admin-btn-ghost hidden shrink-0 md:inline-flex ${sidebarCollapsed ? 'md:hidden' : ''}`}
            onClick={toggleSidebarCollapsed}
            aria-label="Minimize sidebar"
            title="Minimize sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-ghost md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className={`flex-1 overflow-auto p-2 ${sidebarCollapsed ? 'md:px-1.5' : ''}`}>
          {groupNavItemsBySection(navItems).map(({ section, items }, groupIndex) => (
            <div key={`${section}-${items[0]?.to ?? groupIndex}`} className={groupIndex === 0 ? '' : 'mt-3'}>
              {section === ADMIN_NAV_MORE_SECTION ? (
                <>
                  <button
                    type="button"
                    className={`admin-nav-more-toggle mb-0.5 ${sidebarCollapsed ? 'md:admin-nav-more-toggle-compact' : ''}`}
                    onClick={() => setMoreNavOpen((open) => !open)}
                    aria-expanded={moreNavOpen}
                    title={sidebarCollapsed ? 'More' : undefined}
                  >
                    {sidebarCollapsed ? (
                      <MoreHorizontal size={15} className="hidden shrink-0 md:block" />
                    ) : null}
                    <span className={sidebarCollapsed ? 'md:sr-only' : ''}>More</span>
                    {moreNavOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                  </button>
                  {moreNavOpen && (
                    <ul
                      className={`space-y-0.5 ${
                        sidebarCollapsed
                          ? 'md:border-0 md:pl-0 md:ml-0'
                          : 'border-l border-[var(--admin-border)] pl-2 ml-1'
                      }`}
                    >
                      {items.map((item) => (
                        <li key={item.to}>{renderNavLink(item, sidebarCollapsed)}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <p
                    className={`admin-label px-2 text-[var(--admin-text-dim)] ${
                      groupIndex === 0 ? 'pb-1' : 'pb-1 pt-0.5'
                    } ${sidebarCollapsed ? 'md:hidden' : ''}`}
                  >
                    {section}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <li key={item.to}>{renderNavLink(item, sidebarCollapsed)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </nav>

        <div className={`border-t border-[var(--admin-border)] p-2 ${sidebarCollapsed ? 'md:px-1.5' : ''}`}>
          <button
            type="button"
            onClick={handleSignOut}
            title={sidebarCollapsed ? 'Sign out' : undefined}
            className={`admin-btn admin-btn-ghost w-full text-[var(--admin-text-muted)] ${
              sidebarCollapsed ? 'md:justify-center md:px-2' : 'justify-start'
            }`}
          >
            <LogOut size={15} />
            <span className={sidebarCollapsed ? 'md:hidden' : ''}>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex flex-col border-b border-[var(--admin-border)] bg-[var(--admin-bg)]">
          <div className="admin-header-dusk-bar shrink-0" aria-hidden />
          <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="admin-btn admin-btn-ghost hidden md:inline-flex"
              onClick={toggleSidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-ghost md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <Link
              to="/admin"
              className="flex items-center gap-1.5 no-underline transition hover:opacity-90"
            >
              <img
                src="/tudu-icon-transparent.png"
                alt=""
                className="h-5 w-5 shrink-0 object-contain"
              />
              <span className="text-sm font-semibold text-[var(--admin-text)]">TUDU Control</span>
            </Link>
            <AdminBadge>LOCAL</AdminBadge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="admin-theme-toggle"
              title={getAdminThemeSwitchTitle(theme)}
              aria-label={getAdminThemeSwitchTitle(theme)}
            >
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              <span className="hidden sm:inline">{getAdminThemeModeLabel(theme)}</span>
            </button>
            <button
              type="button"
              onClick={handleSync}
              className="admin-btn admin-btn-ghost hidden items-center gap-1.5 sm:inline-flex"
              title="Sync local data"
            >
              <span className="admin-sync-dot" />
              Sync data
            </button>
            <span className="hidden text-xs text-[var(--admin-text-muted)] sm:inline">
              {admin?.email}
            </span>
            <Link
              to="/discover"
              className="text-xs text-[var(--admin-text-dim)] no-underline hover:text-[var(--admin-accent)]"
            >
              Consumer app →
            </Link>
          </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-3 md:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AdminBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="admin-badge admin-badge-neutral text-[9px]">{children}</span>
  )
}
