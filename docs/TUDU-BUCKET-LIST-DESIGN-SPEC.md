# TUDU Bucket List Mode — Design Specification

> **NOW YOU KNOW**

Version 1.0 · July 2026 · TUDU Entertainment Inc.  
Implementation target: React + Vite mobile web (375–430px), platform-neutral for future Expo migration.

---

## 1. Product Overview

Bucket List Mode expands TUDU's existing "save for later" feature into a **visual, social, and shareable experience**. It is not a checklist, task manager, notes app, or productivity tool.

The experience should feel like a combination of:

| Inspiration | What TUDU borrows |
|-------------|-------------------|
| **Instagram Stories** | Full-bleed imagery, story rings, completion share cards, ephemeral celebration moments |
| **Instagram Explore** | Mixed-size mood-board grids, editorial tile layouts, discovery density |
| **Instagram profile grids** | Cover grids, pinned lists, avatar rings, stat rows |
| **TikTok** | Full-screen vertical browsing, gesture-first navigation, minimal chrome |
| **Spotify** | Album-cover list cards, playlist embeds, profile soundtracks |
| **Pinterest** | Vision-board layouts, aspirational imagery, save-to-collection fly animations |
| **Dating-app swipe** | Card deck physics, swipe thresholds, rotation on drag, stack depth |

**Emotional target:** aspirational, energetic, visual, alive. Saving an experience is the **start of a journey**, not the end of an interaction.

**Explicit anti-patterns:** checkbox lists, spreadsheet rows, dense forms, tiny buttons, long instructional copy, permanent label clutter, productivity-app chrome.

---

## 2. Core Features (A–F)

### A. Experience Card Deck

Users discover individual experiences through **full-screen swipeable cards** on `/discover` (Things Tudu).

**User actions:**

- Swipe **right** → save experience to bucket list
- Swipe **left** → skip
- Swipe **up** or **tap** → view details
- Tap dedicated **Bucket List** action → choose destination list or create new list inline
- Tap **Maybe Later** → soft dismiss (re-surfaces later)
- Tap **Skip** → advance without save
- Tap **Share** → native share sheet

**Save flow (MVP):** direct save by default. User may pick which bucket list receives the item via `AddToBucketListModal` when multiple lists exist.

**Save delight sequence:**

1. Experience thumbnail shrinks to 64×64px and flies along a curved path toward the bucket icon (700ms)
2. Bucket icon scales 1.0 → 1.18 → 1.0 and emits warm glow (`--shadow-glow-warm`)
3. 12-particle burst (orange/magenta, 450ms, staggered 20ms)
4. Medium haptic impact
5. Toast: `"Saved to Summer in Saskatchewan"` (240ms slide-up)

**Undo:** toast action `"Undo"` available for 4 seconds; reverses save and restores card to deck top.

---

### B. Bucket List Discovery Feed

A **separate swipeable deck** at `/bucket-lists/discover` where each card represents an **entire bucket list**, not a single experience.

**Example list titles:**

- Summer in Saskatchewan
- Before I Turn 30
- Best Small-Town Food Stops
- Rocky Mountain Weekend
- Things to Do With the Kids
- Ultimate Hockey Road Trip

**User actions:**

- Swipe between bucket-list cover cards
- Tap cover → open full list detail
- Save one experience from a list
- Save several selected experiences (multi-select mode)
- Copy entire list into own account
- Follow or view creator profile
- Share list URL
- Double-tap → like/react
- Long-press → quick preview sheet

**Cover aesthetic:** album cover, Instagram Highlight, travel poster, visual scrapbook. Each cover includes vibe tag, soundtrack indicator, owner avatar with story ring, item/completion counts.

---

### C. Bucket List Detail View

Each bucket list is a **scrollable mood board / editorial collection** — not a database table.

**Contents:**

- Large feature images + smaller image tiles (mixed grid)
- Experience names, locations, dates/seasons
- Completion status badges
- User notes inline on tiles
- Instagram video link thumbnails (embedded social-video tiles)
- Attached Spotify soundtrack section
- Creator info, vibe tag, completion percentage
- Save-item and save-whole-list actions

**Layout inspiration:** Instagram Explore + Pinterest. Alternating portrait/square tiles, occasional full-width editorial breaks.

---

### D. Completing an Experience

Users mark experiences complete from item detail. Optional fields — never required:

- Short write-up / memory
- Rating (1–5)
- Photos or video
- Completion date (auto-filled, editable)
- Who they completed it with (tag people)

**Feel:** composing an Instagram caption + posting a story — not filling a form.

**On complete:**

- Celebration animation (checkmark + gradient ring + particles + progress update)
- Haptic success sequence
- Optional prompt to generate share card

**Undo completion** available for 6 seconds via toast.

---

### E. Completion Share Card

After completing, app generates a **9:16 vertical story card** (1080×1920px export).

**Destinations:** Instagram Stories, Facebook Stories, Snapchat, DMs, camera roll.

**Required elements:**

- Experience image (full-bleed or framed)
- Experience title
- Location
- Completion date
- User write-up (optional)
- User profile image + display name
- TUDU logo
- `"Completed on TUDU"`
- Tagline `"NOW YOU KNOW"`
- Optional progress: `"12 of 25 completed"`

**Three layout variants:**

1. **Cinematic** — full-bleed photo, bottom gradient scrim, minimal type
2. **Scrapbook** — polaroid frame, handwritten-style accent, tape texture overlay at 8% opacity
3. **Minimal premium** — centered type, thin borders, large negative space

**Editor constraints:** user may move, resize, or hide selected elements (title, write-up, progress, QR). Not a full graphic editor — max 6 draggable layers.

---

### F. Profile Soundtrack

Users attach a **Spotify playlist** to:

- Their profile (`/my-tudu` or `/profile/:username`)
- An individual bucket list (bottom of detail view)

**Profile soundtrack feel:** Instagram profile music × Spotify album art.

**Capabilities:**

- Preview playlist (30s clip when available)
- Open in Spotify (deep link)
- Album artwork display
- Playlist name + creator name
- Play/pause toggle on embedded card

---

## 3. Primary Design Direction

| Constraint | Value |
|------------|-------|
| Viewport width | 375px–430px (design at 390px baseline) |
| Color mode | Dark mode first; light mode out of scope for v1 |
| Audience | Gen-Z and young millennials (18–32) |
| Motion | Core product pillar — every important action has visual + motion + haptic feedback |

### Do

- Full-bleed photography
- Large imagery (hero tiles ≥ 160px tall)
- Vibrant dusk gradients (`--gradient-dusk`, `--gradient-dusk-soft`)
- Soft glassmorphism (`backdrop-filter: blur(16px)`, `--color-glass-bg`)
- Dark translucent overlays (`--color-overlay-readability`)
- Strong type hierarchy (Plus Jakarta Sans display + Inter body)
- Rounded cards (`--radius-card: 24px`)
- Floating action controls (48–56px touch targets)
- Smooth gesture-driven motion (Reanimated / CSS transforms)
- Layered depth (z-index stack, parallax 8px on hero scroll)
- Tasteful glow on save/complete states only

### Avoid

- Dense forms (>3 fields visible without scroll)
- Long instruction text (>2 lines per screen section)
- Buttons < 44×44px
- Spreadsheet-style layouts
- Traditional checkbox lists
- Overusing glass (max 3 glass surfaces visible simultaneously)
- Excessive neon / pure `#FF00FF` accents
- Cluttered bottom nav (5 tabs max, icon-only with badge)
- Too many permanent text labels on cards

### Motion contract

Every primary action includes:

1. Visual feedback (scale, glow, or translation)
2. Motion feedback (120–700ms, easing documented per screen)
3. Haptic recommendation (light / medium / heavy / success)
4. Clear state change (badge count, tile badge, toast)

---

## 4. Screen Specifications

Each screen follows the **11-section structure** below.

---

## Screen 1 — Experience Card Deck

**Route:** `/discover`

### 1. Purpose

Discover nearby experiences through a full-screen swipeable card deck. Primary goals: browse, save to bucket list, skip, view details, share. This is TUDU's default home surface after onboarding.

### 2. Visual Layout

