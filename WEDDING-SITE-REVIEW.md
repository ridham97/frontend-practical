# Amee ♥ Ridham Wedding Site — Deep Animation & Feature Review

Site: https://amee-ridham-wedding.higgsfield.app/
Reviewed: full source (HTML / CSS / JS), all media assets, rendered in headless
Chromium at 1440×900 (desktop) and 390×844 (mobile), every section screenshotted.

Tech found: vanilla HTML/CSS/JS · GSAP 3 + ScrollTrigger (self-hosted) · CSS
scroll-snap paging · canvas 2D particle-burst engine with hand-drawn sprites ·
5 ambient H.264 video loops · background music · countdown.

---

## 1. What is already genuinely good

- **Per-event themed world** — backdrop gradient crossfade (green mandvo, purple
  haldi, gold sanji, maroon lagan) driven by ScrollTrigger is smooth in both
  directions and gives each event its own identity.
- **Canvas burst engine** is the best part of the codebase: hand-drawn sprite
  painters (marigold blossoms, holi powder puffs + splats, firework rockets with
  trails, layered full roses), sprite caching, DPR cap, visibility-pause. This is
  real craft, not a library preset.
- **Choreographed entrances** — splash first, then Gujarati word → letter-by-letter
  3D title → card tilts in from depth → shine sweep → details stagger. Good
  narrative ordering.
- **Mobile layout is strong** — the arch (mandap doorway) video card, typography
  scale and spacing all read beautifully at 390px.
- Correct engineering details: `prefers-reduced-motion` fallback, no-GSAP
  fallback, IntersectionObserver lazy video (`preload="none"` → `auto`),
  visibility-change RAF pause, self-hosted fonts with `unicode-range` splits,
  self-hosted GSAP.

## 2. Bugs / real problems found (fix these first)

### 2.1 Desktop: event date + description are cut off (biggest bug)
At 1440×900 the Mandvo / Haldi / Lagan sections show **no date, time or
description at all** — the `.event` panel is `height:100svh; overflow:hidden` and
the header + card formula (`clamp(230px, 100svh − 430px, 460px)`) leaves no room
for `.event__details`, which silently clips below the fold. Sanji shows the date
half-faded and the description clipped. Guests on laptops never see when each
event happens — the core information of the invitation.

### 2.2 Desktop is a stretched phone layout
`.event__inner { max-width: 430px }` centres a phone column in a 1440px viewport
— ~70% of the screen is empty gradient. Awwwards-level sites design the
breakpoint: e.g. two-column event layout (card left, title + details right,
alternating per event), larger card, or full-bleed video background per event.

### 2.3 `.tilt-card` is dead code — zero hover interactions on desktop
The class exists in HTML and `perspective`/`preserve-3d` are set in CSS, but
there is no pointermove handler anywhere. Desktop has no hover states at all
(cards, dots, buttons barely). The shine element already exists — a
mousemove tilt + moving glare is ~20 lines of GSAP `quickTo`.

### 2.4 Wheel hijack side effects
`window.addEventListener("wheel", e => { e.preventDefault(); … })` with
`passive:false`:
- breaks **Ctrl + wheel browser zoom** (accessibility),
- fights inertial trackpads (one flick can queue odd paging),
- `Math.round(scrollY / innerHeight)` assumes panels are exactly
  `innerHeight` tall — `100svh` ≠ `window.innerHeight` in several
  mobile/desktop-chrome situations.
Native `scroll-snap` already does the job; if one-gesture-one-page is wanted,
gate only large deltas and exempt `e.ctrlKey`. (Or switch to Lenis — the JS
header comment already claims Lenis but it is not actually used.)

### 2.5 No WhatsApp / social preview, no favicon
There are **zero Open Graph / Twitter tags and no favicon**. A wedding invite
lives or dies on WhatsApp sharing — right now the shared link shows a bare URL
with no photo of the couple, no date. Add `og:title`, `og:description`,
`og:image` (1200×630 card with names + date), `theme-color` exists already,
plus a favicon/apple-touch-icon (the A♥R monogram already designed in the
loader is the obvious icon).

