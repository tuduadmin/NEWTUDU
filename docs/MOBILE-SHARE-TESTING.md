# Mobile Share Testing

The Web Share API (`navigator.share`) opens the **native Android/iOS share sheet** (Quick Share, WhatsApp, Gmail, contacts row). Browsers only expose it in a **secure context** — HTTPS or `localhost`. Plain HTTP on a LAN IP (e.g. `http://172.16.1.78:5173`) cannot show the native sheet; TUDU falls back to copy link and the custom share panel.

## Why HTTP blocks native share

| URL | Secure context | Native share sheet |
|-----|----------------|-------------------|
| `http://172.16.1.78:5173` | No | Custom fallback only |
| `https://172.16.1.78:5173` | Yes (after cert trust) | Native OS sheet |
| `http://localhost:5173` | Yes | Native OS sheet |
| Production HTTPS | Yes | Native OS sheet |

## Dev setup (phone on same Wi‑Fi)

1. On your dev machine, from the project root:

   ```bash
   npm run dev:https
   ```

   This starts Vite with `@vitejs/plugin-basic-ssl` on `0.0.0.0:5173` so your phone can reach it.

2. Find your machine’s LAN IP (e.g. `172.16.1.78`).

3. On your phone, open:

   ```
   https://172.16.1.78:5173/discover
   ```

4. Accept the **self-signed certificate warning** once (Advanced → proceed). Without this, the page stays non-secure and share stays on the fallback UI.

5. Open an event → tap **Share**. The native system share sheet should appear with installed apps and contacts.

## Share flow in the app

- **Mobile + HTTPS:** Share button calls `navigator.share({ title, text, url })` immediately.
- **User dismisses sheet:** Silent (no error toast).
- **HTTP or unsupported:** Custom `ShareEventSheet` with copy link, WhatsApp, SMS, email, etc.

Desktop over HTTP keeps the custom sheet or copy link. Native sheet testing is intended for **mobile + HTTPS**.

## Production / installed PWA

When the app is served over HTTPS in production, native share works the same way on supported mobile browsers. If you later add a web app manifest and users install the PWA from HTTPS, the installed app also runs in a secure context and gets native share.
