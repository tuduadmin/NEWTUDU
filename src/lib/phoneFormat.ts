const NA_PHONE_LENGTH = 10

/** Strip formatting; keep last 10 digits for NA numbers (handles +1 prefix). */
export function parsePhoneDigits(formatted: string): string {
  const digits = formatted.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }
  if (digits.length > NA_PHONE_LENGTH) {
    return digits.slice(-NA_PHONE_LENGTH)
  }
  return digits
}

/** Format digits as (306) 555-1234 while typing. */
export function formatPhoneDisplay(digits: string): string {
  const d = parsePhoneDigits(digits)
  if (d.length === 0) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, NA_PHONE_LENGTH)}`
}

export function isValidPhone(digits: string): boolean {
  return parsePhoneDigits(digits).length === NA_PHONE_LENGTH
}

/** Normalize any stored/display value to 10-digit storage form. */
export function toStoredPhone(value: string): string {
  return parsePhoneDigits(value)
}

/** Format stored phone for read-only display (handles legacy formatted values). */
export function formatStoredPhone(stored: string | undefined): string {
  if (!stored?.trim()) return ''
  return formatPhoneDisplay(stored)
}

/** E.164 for NA numbers, e.g. +13065551234 */
export function toE164(digits: string): string {
  const d = parsePhoneDigits(digits)
  return d.length === NA_PHONE_LENGTH ? `+1${d}` : ''
}