| Region | Spec |
|--------|------|
| Viewport | 100vw × 100dvh; background `#0B0F1A` |
| Safe area top | `max(12px, env(safe-area-inset-top))` — header sits below |
| Safe area bottom | `max(16px, env(safe-area-inset-bottom))` + 64px nav clearance |
| **TopHeaderBar** | Height 52px; padding 0 16px; flex space-between; z-index 40 |
| Location pill | Height 36px; padding 8px 14px; radius 9999px; glass bg |
| Deck container | Position absolute; inset: 52px 0 64px 0; padding 8px 12px 0 |
| **Active card** | Width: `calc(100% - 24px)` = 366px @ 390px; height: `calc(100dvh - 52px - 64px - 8px)` ≈ 676px; radius 24px; overflow hidden |
| **Stack card 2** | Same width; scale 0.96; translateY 8px; opacity 0.6; z-index 9 |
| **Stack card 3** | Scale 0.92; translateY 16px; opacity 0.35; z-index 8 |
| Hero image | 100% × 62% of card (≈ 419px tall); `object-fit: cover`; `object-position: center 35%` |
| Readability gradient | Linear overlay on image: `rgba(11,15,26,0.35) 0%` → `rgba(11,15,26,0.08) 35%` → `rgba(11,15,26,0.55) 70%` → `rgba(11,15,26,0.92) 100%` |
| Content block | Padding 20px 20px 24px; gap 8px; flex column; min-height 38% of card |
| Category chip | Height 24px; padding 4px 10px; radius 8px; bg `rgba(192,38,160,0.24)` |
| Title | Max 2 lines; ellipsis; margin-top 4px |
| Metadata row | Gap 12px; flex wrap; margin-top 8px |
| Host row | Avatar 28px; gap 8px; margin-top 12px |
| **ActionRail** | Position absolute; bottom 108px; right 16px; flex column; gap 12px; z-index 50 |
| Action button | 48×48px circle; glass bg; icon 24px |
| **BottomActionBar** | Height 72px; padding 12px 20px; gap 12px; flex row; justify center |
| Primary buttons | Skip 56×56px; Save 64×64px (gradient fill); View 56×56px |
| Save button | Gradient `--gradient-dusk-soft`; glow `--shadow-glow-warm` on press |
| **BottomNav** | Fixed bottom; height 64px + safe-area; bg `#121828`; border-top 1px `rgba(255,255,255,0.08)` |
| Progress dots | Optional; 3px × 3px; gap 6px; centered above BottomActionBar; 24px from card bottom |

**Photo cropping:** faces/subjects prioritized via `object-position: center 35%`. Fallback letterbox never used — always cover crop.

**Text wrapping:** title 2 lines max; metadata 1 line each with ellipsis; price always visible (no wrap).

### 3. UI Components

| Component | Props / States |
|-----------|----------------|
| `ExperienceSwipeCard` | `experience: Experience`; `stackIndex: 0\|1\|2`; `dragX: number`; `dragY: number`; states: `idle`, `dragging`, `dismissing-left`, `dismissing-right`, `saved-flying` |
| `ExperienceCardStack` | `cards: Experience[]`; `currentIndex: number`; `onSwipeLeft`, `onSwipeRight`, `onSwipeUp` |
| `ExperienceCardOverlay` | `title`, `category`, `location`, `distance`, `date`, `time`, `price`, `saveCount` |
| `ExperienceActionRail` | `onShare`, `onBucketList`, `onMaybeLater`; state `maybeLaterActive: boolean` |
| `ExperienceBottomActionBar` | `onSkip`, `onSave`, `onView`; `saveLoading: boolean` |
| `BucketSaveFlyAnimation` | `sourceRect: DOMRect`; `targetSelector: string`; `onComplete` |
| `AddToBucketListModal` | `eventIds: string[]`; `open: boolean`; `onClose`, `onSaved(listId)` |
| `DeckProgressIndicator` | `remaining: number`; `total: number` |
| `DiscoverTopHeader` | `locationLabel: string`; `onLocationTap` |

### 4. Typography

| Element | Font | Weight | Size | Line height | Letter spacing | Max lines |
|---------|------|--------|------|-------------|----------------|-----------|
| Card title | Plus Jakarta Sans | 800 | 28px | 1.1 | -0.02em | 2 |
| Category chip | Plus Jakarta Sans | 700 | 10px | 1.0 | 0.06em | 1 |
| Metadata | Inter | 500 | 13px | 1.4 | 0 | 1 |
| Price | Plus Jakarta Sans | 700 | 18px | 1.2 | -0.01em | 1 |
| Host name | Inter | 600 | 13px | 1.4 | 0 | 1 |
| Save count | Inter | 500 | 11px | 1.35 | 0 | 1 |
| Button label (nav) | Plus Jakarta Sans | 700 | 10px | 1.0 | 0.04em | 1 |

### 5. Colors

| Token | Value | Usage |
|-------|-------|-------|
| Page bg | `#0B0F1A` | Deck background |
| Card surface | `#1A2236` | Fallback when image loading |
| Glass button | `rgba(18, 24, 40, 0.72)` + border `rgba(255,255,255,0.12)` | Action rail |
| Text primary | `#F8FAFC` | Titles |
| Text secondary | `rgba(248, 250, 252, 0.72)` | Metadata |
| Text muted | `rgba(248, 250, 252, 0.48)` | Save count |
| Save gradient | `linear-gradient(135deg, rgba(192,38,160,0.85), rgba(244,114,154,0.85), rgba(249,115,22,0.85))` | Save button |
| Skip tint | `rgba(248, 113, 113, 0.16)` | Skip hover |
| Category accent | `rgba(192, 38, 160, 0.24)` | Chip bg |
| Glow save | `0 0 24px rgba(249, 115, 22, 0.45)` | Save press |

### 6. Gestures

| Gesture | Threshold | Behavior |
|---------|-----------|----------|
| Swipe right (save) | `dragX > 120px` OR velocity `> 800px/s` | Card exits right 390px; triggers save + fly animation |
| Swipe left (skip) | `dragX < -120px` OR velocity `< -800px/s` | Card exits left; next card promotes |
| Swipe up (detail) | `dragY < -100px` | Navigate `/search?event=:id` or inline detail sheet |
| Tap card body | — | Same as swipe up |
| Tap Save button | — | Save without full swipe exit; card advances after fly animation |
| Tap Skip | — | Skip without drag |
| Drag active | — | Rotation `dragX * 0.04` deg (max ±12°); scale 1.0 |
| Back gesture (OS) | — | No-op on deck (prevent accidental exit) |
| Pull to refresh | Pull 80px | Reload deck; haptic light |

### 7. Animation

| Trigger | Duration | Delay | Easing | Transform |
|---------|----------|-------|--------|-----------|
| Card drag follow | 0ms (1:1 finger) | 0 | linear | translateX/Y, rotate |
| Card dismiss | 320ms | 0 | `cubic-bezier(0.16, 1, 0.3, 1)` | translateX ±450px; opacity 0 |
| Stack promote | 240ms | 0 | `cubic-bezier(0.2, 0.8, 0.2, 1)` | scale 0.96→1; translateY 8→0 |
| Save fly | 700ms | 0 | `cubic-bezier(0.16, 1, 0.3, 1)` | thumb 100%→64px; path bezier to bucket |
| Particle burst | 450ms | 0 | ease-out | 12 particles; translate 40px; opacity 1→0 |
| Bucket icon pulse | 320ms | 700ms | spring 180/20 | scale 1→1.18→1 |
| Toast enter | 240ms | 820ms | `cubic-bezier(0.16, 1, 0.3, 1)` | translateY 24→0; opacity 0→1 |
| Toast exit | 180ms | — | ease-in | opacity 0 |
| Reduced motion | — | — | — | Instant dismiss; no particles; opacity fade only |

### 8. Haptics

| Event | Type |
|-------|------|
| Swipe threshold crossed | Light impact |
| Save confirmed | Medium impact |
| Skip | Light impact (selection) |
| Pull refresh release | Medium impact |
| Error (save failed) | Warning notification |

### 9. Pattern References

| Source | TUDU adaptation |
|--------|-----------------|
| Tinder/Hinge swipe | Applied to **events**, not people; right = save (positive), left = skip |
| TikTok full-screen | Vertical card dominance; actions float on imagery |
| Instagram Stories | Readability gradient scrim; not sequential taps — swipe deck |
| Spotify album art | Large cover photography as hero |

### 10. States

| State | Behavior |
|-------|----------|
| Loading | Skeleton card: `#1A2236` pulse animation 1.2s; shimmer gradient |
| Empty | Illustration + `"No events nearby"` + CTA `"Expand distance"` |
| Error | `"Couldn't load events"` + retry button 44px tall |
| Offline | Banner 40px; cached cards if available |
| Saved (duplicate) | Toast `"Already in Summer in Saskatchewan"`; option to view list |
| Active swipe | Rotation + tint: right glow `#34D399` 20% edge; left glow `#F87171` 20% |
| Maybe Later | Card deprioritized; subtle yellow dot on progress indicator |

### 11. Accessibility

- All action buttons ≥ 44×44px (`--touch-min`)
- Contrast: title `#F8FAFC` on scrim bottom ≥ 7:1
- Dynamic type: title scales to 32px max; metadata wraps to 2 lines at large sizes
- VoiceOver: card announces `"[Title], [Category], [Distance] away, [Price]"`
- Save button: `"Save to bucket list"`
- Reduced motion: disable rotation and particles; 120ms opacity transitions only
- Focus order: location → card → action rail top-to-bottom → bottom bar → nav

---

## Screen 2 — Bucket List Discovery Feed

**Route:** `/bucket-lists/discover`

### 1. Purpose

Browse **other users' bucket lists** as swipeable cover cards. Discover aspirational collections, copy lists, save individual items, follow creators.

### 2. Visual Layout

