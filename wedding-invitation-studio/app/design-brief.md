# Design brief — Amee ♥ Ridham Invitation Studio

## Design read
A private wedding-operations tool for one couple (Gujarati wedding, Rajkot, Jan 2027): the groom
uploads a guest sheet and ships personalized bilingual invitation PDFs over WhatsApp — the register
is ceremonial-warm but operationally calm.

## Concept spine
**"The stationer's desk."** The site is a master stationer's worktable: the heirloom pichhwai
invitation suite lies on the desk (hero), and below it the tools of the trade — the guest ledger,
the proofing loupe (live preview), the dispatch tray (WhatsApp). Every section is a drawer of the
same desk, not a SaaS dashboard.

## Delivery tier
`editorial` — this is a working tool; typography + the generated pichhwai suite carry the wow.
Micro-motion only (soft reveals on mount, hover lifts, progress shimmer). The Tier-1 moment is the
**live invitation proof**: the actual canvas-rendered invitation pages of the suite, page-flippable,
re-rendered live from real guest data — interactive, user-driven, and the literal product.

## Locked palette
- `#F7F1E5` parchment (ground) — the paper of the suite itself
- `#233D35` deep pichhwai green (ink/primary text)
- `#8C6A2F` antique gold (rules, ornament, accents)
- `#A44A3F` madder red (CTAs/ticks — the wedding-card kanku red)
- `#5E7D74` sage (secondary text, borders)
Defense: lifted directly from the generated pichhwai artwork so panel chrome and invitation read as
one printed object; warm parchment + green ink is the ledger-book register, distinct from any
graphite/neon or beige/brass ban family.

## Locked type
- Display/headings: **Cormorant Garamond** (600/500 + italic) — engraved stationery serif; brand
  justification: the product IS stationery.
- UI/body: **Figtree** (400/500/600) — quiet humanist grotesk for table/form chrome.
- Script accents: **Great Vibes** — invitation name flourishes only, never UI.
- Gujarati: **Noto Serif Gujarati** (400/600/700) — invitation pages + Gujarati UI strings.

## Tier-1 technique
`interactive-artifact` (catalog family: canvas/pixel): the hero proof is a real-time canvas render
of the guest's personalized invitation — scrubbing through pages and switching guest/language
re-paints the artifact. It enacts the spine: the desk's centerpiece is the living proof sheet.

## Section plan (single route `/` + `/studio` panel)
1. Hero — suite cover art + monogram + one-line purpose + CTA into the studio (family: split
   editorial hero).
2. Studio: Upload drawer — Excel template download + dropzone (family: framed panel).
3. Studio: Guest ledger — parsed table, validation, per-guest actions (family: ledger table).
4. Studio: Proof loupe — live page-flip preview per guest EN/GU (family: artifact viewer).
5. Studio: Dispatch — WhatsApp send queue + status (family: action rail).
6. Settings drawer — family names, blessing lists, optional WhatsApp Cloud API (family: form sheet).
Eyebrow budget: 2.

## Asset plan (all Higgsfield-generated, committed to app/public/assets)
- 7 invitation page plates 9:16 @2k: cover, interior, mandvo, haldi, sanji, marriage, family.
- Monogram medallion 1:1 (favicon + hero seal).
- 3:2 studio banner (hero + OG/marketplace cover).
- Boards: 2 refs (hero+upload, ledger+proof) in refs/.

## CTA inventory
- **"Open the studio"** (hero): parchment capsule, gold hairline, red wax-seal dot that presses on
  hover.
- **"Download template"**: ghost ledger-line button, gold underline draws on hover.
- **"Generate PDFs"**: madder-red fill, paper-fold corner, progress shimmer while rendering.
- **"Send on WhatsApp"** (per row): green-ink outline chip with WhatsApp glyph, fills on hover.
Each is its own component; no shared button utility.

## Copy rules
Ceremonial-warm, plain sentences, no em-dashes, no lorem. Gujarati strings proofread as real
Gujarati, not transliteration.
