# Backlog (later)

Items deferred intentionally — not blocking current work.

---

## Create event — Ticketing step layout shift

**Status:** Deferred  
**File:** `src/components/create-event/FinalStep.tsx`  
**Reported:** 2026-07-25

### Problem
On mobile, switching ticketing modes (especially **External tickets** when the URL field appears) can shift content below (age restriction, checklist). Feels glitchy; may confuse older users.

### Current state
- Partial fix in place: snugger spacing, single-day external ↔ RSVP uses a fixed-height slot.
- Zero-shift across all modes (sell, multi-day, tier accordions) not done — diminishing returns for now.

### Preferred fix when revisiting (pick one)
1. **Inline expand** — show external URL inside the External ticket radio row only (recommended).
2. **Pinned step footer** — Next/Save fixed; only middle scrolls (shift less noticeable).
3. **Short fade/slide** — ~150ms animation so new fields feel intentional, not broken.

### Not sufficient alone
- Color-only selection change (helps clarity, does not stop layout jump).

### Revisit if
- Host testing feedback mentions jumping UI or missed taps.
- Broader create-event polish pass for phone-first / accessibility.

---