| Region | Spec |
|--------|------|
| Viewport | 100vw × 100dvh; bg `#0B0F1A` |
| **FeedHeader** | Height 56px; padding 8px 16px; back chevron 44×44; title centered |
| Title | `"Discover Lists"` — 24px/800 |
| Deck area | inset: 56px 0 64px 0; padding 12px 16px |
| **Cover card (active)** | Width 358px @ 390px; height 520px; radius 20px; overflow hidden |
| Cover image | 100% × 100%; `object-fit: cover` |
| Gradient overlay | `linear-gradient(180deg, rgba(11,15,26,0.2) 0%, rgba(11,15,26,0.75) 55%, rgba(11,15,26,0.95) 100%)` |
| Content inset | Padding 20px; position absolute; bottom 0; left 0; right 0 |
| **VibeBadge** | Top-left absolute; 20px from edges; height 28px |
| **ShareButton** | Top-right; 44×44 glass circle |
| Owner row | Margin-bottom 12px; avatar 40px + story ring 46px outer |
| List title | 26px/800; max 2 lines; margin-bottom 8px |
| Stats row | Gap 16px; item count + completion count + like count |
| Soundtrack pill | Height 32px; padding 6px 12px; radius 16px; Spotify green accent border |
| Region label | 12px muted; margin-top 8px |
| **CTA row** | Margin-top 16px; gap 12px |
| Open button | Flex 1; height 48px; radius 24px; gradient fill |
| Save all button | 48×48 icon button |
| Stack cards | Same as Screen 1: scale 0.96/0.92; translateY 8/16px |
| Empty state | Centered; 280px illustration max; 32px side padding |

### 3. UI Components

| Component | Props / States |
|-----------|----------------|
| `BucketListDiscoveryDeck` | `lists: PublicBucketList[]`; `index: number`; swipe handlers |
| `BucketListCoverCard` | `list: PublicBucketList`; `variant: 'feed'\|'grid'\|'preview'`; `isActive: boolean`; `dragX: number` |
| `VibeBadge` | `vibe: VibeTag`; variants per vibe color map |
| `AvatarStoryRing` | `avatarUrl`, `initials`, `size: 40`, `hasStory: boolean`, `verified: boolean` |
| `SoundtrackIndicator` | `playlist?: SpotifyPlaylist`; `compact: boolean` |
| `SaveEntireListButton` | `listId`; states: `idle`, `saving`, `saved`, `duplicate` |
| `ListCopyConfirmationToast` | `listName`, `itemCount`, `onUndo` |
| `CreatorPreviewSheet` | `user: User`; half-sheet height 42dvh |
| `DiscoveryFeedHeader` | `onBack` |

**VibeBadge color map:**

| Vibe | Background | Text |
|------|------------|------|
| Adventurous | `rgba(56, 189, 248, 0.24)` | `#38BDF8` |
| Chill | `rgba(92, 45, 110, 0.32)` | `#C084FC` |
| Romantic | `rgba(244, 114, 154, 0.24)` | `#F4729A` |
| Family | `rgba(251, 191, 36, 0.24)` | `#FBBF24` |
| Foodie | `rgba(249, 115, 22, 0.24)` | `#F97316` |
| Wild | `rgba(192, 38, 160, 0.24)` | `#C026A0` |
| Local | `rgba(52, 211, 153, 0.24)` | `#34D399` |
| Luxury | `rgba(251, 191, 36, 0.16)` | `#FBBF24` |
| Weekend | `rgba(244, 114, 154, 0.16)` | `#F4729A` |
| Road Trip | `rgba(56, 189, 248, 0.16)` | `#38BDF8` |

### 4. Typography

| Element | Font | Weight | Size | LH | LS | Max lines |
|---------|------|--------|------|-----|-----|-----------|
| Screen title | Plus Jakarta Sans | 800 | 24px | 1.15 | -0.02em | 1 |
| List title | Plus Jakarta Sans | 800 | 26px | 1.15 | -0.02em | 2 |
| Owner name | Inter | 600 | 14px | 1.4 | 0 | 1 |
| Stats | Inter | 500 | 12px | 1.4 | 0 | 1 |
| Vibe badge | Plus Jakarta Sans | 700 | 10px | 1.0 | 0.06em | 1 |
| CTA button | Plus Jakarta Sans | 700 | 14px | 1.0 | 0.02em | 1 |

### 5. Colors

Same dusk palette as Screen 1. Cover-specific: gradient overlay min opacity 0.75 at bottom for text legibility. Like animation heart: `#F4729A` → `#C026A0`. Save-all success flash: `#34D399` 24% overlay 200ms.

### 6. Gestures

| Gesture | Threshold | Behavior |
|---------|-----------|----------|
| Horizontal swipe | ±120px / velocity 800px/s | Next/previous list cover |
| Double-tap | 300ms window | Like; heart scale 0→1.3→1; +1 like count |
| Long-press | 400ms | Open `CreatorPreviewSheet` half-sheet |
| Tap Open | — | Navigate `/bucket-list/:id` |
| Tap Save all | — | Copy all items; fly animation to bucket tab |
| Tap avatar | — | Navigate `/profile/:username` |
| Tap share | — | Native share sheet |

### 7. Animation

| Trigger | Duration | Easing | Details |
|---------|----------|--------|---------|
| Card swipe dismiss | 320ms | expo out | translateX ±400px |
| Double-tap heart | 450ms | spring 200/18 | scale + fade |
| Save entire list | 700ms | expo out | Cover shrinks → flies to nav Bucket tab |
| Copy confirmation toast | 240ms | soft out | slide up |
| Long-press sheet | 280ms | expo out | sheet translateY 100%→0 |
| Skeleton shimmer | 1200ms | linear loop | bg position shift |

### 8. Haptics

| Event | Type |
|-------|------|
| Swipe advance | Light |
| Double-tap like | Medium |
| Save entire list success | Success notification |
| Duplicate list warning | Warning |
| Long-press open | Light (on press down at 400ms) |

### 9. Pattern References

| Source | Adaptation |
|--------|------------|
| Spotify album browse | Cover-forward cards with title below image area |
| Instagram Highlights | Circular avatar rings on covers |
| Travel posters | Bold title typography over full-bleed photo |
| Pinterest board preview | Vibe tag as category signal |

### 10. States

| State | Behavior |
|-------|----------|
| Loading | 3 skeleton covers 520px tall; pulse |
| Empty | `"No lists yet"` + `"Check back soon"` |
| Private list | Blurred cover + lock icon; `"This list is private"` |
| Already saved (full) | CTA `"Already saved"` disabled; link to own copy |
| Partial copy | Toast lists N new items, M duplicates skipped |
| Pagination | Load 10 lists; fetch next 10 at index 8 |
| Missing cover | Gradient fallback `--gradient-dusk` + initials |
| Spotify unavailable | Hide soundtrack pill; no layout shift |

### 11. Accessibility

- Cover card: `aria-label="[List name] by [Owner], [N] items"`
- Double-tap like also available as visible heart button 44×44
- Vibe badges include text (not color-only)
- Reduced motion: cross-fade between covers, no stack parallax

---

## Screen 3 — Bucket List Detail View

**Route:** `/bucket-list/:id`

### 1. Purpose

Immerse in a single bucket list as an editorial mood board. View items, media, soundtrack; save items or whole list; navigate to item detail.

### 2. Visual Layout

| Region | Spec |
|--------|------|
| Scroll container | Vertical; `scroll-snap-type: none`; bg `#0B0F1A` |
| **Hero header** | Height 280px; full width; image cover; radius 0 |
| Hero gradient | Bottom 50%: `rgba(11,15,26,0) → rgba(11,15,26,0.92)` |
| Sticky header (scrolled) | Height 52px; triggers at scrollY > 200px; bg `rgba(18,24,40,0.92)` blur 16px |
| Title block (in hero) | Padding 20px; position absolute; bottom 0 |
| List title | 28px/800; max 2 lines |
| Creator row | Avatar 32px; name 14px/600; verified badge 14px |
| Meta row | Item count · completion % · vibe badge; gap 8px; margin-top 8px |
| Description | 15px/400; max 3 lines collapsed; `"Read more"` expands |
| **Action bar** | Padding 16px; gap 12px; flex row |
| Share / Follow / Save Whole | Height 44px; min-width 44px |
| **MasonryGrid** | Padding 12px; gap 8px; CSS Grid |
| Grid columns | 2 columns; col width `(100% - 8px) / 2` = 179px @ 390px |
| Large tile | `grid-column: span 2`; height 240px; radius 16px |
| Small tile | height 160px; radius 16px |
| Portrait tile | height 200px; radius 16px |
| Pattern repeat | Row1: large; Row2: small + small; Row3: portrait + small; Row4: full-width editorial 120px |
| Tile overlay | Bottom gradient 80px; padding 12px |
| Tile title | 14px/700; max 2 lines |
| Completed tile | 60% opacity + `#34D399` check badge 24px top-right |
| Saved-by-viewer | `#38BDF8` bookmark icon 20px top-left |
| **InstagramVideoRow** | Horizontal scroll; padding 16px 12px; gap 12px |
| Video thumb | 120×160px; radius 12px; play icon 32px centered |
| **SpotifySoundtrackSection** | Margin 24px 16px 32px; padding 20px; radius 20px; bg `#121828` |
| Playlist art | 80×80px; radius 8px |
| Embed height | 80px compact player strip |
| Bottom safe | 32px + safe-area |

