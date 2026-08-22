# Host Event Manager UI contract (SOL / dusk reference)

**Reference pages:** `/host` (`EventManagerPage.tsx`), `/host/profile` (`EditPublicProfilePage.tsx`).

Use this page as the consumer **component and copy-density reference** when rolling SOL/dusk across the app. Colors and tokens live in [SOL-theme.md](./SOL-theme.md); this doc is **layout, buttons, and hierarchy**.

Admin (`/admin/*`) stays on Dawn/Dusk admin tokens — do not apply host button rules inside `.admin-shell`.

---

## Page shell

| Use | Classes / component |
|-----|---------------------|
| Full-page consumer host/app view | `app-page-shell` on outer wrapper + `pb-28` when `BottomNav` is shown |
| Top chrome | `AppHeaderBar` with sensible `logoLinkTo` |
| Page title | `font-display text-2xl font-extrabold tracking-tight text-brown` |
| Main padding | `main` → `px-4 pt-2` (match host manager) |

---

## Surfaces (cards & panels)

Defined at top of `EventManagerPage.tsx`:

| Role | Constant / pattern |
|------|---------------------|
| **Primary card** (profile, feedback) | `HOST_CARD` = `app-surface-card p-4` |
| **Inset panel** (empty state, list rows, analytics locked box) | `HOST_PANEL` = `rounded-[14px] border border-app-subtle bg-app-elevated` |

**Avoid:** `bg-white`, `bg-white/90`, raw `bg-cream` on large panels in dusk — they stay light or unreadable. Use `app-surface-card` or `HOST_PANEL`.

**Analytics gradient wrapper:** soft brand tint on panel (`bg-gradient-to-br from-orange/12 via-sunset-pink/8 to-purple/8`) — optional for “featured” sections only; don’t stack many on one scroll.

---

## Buttons & links (hierarchy)

**One full gradient primary per viewport** when possible (e.g. **Create personal event**). Secondary actions use outline/elevated, not a second rainbow button.

| Tier | When | Implementation |
|------|------|----------------|
| **Primary** | Main page action (create event, publish, continue draft) | `GradientButton` — `fullWidth`, `className="… py-2 text-sm"`, optional `Plus` + `mr-1`. Uses `bg-gradient-tudu` (default variant). |
| **Accent outline** | Verify, send feedback, non-destructive secondary CTAs | `border border-orange/35 bg-app-elevated py-2.5 text-sm font-semibold text-orange` + hover `border-orange/50 bg-orange/5`. Can be `<Link>` or `<button>`. |
| **Secondary nav / tools** | Scan tickets, edit profile, tabs | `HOST_SECONDARY_LINK` / `HOST_OUTLINE_BTN` — `border-app-subtle bg-app-elevated`, hover orange tint. Active route: orange border + bold (`HOST_MANAGER_ACTION_LINK_ACTIVE`). |
| **Text links** | Add slots, verify on badge, view profile | `text-orange font-semibold no-underline hover:underline` or existing tier badge link class. |

**Copy on buttons:** Sentence case (`Send feedback`, `Create personal event`) — not ALL CAPS unless legacy marketing exception.

---

## Profile header (personal & org)

Centered stack on `HOST_CARD`:

1. **Avatar** — `HostProfileAvatar` (initials fallback).
2. **Display name** — `font-display text-2xl font-bold text-brown`.
3. **Tier** — `HostProfileTierBadge` with `mt-3` wrapper; unverified shows grey pill + **Verify →** link (single verify entry — don’t repeat long verify copy in slot line).
4. **Social row** — `HostProfileSocialLinks` with `reserveSpace`.
5. **Slot metadata** — `text-xs text-brown-muted`, `mt-4` below social: private **or** public usage; no paragraph-length verify text here.
6. **Primary CTA** — `GradientButton` create event directly under metadata.

**Context toggle** (`HostContextToggle`): dark tabs — active = `border-orange/35 bg-app-elevated ring-orange/15`; inactive = `border-app-subtle` transparent. Org create promo line can stay bright for beta discoverability.

---

## Forms & search

- Consumer fields: `.app-field` + `formFieldClasses.ts`.
- Event list search on host page: `app-field py-3 pl-10 pr-4`.

---

## Typography & meta

| Element | Style |
|---------|--------|
| Section label (Beta Feedback, etc.) | `text-[10px] font-bold uppercase tracking-wide text-brown-muted` |
| Body / helper | `text-xs leading-relaxed text-brown-muted` |
| In-card title | `font-display text-base font-bold text-brown` |
| Destructive / errors | `text-maroon` / `text-red-400` sparingly |

---

## Analytics block (locked state)

- 3×2 metric grid with lock placeholders.
- Helper under grid: *“All 6 metrics unlock after phone verification.”*
- Locked CTA panel: `HOST_PANEL`-style elevated box + **accent outline** verify link (not `GradientButton`).

---

## Beta feedback block

- Same `HOST_CARD` as profile.
- Icon in tinted square (`bg-purple/10`).
- Personable `text-xs` body copy.
- **Send feedback** = accent outline button (not gradient).

---

## Rollout checklist (pass 4)

Apply host contract → other routes in this order:

1. **Host siblings** — `/host/profile` ✅, `/host/create-event`, `/host/subscription` (many still `bg-cream` shells).
2. **My Tudu + settings** — align secondary buttons and cards to `HOST_PANEL` / outline accent pattern.
3. **Discover + event detail** — page shell + card surfaces.
4. **Auth** — `auth-flow-page` + `app-surface-card` (sign-in done); verify phone, sign-up header.
5. **Modals / sheets** — replace `bg-white` dialogs with `app-surface-card` or dusk `install-app-sheet` pattern.
6. **Grep sweeps** — `bg-orange py-3` link-buttons → `GradientButton` or accent outline per hierarchy above.

**Verification:** `rg "bg-white/90|bg-cream\"" src/pages` on consumer routes; fix outliers.

---

## Related files

- `src/pages/host/EventManagerPage.tsx` — constants `HOST_*`
- `src/components/GradientButton.tsx` — primary CTA
- `src/components/host/HostContextToggle.tsx` — context tabs
- `src/components/host/HostAnalyticsPanel.tsx` — analytics + verify outline
- `src/styles/sol-dusk.css` — dusk overrides
- `docs/design/SOL-theme.md` — color tokens & theme ids
