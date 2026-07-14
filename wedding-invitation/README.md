# Amee ♥ Ridham — Wedding Invitation

A cinematic, mobile-first single-page wedding invitation for a Gujarati wedding
in Rajkot — 28 & 29 January 2026.

## Events

| # | Event            | Date   | Time     | Dress theme     |
|---|------------------|--------|----------|-----------------|
| 1 | Mandvo (માંડવો)  | 28 Jan | 9:00 AM  | Green           |
| 2 | Haldi (હળદી)     | 28 Jan | 11:00 AM | Purple / Violet |
| 3 | Sanji (સાંજી)    | 28 Jan | 7:00 PM  | Open theme      |
| 4 | Lagan (લગ્ન)     | 29 Jan | 7:00 PM  | Open theme      |

Venue: **OTB Rajkot**, Nyari Dam 1 Road, Kalavad Road, Rajkot, Gujarat 360005.

## Highlights

- **One continuous scroll** — the fixed backdrop colour morphs between event
  palettes (green → purple → black/gold → rose) so there is no hard break
  between sections.
- **3D scroll choreography** — each event card tilts in from deep perspective
  (GSAP ScrollTrigger scrub) with a shine sweep, letter-cascade headings and
  parallax inside the arch frame.
- **Themed particle engine** — canvas particles switch with the active event:
  marigold petals (hero), white flowers (Mandvo), purple petals + turmeric
  specks (Haldi), golden bokeh (Sanji), rose petals (Lagan).
- **Buttery smooth scrolling** via Lenis, live countdown, section progress
  dots, and a Get Directions link to the venue.
- **Cinematic 4K artwork** (3072×5504) generated with Higgsfield AI
  (Nano Banana Pro), one bespoke scene per event.
- **Fully self-contained** — GSAP, Lenis and all fonts (including the Gujarati
  Baloo Bhai 2 subset) are vendored locally; no CDN required.
- Respects `prefers-reduced-motion` and degrades gracefully if JS fails.

## Run

Static site — open `index.html` or serve the folder:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```