**Design decision — Spotify placement:** Final designed section (not sticky). Rationale: mood board should end with emotional "soundtrack of this list" moment like album outro; sticky player competes with tile CTAs; pinned bottom reduces scrollable grid by 120px on small phones.

### 3. UI Components

| Component | Props / States |
|-----------|----------------|
| `BucketListDetailPage` | `listId`; resolves own vs public |
| `BucketListHeroHeader` | `coverUrl`, `title`, `creator`, `scrollProgress` |
| `BucketListStickyHeader` | `visible: boolean`; condensed title |
| `BucketListActionBar` | `canFollow`, `canSaveAll`, `isOwner` |
| `MasonryGrid` | `items: BucketListItem[]`; `layoutPattern: 'editorial'` |
| `ExperienceTile` | `item`, `size: 'large'\|'small'\|'portrait'\|'editorial'`; `isCompleted`, `isSaved` |
| `InstagramVideoCarousel` | `media: InstagramMedia[]` |
| `SpotifySoundtrackCard` | `playlist: SpotifyPlaylist`; `variant: 'full'\|'compact'` |
| `CompletionProgressRing` | `completed: number`; `total: number`; 40px diameter |
| `SaveItemButton` | icon button on tile hover/long-press |
| `TileQuickActionsSheet` | long-press menu: save, share, open, remove |

### 4. Typography

| Element | Font | Weight | Size | LH | LS | Max lines |
|---------|------|--------|------|-----|-----|-----------|
| List title (hero) | Plus Jakarta Sans | 800 | 28px | 1.1 | -0.02em | 2 |
| List title (sticky) | Plus Jakarta Sans | 700 | 18px | 1.25 | -0.01em | 1 |
| Description | Inter | 400 | 15px | 1.5 | 0 | 3 (collapsed) |
| Tile title | Plus Jakarta Sans | 700 | 14px | 1.25 | 0 | 2 |
| Tile location | Inter | 500 | 11px | 1.35 | 0 | 1 |
| Section label | Plus Jakarta Sans | 700 | 18px | 1.25 | -0.01em | 1 |
| Soundtrack title | Plus Jakarta Sans | 700 | 16px | 1.25 | 0 | 1 |

### 5. Colors

| Element | Value |
|---------|-------|
| Page bg | `#0B0F1A` |
| Tile fallback | `#1A2236` |
| Tile overlay | `linear-gradient(180deg, transparent, rgba(11,15,26,0.85))` |
| Completed badge | `#34D399` on `rgba(11,15,26,0.72)` |
| Saved indicator | `#38BDF8` |
| Soundtrack card | `#121828`; border `1px rgba(255,255,255,0.08)` |
| Follow button active | `#C026A0` fill |

### 6. Gestures

| Gesture | Behavior |
|---------|----------|
| Vertical scroll | Standard; parallax hero at 0.5× scroll speed |
| Tap tile | Navigate `/bucket-list/:listId/item/:itemId` |
| Long-press tile (400ms) | `TileQuickActionsSheet` |
| Horizontal scroll | Instagram video row only |
| Pull to refresh | Owner only; reload list metadata |
| Pinch | Not used |

### 7. Animation

| Trigger | Duration | Easing | Details |
|---------|----------|--------|---------|
| Sticky header appear | 180ms | soft out | opacity 0→1; translateY -8→0 |
| Hero parallax | scroll-linked | — | translateY scrollY × 0.5 |
| Tile appear | 240ms | expo out | opacity + translateY 12→0; stagger 40ms |
| Save item fly | 700ms | expo out | tile thumb → bucket nav |
| Progress ring fill | 450ms | soft out | stroke-dashoffset |
| Soundtrack play pulse | 1200ms | linear loop | equalizer bars |

### 8. Haptics

| Event | Type |
|-------|------|
| Save item | Medium |
| Save whole list | Success |
| Follow creator | Light |
| Long-press | Light at 400ms |
| Pull refresh | Medium |

### 9. Pattern References

| Source | Adaptation |
|--------|------------|
| Pinterest masonry | Mixed tile heights for experiences |
| Instagram Explore | Large hero + dense grid |
| Spotify playlist page | Soundtrack as dedicated finale section |
| Magazine editorial | Full-width text breaks between grid rows |

### 10. States

| State | Behavior |
|-------|----------|
| Loading | Hero skeleton 280px + 6 tile skeletons |
| Empty list | `"This list is empty"` + owner-only `"Add experiences"` CTA |
| Private | Blur grid; `"Private list"` for non-followers |
| Offline | Cached tiles; banner |
| Missing image | Initials on `#1A2236` |
| Spotify unavailable | Card shows `"Open in Spotify"` link only |
| Instagram unavailable | Hide video row |
| Own list | Edit name inline; delete list in overflow menu |
| Viewer | Save buttons visible; no delete |

### 11. Accessibility

- Tiles: `aria-label="[Experience title], [location], [completed/not completed]"`
- Progress ring: `aria-valuenow` / `aria-valuemax`
- Soundtrack: play button 44×44; `"Play [playlist name] preview"`
- Reduced motion: no parallax; instant sticky header

---

## Screen 4 — Item Detail and Completion

**Route:** `/bucket-list/:listId/item/:itemId`

### 1. Purpose

View full experience details for a saved bucket list item. Mark complete with optional memory, media, rating, tags. Celebrate completion.

### 2. Visual Layout

| Region | Spec |
|--------|------|
| Scroll | Vertical; collapsible hero |
| **Hero image** | Width 100%; height 360px (expanded); collapses to 72px on scroll |
| Collapse trigger | scrollY > 180px |
| Collapsed bar | Sticky top below safe-area; title 16px/700 truncated |
| Back button | 44×44; top-left over hero; glass bg |
| **Content** | Padding 20px 16px; gap 20px |
| Title | 24px/800 |
| Metadata chips | Row gap 8px; chip height 28px |
| Description | 15px/400; full text |
| Map preview | Height 160px; radius 16px; margin-top 12px |
| Host card | Height 72px; padding 12px; radius 16px; bg `#121828` |
| Instagram row | Same as Screen 3 |
| **Completion section** | Padding 20px; radius 20px; bg `#121828`; border 1px glass |
| Toggle | `CompletionToggle` 52px height |
| Write-up composer | Min-height 120px; max-height 200px; padding 16px; radius 12px; bg `#1A2236` |
| Character count | 11px muted; `"0 / 280"` bottom-right |
| Rating row | 5 stars 44×44 tap targets |
| Media attachments | Horizontal scroll; 80×80 thumbs; radius 8px |
| Tag people | Pill chips height 32px |
| Privacy row | Toggle + label 44px row |
| Share-after-complete | Checkbox row |
| **Complete CTA** | Fixed bottom; height 56px + safe-area; padding 12px 16px |
| Hold-to-complete ring | SVG 64px; stroke `#34D399`; 800ms fill |

### 3. UI Components

| Component | Props / States |
|-----------|----------------|
| `ItemDetailPage` | `listId`, `itemId` |
| `CollapsingHero` | `imageUrl`, `scrollY`, `title` |
| `ExperienceMetadataRow` | `location`, `date`, `price`, `season` |
| `MapPreviewCard` | `lat`, `lng`, `staticMapUrl` |
| `HostInfoCard` | `hostName`, `avatarUrl` |
| `CompletionToggle` | `isCompleted: boolean`; `onToggle` |
| `CompletionWriteUpComposer` | `value`, `maxLength: 280`, `placeholder` |
| `StarRatingInput` | `value: 1-5`, `onChange` |
| `MediaAttachmentStrip` | `photos`, `video`, `onAdd`, `onRemove` |
| `TagPeopleInput` | `taggedUserIds[]` |
| `PrivacySelector` | `isPublic: boolean` |
| `HoldToCompleteButton` | progress 0–1 over 800ms |
| `CompletionCelebration` | fullscreen overlay; auto-dismiss 2400ms |
| `CompletionUndoToast` | 6s window |

**CompletionToggle states:** `inactive` (outline), `active` (gradient ring), `completed` (green fill + check).

**Placeholder copy:** `"What was the vibe? Would you do it again?"`

### 4. Typography

| Element | Font | Weight | Size | LH | LS | Max lines |
|---------|------|--------|------|-----|-----|-----------|
| Hero title (expanded) | Plus Jakarta Sans | 800 | 24px | 1.15 | -0.02em | 3 |
| Hero title (collapsed) | Plus Jakarta Sans | 700 | 16px | 1.25 | 0 | 1 |
| Section title | Plus Jakarta Sans | 700 | 18px | 1.25 | -0.01em | 1 |
| Body | Inter | 400 | 15px | 1.5 | 0 | unlimited |
| Composer | Inter | 400 | 15px | 1.5 | 0 | — |
| Chip | Inter | 500 | 12px | 1.4 | 0 | 1 |
| CTA | Plus Jakarta Sans | 700 | 16px | 1.0 | 0.02em | 1 |

### 5. Colors

| Element | Value |
|---------|-------|
| Completion section bg | `#121828` |
| Composer bg | `#1A2236` |
| Complete CTA gradient | `linear-gradient(135deg, #34D399, #059669)` |
| Hold ring track | `rgba(255,255,255,0.12)` |
| Hold ring fill | `#34D399` |
| Star active | `#FBBF24` |
| Star inactive | `rgba(248,250,252,0.24)` |

