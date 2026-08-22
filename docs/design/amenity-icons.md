# Amenity & category icons

Canonical icon identity for event **amenities** and **categories** lives in code (phase 1). The admin **Categories & Amenities** page at `/admin/categories-amenities` is a read-only mirror used to verify locked icons across the app.

## Source files

| Concern | File |
|--------|------|
| Amenity ids + labels | `src/data/eventCategories.ts` (`PRIMARY_AMENITIES`, `ADDITIONAL_AMENITIES`) |
| Amenity icon mapping (solid + outline) | `src/data/amenityIconRegistry.ts` |
| React helpers (`AmenityIconById`, `AmenityPreviewStrip`) | `src/lib/amenityIcons.tsx` |
| Event category icons | `src/data/eventCategories.ts` (`EVENT_CATEGORIES[].icon`) |

Every amenity id in `eventCategories.ts` must have an entry in `AMENITY_ICON_REGISTRY`. A startup assertion throws if any are missing.

## Registry API

Each amenity entry has:

- **Lucide / Heroicons entry**
  - `solid` — Heroicons `@heroicons/react/24/solid` **or** Lucide wrapped via `lucideAsSolid()` (`strokeWidth: 2.5`)
  - `outline` — matching Lucide icon for the create-event picker
  - `solidIconId` — export name shown in admin
  - `source` — `'heroicons' | 'lucide'`
- **react-icons entry** — use `reactIconsEntry()` helper
  - `icon` — component imported from e.g. `react-icons/fa`
  - `reactIconsImport` — subpath (`fa`, `md`, `io5`, …)
  - `reactIconsName` — export name (`FaWifi`, …)
  - `solidIconId` — same as `reactIconsName` (admin column)
  - `source` — `'react-icons'`
  - Same glyph renders for solid cards and the orange 16px create-event picker (`AmenityIconDisplay`).

**Parking:** Lucide `CircleParking` (P in circle). Heroicons has no parking-letter glyph.

## Amenity mapping (reference-aligned)

| Amenity id | Solid | Outline | Source | Notes |
|------------|-------|---------|--------|-------|
| `food-drink` | UtensilsCrossed | UtensilsCrossed | lucide | Fork & knife |
| `alcohol` | Martini | Martini | lucide | Cocktail glass |
| `bathrooms` | Bath | Bath | lucide | Approx. restroom signage |
| `parking` | CircleParking | CircleParking | lucide | P in circle |
| `wheelchair` | Accessibility | Accessibility | lucide | ISA wheelchair |
| `wifi` | FaWifi | FaWifi | react-icons | Template — `react-icons/fa` |
| `kid-friendly` | Shapes | Shapes | lucide | Blocks / shapes |
| `baby-changing` | Baby | Baby | lucide | No stroller icon; baby silhouette |
| `pet-friendly` | PawPrint | PawPrint | lucide | |
| `power` | PlugZap | PlugZap | lucide | Plug + bolt |
| `water` | Droplets | Droplets | lucide | Approx. faucet / water |
| `atm` | FaCreditCard | FaCreditCard | react-icons | Template — `react-icons/fa` |
| `ev-charging` | EvCharger | EvCharger | lucide | |
| `security` | Shield | Shield | lucide | Plain shield |
| `medical` | BriefcaseMedical | BriefcaseMedical | lucide | First-aid kit |
| `lodging` | BedDouble | BedDouble | lucide | |
| `camping` | Tent | Tent | lucide | |
| `camper-trailers` | Caravan | Caravan | lucide | Travel trailer |
| `outdoor-seating` | Umbrella | Umbrella | lucide | Patio umbrella |
| `transit` | Bus | Bus | lucide | Front-facing bus |

## Event category mapping

| Category | Icon | Library | Notes |
|----------|------|---------|-------|
| Music | MusicalNoteIcon | heroicons | |
| Arts & Culture | Palette | lucide | Palette + brush motif |
| Lifestyle & Wellness | HeartPulse | lucide | Heart + pulse |
| Community & Causes | HeartHandshake | lucide | Hand + heart |
| Faith & Spirituality | PeaceSymbolIcon | custom SVG | Peace symbol in circle |
| Sports & Fitness | Volleyball | lucide | Ball (soccer-like) |
| Outdoors & Adventure | Mountain | lucide | Peak; no sun in Lucide set |
| Food & Drink | UtensilsCrossed | lucide | |
| Family & Kids | HandRaisedIcon | heroicons | Figure arms raised |
| Pets & Animals | PawPrint | lucide | |
| Nightlife & Social | Martini | lucide | Single glass; approx. clinking |
| Tech & Gaming | Gamepad2 | lucide | Controller |
| Shopping & Markets | ShoppingCartIcon | heroicons | |
| Education & Workshops | BookOpenIcon | heroicons | |
| Business, Science & Innovation | LightBulbIcon | heroicons | |
| Auto & Motor Sports | CarFront | lucide | Front-view car |
| Aviation & Aerospace | Plane | lucide | Top-down plane |
| Festivals & Special Events | StarIcon | heroicons | |

Category Lucide icons use the same `strokeWidth: 2.5` helper as amenity solids.

## UI consumers

Use the registry helpers — do not add local icon maps:

- Discover / landing cards: `AmenityPreviewStrip`, `AmenityIconById` with `iconVariant="solid"` or `"outline"`
- Create event picker: `AmenityIconById` with `iconVariant="outline"`
- Legacy discover chips (`food` / `parking` / `wheelchair`): map via `LEGACY_DISCOVER_AMENITY_IDS` in the registry
- Category chips on discover cards: match `EVENT_CATEGORIES` by label and render `category.icon`

## Adding an icon from [react-icons](https://react-icons.github.io)

1. Open [react-icons.github.io](https://react-icons.github.io) and search for the glyph you want (e.g. “wifi”).
2. Click the icon and copy the import line from the panel, e.g. `import { FaWifi } from 'react-icons/fa'`.
   - Note the **package subpath** (`fa`) and **export name** (`FaWifi`).
3. In `src/data/amenityIconRegistry.ts`, add that import at the top with the other icon imports.
4. Replace the amenity’s registry block with `reactIconsEntry`:

   ```ts
   wifi: reactIconsEntry(FaWifi, 'fa', 'FaWifi'),
   ```

   `reactIconsEntry(icon, reactIconsImport, reactIconsName)` sets `source: 'react-icons'` and wires the same component for solid + picker outline.

5. Save, run `npm run build`, then open `/admin/categories-amenities` and check **Solid** and **Outline preview** for that amenity (picker uses orange `text-orange` at 16px via `AmenityIconDisplay`).
6. Repeat for other amenities — only change entries you care about; the rest can stay on Lucide/Heroicons.

**Live templates in the registry:** `wifi` and `atm` already use this pattern.

## Changing an icon (Lucide / Heroicons)

1. Edit `src/data/amenityIconRegistry.ts` (amenities) or `src/data/eventCategories.ts` (categories).
2. Prefer Heroicons 24/solid when semantics match; otherwise Lucide + `lucideAsSolid()` or a small custom SVG (categories only).
3. Keep outline Lucide icons aligned for create-event parity.
4. Open `/admin/categories-amenities` and confirm solid + outline previews.
5. Run `npm run build`.

## Phase 2 (not implemented)

- Interactive admin picker from a fixed Heroicons allow-list
- Persist overrides (e.g. localStorage or API) instead of code-only edits
- Unify hidden-gem amenities (`src/lib/amenities.ts`) with the same registry where ids overlap
