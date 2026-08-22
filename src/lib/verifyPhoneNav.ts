export const VERIFY_PHONE_PATH = '/verify-phone'

export const VERIFY_PHONE_DEFAULT_RETURN = '/my-tudu/settings/edit-profile'

/** Build /verify-phone URL with an optional return path for back navigation. */
export function getVerifyPhoneUrl(returnTo?: string): string {
  if (!returnTo) return VERIFY_PHONE_PATH
  return `${VERIFY_PHONE_PATH}?returnTo=${encodeURIComponent(returnTo)}`
}

function isSafeReturnPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith('/') && !path.startsWith('//'))
}

/** Resolve where Verify Phone should navigate back to. */
export function getVerifyPhoneReturnUrl(
  searchParams: URLSearchParams,
  locationState?: { returnTo?: string } | null,
): string {
  const fromParam = searchParams.get('returnTo')
  const fromState = locationState?.returnTo
  const candidate = fromParam ?? fromState
  if (isSafeReturnPath(candidate)) return candidate
  return VERIFY_PHONE_DEFAULT_RETURN
}

/** Human-readable back link label for the resolved return path. */
export function getVerifyPhoneReturnLabel(returnTo: string): string {
  switch (returnTo) {
    case '/host':
      return 'Back to Event Manager'
    case '/host/create-org':
      return 'Back to Create Host Account'
    case '/host/profile':
      return 'Back to Edit Profile'
    case '/host/finance':
      return 'Back to Finance Hub'
    case '/my-tudu/settings/edit-profile':
      return 'Back to Edit Profile'
    case '/my-tudu/settings/security':
      return 'Back to Security'
    default:
      return 'Back to Settings'
  }
}