### 6. Gestures

| Gesture | Behavior |
|---------|----------|
| Tap toggle | Flip completion (with confirm if uncompleting) |
| Hold Complete CTA 800ms | Alternative complete path; ring fills |
| Swipe down on hero | Expand/collapse hero (optional) |
| Keyboard open | Composer scrolls into view; CTA stays fixed |
| Back | Pop navigation; draft saved to localStorage |

### 7. Animation

| Trigger | Duration | Easing | Details |
|---------|----------|--------|---------|
| Hero collapse | 240ms | soft out | height 360→72px |
| Toggle on | 320ms | spring 200/20 | scale 1→1.05→1 |
| **CompletionCelebration** | 2400ms total | — | — |
| Checkmark draw | 450ms | expo out | SVG stroke |
| Gradient ring expand | 450ms | expo out | scale 0.6→2.4; opacity 0.6→0 |
| Particle burst | 450ms | ease-out | 16 particles |
| Confetti | 1200ms | gravity sim | 24 pieces; `#F97316`, `#C026A0`, `#FBBF24` |
| Image glow | 600ms | ease-in-out | box-shadow pulse |
| Progress update | 320ms | soft out | number count-up |
| Overlay dismiss | 180ms | ease-in | opacity 0 |

**Reduced motion:** checkmark + progress only; no confetti/particles.

### 8. Haptics

| Event | Type |
|-------|------|
| Toggle on | Medium |
| Hold ring 50% | Light |
| Hold complete | Heavy |
| Celebration start | Success notification |
| Star tap | Selection |
| Undo complete | Light |

### 9. Pattern References

| Source | Adaptation |
|--------|------------|
| Instagram caption composer | Write-up field styling and placeholder tone |
| Instagram post completion | Media attachments strip |
| Apple Fitness rings | Hold-to-complete ring (shortened 800ms) |
| Strava activity save | Celebration overlay (less data-dense) |

### 10. States

| State | Behavior |
|-------|----------|
| Not completed | Toggle off; CTA `"Mark complete"` |
| Draft write-up | Auto-save every 2s to localStorage |
| Completing | CTA loading; disable navigation |
| Completed | Green badge; `"Edit memory"` mode |
| Reopen completed | Pre-fill write-up + media |
| Offline complete | Queue sync; optimistic UI |
| Missing hero | `#1A2236` placeholder |

### 11. Accessibility

- Toggle: `role="switch"` + `aria-checked`
- Composer: `aria-describedby` character count
- Stars: `aria-label="Rate [n] stars"`
- Hold button: alternative single-tap for motor accessibility
- Celebration: `aria-live="polite"` `"Experience completed"`
- Reduced motion: skip confetti; haptic only on success

---

## Screen 5 — Completion Share Card

**Route:** `/completions/:completionId/share` (modal or full-screen)

### 1. Purpose

Preview, lightly customize, and export a 9:16 share card after completing an experience.

### 2. Visual Layout

| Region | Spec |
|--------|------|
| Preview container | Centered; width 100%; padding 16px |
| **Card preview** | Width 100% max 358px; aspect-ratio 9/16; height auto (≈636px) |
| Export resolution | 1080×1920px (scale factor 3.015 @ 358px preview) |
| Safe zone (Story UI) | Top 120px + bottom 180px keep critical text out (Instagram) |
| **Variant switcher** | Segmented control height 40px; margin-bottom 16px |
| **Editable layers** | Max 6: title, write-up, progress, profile, logo, QR |
| Drag bounds | 16px inset from card edges |
| Pinch resize | Scale 0.8–1.2 on selected layer |
| **Toolbar** | Fixed bottom; height 72px + safe-area |
| Export button | Primary 56px height |
| Share row | Icons 48×48: Instagram, Messages, Save, More |

**Variant layouts (1080×1920):**

| Variant | Layout |
|---------|--------|
| **Cinematic** | Full-bleed image; gradient scrim bottom 45% (opacity 0→0.85); title 64px from bottom at y=1520; location y=1620; date y=1680; profile 96px circle at y=1720; TUDU logo 48px top-left (48,48) |
| **Scrapbook** | Image inset 64px with 12px white border; rotation -2deg; tape SVG top-center; title below image; write-up handwritten accent 32px Plus Jakarta Italic |
| **Minimal** | Solid `#121828` bg; image 880×880 centered at y=280; title centered below; thin `#F4729A` divider 120px wide |

### 3. UI Components

| Component | Props / States |
|-----------|----------------|
| `ShareCardPreview` | `config: ShareCardConfig`; `variant`; `scale: 'preview'\|'export'` |
| `ShareCardVariantPicker` | `value: 'cinematic'\|'scrapbook'\|'minimal'` |
| `DraggableShareLayer` | `id`, `bounds`, `defaultPosition`, `hidden` |
| `ShareCardExporter` | generates PNG 1080×1920 via canvas |
| `ShareCardAnimationPreview` | 3s loop: fade-in + scale 0.95→1 |
| `ShareToolbar` | export, share, save |
| `QrCodeLayer` | optional; 120×120; bottom-right with 48px margin |

### 4. Typography (export @ 1080×1920)

| Element | Font | Weight | Size | LH | LS |
|---------|------|--------|------|-----|-----|
| Experience title | Plus Jakarta Sans | 800 | 72px | 1.1 | -0.02em |
| Location | Inter | 600 | 36px | 1.3 | 0 |
| Date | Inter | 500 | 28px | 1.4 | 0.04em |
| Write-up | Inter | 400 | 32px | 1.45 | 0 |
| User name | Plus Jakarta Sans | 700 | 36px | 1.2 | 0 |
| "Completed on TUDU" | Plus Jakarta Sans | 700 | 24px | 1.0 | 0.08em |
| "NOW YOU KNOW" | Plus Jakarta Sans | 800 | 28px | 1.0 | 0.12em |
| Progress | Inter | 600 | 28px | 1.4 | 0 |

**Write-up limit:** 280 characters; 4 lines max on card with ellipsis.

### 5. Colors

| Element | Value |
|---------|-------|
| Scrim | `linear-gradient(180deg, transparent 40%, rgba(11,15,26,0.92) 100%)` |
| Scrapbook border | `#FFFFFF` |
| Minimal bg | `#121828` |
| Accent divider | `#F4729A` |
| Progress text | `#FBBF24` |
| QR bg | `#FFFFFF` |

### 6. Gestures

| Gesture | Behavior |
|---------|----------|
| Tap layer | Select; show resize handles |
| Drag layer | Move within bounds |
| Pinch (2 finger) | Resize selected layer |
| Tap hide icon | Toggle layer visibility |
| Double-tap preview | Reset layout to variant default |
| Swipe variant picker | Change variant |

### 7. Animation

| Trigger | Duration | Easing | Details |
|---------|----------|--------|---------|
| Preview enter | 320ms | expo out | scale 0.92→1; opacity 0→1 |
| Variant switch | 240ms | soft out | crossfade |
| Export flash | 120ms | — | white overlay 20% opacity |
| Pre-export preview loop | 3000ms | ease-in-out | subtle Ken Burns 1.03 scale on image |
| Toolbar slide up | 240ms | expo out | translateY |

### 8. Haptics

| Event | Type |
|-------|------|
| Export success | Success notification |
| Save to camera roll | Medium |
| Layer select | Selection |
| Variant change | Light |

### 9. Pattern References

| Source | Adaptation |
|--------|------------|
| Instagram Story compose | 9:16 safe zones |
| Spotify Wrapped | Bold typography over photo |
| Canva templates | Limited drag — not full editor |

### 10. States

| State | Behavior |
|-------|----------|
| Generating | Spinner on export button |
| Export success | Toast `"Saved to photos"` |
| Export fail | Error toast + retry |
| Missing write-up | Layer hidden by default |
| Missing profile photo | Initials circle |
| Offline | Export still works; share sheet may queue |

### 11. Accessibility

- Export button: `"Export share card at 1080 by 1920 pixels"`
- Layer controls: keyboard arrows move 4px per press
- Preview: alt text `"Share preview for [title]"`
- Reduced motion: static preview only

---

## Screen 6 — Profile with Soundtrack

**Route:** `/profile/:username` · `/my-tudu` (owner)

### 1. Purpose

Showcase a user's bucket lists, completed experiences, and profile soundtrack. Primary content type is bucket lists (not generic posts).

### 2. Visual Layout