### 2.6 Posters are heavier than the videos (performance)
Every poster JPEG is **3072×5504 px, 1.4–2.6 MB (≈10 MB total)** — while each
video loop is only ~0.85–1.5 MB. The hero poster (1.46 MB progressive JPEG) is
the LCP image. Fixes: export posters at ≤1080w as WebP/AVIF (~60–120 KB each),
ideally grab them from the video's first frame so poster→video is seamless,
`<link rel="preload">` the hero poster, add explicit dimensions.

### 2.7 Smaller items
- Loader enforces a **1.4 s minimum wait** even when everything is cached —
  feels slow on repeat visits; 0.6–0.8 s is enough.
- **5 font families / 15 woff2 files**; Great Vibes and Dancing Script are two
  overlapping script faces — dropping one saves requests and tightens the
  design system.
- Music tries to autoplay (usually blocked); an intentional entry gate (below)
  solves this elegantly instead of relying on the first random tap.

## 3. Animation upgrades to reach awwwards level

Ordered roughly by impact-per-effort.

### A. "Open the invitation" entry gate ⭐ top pick
Replace the passive loader with an interactive cover: a closed envelope /
mandap door with the A♥R monogram wax seal — user taps **"Open Invitation"**,
the seal breaks, doors/flaps open (clip-path or 3D rotateY), hero video fades
in behind, **and the tap legitimately unlocks the background music**. This is
the signature pattern of premium digital wedding invites and fixes the
autoplay problem at the same time.

### B. Scroll-scrubbed storytelling (the core awwwards pattern)
Today almost everything is *triggered* (plays once on enter); only the hero
parallax is scrubbed. Pin each event section (`ScrollTrigger pin + scrub`) over
~180vh so scrolling itself drives the sequence: title letters resolve → card
rises from depth → details settle → burst fires at the peak. Scrubbing makes the
page feel "hand-cranked" rather than "video that plays at you" — that is the
single biggest feel difference vs. sites like lusion.co / activetheory.net
winners.

### C. A drawn "journey thread" connecting the events
A golden SVG vine/thread (matches the existing knot-and-heart motif in the
Blessings section) that draws itself along scroll (`stroke-dashoffset` scrub)
from Mandvo 01 → Lagan 04, with the event number nodes lighting up as you pass.
Gives the four events a narrative spine and fills the empty desktop margins.

### D. Micro-interactions (desktop feel)
- **Implement the card tilt**: pointermove → `rotateX/rotateY` (±6°) with the
  existing `event__card-shine` following the cursor as glare; on mobile use
  `deviceorientation` for a subtle gyro tilt.
- **Magnetic button** on "Get Directions" (translate toward cursor within 40px).
- **Countdown flip/roll** — animate digit changes (y-slide mask or rotateX
  flip) instead of instant text swap; the seconds cell becomes a heartbeat.
- Dots nav: show the `data-label` on hover, animate the active dot with a ring
  draw.
- Custom cursor (small gold dot + trailing ring, `mix-blend-mode: difference`)
  — cheap and instantly "awwwards".

### E. Ambient life between bursts
The bursts are great but last ~2 s; after that screens are static. Add a very
low-density ambient layer per theme (the engine already supports it): 6–8
drifting marigold petals on mandvo, floating bokeh fireflies on sanji, slow
rose petals on lagan, faint incense smoke wisp on haldi. Plus a subtle
film-grain overlay for cinematic texture.

### F. Section transitions with shape
The backdrop crossfade is smooth but shapeless. An **arch-shaped clip-path
wipe** (the mandap doorway silhouette expanding from the card) when a new event
takes over would rhyme with the card's arch frame. GSAP can scrub
`clip-path: ellipse/inset` cheaply.

### G. Text reveals
Names and titles currently fade/slide. Masked line reveals
(`overflow:hidden` parent, text slides up from behind the mask) and per-letter
splits for "Amee & Ridham" with a slight rotation — the hero already splits
event titles into `<span>`s, so the mechanism exists; apply it to the hero
names + a gold gradient shimmer sweep timed after the reveal.

### H. Three.js / WebGL tier (only if you want to go further)
The current audience (wedding guests, mid-range phones) argues for restraint,
but tasteful options:
- **WebGL silk/curtain shader** as the hero background (slow cloth wave, à la
  threejs.org shader examples) instead of a flat veil.
