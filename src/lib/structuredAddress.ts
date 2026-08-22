/** Shared structured address fields for events, hidden gems, etc. */
export type StructuredAddress = {
  streetAddress: string
  streetSuite: string
  city: string
  province: string
  postalCode: string
  country: string
}

export function defaultStructuredAddress(country = 'Canada'): StructuredAddress {
  return {
    streetAddress: '',
    streetSuite: '',
    city: '',
    province: '',
    postalCode: '',
    country,
  }
}

export function formatStructuredAddress(address: StructuredAddress): string {
  const line1 = [address.streetAddress.trim(), address.streetSuite.trim()].filter(Boolean).join(', ')
  const line2 = [address.city.trim(), address.province.trim(), address.postalCode.trim()]
    .filter(Boolean)
    .join(', ')
  return [line1, line2, address.country.trim()].filter(Boolean).join(', ')
}
