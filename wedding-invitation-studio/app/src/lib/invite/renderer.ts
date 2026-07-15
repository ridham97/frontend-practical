// Canvas painters for the invitation pages. All pages are laid out on a
// 1080 x 1920 logical grid and rendered at `scale` for print sharpness.
// Browser text shaping handles Gujarati conjuncts natively. Every text block
// shrinks-to-fit or wraps inside a hand-measured safe window per artwork so
// nothing collides with the illustration.
import type { EventKey, Guest, Lang, WeddingSettings } from "./types";
import { ASSETS, EVENT_BG, TEXTS, coupleNames, guestLine } from "./wedding-data";

export const PAGE_W = 1080;
export const PAGE_H = 1920;

export const INK = "#233D35";
export const GOLD = "#8C6A2F";
export const RED = "#A44A3F";
export const SAGE = "#5E7D74";
export const CREAM = "#FBF6EA";

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let cached = imageCache.get(src);
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load " + src));
      img.src = src;
    });
    imageCache.set(src, cached);
  }
  return cached;
}

let fontsReady: Promise<void> | null = null;

/** Register the invitation fonts with the document before painting. */
export function ensureFonts(): Promise<void> {
  if (fontsReady) return fontsReady;
  const faces: Array<[string, string, string, string]> = [
    ["Cormorant Garamond", "/assets/fonts/CormorantGaramond-500.ttf", "500", "normal"],
    ["Cormorant Garamond", "/assets/fonts/CormorantGaramond-600.ttf", "600", "normal"],
    ["Cormorant Garamond", "/assets/fonts/CormorantGaramond-700.ttf", "700", "normal"],
    ["Cormorant Garamond", "/assets/fonts/CormorantGaramond-500i.ttf", "500", "italic"],
    ["Great Vibes", "/assets/fonts/GreatVibes-400.ttf", "400", "normal"],
    ["Noto Serif Gujarati", "/assets/fonts/NotoSerifGujarati-400.ttf", "400", "normal"],
    ["Noto Serif Gujarati", "/assets/fonts/NotoSerifGujarati-600.ttf", "600", "normal"],
    ["Noto Serif Gujarati", "/assets/fonts/NotoSerifGujarati-700.ttf", "700", "normal"],
  ];
  fontsReady = Promise.all(
    faces.map(([family, url, weight, style]) => {
      const face = new FontFace(family, `url(${url})`, { weight, style });
      return face.load().then((loaded) => {
        document.fonts.add(loaded);
      });
    }),
  ).then(() => undefined);
  return fontsReady;
}

interface Painter {
  ctx: CanvasRenderingContext2D;
  lang: Lang;
}

type FontOpts = { weight?: string; italic?: boolean; family?: "serif" | "script" | "gujarati" };

function font(p: Painter, size: number, opts?: FontOpts) {
  const family =
    opts?.family === "script"
      ? "'Great Vibes'"
      : opts?.family === "gujarati" || (p.lang === "gujarati" && opts?.family !== "serif")
        ? "'Noto Serif Gujarati'"
        : "'Cormorant Garamond'";
  p.ctx.font = `${opts?.italic ? "italic " : ""}${opts?.weight ?? "500"} ${size}px ${family}, serif`;
}

/** Set the font, shrinking the size until `text` fits within maxWidth. */
function fitFont(p: Painter, size: number, text: string, maxWidth: number, opts?: FontOpts): number {
  let s = size;
  font(p, s, opts);
  while (s > 20 && p.ctx.measureText(text).width > maxWidth) {
    s -= 2;
    font(p, s, opts);
  }
  return s;
}

