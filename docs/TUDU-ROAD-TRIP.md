# TUDU Road Trip Mode — Strategy & Direction

> Source: TUDU_Road_Trip_Mode July 7, 2026.docx

## Overview

Road Trip Mode turns a drive into a planned or spontaneous adventure. Tell TUDU where you're headed, and it builds a route with stops along the way — or hand over control entirely with **"Surprise Me"** and let TUDU plan a spontaneous local adventure. It's designed to feel like its own destination within the app, not just another filter on the map.

Road Trip Mode was originally built ahead of beta launch but pulled before release to avoid overwhelming early users. It's now planned for reintroduction as its own dedicated section with its own **bottom navigation tab** — the same way Bucket List Mode is planned to get one.

## Core Concept

Road Trip Mode is entered by pressing its own icon on the bottom navigation bar, which opens a dedicated, fully themed Road Trip display — distinct in look and feel from the rest of the app. From there, users choose one of two paths:

### Plan a Destination

The user picks where they're headed, and TUDU crafts stops along the way based on the route. Users can also specify **how many stops** they want, letting TUDU replan the route to hit that number of extra events or points of interest.

### Surprise Me

A spontaneous, local adventure built just for the user — no destination required. TUDU builds a fun, unplanned route based on what's nearby.

## Scan Mode (While Driving)

Scan Mode is Road Trip Mode's passive, always-on companion for when a route isn't actively planned. While driving, it continuously checks for anything matching the user's filters within a **shorter radius**, and sends an alert when something relevant is nearby.

- Alerts based on the user's **existing filters**, not a new filter system.
- Radius intentionally shorter than normal browsing — surfaces in-the-moment detours.
- User can open alert for full details, or keep driving and ignore it.

> **Direction note:** Alert design must minimize distraction — large tap targets, minimal reading, voice/audio alerts as an option.

## Navigation & Placement

- Own icon on the **bottom navigation bar** (consistent with Bucket List Mode).
- Tapping opens a **fully themed Road Trip display**, not a standard list or map view.
- Visual theme is part of the experience itself (see Seasonal & Regional Theming).

## Seasonal & Regional Theming

The Road Trip Mode landing screen changes its visual theme with the seasons, and eventually by country/region as TUDU expands. Design directions include:

- Autumn / golden hour
- Night sky
- Winter dusk (illustrated)
- Autumn (illustrated, with tagline)
- Winter day (illustrated)

The **core layout stays consistent** across every theme:

- Logo
- "Road Trip Mode" title
- Two action cards: **Plan a Destination** / **Surprise Me**

> **Direction note:** Define trigger logic for theme changes — calendar-based, weather-based, location-based, or combination.

## Relaunch Considerations

- Define what's different this time — staged rollout, onboarding/tooltips, or better timing.
- Decide whether Road Trip Mode and Bucket List Mode launch together or separately.
- Clarify how "number of stops" works technically — cap, detour distance/time balance.

## Open Considerations Summary

- What triggers seasonal/regional theme changes at launch vs. later?
- How does Scan Mode alert the user safely while driving (visual, audio, or both)?
- What's the relaunch plan to avoid prior confusion?
- Does Road Trip Mode launch alongside or separately from Bucket List Mode?
- Is there a cap on the number of stops in "Plan a Destination"?

## Key Requirements Summary

| Area | Requirement |
|------|-------------|
| Nav | Dedicated bottom-nav tab → themed landing screen |
| Plan | Destination input + stop count → route with POIs/events |
| Surprise Me | No destination; spontaneous local route |
| Scan Mode | Passive nearby alerts while driving (shorter radius) |
| Theme | Seasonal/regional backgrounds; consistent core layout |
| UX | Distinct from main app; not buried in map or event feed |
