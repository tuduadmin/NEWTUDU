# SOL — default dark brand theme

## What SOL means in the app

**SOL** is the user-facing name for the **Dusk** appearance theme. It maps to the stable theme id `dusk` (localStorage key `tudu-app-theme` = `"dusk"`). Do not rename the id — routes, CSS selectors, and saved preferences depend on `dusk`.

SOL expresses the **DUSK gradient** brand look: midnight surfaces plus magenta → sunset pink → orange accent gradient (`--gradient-dusk` in `src/styles/tokens.css`).

| Persisted id | CSS selector | Display name | Legacy label (settings) |
|--------------|--------------|--------------|-------------------------|
| `dusk` | `html[data-app-theme='dusk']` | **SOL** | Dusk |

Other theme ids (`dawn`, `midnight`, …) are unchanged. Light “Dawn” uses character label **Lumi** in settings (Sol moved to SOL/dusk).

## Visual spec (target)

| Token / area | Hex (landing / SOL mockup) |
|--------------|----------------------------|
| Page background | `#0b0f1a` (`--color-midnight`, `--color-page-bg`, `--color-app-dark`) |
| Elevated surface | `#121828` (`--color-midnight-elevated`, `--color-app-dark-elevated`) |
| Card / panel surface | `#1a2236` (`--color-midnight-surface`) |
| Form field fill | `#121828` (`--sol-field-bg` / `--color-midnight-elevated`) |
| Field border | `white/10` · placeholder `white/40` · focus ring orange `30%` |
| Primary text on dark | `#f8fafc` (`--color-text-primary`) |
| Muted text on dark | `rgba(248, 250, 252, 0.72)` secondary · `0.48` muted |
| Hero panel (landing) | `#0b0f1a` |
| Brand accent | `--gradient-dusk` (magenta `#c026a0` → pink `#f4729a` → orange `#f97316`) |
| Headline gradient utility | `.text-gradient` peach `#f68e5d` → purple `#c02e8d` |

### Dusk base overrides (`index.css`)

When `data-app-theme='dusk'` (SOL default):

- `--color-cream` / `--color-cream-dark` map to midnight charcoal (`#0b0f1a` / `#121828`) so legacy `bg-cream` shells are not blue-tinted.
- `--color-brown` / `--color-brown-muted` remap to light primary / `white/72` secondary so legacy `text-brown` reads on dark without per-page rewrites.
- `body` uses `bg-midnight` and light text.
- `--color-page-bg: #0b0f1a` for wrappers using the CSS variable.
- **Surface utilities:** `.app-page-shell`, `.bg-app-elevated`, `.border-app-subtle`, `.divide-app-subtle` — cream/white panels in light themes; `#121828` elevated panels and `white/10` borders in dusk.

**Landing (pass 2):** `LandingPage.tsx` uses `bg-midnight`, `Header variant="dark"`, white + `text-gradient` hero copy, and `FeatureCard variant="dark"`.

**Bottom nav (pass 2):** Discover, My Tudu, Road Trip (`ModeLandingPage` + sub-routes), Bucket List landing/mine/discover — page shells via `.app-page-shell*`; card/panel containers use `.bg-app-elevated` / `.border-app-subtle`.

**Form fields (pass 3):** All consumer `input`, `textarea`, `select`, and `[type=search]` use dusk field tokens in `sol-dusk.css` (`#121828` fill, `white/10` border, `white/40` placeholder, orange focus ring). Prefer `.app-field` / `formFieldClasses.ts` in TSX so light themes stay cream. Admin `.admin-shell` inputs are excluded from consumer overrides.

## Default & persistence

- **Fresh install (no `tudu-app-theme` in localStorage):** default is **`dusk`** → SOL resolves on load via `applyAppTheme()` in `main.tsx`.
- **Saved preference:** any valid id or `auto` in `tudu-app-theme`.
- **`auto` mode:** time-of-day resolution (unchanged):
  - 06:00–12:00 → `dawn`
  - 12:00–18:00 → `evergreen`
  - 18:00–21:00 → `dusk` (SOL)
  - 21:00–06:00 → `midnight`

Future: `auto` may bias toward `dusk` as the canonical dark default; not changed in foundation pass.

## Already aligned with SOL / dusk tokens

These areas already use midnight / gradient-dusk (not cream shells):

- Bucket onboarding (`OnboardingLayout`, onboarding steps)
- `BottomNav` (discover / app chrome)
- `HostPage`, bucket story/detail hero areas
- `Footer` default variant `dark` (midnight bar)
- Marketing `Header` dark variant

## Pass 2 — work through systematically

**Pass 3 (form cohesion):** Global dusk form styling + `.app-field` adoption on My Tudu library search, bucket list modals, create-event layout, settings security/password, notification prefs select. Admin unchanged (`.admin-shell` revert rules).

Mockup reference: `assets/Landing_Page.png` (marketing landing — charcoal shell, gradient headlines).

Re-theme **cream-first page shells** to respect `html[data-app-theme='dusk']` (midnight bg, light text). High-traffic order suggested:

1. **Landing** — `LandingPage.tsx` ✅ dark shell (remaining landing subcomponents may still use brown on cards — pass 2b)
2. **Discover** — `DiscoverPage.tsx` ✅ stack hint + detail panel elevated surfaces
3. **My Tudu** — `MyTuduPage.tsx`, `SettingsLayout` + settings fields ✅
4. **Host tools** — create event layout, org create, event manager, edit profile ✅ shells + `.app-field`
5. **Auth / legal** — sign-in, verify phone, cookie/terms/privacy
6. **Bucket / road trip / search** — `ModeLandingPage`, mine/discover, road-trip sub-pages ✅; search + detail pages — pass 2b
7. **Admin** — `styles/admin.css` (separate track)

### Implementation pattern (pass 2)

- **`sol-dusk.css`:** `--color-brown` / `--color-brown-muted` on dusk; global `input`/`select`/`textarea` styling; selective `bg-white` → elevated midnight (skips `bg-white/xx`)
- **`lib/formFieldClasses.ts` + `.app-field`:** shared field classes on settings, create org, address editors, `FormFields.tsx`
- **`index.css`:** `.app-page-shell`, `.bg-app-elevated`, cream remaps per theme id
- Keep cream+brown for `dawn` and other light theme ids until each theme is spec’d

## Related code

- `src/lib/appThemes.ts` — ids, SOL label, default, `applyAppTheme`
- `src/index.css` — per-theme cream overrides, `.app-page-shell`, imports `sol-dusk.css`
- `src/styles/sol-dusk.css` — SOL consumer dusk (fields, surfaces, body text)
- `src/lib/formFieldClasses.ts` — `.app-field` class bundles
- `src/styles/tokens.css` — `--gradient-dusk`, midnight palette
- `src/components/settings/ThemeGrid.tsx` — shows `characterName` (SOL for dusk)

## UI contract (pass 4)

**Reference page:** Host Event Manager (`/host`). Buttons, cards, profile header, and analytics patterns are documented in **[HOST-UI-CONTRACT.md](./HOST-UI-CONTRACT.md)**. Roll out from host → settings → discover → auth → modals; admin stays separate.
