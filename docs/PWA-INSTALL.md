# PWA install — Add to home screen

TUDU exposes **Add Tudu to home screen** on signup (and in My Tudu settings). Install behavior depends on the browser and OS.

## Requirements

- **HTTPS** in production (or `npm run dev:https` locally). Chrome will not fire `beforeinstallprompt` on plain HTTP except localhost.
- **`public/manifest.webmanifest`** linked from `index.html`, plus icons (`/tudu-icon.png` by default).
- **Service worker:** not required for iOS “Add to Home Screen”; Chrome may still show install without a SW on some versions, but a full offline PWA typically needs one (future: `vite-plugin-pwa`).

## Android (Chrome, Edge, Samsung Internet)

1. When criteria are met, the browser fires **`beforeinstallprompt`**.
2. Tapping **Add Tudu to home screen** calls **`prompt()`** and shows the system install dialog with your manifest name and icon.
3. If the event is not available yet, the in-app sheet shows menu steps (**Install app** / **Add to Home screen**).

## iOS / iPadOS (Safari)

Apple does **not** support `beforeinstallprompt`. Tapping the button opens instructions:

**Share → Add to Home Screen → Add**

The icon comes from **`apple-touch-icon`** (and manifest icons for some iOS versions). Admin seasonal uploads update both via `applyPwaIconsFromStorage()`.

## Desktop (Chrome, Edge)

Same as Android when `beforeinstallprompt` fires (install to apps / dock). Otherwise the sheet shows browser menu instructions.

## Already installed

If the app runs in **standalone** display mode (launched from home screen), the signup button is hidden.

## Admin seasonal icons

**Admin → Product → PWA App Icon** (`/admin/settings/app-icon`):

- Upload one image → auto 192 / 512 PNG overrides in **localStorage** + dynamic manifest blob URL.
- **Production:** replace files under `public/icons/pwa/` or CDN; edit `manifest.webmanifest` and cache-bust. See `public/icons/pwa/README.md`.

## Audit notes (Phase 1)

| Item | Status |
|------|--------|
| `vite-plugin-pwa` | Not installed; static manifest + optional dynamic override |
| `InstallAppOverlay` | Reused; iOS Share steps + Chrome `prompt()` |
| Default icons | `/tudu-icon.png` (repo assets) |
| Signup CTA | `SignUpPage` footer |
