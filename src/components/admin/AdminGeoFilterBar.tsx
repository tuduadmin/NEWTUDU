import { useMemo } from 'react'
import { AdminButton, AdminFilterBar, AdminSelect } from './AdminUI'
import {
  getGeoFilterOptions,
  hasActiveGeoFilters,
  type AnalyticsFilters,
} from '../../lib/analyticsGeo'

type AdminGeoFilterBarProps = {
  filters: AnalyticsFilters
  onChange: (filters: AnalyticsFilters) => void
  onClear?: () => void
}

export default function AdminGeoFilterBar({
  filters,
  onChange,
  onClear,
}: AdminGeoFilterBarProps) {
  const filterOptions = useMemo(
    () => getGeoFilterOptions(filters.country === 'all' ? undefined : filters.country),
    [filters.country],
  )

  const regionLabel = filters.country === 'United States' ? 'State' : 'Province'

  function handleCountryChange(country: string) {
    onChange({ country, province: 'all', city: 'all' })
  }

  function handleProvinceChange(province: string) {
    onChange({ ...filters, province, city: 'all' })
  }

  function handleClear() {
    if (onClear) {
      onClear()
    } else {
      onChange({ country: 'all', province: 'all', city: 'all' })
    }
  }

  return (
    <AdminFilterBar>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-text-dim)]">
            Country
          </span>
          <AdminSelect
            value={filters.country ?? 'all'}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="min-w-[10rem]"
          >
            <option value="all">All Countries</option>
            {filterOptions.countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </AdminSelect>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-text-dim)]">
            {regionLabel}
          </span>
          <AdminSelect
            value={filters.province ?? 'all'}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="min-w-[10rem]"
            disabled={!filters.country || filters.country === 'all'}
          >
            <option value="all">All {regionLabel}s</option>
            {filterOptions.provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label} ({p.code})
              </option>
            ))}
          </AdminSelect>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-text-dim)]">
            City
          </span>
          <AdminSelect
            value={filters.city ?? 'all'}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className="min-w-[10rem]"
          >
            <option value="all">All Cities</option>
            {filterOptions.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </AdminSelect>
        </label>

        {hasActiveGeoFilters(filters) && (
          <AdminButton variant="ghost" onClick={handleClear} className="mb-0.5">
            Clear filters
          </AdminButton>
        )}
      </div>
    </AdminFilterBar>
  )
}
