import { getAllAccounts, getHostEvents, type HostEvent, type UserAccount } from './account'
import { PLATFORM_ADMIN } from './auth'
import { formatCityLabel } from './location'

function getHomeRegionFromCity(homeCity: string): string {
  const parts = homeCity.split(',')
  if (parts.length >= 2) return parts.slice(1).join(',').trim()
  return ''
}

export type AnalyticsFilters = {
  country?: string
  province?: string
  state?: string
  city?: string
}

export const DEFAULT_COUNTRIES = ['Canada', 'United States', 'United Kingdom'] as const

export const CANADIAN_PROVINCES: { code: string; label: string }[] = [
  { code: 'AB', label: 'Alberta' },
  { code: 'BC', label: 'British Columbia' },
  { code: 'MB', label: 'Manitoba' },
  { code: 'NB', label: 'New Brunswick' },
  { code: 'NL', label: 'Newfoundland and Labrador' },
  { code: 'NS', label: 'Nova Scotia' },
  { code: 'NT', label: 'Northwest Territories' },
  { code: 'NU', label: 'Nunavut' },
  { code: 'ON', label: 'Ontario' },
  { code: 'PE', label: 'Prince Edward Island' },
  { code: 'QC', label: 'Quebec' },
  { code: 'SK', label: 'Saskatchewan' },
  { code: 'YT', label: 'Yukon' },
]

export const US_STATES: { code: string; label: string }[] = [
  { code: 'AL', label: 'Alabama' },
  { code: 'AK', label: 'Alaska' },
  { code: 'AZ', label: 'Arizona' },
  { code: 'AR', label: 'Arkansas' },
  { code: 'CA', label: 'California' },
  { code: 'CO', label: 'Colorado' },
  { code: 'CT', label: 'Connecticut' },
  { code: 'DE', label: 'Delaware' },
  { code: 'FL', label: 'Florida' },
  { code: 'GA', label: 'Georgia' },
  { code: 'HI', label: 'Hawaii' },
  { code: 'ID', label: 'Idaho' },
  { code: 'IL', label: 'Illinois' },
  { code: 'IN', label: 'Indiana' },
  { code: 'IA', label: 'Iowa' },
  { code: 'KS', label: 'Kansas' },
  { code: 'KY', label: 'Kentucky' },
  { code: 'LA', label: 'Louisiana' },
  { code: 'ME', label: 'Maine' },
  { code: 'MD', label: 'Maryland' },
  { code: 'MA', label: 'Massachusetts' },
  { code: 'MI', label: 'Michigan' },
  { code: 'MN', label: 'Minnesota' },
  { code: 'MS', label: 'Mississippi' },
  { code: 'MO', label: 'Missouri' },
  { code: 'MT', label: 'Montana' },
  { code: 'NE', label: 'Nebraska' },
  { code: 'NV', label: 'Nevada' },
  { code: 'NH', label: 'New Hampshire' },
  { code: 'NJ', label: 'New Jersey' },
  { code: 'NM', label: 'New Mexico' },
  { code: 'NY', label: 'New York' },
  { code: 'NC', label: 'North Carolina' },
  { code: 'ND', label: 'North Dakota' },
  { code: 'OH', label: 'Ohio' },
  { code: 'OK', label: 'Oklahoma' },
  { code: 'OR', label: 'Oregon' },
  { code: 'PA', label: 'Pennsylvania' },
  { code: 'RI', label: 'Rhode Island' },
  { code: 'SC', label: 'South Carolina' },
  { code: 'SD', label: 'South Dakota' },
  { code: 'TN', label: 'Tennessee' },
  { code: 'TX', label: 'Texas' },
  { code: 'UT', label: 'Utah' },
  { code: 'VT', label: 'Vermont' },
  { code: 'VA', label: 'Virginia' },
  { code: 'WA', label: 'Washington' },
  { code: 'WV', label: 'West Virginia' },
  { code: 'WI', label: 'Wisconsin' },
  { code: 'WY', label: 'Wyoming' },
  { code: 'DC', label: 'District of Columbia' },
]

const US_STATE_CODES = new Set(US_STATES.map((s) => s.code))

export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === PLATFORM_ADMIN.email.toLowerCase()
}

function defaultCountryForProvince(province: string): string {
  return US_STATE_CODES.has(province) ? 'United States' : 'Canada'
}

