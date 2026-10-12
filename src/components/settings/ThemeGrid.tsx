import { useState } from 'react'
import { Clock, Lock } from 'lucide-react'
import {
  APP_THEME_OPTIONS,
  APP_THEMES_LOCKED,
  getAppThemeId,
  saveAppThemeId,
  type AppThemeId,
} from '../../lib/appThemes'
import {
  prefChoiceClasses,
  PREF_CHOICE_ACTIVE_TEXT,
} from '../../lib/prefChoiceClasses'

type ThemeGridProps = {
  /** When true, all themes are shown but cannot be changed. Defaults to APP_THEMES_LOCKED. */
  locked?: boolean
}

export default function ThemeGrid({ locked = APP_THEMES_LOCKED }: ThemeGridProps) {
  const [selected, setSelected] = useState<AppThemeId>(() => getAppThemeId())

  function select(id: AppThemeId) {
    if (locked) return
    setSelected(id)
    saveAppThemeId(id)
  }

  return (
    <div>
      {locked && (
        <p className="mb-3 text-xs leading-relaxed text-brown-muted">
          More themes are on the way. Dusk is active for everyone right now.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {APP_THEME_OPTIONS.map((theme) => {
          const active = selected === theme.id
          return (
            <button
              key={theme.id}
              type="button"
              disabled={locked}
              aria-disabled={locked}
              aria-pressed={active}
              aria-label={`${theme.legacyName} theme`}
              onClick={() => select(theme.id)}
              className={`relative flex flex-col gap-2 px-2.5 py-2.5 ${prefChoiceClasses(active)} ${
                locked ? 'cursor-not-allowed opacity-90' : ''
              } ${locked && !active ? 'hover:border-brown/25' : ''}`}
            >
              <span
                className="h-8 w-full shrink-0 rounded-[10px] border border-brown/10 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${theme.preview.bg} 40%, ${theme.preview.accent} 100%)`,
                }}
                aria-hidden
              />
              <span
                className={`pref-choice-label w-full text-center text-xs font-semibold leading-tight ${
                  active ? PREF_CHOICE_ACTIVE_TEXT : 'text-brown'
                }`}
              >
                {theme.legacyName}
              </span>
              {locked && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brown/10 text-brown-muted">
                  <Lock size={10} aria-hidden />
                  <span className="sr-only">Locked</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        disabled={locked}
        aria-disabled={locked}
        aria-pressed={selected === 'auto'}
        onClick={() => select('auto')}
        className={`relative mt-2 flex w-full items-center justify-center gap-2 px-3 py-2.5 ${prefChoiceClasses(selected === 'auto')} ${
          locked ? 'cursor-not-allowed opacity-90' : ''
        } ${locked ? 'hover:border-brown/25' : ''}`}
      >
        <Clock
          size={15}
          className={selected === 'auto' ? 'pref-choice-label shrink-0 opacity-90' : 'shrink-0 text-brown-muted'}
          aria-hidden
        />
        <span
          className={`pref-choice-label text-xs font-semibold ${selected === 'auto' ? PREF_CHOICE_ACTIVE_TEXT : 'text-brown'}`}
        >
          Auto — match time of day
        </span>
        {locked && (
          <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-brown/10 text-brown-muted">
            <Lock size={10} aria-hidden />
          </span>
        )}
      </button>
    </div>
  )
}
