# Attendee Checklist Examples

Seed scenarios for localStorage demo flows. Hosts configure these in **Create Event → Step 4 (Final Details) → Attendee Checklist**, placed after ticketing and before age/amenities.

---

## Example A: Neighborhood Potluck (Free RSVP)

**Use case:** Block party — host needs balanced food signup.

### Host setup

1. **Ticketing:** Free — RSVP only  
   - Capacity: `40`  
   - Waitlist: off  
2. **Attendee Checklist:** Enable  
   - Template: **Potluck / Item signup**  
   - Items: Salad, Dessert, Drinks, Main dish (defaults)  
   - Mandatory: **on**  
   - Allow skip: **on**

### Attendee flow (`/event/:id/rsvp`)

1. Open private invite or Discover card → RSVP  
2. Checklist modal: radio list of available items  
3. Pick **Dessert** OR tap **Skip**  
4. Confirm RSVP → claim stored in `tudu_checklist_claims`

### Expected localStorage keys

| Key | Purpose |
|-----|---------|
| `tudu_checklist_claims` | Who claimed which potluck item |
| `tudu_checklist_responses` | Full attendee response per event |

### Demo verification

```javascript
JSON.parse(localStorage.getItem('tudu_checklist_claims'))
JSON.parse(localStorage.getItem('tudu_checklist_responses'))
```

Second attendee should not see items already claimed.

---

## Example B: Regional Conference (Sell Tickets)

**Use case:** Two-day event with catered meals — kitchen needs headcounts + dietary info.

### Host setup

1. **Ticketing:** Sell tickets  
   - Tier: Conference Pass — `$149` — qty `200`  
2. **Attendee Checklist:** Enable  
   - Template: **Conference / Meal planning**  
   - Meals: Day 1 Breakfast/Lunch/Dinner, Day 2 Breakfast/Lunch/Dinner (defaults)  
   - Mandatory: **on**  
   - Allow skip: off (conference template)

### Attendee flow (`/event/:id/rsvp`)

1. Tap **Get Tickets** on event page  
2. Checklist: check meals attending (multi-select)  
3. **Dietary restrictions** textarea required (e.g. `Vegetarian, no shellfish`)  
4. Submit blocked until both complete when mandatory  
5. Confirm ticket stub → response saved

### Expected behavior

- Empty meal selection → error: *Select at least one meal.*  
- Empty dietary field → error: *Please share dietary restrictions (or write "None").*  
- Review step (Step 5) shows: `Conference meals · 7 items · Required`

---

## Custom checklist (advanced)

Template: **Custom checklist**

| Item label | Type | Rule |
|------------|------|------|
| T-shirt size S | single_pick | Pick one |
| Workshop A | multi_check | Check many |
| Accessibility needs | text_note | Free text |

Toggle **Mandatory before RSVP/purchase** and **Allow skip** per potluck-style single-pick items.

---

## Placement rationale

Checklists sit **after ticketing** in Step 4 so hosts first decide *how people get in* (RSVP vs paid vs external), then optionally collect *what they need from attendees* (food, meals, notes). Age and amenities follow as event metadata, not guest tasks.
