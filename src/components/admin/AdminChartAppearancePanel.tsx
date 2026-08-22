import { AdminButton, AdminPanel } from './AdminUI'
import {
  GROWTH_SERIES_CATALOG,
  resetGrowthChartPreferences,
  updateGrowthSeriesPreference,
  type GrowthChartPreferences,
  type GrowthSeriesId,
} from '../../lib/adminChartPreferences'

type AdminChartAppearancePanelProps = {
  preferences: GrowthChartPreferences
  onChange: (prefs: GrowthChartPreferences) => void
}

export default function AdminChartAppearancePanel({
  preferences,
  onChange,
}: AdminChartAppearancePanelProps) {
  function patchSeries(id: GrowthSeriesId, patch: Parameters<typeof updateGrowthSeriesPreference>[1]) {
    onChange(updateGrowthSeriesPreference(id, patch))
  }

  return (
    <AdminPanel className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="admin-label">Chart appearance</p>
          <p className="mt-0.5 text-[10px] text-[var(--admin-text-dim)]">
            Toggle metrics and pick line colors. Saved in this browser.
          </p>
        </div>
        <AdminButton
          variant="ghost"
          className="text-[10px]"
          onClick={() => onChange(resetGrowthChartPreferences())}
        >
          Reset defaults
        </AdminButton>
      </div>

      <ul className="space-y-2">
        {GROWTH_SERIES_CATALOG.map((def) => {
          const pref = preferences.series[def.id]
          return (
            <li
              key={def.id}
              className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pref.enabled}
                    onChange={(e) => patchSeries(def.id, { enabled: e.target.checked })}
                    className="shrink-0"
                  />
                  <span className="text-xs font-medium text-[var(--admin-text)]">{def.label}</span>
                </label>
                <label
                  className={`relative shrink-0 ${pref.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                  title={pref.enabled ? `Color for ${def.label}` : `Enable ${def.label} to change color`}
                >
                  <input
                    type="color"
                    value={pref.color}
                    disabled={!pref.enabled}
                    onChange={(e) => patchSeries(def.id, { color: e.target.value })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    aria-label={`Color for ${def.label}`}
                  />
                  <span
                    className="block h-5 w-5 rounded-full border border-[var(--admin-border)] shadow-sm"
                    style={{ backgroundColor: pref.color }}
                    aria-hidden
                  />
                </label>
              </div>
              <p className="mt-1 pl-6 text-[10px] leading-relaxed text-[var(--admin-text-dim)]">
                {def.description}
              </p>
            </li>
          )
        })}
      </ul>
    </AdminPanel>
  )
}