| Region | Spec |
|--------|------|
| Scroll | Vertical; sticky tabs |
| **Profile header** | Padding 20px 16px 0 |
| Avatar | 96×96; story ring 108px outer diameter; ring 3px `--gradient-story-ring` |
| Display name | 22px/800; centered; margin-top 12px |
| Username | 14px/500 muted; `@username` |
| Bio | 15px/400; max 3 lines; margin-top 8px |
| Location | 12px muted; icon 14px |
| **Stats row** | Height 56px; 3 columns equal width |
| Stat value | 18px/800 |
| Stat label | 11px/500 muted |
| **Action row** | Gap 12px; margin 16px 0 |
| Edit / Share buttons | Height 40px; flex 1; radius 20px |
| **ProfileSoundtrackCard** | Margin 0 16px 20px; height 88px; padding 12px; radius 16px; bg `#121828` |
| Playlist art | 64×64; radius 8px |
| Play button | 44×44 circle |
| **Tab bar** | Height 48px; sticky top when scroll passes header (~320px) |
| Tabs | Lists · Completed · Saved |
| Active indicator | 2px height `#F97316`; width 40px; centered under tab |
| **Grid** | 3 columns; gap 2px; padding 0 |
| Cover cell | Square 1:1; width `(100% / 3)` ≈ 129px @ 390px |
| Pinned list | 2×2 span (large square 260px); pin icon 20px top-right |
| Completed cell | Same ratio; `#34D399` check 24px overlay bottom-right |
| Private badge | Lock 16px center overlay on blurred cell |
| Empty tab | Centered 200px min-height; CTA link |

### 3. UI Components

| Component | Props / States |
|-----------|----------------|
| `ProfilePage` | `username`; `isOwner: boolean` |
| `ProfileHeader` | `user: User` |
| `AvatarStoryRing` | `size: 96`; `hasActiveStory: boolean` |
| `ProfileStatsRow` | followers, following, completed, lists |
| `ProfileActionRow` | `isOwner`; edit/share/follow |
| `ProfileSoundtrackCard` | `playlist?: SpotifyPlaylist`; `isPlaying: boolean` |
| `ProfileTabBar` | `activeTab: 'lists'\|'completed'\|'saved'` |
| `BucketListCoverGrid` | `lists: BucketList[]`; `pinnedId?: string` |
| `CompletedExperienceGrid` | `completions: Completion[]` |
| `PrivateProfileGate` | blur overlay + follow CTA |
| `EmptyProfileState` | context per tab |

### 4. Typography

| Element | Font | Weight | Size | LH | LS | Max lines |
|---------|------|--------|------|-----|-----|-----------|
| Display name | Plus Jakarta Sans | 800 | 22px | 1.15 | -0.02em | 1 |
| Username | Inter | 500 | 14px | 1.4 | 0 | 1 |
| Bio | Inter | 400 | 15px | 1.5 | 0 | 3 |
| Stat value | Plus Jakarta Sans | 800 | 18px | 1.2 | 0 | 1 |
| Stat label | Inter | 500 | 11px | 1.35 | 0.04em | 1 |
| Tab label | Plus Jakarta Sans | 700 | 13px | 1.0 | 0.04em | 1 |
| Soundtrack title | Plus Jakarta Sans | 700 | 15px | 1.25 | 0 | 1 |
| Grid label (pinned) | Plus Jakarta Sans | 700 | 12px | 1.2 | 0 | 2 |

### 5. Colors

| Element | Value |
|---------|-------|
| Header bg | `#0B0F1A` |
| Stat divider | `rgba(255,255,255,0.08)` vertical 1px |
| Tab inactive | `rgba(248,250,252,0.48)` |
| Tab active | `#F8FAFC` |
| Story ring | `conic-gradient(#F97316, #C026A0, #38BDF8, #FBBF24, #F97316)` |
| Follow button | `#C026A0` fill |
| Edit button | `#1A2236` border `rgba(255,255,255,0.12)` |

### 6. Gestures

| Gesture | Behavior |
|---------|----------|
| Tap grid cell | Navigate list detail or completion story |
| Long-press cell (owner) | Pin/unpin list |
| Tap soundtrack | Play/pause preview |
| Tap avatar ring | View active completion stories |
| Pull refresh | Reload profile |
| Horizontal swipe on tabs | Switch tab (optional) |

### 7. Animation

| Trigger | Duration | Easing | Details |
|---------|----------|--------|---------|
| Tab switch | 240ms | soft out | content crossfade |
| Sticky tab bar | 180ms | soft out | bg blur fade-in |
| Story ring rotate | 8000ms | linear loop | 360deg (paused reduced-motion) |
| Play equalizer | 1200ms | linear loop | 4 bars |
| Pin list | 320ms | spring 180/20 | scale 1→1.02→1 |

### 8. Haptics

| Event | Type |
|-------|------|
| Tab change | Selection |
| Pin list | Medium |
| Follow | Light |
| Play soundtrack | Light |

### 9. Pattern References

| Source | Adaptation |
|--------|------------|
| Instagram profile | Stats + grid + tabs — but tabs are Lists/Completed not Posts/Reels |
| Spotify profile header | Soundtrack card with album art |
| Instagram Highlights | Story ring on avatar for completion stories |

### 10. States

| State | Behavior |
|-------|----------|
| Owner | Edit profile visible; private tabs accessible |
| Visitor | Follow button; public content only |
| Private profile | Grid blurred; `"Follow to see lists"` |
| Empty lists | `"No bucket lists yet"` + CTA discover |
| Empty completed | `"No completions yet"` |
| No soundtrack | Card shows `"Add a soundtrack"` (owner) |
| Spotify unavailable | Open in Spotify link fallback |

### 11. Accessibility

- Stats: accessible names `"142 completed experiences"`
- Tabs: `role="tablist"` with keyboard navigation
- Soundtrack: `"Play [name] by [creator] on Spotify preview"`
- Grid cells: `"[List name], [n] items, pinned"` 
- Reduced motion: static story ring

---

## 5. Visual Identity — Dusk Palette

Refined hex values (canonical):

| Token | Hex | Usage |
|-------|-----|-------|
| Midnight | `#0B0F1A` | Primary background |
| Elevated | `#121828` | Cards, nav, elevated surfaces |
| Surface | `#1A2236` | Inputs, secondary cards, skeleton |
| Plum | `#5C2D6E` | Gradient anchor, chill vibes |
| Magenta | `#C026A0` | Primary accent, follow, active highlights |
| Sunset Pink | `#F4729A` | Likes, romantic vibes, scrapbook accent |
| Sunset Orange | `#F97316` | Primary CTA, story ring, tab indicator |
| Warm Yellow | `#FBBF24` | Progress, ratings, warnings |
| Electric Blue | `#38BDF8` | Links, info, saved indicators |
| Success | `#34D399` | Completion, confirmed save |
| Error | `#F87171` | Skip tint, errors, destructive |

**Gradients:**

```css
--gradient-dusk: linear-gradient(135deg, #0B0F1A 0%, #5C2D6E 28%, #C026A0 52%, #F4729A 72%, #F97316 88%, #FBBF24 100%);
--gradient-dusk-soft: linear-gradient(135deg, rgba(192,38,160,0.85) 0%, rgba(244,114,154,0.85) 45%, rgba(249,115,22,0.85) 100%);
--gradient-story-ring: conic-gradient(from 180deg, #F97316, #C026A0, #38BDF8, #FBBF24, #F97316);
```

**Text on photography:** always use `--color-overlay-readability` scrim; minimum bottom 40% opacity 0.55.

**Warm accents for:** primary actions, story rings, completion, progress, save states, selected tabs.

**Cool accents for:** info links, Spotify secondary accents, saved bookmarks.

**Green (`#34D399`):** success/completed only — never primary brand.

---

## 6. Typography Requirements

### Font families

| Role | Family | Fallback |
|------|--------|----------|
| Display | **Plus Jakarta Sans** | `system-ui, sans-serif` |
| Body / UI | **Inter** | `system-ui, sans-serif` |

### Google Fonts import

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700&family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;0,800;1,600&display=swap');
```

### Type scale

| Token | Weight | Size | Line height | Letter spacing | Use |
|-------|--------|------|-------------|----------------|-----|
| `--text-display` | 800 | 32px | 1.1 | -0.02em | Landing moments |
| `--text-screen-title` | 800 | 24px | 1.15 | -0.02em | Screen headers |
| `--text-card-title` | 700 | 22px | 1.2 | -0.01em | Card titles |
| `--text-section-title` | 700 | 18px | 1.25 | -0.01em | Section headers |
| `--text-body` | 400 | 15px | 1.5 | 0 | Body copy |
| `--text-body-semibold` | 600 | 15px | 1.5 | 0 | Emphasis |
| `--text-metadata` | 500 | 12px | 1.4 | 0 | Metadata |
| `--text-caption` | 500 | 11px | 1.35 | 0 | Captions |
| `--text-button` | 700 | 14px | 1.0 | 0.02em | Buttons |
| `--text-badge` | 700 | 10px | 1.0 | 0.06em | Badges, chips |
| `--text-progress` | 800 | 18px | 1.2 | 0 | Numeric progress |
| `--text-story-title` | 800 | 72px | 1.1 | -0.02em | Share card export |
| `--text-story-body` | 400 | 32px | 1.45 | 0 | Share card write-up |

**Overflow:** titles ellipsis after max lines; body wraps; badges never wrap.

---

## 7. Iconography — Lucide

**Library:** [Lucide](https://lucide.dev) (`lucide-react`)

| Setting | Value |
|---------|-------|
| Default stroke width | 2px |
| Small (`--icon-sm`) | 16px |
| Standard (`--icon-md`) | 20px |
| Large (`--icon-lg`) | 24px |
| XL (`--icon-xl`) | 32px |
| Active state | Filled variant OR stroke 2.5px + accent color |
| Icon button bg | 48×48 circle; `rgba(18,24,40,0.72)`; border `rgba(255,255,255,0.12)` |

**Key icons:**

| Action | Lucide icon |
|--------|-------------|
| Save to bucket | `Bookmark` / custom `BucketListIcon` |
| Skip | `X` |
| View | `ChevronUp` |
| Share | `Share2` |
| Like | `Heart` |
| Soundtrack | `Music` |
| Spotify | `Music2` (custom green) |
| Complete | `CheckCircle2` |
| Play video | `Play` filled |
| Private | `Lock` |
| Verified | `BadgeCheck` |
| Location | `MapPin` |
| Add photo | `ImagePlus` |

**Custom `BucketListIcon`:** Lucide `List` modified — rounded bucket silhouette with gradient fill `#F97316→#C026A0`; 24×24 viewBox; used exclusively for save-fly target and nav tab.

