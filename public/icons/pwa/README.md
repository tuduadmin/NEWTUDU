# PWA home-screen icons

Default install icons ship from the repo root assets (`/tudu-icon.png`). For seasonal themes (St. Patrick's, holidays, etc.), replace or override these files in production:

| File | Size | Use |
|------|------|-----|
| `icon-192.png` | 192×192 | Android / Chrome manifest |
| `icon-512.png` | 512×512 | Splash / high-DPI install |

**Production:** upload PNGs to your CDN or static host under `/icons/pwa/` and update `manifest.webmanifest` (or serve a dynamic manifest from the API). Browsers cache manifests aggressively — bump cache headers or version query strings when swapping seasonal art.

**Local demo:** Admin → **PWA App Icon** stores overrides in `localStorage` and injects a dynamic manifest at runtime (per browser / device only).
