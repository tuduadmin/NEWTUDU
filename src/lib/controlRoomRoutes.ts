/** Staff sign-in path. Override in production via VITE_CONTROL_ROOM_SIGN_IN_PATH (unlisted URL). */
export function getControlRoomSignInPath(): string {
  const raw = import.meta.env.VITE_CONTROL_ROOM_SIGN_IN_PATH?.trim()
  if (!raw) return '/admin/signin'
  return raw.startsWith('/') ? raw : `/${raw}`
}

/** React Router path segment (no leading slash). */
export function getControlRoomSignInRoutePattern(): string {
  return getControlRoomSignInPath().replace(/^\//, '')
}

export function isDevControlRoomDiscoveryEnabled(): boolean {
  return import.meta.env.DEV
}