- **Particle names**: "Amee & Ridham" assembling from ~2k gold particles then
  dispersing on scroll.
- **Displacement transition** between event backdrops (ripple/ink-bleed via a
  displacement texture — the classic hover-distortion effect).
Keep it to one WebGL moment (hero); everything else stays GSAP/canvas for
performance.

## 4. AI video (Higgsfield) — specific improvements

- **Blessings + Venue sections have no video at all** — they are flat gradient
  screens (weakest visuals on the site). Generate ambient loops: floating diyas
  / soft temple garland breeze for Blessings; a dusk aerial-style loop of a
  wedding lawn for Venue.
- **Loop seams**: some loops show a visible jump at restart. Regenerate with
  seamless-loop prompts or crossfade the last 0.5 s into the first.
- **Portrait-only crops**: videos are ~1292px-wide portrait crops shown in a
  4:5 arch on desktop too. Generate landscape variants (reframe tool) and swap
  by media query, or go full-bleed video background per event on desktop —
  fixes issue 2.2 in one move.
- **Hero cinematic**: current hero is a subtle ambient loop. A 6–8 s
  slow-motion cinematic (camera push through garlands into the mandap) upscaled
  to 2K for desktop would give a real "film title" opening under the names.
- **Couple story section**: an AI-assisted "our story" strip (photos → short
  animated clips) between Blessings and Mandvo is the most-loved feature on
  premium invites.

## 5. Missing invite features (product, not animation)

1. **RSVP** — name + attending + guest count (the Higgsfield website DB can
   store submissions). Even a WhatsApp deep-link "RSVP on WhatsApp" button
   (`wa.me/<number>?text=...`) is better than nothing.
2. **Add to Calendar** — per-event `.ics` + Google Calendar links (guests will
   forget 28 vs 29 Jan otherwise).
3. **Map preview** — a static map image next to "Get Directions".
4. **Share button** — Web Share API (`navigator.share`) + the OG tags from 2.5.
5. **Gallery / story timeline** of the couple.
6. **Guest wishes wall** — leave a blessing, shown as floating cards.
7. **Language toggle** — full ગુજરાતી version, not just accent phrases.
8. Itinerary details: dress code per event, hashtag (#AmeeRidham), contact.

## 6. Quick performance checklist

| Item | Now | Target |
|---|---|---|
| Poster images | 3072×5504 JPEG, 1.4–2.6 MB each | ≤1080w WebP/AVIF, 60–150 KB |
| Hero LCP | 1.46 MB poster, no preload | preload + compressed poster |
| Fonts | 5 families, 15 files | 3 families (drop Great Vibes or Dancing Script, maybe Marcellus→Cormorant caps) |
| Loader min wait | 1.4 s forced | ≤0.8 s, skip when cached |
| OG/favicon | none | og:image card + monogram favicon |
| Videos | ~1 MB H.264 loops, lazy ✅ | keep; add landscape desktop variants |

## 7. Reference patterns to study

- **Awwwards scroll craft**: lusion.co, activetheory.net, cuberto.com — pinned
  scrub scenes, custom cursor, magnetic elements, one WebGL hero moment.
- **Lenis smooth scroll** (studio-freight/lenis) + GSAP ScrollTrigger — the
  de-facto awwwards stack; the code comment already names it, so finish the
  thought.
- **threejs.org examples** — `webgl_shader` cloth/silk backgrounds,
  displacement-map transitions, instanced particles for particle-text.
- **Premium digital invite pattern**: sealed-envelope entry gate → music →
  story → events → RSVP; the entry gate is the single most recognisable
  "expensive invite" signal.

## Suggested priority order

1. Fix desktop clipped event details (bug) + desktop two-column event layout
2. OG tags + favicon + compressed posters (shareability + speed, one evening)
3. "Open Invitation" entry gate (unlocks music properly, huge perceived value)
4. Card tilt + countdown flip + dots labels + magnetic button (micro-interactions)
5. Pinned scroll-scrub event scenes + journey thread
6. Ambient particles between bursts + arch wipe transitions
7. AI video for Blessings/Venue + landscape desktop variants + story section
8. RSVP + Add-to-Calendar + share
9. (Optional) one WebGL hero moment
