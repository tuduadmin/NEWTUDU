export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!isIos) return false
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

export async function runInstallPrompt(event: BeforeInstallPromptEvent): Promise<'accepted' | 'dismissed'> {
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}
