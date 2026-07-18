/// <reference types="vite/client" />

interface ContactAddress {
  addressLine?: string[]
  country?: string
  countryCode?: string
  dependentLocality?: string
  formatted?: string
  languageCode?: string
  organization?: string
  phone?: string
  postalCode?: string
  recipient?: string
  region?: string
  sortingCode?: string
}

interface ContactEmail {
  address?: string
  type?: string
}

interface ContactIcon {
  sizes?: string
  src?: string
  type?: string
}

interface ContactName {
  family?: string
  formatted?: string
  given?: string
  honorificPrefix?: string
  honorificSuffix?: string
  middle?: string
}

interface ContactPhone {
  country?: string
  number?: string
  type?: string
}

interface ContactSelectResult {
  address?: ContactAddress[]
  email?: ContactEmail[]
  icon?: ContactIcon[]
  name?: string[]
  tel?: string[]
  url?: string[]
}

interface ContactsManager {
  select(
    properties: ('address' | 'email' | 'icon' | 'name' | 'tel' | 'url')[],
    options?: { multiple?: boolean },
  ): Promise<ContactSelectResult[]>
}

interface Navigator {
  contacts?: ContactsManager
}
