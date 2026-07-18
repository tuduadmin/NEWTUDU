# Feature Locks

## LOCKED — Do not modify without explicit user approval

- `src/components/locked/AppHeaderBar.tsx`
- `src/components/Footer.tsx`
- Header layout: **Icon | Location | Settings**
- Footer design (marketing pages)
- Location logic in `src/lib/location.ts` (GPS, home city, Travel Pass rules)

Signed-in app pages must use `AppHeaderBar` as the single header source of truth.

## Host Events (LOCKED)
- src/pages/host/EventManagerPage.tsx
- src/pages/host/TicketScannerPage.tsx
- src/pages/host/EditPublicProfilePage.tsx
- src/pages/host/AddHiddenGemPage.tsx
Do not modify without explicit user approval.

**User-approved exception (2026-07-18):** EventManagerPage org profile section — centered avatar/logo layout and placeholder org name ("Your Organization Name").
