# Amee ♥ Ridham — Wedding Invitation Studio

**Live app: https://amee-ridham-invites.higgsfield.app**

A personal admin panel that turns one Excel guest sheet into a personalized wedding
invitation PDF for every guest — in **English or Gujarati** — and dispatches each one on
**WhatsApp**.

Wedding: **Amee ♥ Ridham · 28 & 29 January 2027 · OTB, Nyari Dam 1 Road, Kalavad Road, Rajkot**
(details taken from https://amee-ridham-wedding.higgsfield.app/).

## What each guest receives

A multi-page PDF (1080 x 1920, phone-friendly), built from AI-generated pichhwai artwork:

1. **Cover** — "To, `<guest name>`" personalized (Mr. / Mr. & Mrs. / `<name>` & Family), the
   A♥R monogram, couple names and dates.
2. **Invitation page** — blessing text with both sets of parents' names.
3. **One page per event the guest is invited to** — Mandvo (માંડવો), Haldi (હળદી),
   Sanji (સાંજી), Marriage (લગ્ન) — each with the ☐ MR. ☐ MR. & MRS. ☑ FAMILY row ticked
   for that guest, date, time, venue and a tappable "View Location" map link.
4. **Family page** — "Awaiting your presence" (દર્શનાભિલાષી) name lists (placeholder names
   for now — editable in Settings on the live site).

## The Excel sheet

Download the template from the app ("Download Excel template"), or see
`sample-data/Amee_Ridham_Guest_List_Sample.xlsx`. Columns:

| Column | Values |
|---|---|
| Name | as printed on the card |
| Phone | 10-digit WhatsApp number (or with +91) |
| Invite For | `1`/`mr` = Mr. · `2`/`mr & mrs` = couple · `all`/`family` = whole family |
| Language | `english` / `gujarati` (also `en`/`gu`) |
| Events | `all`, or list: `mandvo, haldi, sanji, marriage` (numbers 1-4 also work) |
| PDF Name | optional custom file name |

## WhatsApp sending — three modes

1. **Phone**: the WhatsApp button opens the native share sheet with the PDF attached.
2. **Desktop**: opens the guest's chat on WhatsApp Web with the personalized message
   pre-typed and downloads the PDF beside it to drag into the chat.
3. **Fully automatic** (optional): paste Meta WhatsApp Business Cloud API credentials
   (phone number ID + permanent token) into Settings and the button uploads + delivers
   each PDF automatically from the registered number — no clicks in WhatsApp at all.

Guest list, sent/pending status and wedding settings persist in the app's database (D1).

## Tech

- React 19 + TanStack Start, server-rendered on a Cloudflare Worker (Higgsfield hosting).
- PDF pages painted on `<canvas>` (correct Gujarati shaping via Noto Serif Gujarati),
  assembled with jsPDF; Excel parsing with SheetJS; bulk ZIP export with JSZip.
- Artwork generated with Higgsfield (nano banana pro), fonts self-hosted
  (Cormorant Garamond, Great Vibes, Noto Serif Gujarati, Figtree).
- Source lives in `app/` — `bun install && bun run dev` to run locally.

## Editing content

- Family name lists, marriage muhurat time and WhatsApp API keys: **Settings drawer in the
  live app** (persisted in the database).
- Couple/parents names, venue, event dates/times/taglines: `app/src/lib/invite/wedding-data.ts`.
- Page layouts: `app/src/lib/invite/renderer.ts`.
