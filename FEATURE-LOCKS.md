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
- src/pages/host/CreateEventPage.tsx
- src/components/create-event/CreateEventStepper.tsx
- src/components/create-event/CreateEventLayout.tsx
- src/components/create-event/BasicsStep.tsx
- src/components/create-event/ScheduleStep.tsx
- src/components/create-event/CategoryStep.tsx
- src/components/create-event/FinalStep.tsx
- src/components/create-event/ReviewStep.tsx
Do not modify without explicit user approval.

**User-approved exception (2026-07-18):** EventManagerPage org profile section — centered avatar/logo layout and placeholder org name ("Your Organization Name").

**User-approved exception (2026-07-18):** EventManagerPage Create Event buttons wired to `/host/create-event` wizard (replaces CreateEventModal entry).

**User-approved exception (2026-07-18):** EventManagerPage — removal of progress section (Live Events progress bar, featured event % indicator, and setup/completion progress UI).

**User-approved exception (2026-07-18):** FinalStep.tsx — ticketing mode picker (`free_rsvp`, `free_donation`, `sell`, `external`), capacity/waitlist, external URL, live preview snippet.

**User-approved exception (2026-07-18):** FinalStep.tsx + ReviewStep.tsx — Attendee Checklist section (Step 4, after ticketing, before age/amenities).

**User-approved exception (2026-07-18):** New checklist components (not locked):
- `src/components/create-event/ChecklistBuilder.tsx` — host-side template/custom builder
- `src/components/AttendeeChecklistForm.tsx` — attendee-facing potluck/conference/custom UI
- `src/lib/checklist.ts` — localStorage claims/responses demo
- `src/pages/EventRsvpPage.tsx` — `/event/:id/rsvp` flow
