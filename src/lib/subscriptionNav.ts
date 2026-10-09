export const HOST_SUBSCRIPTION_PATH = '/host/subscription'

export const HOST_SUBSCRIPTION_DEFAULT_RETURN = '/host'

function isSafeReturnPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith('/') && !path.startsWith('//'))
}

export function getSubscriptionUrl(returnTo?: string): string {
  if (!returnTo || !isSafeReturnPath(returnTo)) return HOST_SUBSCRIPTION_PATH
  return `${HOST_SUBSCRIPTION_PATH}?returnTo=${encodeURIComponent(returnTo)}`
}

export function getSubscriptionReturnUrl(searchParams: URLSearchParams): string {
  const candidate = searchParams.get('returnTo')
  if (isSafeReturnPath(candidate)) return candidate
  return HOST_SUBSCRIPTION_DEFAULT_RETURN
}

export function getSubscriptionReturnLabel(returnTo: string): string {
  const path = returnTo.split('?')[0]
  switch (path) {
    case '/host':
      return 'Event Manager'
    case '/my-tudu':
    case '/my-tudu/feed':
      return 'My Tudu'
    case '/discover':
      return 'Discover'
    case '/discover/date-night':
      return 'Date night'
    case '/host/profile':
      return 'Edit profile'
    default:
      if (path.startsWith('/my-tudu')) return 'My Tudu'
      if (path.startsWith('/discover')) return 'Discover'
      return 'Back'
  }
}
