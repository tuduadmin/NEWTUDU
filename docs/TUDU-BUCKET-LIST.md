# TUDU Bucket List Mode

> Source: `TUDU_Bucket_List_Mode july 5, 2026.docx` (TUDU Entertainment Inc.)

## Vision

Bucket List Mode reimagines "save for later" as something users actively build, personalize, and complete — not a forgotten folder, but a living, shareable collection of experiences with its own identity. Saving should feel like the **start of a journey**, not the end of the interaction.

Users curate a bucket list with a soundtrack, discover other people's bucket lists the way they'd discover events, and mark items complete with an optional story attached.

---

## 1. Card Deck Integration (Things Tudu / Discover)

While browsing the main swipeable card deck, users can act on experience cards beyond a simple skip:

| Action | Behavior (MVP) |
|--------|----------------|
| **Save** | Direct save — immediately adds the event to the user's bucket list (localStorage), then advances to the next card |
| **View** | Opens event search / detail flow |
| **Skip** | Advances without saving |
| **Back** | Returns to previous card |
| **Share** | Native share when available |

**Decision (MVP):** Use **direct save by default** (middle-ground from spec). An organize/holding-area flow can be added later.

---

## 2. Bottom Navigation

Bucket List is the fourth tab in the bottom nav (between Things Tudu and My Tudu):

`Host Events` · `Road Trip` · `Things Tudu` · **Bucket List** · `My Tudu`

- Route: `/bucket-list`
- Badge shows count of saved (active) bucket list items
- Active tab uses orange highlight consistent with other nav items

---

## 3. Bucket List Page — Two Surfaces

The dedicated Bucket List page has two modes (tabs):

### 3a. My List

The user's own curated collection:

- Saved events with image, title, city, and date/cost metadata
- **Filters:** All · Active · Completed
- **Search** by event title or city
- Tap an item to expand detail
- **Mark complete** toggle with optional short write-up (never mandatory)
- **Remove** from list
- **Soundtrack section** at bottom — Spotify playlist embed placeholder (per-list soundtrack in full vision)
- Empty state when nothing saved yet, with link to `/discover`

### 3b. Discover Lists

Browse other people's full bucket lists (separate from individual event cards):

- Swipeable cover cards — one card per person's bucket list
- Tap a cover to open the full readable list inside
- From a public list: save individual items or **Save entire list** to your bucket list
- Each list can include Spotify playlist + Instagram links (mock data in MVP)

**Open question (from spec):** Are event cards and bucket-list browsing two separate surfaces, or should bucket lists appear as a filter/mode within the main deck? MVP treats them as **separate tabs** on `/bucket-list`.

---

## 4. Inside a Bucket List (Own or Viewing)

Each bucket list includes:

| Element | Description |
|---------|-------------|
| Saved items | Image + event details per item |
| Spotify playlist | Owner-created soundtrack embedded at bottom of list |
| Instagram links | Related video content where available |
| Completion | Toggle complete + optional write-up on own items |

This is a **mood board / vision board**, not a plain checklist — sound, video, and visuals reinforce the feeling of the experiences.

---

## 5. Completing Items

When a user opens an item in **their own** bucket list:

1. Toggle **Mark complete**
2. Optionally add a short write-up about how it went
3. Write-up is never required — completion should feel rewarding, not like homework

**Future consideration:** Share completed items with write-ups as stories/posts.

---

## 6. Spotify Integration

### 6.1 Bucket List Soundtracks

Each bucket list can have its own Spotify playlist, created by the list owner and embedded at the bottom of the list page.

### 6.2 Profile Soundtracks

Users can add a playlist as their profile soundtrack (extends beyond bucket list — see My Tudu / profile spec).

**Open question:** Confirm Spotify Web API vs embed widget, and whether playback requires the viewer's own Spotify account.

---

## 7. Open Considerations

| Topic | Status |
|-------|--------|
| Direct save vs save-then-organize | **MVP: direct save** |
| Card deck vs bucket-list discovery relationship | Separate tabs on `/bucket-list` (MVP) |
| Share completed items with write-ups | Future |
| Spotify embed technical plan | Placeholder embed in MVP |
| Instagram links — manual vs auto-detected | Manual by creator (MVP mock links) |

---

## 8. Implementation Notes (Current Build)

| File | Purpose |
|------|---------|
| `src/lib/bucketList.ts` | localStorage CRUD, completion, custom update event |
| `src/pages/BucketListPage.tsx` | My List + Discover Lists UI |
| `src/pages/DiscoverPage.tsx` | Save button → `addToBucketList()` |
| `src/data/mockBucketLists.ts` | Sample public lists for Discover Lists tab |
| `src/components/BottomNav.tsx` | Badge count from bucket list |

**Storage key:** `tudu_bucket_list`

**Test route:** `/bucket-list`