**Accessibility:** every icon button has `aria-label`; decorative icons `aria-hidden="true"`.

---

## 8. Technical Assumptions

| Area | Assumption |
|------|------------|
| Framework | React 18 + Vite + TypeScript (current TUDU stack) |
| Future native | Component specs map to React Native + Expo |
| Animation (web) | Framer Motion or CSS transforms + `@keyframes` |
| Animation (native) | Reanimated 3 + Gesture Handler |
| Haptics (web) | `navigator.vibrate()` fallback; Expo Haptics on native |
| Storage (MVP) | `localStorage` keys: `tudu_bucket_lists`, `tudu_public_bucket_lists` |
| Images | `object-fit: cover`; lazy load below fold; WebP preferred |
| Spotify | Embed iframe (`open.spotify.com/embed`) + deep link `spotify:playlist:` |
| Instagram | External links + thumbnail URLs; no API dependency in v1 |
| Share export | Canvas API (`html-to-image` or custom canvas) @ 1080×1920 |
| Routing | React Router v6 |
| Safe areas | `env(safe-area-inset-*)` on all fixed headers/nav |
| Performance target | 55+ FPS during swipe on iPhone 12 / Pixel 6 equivalent |

**Non-goals for v1:** backend sync, real Spotify OAuth, Instagram oEmbed API, full graphic editor.

---

## 9. Cursor Handoff Summary

### A. Recommended Screen Routes

| Route | Screen |
|-------|--------|
| `/discover` | Experience Card Deck (Things Tudu) |
| `/bucket-list` | My bucket lists hub (tabs: My List · Discover) |
| `/bucket-lists/discover` | Bucket List Discovery Feed |
| `/bucket-list/:id` | Bucket List Detail View |
| `/bucket-list/:listId/item/:itemId` | Item Detail and Completion |
| `/completions/:completionId/share` | Completion Share Card |
| `/profile/:username` | Profile with Soundtrack (visitor) |
| `/my-tudu` | Profile with Soundtrack (owner) |
| `/bucket-list/story/:storyId` | Completed list story viewer |

### B. Master Component Inventory

**Navigation**

- `BottomNav`, `DiscoverTopHeader`, `BucketListStickyHeader`, `ProfileTabBar`

**Discovery**

- `ExperienceSwipeCard`, `ExperienceCardStack`, `ExperienceCardOverlay`, `ExperienceActionRail`, `ExperienceBottomActionBar`, `DeckProgressIndicator`

**Bucket Lists**

- `BucketListCoverCard`, `BucketListDiscoveryDeck`, `BucketListHeroHeader`, `BucketListActionBar`, `MasonryGrid`, `ExperienceTile`, `VibeBadge`, `AddToBucketListModal`

**Experience Items**

- `ItemDetailPage`, `CollapsingHero`, `ExperienceMetadataRow`, `MapPreviewCard`, `HostInfoCard`

**Completion**

- `CompletionToggle`, `CompletionWriteUpComposer`, `StarRatingInput`, `MediaAttachmentStrip`, `TagPeopleInput`, `HoldToCompleteButton`, `CompletionCelebration`

**Sharing**

- `ShareCardPreview`, `ShareCardVariantPicker`, `DraggableShareLayer`, `ShareCardExporter`, `ShareToolbar`

**Profile**

- `ProfilePage`, `ProfileHeader`, `ProfileStatsRow`, `ProfileActionRow`, `BucketListCoverGrid`, `CompletedExperienceGrid`, `AvatarStoryRing`

**Spotify**

- `SpotifySoundtrackCard`, `SoundtrackIndicator`, `ProfileSoundtrackCard`

**Social Media**

- `InstagramVideoCarousel`, `InstagramVideoThumb`

**Feedback**

- `Toast`, `BucketSaveFlyAnimation`, `ListCopyConfirmationToast`, `CompletionUndoToast`

**Loading and Empty States**

- `SkeletonCard`, `SkeletonCover`, `SkeletonTile`, `EmptyState`, `ErrorState`, `OfflineBanner`

### C. Data Models

```typescript
export type User = {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  initials: string
  bio?: string
  location?: string
  isVerified?: boolean
  followerCount?: number
  followingCount?: number
  completedCount?: number
  bucketListCount?: number
  profileSoundtrack?: SpotifyPlaylist
  isPrivate?: boolean
}

export type Experience = {
  id: string
  title: string
  category: string
  city: string
  region?: string
  distance?: string
  date?: string
  time?: string
  price?: string
  imageUrl: string
  description?: string
  hostName?: string
  hostAvatarUrl?: string
  saveCount?: number
  season?: string
  mapPreviewUrl?: string
  ticketUrl?: string
  instagramMedia?: InstagramMedia[]
}

export type SpotifyPlaylist = {
  id: string
  name: string
  ownerName: string
  coverImageUrl: string
  trackCount: number
  spotifyUrl: string
  previewUrl?: string
}

export type InstagramMedia = {
  id: string
  thumbnailUrl: string
  permalink: string
  type: 'video' | 'photo'
}

export type BucketListItem = {
  id: string
  experienceId: string
  experience?: Experience
  addedAt: string
  note?: string
  isCompleted: boolean
  completion?: Completion
}

export type Completion = {
  id: string
  experienceId: string
  bucketListId: string
  completedAt: string
  writeUp?: string
  rating?: 1 | 2 | 3 | 4 | 5
  photoUrls?: string[]
  videoUrl?: string
  taggedUserIds?: string[]
  completedWith?: string[]
  isPublic: boolean
  shareAfterComplete?: boolean
}

export type BucketList = {
  id: string
  name: string
  description?: string
  coverImageUrl?: string
  ownerId?: string
  owner?: User
  vibe?: VibeTag
  region?: string
  eventIds: string[]
  items?: BucketListItem[]
  createdAt: string
  updatedAt: string
  spotifyUrl?: string
  soundtrack?: SpotifyPlaylist
  instagramMedia?: InstagramMedia[]
  completedIds: string[]
  isPrivate?: boolean
  likeCount?: number
  saveCount?: number
}

export type PublicBucketList = {
  id: string
  name: string
  ownerName: string
  ownerInitials: string
  ownerAvatarUrl?: string
  ownerVerified?: boolean
  coverImage: string
  description: string
  region?: string
  vibe?: VibeTag
  itemCount: number
  completedCount: number
  likeCount?: number
  saveCount?: number
  hasSoundtrack?: boolean
  soundtrack?: SpotifyPlaylist
  events: Experience[]
}

export type ShareCardConfig = {
  variant: 'cinematic' | 'scrapbook' | 'minimal'
  experienceTitle: string
  location: string
  completedAt: string
  writeUp?: string
  userDisplayName: string
  userAvatarUrl?: string
  experienceImageUrl: string
  bucketListName?: string
  progressLabel?: string
  showQrCode?: boolean
  hiddenElements?: string[]
  exportWidth: 1080
  exportHeight: 1920
}

export type VibeTag =
  | 'Adventurous' | 'Chill' | 'Romantic' | 'Family' | 'Foodie'
  | 'Wild' | 'Local' | 'Luxury' | 'Weekend' | 'Road Trip'
```

### D. Design Tokens