function setTracking(p: Painter, px: number) {
  (p.ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
}

/** Draw one centered line, shrunk to fit maxWidth (default: safe column). */
function center(p: Painter, text: string, y: number, color: string, tracking = 0, maxWidth = 900) {
  p.ctx.save();
  p.ctx.fillStyle = color;
  p.ctx.textAlign = "center";
  p.ctx.textBaseline = "alphabetic";
  if (tracking) setTracking(p, tracking);
  if (p.ctx.measureText(text).width > maxWidth) {
    // shrink in place without losing the caller's font shorthand
    const parts = p.ctx.font.match(/(\d+(?:\.\d+)?)px/);
    if (parts) {
      let size = parseFloat(parts[1]);
      while (size > 20 && p.ctx.measureText(text).width > maxWidth) {
        size -= 2;
        p.ctx.font = p.ctx.font.replace(/(\d+(?:\.\d+)?)px/, `${size}px`);
      }
    }
  }
  p.ctx.fillText(text, PAGE_W / 2, y);
  p.ctx.restore();
  if (tracking) setTracking(p, 0);
}

/** Wrap text to maxWidth, draw centered lines, return y of the LAST drawn line. */
function centerWrapped(p: Painter, text: string, y: number, color: string, maxWidth: number, lineHeight: number): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const probe = line ? line + " " + word : word;
    if (p.ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  let cursor = y;
  for (const l of lines) {
    center(p, l, cursor, color, 0, maxWidth + 40);
    cursor += lineHeight;
  }
  return cursor - lineHeight;
}

function hairline(p: Painter, x1: number, x2: number, y: number, color = GOLD, width = 2) {
  p.ctx.save();
  p.ctx.strokeStyle = color;
  p.ctx.lineWidth = width;
  p.ctx.beginPath();
  p.ctx.moveTo(x1, y);
  p.ctx.lineTo(x2, y);
  p.ctx.stroke();
  p.ctx.restore();
}

/** Small diamond ornament flanked by hairlines. */
function ornamentRule(p: Painter, y: number, color = GOLD, halfSpan = 150) {
  const cx = PAGE_W / 2;
  hairline(p, cx - halfSpan, cx - 18, y, color);
  hairline(p, cx + 18, cx + halfSpan, y, color);
  p.ctx.save();
  p.ctx.fillStyle = color;
  p.ctx.translate(cx, y);
  p.ctx.rotate(Math.PI / 4);
  p.ctx.fillRect(-5.5, -5.5, 11, 11);
  p.ctx.restore();
}

function drawBackground(p: Painter, img: HTMLImageElement) {
  const scale = Math.max(PAGE_W / img.width, PAGE_H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  p.ctx.drawImage(img, (PAGE_W - w) / 2, (PAGE_H - h) / 2, w, h);
}

/**
 * The Mr / Mr & Mrs / Family selection row. Printed ONCE per invitation, on
 * the cover, with the guest's option ticked.
 */
function checkboxRow(p: Painter, y: number, guest: Guest) {
  const labels =
    p.lang === "gujarati"
      ? [
          { key: "mr", label: "શ્રી" },
          { key: "mrmrs", label: "શ્રી તથા શ્રીમતી" },
          { key: "family", label: "સહપરિવાર" },
        ]
      : [
          { key: "mr", label: "MR." },
          { key: "mrmrs", label: "MR. & MRS." },
          { key: "family", label: "FAMILY" },
        ];
  const ctx = p.ctx;
  const box = 27;
  const gap = 12;
  const groupGap = 46;

  font(p, p.lang === "gujarati" ? 31 : 29, { weight: "600", family: p.lang === "gujarati" ? "gujarati" : "serif" });
  if (p.lang === "english") setTracking(p, 2);
  const widths = labels.map((l) => ctx.measureText(l.label).width + box + gap);
  const total = widths.reduce((a, b) => a + b, 0) + groupGap * (labels.length - 1);
  let x = (PAGE_W - total) / 2;

  labels.forEach((l, i) => {
    const boxY = y - box + 6;
    ctx.save();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, boxY, box, box);
    if (guest.inviteType === l.key) {
      ctx.strokeStyle = RED;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 6, boxY + box / 2 + 2);
      ctx.lineTo(x + box / 2 - 2, boxY + box - 6);
      ctx.lineTo(x + box + 7, boxY - 5);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(l.label, x + box + gap, y);
    ctx.restore();
    x += widths[i] + groupGap;
  });
  if (p.lang === "english") setTracking(p, 0);
}

function makeCanvas(scale: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(PAGE_W * scale);
  canvas.height = Math.round(PAGE_H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

export interface PageLink {
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
}

export interface RenderedPage {
  canvas: HTMLCanvasElement;
  links: PageLink[];
}

// ---------------------------------------------------------------------------
// Page 1 — Cover (peacock arch art). Clean center column ~ y 400-1470.
// Carries the guest line AND the single salutation selection row.
// ---------------------------------------------------------------------------
async function paintCover(guest: Guest, settings: WeddingSettings, scale: number): Promise<RenderedPage> {
  const lang = guest.language;
  const [bg, monogram] = await Promise.all([loadImage(ASSETS.cover), loadImage(ASSETS.monogram)]);
  const { canvas, ctx } = makeCanvas(scale);
  const p: Painter = { ctx, lang };

  drawBackground(p, bg);

  // Guest address line
  font(p, 31, { italic: lang === "english", weight: "600" });
  center(p, lang === "gujarati" ? TEXTS.toGu : TEXTS.toEn, 442, SAGE);
  const line = guestLine(guest.name, guest.inviteType, lang);
  fitFont(p, lang === "gujarati" ? 48 : 54, line, 620, { weight: "600" });
  center(p, line, 518, RED, 0, 640);
  const lw = Math.min(ctx.measureText(line).width + 80, 680);
  hairline(p, (PAGE_W - lw) / 2, (PAGE_W + lw) / 2, 548, GOLD, 2);

  // The one salutation selection row for the whole PDF
  checkboxRow(p, 625, guest);

  // Monogram seal
  const mSize = 190;
  const mCy = 800;
  ctx.save();
  ctx.beginPath();
  ctx.arc(PAGE_W / 2, mCy, mSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(monogram, (PAGE_W - mSize) / 2, mCy - mSize / 2, mSize, mSize);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(PAGE_W / 2, mCy, mSize / 2 + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  font(p, 33, { weight: "600" });
  center(p, lang === "gujarati" ? TEXTS.weddingOfGu : TEXTS.weddingOfEn.toUpperCase(), 972, SAGE, lang === "gujarati" ? 0 : 7);

  const [first, second] = coupleNames(settings, lang);
  if (lang === "gujarati") {
    fitFont(p, 104, first, 780, { weight: "700", family: "gujarati" });
    center(p, first, 1090, INK);
    font(p, 44, { weight: "500" });
    center(p, "♥", 1152, RED);
    fitFont(p, 104, second, 780, { weight: "700", family: "gujarati" });
    center(p, second, 1268, INK);
  } else {
    fitFont(p, 130, first, 780, { family: "script" });
    center(p, first, 1098, INK);
    font(p, 44, { weight: "500", family: "serif" });
    center(p, "♥", 1152, RED);
    fitFont(p, 130, second, 780, { family: "script" });
    center(p, second, 1272, INK);
  }

  ornamentRule(p, 1330);
  font(p, 37, { weight: "600" });
  center(p, lang === "gujarati" ? settings.datesGu : settings.datesEn, 1390, GOLD, lang === "gujarati" ? 0 : 2, 800);
  font(p, 29, { weight: "500" });
  center(
    p,
    lang === "gujarati" ? settings.venueNameGu + " · " + settings.cityGu : settings.venueNameEn + " · " + settings.cityEn,
    1438,
    SAGE,
    0,
    800,
  );

  return { canvas, links: [] };
}

// ---------------------------------------------------------------------------
// Page 2 — Invitation text (interior art). Clear inside double border.
// ---------------------------------------------------------------------------
async function paintInvitation(guest: Guest, settings: WeddingSettings, scale: number): Promise<RenderedPage> {
  const lang = guest.language;
  const bg = await loadImage(ASSETS.interior);
  const { canvas, ctx } = makeCanvas(scale);
  const p: Painter = { ctx, lang };
  void ctx;
  drawBackground(p, bg);

  font(p, 33, { weight: "600" });
  center(p, lang === "gujarati" ? TEXTS.ganeshGu : TEXTS.ganeshEn, 255, RED, 2);

  if (lang === "gujarati") {
    font(p, 82, { weight: "700", family: "gujarati" });
    center(p, TEXTS.invitationGu, 425, GOLD);
  } else {
    font(p, 98, { family: "script" });
    center(p, TEXTS.invitationEn, 435, GOLD);
  }
  ornamentRule(p, 495);

  font(p, lang === "gujarati" ? 35 : 38, { weight: "500", italic: lang === "english" });
  centerWrapped(p, lang === "gujarati" ? settings.blessingGu : settings.blessingEn, 590, INK, 760, lang === "gujarati" ? 62 : 56);

  // Couple, in the chosen order, with matching parent lines
  const firstIsBride = settings.brideFirst;
  const firstName = lang === "gujarati" ? (firstIsBride ? settings.brideGu : settings.groomGu) : firstIsBride ? settings.brideEn : settings.groomEn;
  const secondName = lang === "gujarati" ? (firstIsBride ? settings.groomGu : settings.brideGu) : firstIsBride ? settings.groomEn : settings.brideEn;
  const firstParents = lang === "gujarati" ? (firstIsBride ? settings.brideParentsGu : settings.groomParentsGu) : firstIsBride ? settings.brideParentsEn : settings.groomParentsEn;
  const secondParents = lang === "gujarati" ? (firstIsBride ? settings.groomParentsGu : settings.brideParentsGu) : firstIsBride ? settings.groomParentsEn : settings.brideParentsEn;

  if (lang === "gujarati") {
    fitFont(p, 92, "ચિ. " + firstName, 800, { weight: "700", family: "gujarati" });
    center(p, "ચિ. " + firstName, 905, RED);
    font(p, 34, { weight: "500" });
    center(p, firstParents, 972, INK, 0, 840);
    font(p, 46, { weight: "600" });
    center(p, TEXTS.withGu, 1065, SAGE);
    fitFont(p, 92, "ચિ. " + secondName, 800, { weight: "700", family: "gujarati" });
    center(p, "ચિ. " + secondName, 1185, RED);
    font(p, 34, { weight: "500" });
    center(p, secondParents, 1252, INK, 0, 840);
  } else {
    fitFont(p, 125, firstName, 800, { family: "script" });
    center(p, firstName, 920, RED);
    font(p, 34, { weight: "500" });
    center(p, firstParents, 975, INK, 0, 840);
    font(p, 54, { italic: true });
    center(p, TEXTS.withEn, 1065, SAGE);
    fitFont(p, 125, secondName, 800, { family: "script" });
    center(p, secondName, 1190, RED);
    font(p, 34, { weight: "500" });
    center(p, secondParents, 1250, INK, 0, 840);
  }

  ornamentRule(p, 1325);
  font(p, 42, { weight: "600" });
  center(p, lang === "gujarati" ? settings.datesGu : settings.datesEn, 1392, GOLD, 0, 820);
  font(p, 33, { weight: "500" });
  center(
    p,
    lang === "gujarati" ? settings.venueNameGu + ", " + settings.cityGu : settings.venueNameEn + ", " + settings.cityEn,
    1445,
    INK,
    0,
    820,
  );

  font(p, lang === "gujarati" ? 31 : 33, { weight: "500", italic: lang === "english" });
  centerWrapped(p, lang === "gujarati" ? settings.poemGu : settings.poemEn, 1535, SAGE, 740, lang === "gujarati" ? 52 : 48);

  return { canvas, links: [] };
}

// ---------------------------------------------------------------------------
// Event pages — one shared theme, uniform layout, per-art vertical anchor.
// ---------------------------------------------------------------------------
/** y of the event title baseline per artwork (tuned to each art's clean band). */
const EVENT_TITLE_Y: Record<EventKey, number> = {
  mandvo: 640,
  haldi: 620,
  sanji: 640,
  marriage: 500,
};

async function paintEvent(guest: Guest, key: EventKey, settings: WeddingSettings, scale: number): Promise<RenderedPage> {
  const lang = guest.language;
  const info = settings.events[key];
  const bg = await loadImage(EVENT_BG[key]);
  const { canvas, ctx } = makeCanvas(scale);
  const p: Painter = { ctx, lang };

  drawBackground(p, bg);

  // Title
  let y = EVENT_TITLE_Y[key];
  if (lang === "gujarati") {
    fitFont(p, 108, info.titleGu, 800, { weight: "700", family: "gujarati" });
    center(p, info.titleGu, y, RED);
  } else {
    fitFont(p, 128, info.titleEn, 800, { family: "script" });
    center(p, info.titleEn, y, RED);
    if (info.titleGu.trim()) {
      font(p, 38, { weight: "600", family: "gujarati" });
      center(p, info.titleGu, y + 64, GOLD);
      y += 64;
    }
  }

  // Tagline
  font(p, lang === "gujarati" ? 33 : 35, { weight: "500", italic: lang === "english" });
  center(p, lang === "gujarati" ? info.taglineGu : info.taglineEn, y + 62, SAGE, 0, 800);
  y += 62;

  // Date + time
  font(p, 44, { weight: "600" });
  center(p, lang === "gujarati" ? info.dateGu : info.dateEn, y + 96, INK, 0, 820);
  font(p, 38, { weight: "600" });
  center(p, lang === "gujarati" ? info.timeGu : info.timeEn, y + 158, GOLD, 0, 820);
  y += 158;

  // Venue
  ornamentRule(p, y + 66);
  font(p, 40, { weight: "600" });
  center(p, lang === "gujarati" ? settings.venueNameGu : settings.venueNameEn, y + 132, INK, 0, 820);
  font(p, 29, { weight: "500" });
  const lastAddr = centerWrapped(p, lang === "gujarati" ? settings.venueAddressGu : settings.venueAddressEn, y + 182, INK, 720, 44);

  // Clickable map link
  const pinY = lastAddr + 64;
  font(p, 29, { weight: "600" });
  const label = lang === "gujarati" ? TEXTS.viewLocationGu : TEXTS.viewLocationEn;
  center(p, label, pinY, RED);
  const labelW = ctx.measureText(label).width;

  return {
    canvas,
    links: [{ x: (PAGE_W - labelW) / 2 - 24, y: pinY - 38, w: labelW + 48, h: 58, url: settings.mapsUrl || "https://maps.app.goo.gl/YYAmwTaVeNr1HDDB8" }],
  };
}

// ---------------------------------------------------------------------------
// Family page (swan pond art). Clean center ~ y 260-1450.
// ---------------------------------------------------------------------------
async function paintFamily(guest: Guest, settings: WeddingSettings, scale: number): Promise<RenderedPage> {
  const lang = guest.language;
  const bg = await loadImage(ASSETS.family);
  const { canvas, ctx } = makeCanvas(scale);
  const p: Painter = { ctx, lang };
  void ctx;
  drawBackground(p, bg);

  font(p, 33, { weight: "600" });
  center(p, lang === "gujarati" ? TEXTS.ganeshGu : TEXTS.ganeshEn, 275, RED, 2);

  const awaiting = lang === "gujarati" ? settings.awaitingGu : settings.awaitingEn;
  const withLove = lang === "gujarati" ? settings.withLoveGu : settings.withLoveEn;
  const wishes = lang === "gujarati" ? settings.bestWishesGu : settings.bestWishesEn;
  const itemCount = awaiting.length + withLove.length + wishes.length;
  const compact = itemCount > 12;

  let y = compact ? 380 : 415;
  const lineStep = (lang === "gujarati" ? 62 : 57) - (compact ? 6 : 0);
  const sectionGap = compact ? 46 : 60;

  const section = (title: string, items: string[]) => {
    if (!items.length) return;
    if (lang === "english") {
      font(p, 66, { family: "script" });
      center(p, title, y, GOLD);
      y += 76;
    } else {
      font(p, 50, { weight: "700", family: "gujarati" });
      center(p, title, y, GOLD);
      y += 84;
    }
    font(p, lang === "gujarati" ? 35 : 39, { weight: "500" });
    for (const item of items) {
      fitFont(p, lang === "gujarati" ? 35 : 39, item, 760, { weight: "500" });
      center(p, item, y, INK, 0, 780);
      y += lineStep;
    }
    y += sectionGap;
  };

  section(lang === "gujarati" ? TEXTS.awaitingGu : TEXTS.awaitingEn, awaiting);
  section(lang === "gujarati" ? TEXTS.withLoveGu : TEXTS.withLoveEn, withLove);
  section(lang === "gujarati" ? TEXTS.bestWishesGu : TEXTS.bestWishesEn, wishes);

  ornamentRule(p, y);
  font(p, lang === "gujarati" ? 35 : 38, { weight: "600", italic: lang === "english" });
  centerWrapped(p, lang === "gujarati" ? settings.closingGu : settings.closingEn, y + 74, RED, 720, 54);

  return { canvas, links: [] };
}

// ---------------------------------------------------------------------------
// Public API — pages are chosen from the guest's selected events.
// ---------------------------------------------------------------------------
export type PageSpec = { kind: "cover" } | { kind: "invitation" } | { kind: "event"; event: EventKey } | { kind: "family" };

export function pageSpecs(guest: Guest): PageSpec[] {
  return [
    { kind: "cover" },
    { kind: "invitation" },
    ...guest.events.map((event) => ({ kind: "event" as const, event })),
    { kind: "family" },
  ];
}

export async function renderPage(guest: Guest, spec: PageSpec, settings: WeddingSettings, scale = 1): Promise<RenderedPage> {
  await ensureFonts();
  switch (spec.kind) {
    case "cover":
      return paintCover(guest, settings, scale);
    case "invitation":
      return paintInvitation(guest, settings, scale);
    case "event":
      return paintEvent(guest, spec.event, settings, scale);
    case "family":
      return paintFamily(guest, settings, scale);
  }
}