export type ResolvedGeo = {
  country: string
  province: string
  city: string
}

export function resolveAccountGeo(account: UserAccount): ResolvedGeo {
  const province =
    account.province || account.homeRegion || getHomeRegionFromCity(account.homeCity)
  const country = account.country || (province ? defaultCountryForProvince(province) : 'Canada')
  return {
    country,
    province,
    city: formatCityLabel(account.homeCity),
  }
}

export function resolveEventGeo(event: HostEvent): ResolvedGeo {
  const province = event.province || ''
  const country = event.country || (province ? defaultCountryForProvince(province) : 'Canada')
  return {
    country,
    province,
    city: formatCityLabel(event.city ?? ''),
  }
}

function isFilterActive(value?: string): boolean {
  return Boolean(value && value !== 'all')
}

export function matchesGeoFilter(geo: ResolvedGeo, filters: AnalyticsFilters): boolean {
  if (isFilterActive(filters.country) && geo.country !== filters.country) return false
  const regionFilter = filters.province || filters.state
  if (isFilterActive(regionFilter) && geo.province !== regionFilter) return false
  if (isFilterActive(filters.city) && geo.city.toLowerCase() !== filters.city!.toLowerCase()) {
    return false
  }
  return true
}

export function accountMatchesFilters(account: UserAccount, filters: AnalyticsFilters): boolean {
  if (!hasActiveGeoFilters(filters)) return true
  return matchesGeoFilter(resolveAccountGeo(account), filters)
}

export function eventMatchesFilters(event: HostEvent, filters: AnalyticsFilters): boolean {
  if (!hasActiveGeoFilters(filters)) return true
  return matchesGeoFilter(resolveEventGeo(event), filters)
}

export function hasActiveGeoFilters(filters: AnalyticsFilters): boolean {
  return (
    isFilterActive(filters.country) ||
    isFilterActive(filters.province) ||
    isFilterActive(filters.state) ||
    isFilterActive(filters.city)
  )
}

export function getProvincesForCountry(country?: string): { code: string; label: string }[] {
  if (country === 'United States') return US_STATES
  if (country === 'Canada') return CANADIAN_PROVINCES
  return [...CANADIAN_PROVINCES, ...US_STATES]
}

export function getProvinceLabel(code: string, country?: string): string {
  const list = getProvincesForCountry(country)
  return list.find((p) => p.code === code)?.label ?? code
}

export type GeoFilterOptions = {
  countries: string[]
  provinces: { code: string; label: string }[]
  cities: string[]
}

export function getGeoFilterOptions(selectedCountry?: string): GeoFilterOptions {
  const accounts = getAllAccounts().filter((a) => !isAdminEmail(a.email))
  const events = getHostEvents()

  const countrySet = new Set<string>([...DEFAULT_COUNTRIES])
  const provinceSet = new Set<string>()
  const citySet = new Set<string>()

  for (const account of accounts) {
    const geo = resolveAccountGeo(account)
    if (geo.country) countrySet.add(geo.country)
    if (geo.province) provinceSet.add(geo.province)
    if (geo.city) citySet.add(geo.city)
  }

  for (const event of events) {
    const geo = resolveEventGeo(event)
    if (geo.country) countrySet.add(geo.country)
    if (geo.province) provinceSet.add(geo.province)
    if (geo.city) citySet.add(geo.city)
  }

  const countryFiltered = isFilterActive(selectedCountry)
  const baseProvinces = getProvincesForCountry(countryFiltered ? selectedCountry : undefined)
  const knownCodes = new Set(baseProvinces.map((p) => p.code))

  const extraProvinces = [...provinceSet]
    .filter((code) => !knownCodes.has(code))
    .map((code) => ({ code, label: getProvinceLabel(code, selectedCountry) }))

  const provinces = countryFiltered
    ? [...baseProvinces, ...extraProvinces].sort((a, b) => a.label.localeCompare(b.label))
    : [...baseProvinces, ...extraProvinces]
        .filter((p, i, arr) => arr.findIndex((x) => x.code === p.code) === i)
        .sort((a, b) => a.label.localeCompare(b.label))

  return {
    countries: [...countrySet].sort(),
    provinces,
    cities: [...citySet].filter(Boolean).sort((a, b) => a.localeCompare(b)),
  }
}