```css
:root {
  /* Colors */
  --color-midnight: #0b0f1a;
  --color-midnight-elevated: #121828;
  --color-midnight-surface: #1a2236;
  --color-plum: #5c2d6e;
  --color-magenta: #c026a0;
  --color-sunset-pink: #f4729a;
  --color-sunset-orange: #f97316;
  --color-warm-yellow: #fbbf24;
  --color-electric-blue: #38bdf8;
  --color-success: #34d399;
  --color-error: #f87171;

  /* Text */
  --color-text-primary: #f8fafc;
  --color-text-secondary: rgba(248, 250, 252, 0.72);
  --color-text-muted: rgba(248, 250, 252, 0.48);
  --color-text-inverse: #0b0f1a;

  /* Surfaces & glass */
  --color-glass-bg: rgba(18, 24, 40, 0.72);
  --color-glass-border: rgba(255, 255, 255, 0.12);
  --color-overlay-readability: linear-gradient(
    180deg,
    rgba(11, 15, 26, 0.35) 0%,
    rgba(11, 15, 26, 0.08) 35%,
    rgba(11, 15, 26, 0.55) 70%,
    rgba(11, 15, 26, 0.92) 100%
  );

  /* Gradients */
  --gradient-dusk: linear-gradient(135deg, #0b0f1a 0%, #5c2d6e 28%, #c026a0 52%, #f4729a 72%, #f97316 88%, #fbbf24 100%);
  --gradient-dusk-soft: linear-gradient(135deg, rgba(192, 38, 160, 0.85) 0%, rgba(244, 114, 154, 0.85) 45%, rgba(249, 115, 22, 0.85) 100%);
  --gradient-story-ring: conic-gradient(from 180deg, #f97316, #c026a0, #38bdf8, #fbbf24, #f97316);

  /* Shadows & glows */
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.45);
  --shadow-float: 0 12px 40px rgba(0, 0, 0, 0.55);
  --shadow-glow-warm: 0 0 24px rgba(249, 115, 22, 0.45);
  --shadow-glow-magenta: 0 0 32px rgba(192, 38, 160, 0.4);
  --shadow-glow-success: 0 0 20px rgba(52, 211, 153, 0.35);

  /* Spacing (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-safe-top: max(12px, env(safe-area-inset-top));
  --space-safe-bottom: max(16px, env(safe-area-inset-bottom));

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-card: 24px;
  --radius-cover: 20px;
  --radius-pill: 9999px;

  /* Typography */
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  /* Icon sizes */
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-lg: 24px;
  --icon-xl: 32px;

  /* Touch targets */
  --touch-min: 44px;
  --touch-action: 48px;
  --touch-fab: 56px;

  /* Z-index */
  --z-card-stack: 10;
  --z-header: 40;
  --z-floating: 50;
  --z-modal: 60;
  --z-toast: 70;
  --z-save-fly: 80;

  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-soft: cubic-bezier(0.2, 0.8, 0.2, 1);
  --duration-instant: 120ms;
  --duration-fast: 180ms;
  --duration-normal: 240ms;
  --duration-slow: 320ms;
  --duration-celebrate: 450ms;
  --duration-fly: 700ms;
}
```

### E. Type Scale

| Token | Size | Weight | Line height | Letter spacing |
|-------|------|--------|-------------|----------------|
| Display | 32px | 800 | 1.1 | -0.02em |
| Screen title | 24px | 800 | 1.15 | -0.02em |
| Card title | 22px | 700 | 1.2 | -0.01em |
| Section title | 18px | 700 | 1.25 | -0.01em |
| Body | 15px | 400 | 1.5 | 0 |
| Body semibold | 15px | 600 | 1.5 | 0 |
| Metadata | 12px | 500 | 1.4 | 0 |
| Caption | 11px | 500 | 1.35 | 0 |
| Button | 14px | 700 | 1.0 | 0.02em |
| Badge | 10px | 700 | 1.0 | 0.06em |
| Progress numeric | 18px | 800 | 1.2 | 0 |
| Story export title | 72px | 800 | 1.1 | -0.02em |
| Story export body | 32px | 400 | 1.45 | 0 |

### F. Spacing Scale

4px base: `4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64`

| Use | Token |
|-----|-------|
| Tight inline gap | `--space-1` (4px) |
| Chip padding | `--space-2` (8px) |
| Grid gap | `--space-2` (8px) |
| Card inner padding | `--space-4`–`--space-5` (16–20px) |
| Section margin | `--space-6` (24px) |
| Hero padding | `--space-5` (20px) |
| Page horizontal gutter | `--space-4` (16px) |
| Nav clearance | `--space-16` (64px) |

### G. Responsive Rules

| Width | Behavior |
|-------|----------|
| **375px** | Card width `calc(100% - 24px)` = 351px; grid tiles 171.5px; reduce hero title 26px |
| **390px** | Baseline design width; all spec measurements reference this |
| **430px** | Card max-width 406px centered; typography unchanged; gutters remain 16px |
| **Small height (<667px)** | Hero 240px; deck card min-height 520px; reduce stack to 2 cards |
| **Notch devices** | `--space-safe-top` on all fixed top elements |
| **Home indicator** | `--space-safe-bottom` + 64px on fixed bottom bars |
| **Tablet (≥768px)** | Single column max-width 430px centered; side margins `#0B0F1A` |

### H. Animation Cheat Sheet

| Interaction | Duration | Easing | Transform | Haptic | Reduced motion |
|-------------|----------|--------|-----------|--------|----------------|
| Card swipe dismiss | 320ms | expo out | translateX ±450px | Light | Instant opacity 0 |
| Card stack promote | 240ms | soft out | scale 0.96→1 | — | Instant |
| Save to bucket fly | 700ms | expo out | scale 1→0.15; bezier path | Medium | Fade only |
| Save entire list | 700ms | expo out | cover→nav tab | Success | Toast only |
| Double-tap like | 450ms | spring 200/18 | heart scale 0→1.3→1 | Medium | No scale |
| Open detail | 280ms | expo out | translateY 100%→0 | Light | Instant |
| Close detail | 240ms | soft out | translateY 0→100% | — | Instant |
| Mark complete | 320ms | spring 200/20 | toggle scale | Medium | Instant |
| Completion celebration | 2400ms | mixed | check+ring+confetti | Success | Check only |
| Story card preview | 3000ms | ease-in-out | Ken Burns 1.03 | — | Static |
| Tab change | 240ms | soft out | crossfade | Selection | Instant |
| Long-press preview | 280ms | expo out | sheet up | Light at 400ms | Instant appear |
| Toast enter | 240ms | expo out | translateY 24→0 | — | Fade |
| Toast exit | 180ms | ease-in | opacity 0 | — | Instant |

### I. Development Order

**Phase 1 — Foundation**

1. Design tokens (`src/styles/tokens.css`) + Lucide setup
2. Type definitions (`src/types/bucketList.ts`)
3. Bottom nav + route shells

**Phase 2 — Discovery core**

4. Experience Card Deck + swipe physics
5. Save-to-bucket fly animation + toast
6. `AddToBucketListModal`

**Phase 3 — Bucket list surfaces**

7. Bucket List Discovery Feed
8. Bucket List Detail View (masonry grid)
9. Spotify + Instagram sections

**Phase 4 — Completion flow**

10. Item Detail and Completion
11. CompletionCelebration overlay
12. Completion Share Card generator

**Phase 5 — Profile + polish**

13. Profile with Soundtrack
14. Accessibility audit + reduced motion
15. Performance pass (55 FPS swipe target)

### J. Acceptance Criteria

**Screen 1 — Experience Card Deck**

- [ ] Swipe gesture maintains ≥55 FPS on iPhone 12 / Pixel 6 class devices
- [ ] All touch targets ≥44×44px
- [ ] Text readable on 100% of seed images (contrast ≥4.5:1 on scrim)
- [ ] Save animation confirms destination list name in toast
- [ ] Undo restores item within 4 seconds
- [ ] Reduced motion disables particles and rotation

**Screen 2 — Bucket List Discovery Feed**

- [ ] Cover cards render at 358×520px ±2px at 390px viewport
- [ ] Double-tap like increments count with animation
- [ ] Save entire list copies all items; duplicates handled with message
- [ ] Private lists show lock state without leaking titles
- [ ] Pagination loads next batch before user reaches last card

**Screen 3 — Bucket List Detail View**

- [ ] Masonry grid matches editorial pattern (large → small pair → portrait)
- [ ] Sticky header appears at scrollY > 200px
- [ ] Spotify section renders at bottom without blocking grid scroll
- [ ] Completed tiles show green check badge; 60% opacity
- [ ] Spotify failure does not block list content

**Screen 4 — Item Detail and Completion**

- [ ] Hero collapses from 360px to 72px at scrollY > 180px
- [ ] Write-up limited to 280 characters with live count
- [ ] Hold-to-complete fires at 800ms with ring fill
- [ ] Celebration auto-dismisses at 2400ms
- [ ] Undo available 6 seconds after complete
- [ ] Draft write-up persists in localStorage on navigate away

**Screen 5 — Completion Share Card**

- [ ] Export PNG exactly 1080×1920px
- [ ] Three variants switch without layout break
- [ ] Instagram safe zones respected (top 120px, bottom 180px clear)
- [ ] User can hide/show layers; drag within 16px inset bounds
- [ ] `"Completed on TUDU"` and `"NOW YOU KNOW"` always present unless explicitly hidden

**Screen 6 — Profile with Soundtrack**

- [ ] Avatar story ring 108px outer; avatar 96px
- [ ] Soundtrack card plays preview when `previewUrl` available
- [ ] Grid 3-column with 2px gap; pinned list spans 2×2
- [ ] Owner sees Edit; visitor sees Follow
- [ ] Private profile blurs grid for non-followers
- [ ] Completion state synced with detail view and discovery counts

**Global**

- [ ] All screens use dusk palette hex values exactly as specified
- [ ] Plus Jakarta Sans + Inter loaded; no fallback flash >100ms
- [ ] Offline banner does not block primary gestures
- [ ] `prefers-reduced-motion` respected on all animations

---

*End of TUDU Bucket List Mode Design Specification · NOW YOU KNOW*
