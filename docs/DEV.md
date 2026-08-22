# TUDU local development

## Can't connect to localhost:5173

1. **Start the dev server** from **`Projects/tudu`**: `npm run dev` (already passes `--host` and `--strictPort`). Leave that terminal open — if it exits, nothing listens on 5173.
2. **Port 5173 in use** — with `strictPort: true`, Vite **exits** instead of picking another port. Stop the other process (`netstat -ano | findstr :5173` on Windows) or close the other Vite terminal, then run `npm run dev` again.
3. **Wrong folder** — another project on 5173 looks “connected” but is not TUDU. Always `cd` to **`tudu`** before `npm run dev`.
4. **http vs https** — use **`http://localhost:5173`** unless you ran `npm run dev:https`.
5. **Smoke test** — in a browser or `curl.exe http://127.0.0.1:5173/health` (expect HTML + HTTP 200; in the browser, plain **TUDU OK** after the bundle loads).
6. **Dependencies** — if `npm run dev` fails, run `npm install` in **`tudu`**, then retry.

When Vite is ready it prints **Local** and **Network** URLs (e.g. `http://localhost:5173/` and `http://172.16.x.x:5173/`).

## Run the app

From **`Projects/tudu`** (not emerald-lounge or other Vite projects):

```bash
npm run dev
```

Vite listens on **all interfaces** (`host: true`) at port **5173**. Use the **Network** URL Vite prints (e.g. `http://172.16.1.78:5173`) on your phone and desktop.

## HTTP vs HTTPS

| Command | URL |
|---------|-----|
| `npm run dev` | **http://** only |
| `npm run dev:https` | **https://** (self-signed cert via `@vitejs/plugin-basic-ssl`) |

- Mobile Chrome/Safari show **“Not secure”** on LAN **http://** — normal for local dev; you can ignore it on your Wi‑Fi for testing.
- Do **not** open `https://172.16.x.x:5173` unless you started `dev:https`; the page will fail or stay blank.
- System share / some Web APIs need HTTPS — use `npm run dev:https` when testing those features.

## localhost vs LAN IP

`http://localhost:5173` and `http://172.16.1.78:5173` are **different origins**. Each has its own **localStorage** (sign-in, preferences, demo data). Pick one URL per device and stick to it.

## Links don’t work (`localhost:5173` won’t open)

Symptoms: browser **“Can’t reach this page”**, **connection refused**, or Cursor chat links do nothing.

1. **Dev server must be running** — from `Projects/tudu`, run `npm run dev` and leave that terminal open. Vite should print:
   - `Local:   http://localhost:5173/`
   - `Network: http://<your-LAN-IP>:5173/`
2. **Smoke test** — with the server up, open **`http://localhost:5173/health`** (or `http://127.0.0.1:5173/health`). You should get the SPA; after React loads, the page shows **TUDU OK**. If the request fails entirely, nothing is listening on 5173.
3. **Wrong project on 5173** — if you started Vite from **emerald-lounge** or another repo, port 5173 may show the wrong app or an old process. Stop other Vite instances, then start **`tudu`** only (`strictPort: true` — see below).
4. **Port already in use** — `npm run dev` uses **`strictPort: true`**. If 5173 is taken, Vite **exits** instead of moving to 5174. On Windows, find the process: `netstat -ano | findstr :5173`, then end the stale PID in Task Manager, or close the terminal that was running the old dev server.
5. **Use http, not https** — unless you ran `npm run dev:https`, open **`http://`** URLs only.
6. **Deep links** — routes like `/discover` and `/host` are defined in `App.tsx`; they need the dev server (or `npm run preview` after `npm run build`). A dead server looks like “links broken” for every path.

## Blank screen checklist

1. Dev server running from **`tudu`** — wrong folder on port 5173 serves another app or nothing useful.
2. Browser **Console** — fix red errors (e.g. failed module load).
3. **Hard refresh** (Ctrl+Shift+R) after pulling code.
4. Match **http** vs **https** to how you started Vite.
5. Wait 8s — if the inline fallback appears, the bundle did not mount (see Console).
6. Smoke test: open **`/health`** — should show plain text `TUDU OK`.

## Production build

```bash
npm run build
npm run preview
```

Preview uses `host: true` and port **5173** from `vite.config.ts` (falls back to the next free port if 5173 is taken).

## Routing notes

- `ActivityTracker` uses `useLocation` in `App.tsx`; `App` is wrapped by `BrowserRouter` in `main.tsx`, so no layout change is required.
- **`/health`** — minimal “TUDU OK” page to verify the SPA bundle mounted (after React loads).

## If preview CLI looks wrong

Do **not** pass a bare port as a positional arg (`npm run preview -- --host 5173` makes Vite treat `5173` as a directory). Use `npm run preview` or `npx vite preview --host --port 5173`.
