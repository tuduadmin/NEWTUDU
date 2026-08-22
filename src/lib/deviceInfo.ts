/** Short device string for feedback / report tickets. */
export function captureDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown device'
  const ua = navigator.userAgent
  let browser = 'Browser'
  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
  else if (ua.includes('Firefox/')) browser = 'Firefox'

  let os = 'Unknown OS'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'

  const mobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
      ? ' · Mobile viewport'
      : ''

  return `${browser} · ${os}${mobile}`
}
