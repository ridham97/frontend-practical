// Canvas painters for the invitation pages. All pages are laid out on a
// 1080 x 1920 logical grid and rendered at `scale` for print sharpness.
// Browser text shaping handles Gujarati conjuncts natively. Text zones are
// hand-measured against each generated artwork so type never collides with
// the illustration.
import type { EventKey, Guest, Lang, WeddingSettings } from "./types";
import {
  ASSETS,
  COUPLE,
  EVENTS,
  TEXTS,
  VENUE,
  guestLine,
} from "./wedding-data";

export const PAGE_W = 1080;
export const PAGE_H = 1920;

export const INK = "#233D35";
export const GOLD = "#8C6A2F";
export const RED = "#A44A3F";
export const SAGE = "#5E7D74";
export const CREAM = "#FBF6EA";
const NIGHT_GOLD = "#E8C97D";
const NIGHT_SOFT = "#D7DCF0";

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
  while (s > 22 && p.ctx.measureText(text).width > maxWidth) {
    s -= 2;
    font(p, s, opts);
  }
  return s;
}

function setTracking(p: Painter, px: number) {
  (p.ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
}

function center(p: Painter, text: string, y: number, color: string, tracking = 0) {
  p.ctx.save();
  p.ctx.fillStyle = color;
  p.ctx.textAlign = "center";
  p.ctx.textBaseline = "alphabetic";
  if (tracking) setTracking(p, tracking);
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
    center(p, l, cursor, color);
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

/** The Mr / Mr & Mrs / Family checkbox row, with the guest's option ticked. */
function checkboxRow(p: Painter, y: number, guest: Guest, dark = false) {
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
  const box = 28;
  const gap = 13;
  const groupGap = 48;
  const ink = dark ? CREAM : INK;

  font(p, p.lang === "gujarati" ? 32 : 30, { weight: "600", family: p.lang === "gujarati" ? "gujarati" : "serif" });
  if (p.lang === "english") setTracking(p, 2);
  const widths = labels.map((l) => ctx.measureText(l.label).width + box + gap);
  const total = widths.reduce((a, b) => a + b, 0) + groupGap * (labels.length - 1);
  let x = (PAGE_W - total) / 2;

  labels.forEach((l, i) => {
    const boxY = y - box + 6;
    ctx.save();
    ctx.strokeStyle = dark ? NIGHT_GOLD : GOLD;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, boxY, box, box);
    if (guest.inviteType === l.key) {
      ctx.strokeStyle = dark ? NIGHT_GOLD : RED;
      ctx.lineWidth = 5.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 6, boxY + box / 2 + 2);
      ctx.lineTo(x + box / 2 - 2, boxY + box - 6);
      ctx.lineTo(x + box + 7, boxY - 5);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = ink;
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
// Page 1 — Cover (peacock arch art). Clean center column ~ y 400-1450.
// ---------------------------------------------------------------------------
async function paintCover(guest: Guest, scale: number): Promise<RenderedPage> {
  const lang = guest.language;
  const [bg, monogram] = await Promise.all([loadImage(ASSETS.cover), loadImage(ASSETS.monogram)]);
  const { canvas, ctx } = makeCanvas(scale);
  const p: Painter = { ctx, lang };

  drawBackground(p, bg);

  // Guest address line
  font(p, 32, { italic: lang === "english", weight: "600" });
  center(p, lang === "gujarati" ? TEXTS.toGu : TEXTS.toEn, 455, SAGE);
  const line = guestLine(guest.name, guest.inviteType, lang);
  fitFont(p, lang === "gujarati" ? 50 : 56, line, 620, { weight: "600" });
  center(p, line, 535, RED);
  const lw = Math.min(ctx.measureText(line).width + 80, 680);
  hairline(p, (PAGE_W - lw) / 2, (PAGE_W + lw) / 2, 565, GOLD, 2);

  // Monogram seal
  const mSize = 200;
  const mCy = 745;
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

  font(p, 34, { weight: "600" });
  center(p, lang === "gujarati" ? TEXTS.weddingOfGu : TEXTS.weddingOfEn.toUpperCase(), 950, SAGE, lang === "gujarati" ? 0 : 7);

  if (lang === "gujarati") {
    font(p, 110, { weight: "700", family: "gujarati" });
    center(p, COUPLE.brideGu, 1075, INK);
    font(p, 46, { weight: "500" });
    center(p, "♥", 1140, RED);
    font(p, 110, { weight: "700", family: "gujarati" });
    center(p, COUPLE.groomGu, 1260, INK);
  } else {
    font(p, 135, { family: "script" });
    center(p, COUPLE.brideEn, 1085, INK);
    font(p, 46, { weight: "500", family: "serif" });
    center(p, "♥", 1140, RED);
    font(p, 135, { family: "script" });
    center(p, COUPLE.groomEn, 1265, INK);
  }

  ornamentRule(p, 1320);
  font(p, 38, { weight: "600" });
  center(p, lang === "gujarati" ? COUPLE.datesGu : COUPLE.datesEn, 1382, GOLD, lang === "gujarati" ? 0 : 2);
  font(p, 30, { weight: "500" });
  center(p, lang === "gujarati" ? VENUE.nameGu + " · " + COUPLE.cityGu : VENUE.nameEn + " · " + COUPLE.cityEn, 1432, SAGE);

  return { canvas, links: [] };
}

// ---------------------------------------------------------------------------
// Page 2 — Invitation text (interior art). Clear inside double border.
// ---------------------------------------------------------------------------
async function paintInvitation(guest: Guest, scale: number): Promise<RenderedPage> {
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
  centerWrapped(p, lang === "gujarati" ? TEXTS.blessingGu : TEXTS.blessingEn, 590, INK, 760, lang === "gujarati" ? 62 : 56);

  if (lang === "gujarati") {
    font(p, 96, { weight: "700", family: "gujarati" });
    center(p, "ચિ. " + COUPLE.brideGu, 905, RED);
    font(p, 35, { weight: "500" });
    center(p, COUPLE.brideParentsGu, 972, INK);
    font(p, 46, { weight: "600" });
    center(p, TEXTS.withGu, 1065, SAGE);
    font(p, 96, { weight: "700", family: "gujarati" });
    center(p, "ચિ. " + COUPLE.groomGu, 1185, RED);
    font(p, 35, { weight: "500" });
    center(p, COUPLE.groomParentsGu, 1252, INK);
  } else {
    font(p, 125, { family: "script" });
    center(p, COUPLE.brideEn, 920, RED);
    font(p, 35, { weight: "500" });
    center(p, COUPLE.brideParentsEn, 975, INK);
    font(p, 54, { italic: true });
    center(p, TEXTS.withEn, 1065, SAGE);
    font(p, 125, { family: "script" });
    center(p, COUPLE.groomEn, 1190, RED);
    font(p, 35, { weight: "500" });
    center(p, COUPLE.groomParentsEn, 1250, INK);
  }

  ornamentRule(p, 1325);
  font(p, 42, { weight: "600" });
  center(p, lang === "gujarati" ? COUPLE.datesGu : COUPLE.datesEn, 1392, GOLD);
  font(p, 33, { weight: "500" });
  center(p, lang === "gujarati" ? VENUE.nameGu + ", " + COUPLE.cityGu : VENUE.nameEn + ", " + COUPLE.cityEn, 1445, INK);

  font(p, lang === "gujarati" ? 31 : 33, { weight: "500", italic: lang === "english" });
  centerWrapped(p, lang === "gujarati" ? TEXTS.poemGu : TEXTS.poemEn, 1535, SAGE, 740, lang === "gujarati" ? 52 : 48);

  return { canvas, links: [] };
}

// ---------------------------------------------------------------------------
// Event pages — hand-measured text windows per artwork.
// ---------------------------------------------------------------------------
interface EventLayout {
  top: number;      // y of the checkbox row
  compact: boolean; // compact = single-line date, tighter rhythm
  dark: boolean;    // indigo night art (sanji)
}

const EVENT_LAYOUTS: Record<EventKey, EventLayout> = {
  mandvo: { top: 500, compact: false, dark: false },
  haldi: { top: 490, compact: false, dark: false },
  sanji: { top: 770, compact: true, dark: true },
  marriage: { top: 385, compact: true, dark: false },
};

async function paintEvent(guest: Guest, key: EventKey, settings: WeddingSettings, scale: number): Promise<RenderedPage> {
  const lang = guest.language;
  const info = EVENTS[key];
  const layout = EVENT_LAYOUTS[key];
  const bg = await loadImage(info.bg);
  const { canvas, ctx } = makeCanvas(scale);
  const p: Painter = { ctx, lang };
  const { dark, compact, top } = layout;

  drawBackground(p, bg);

  const ink = dark ? CREAM : INK;
  const soft = dark ? NIGHT_SOFT : SAGE;
  const accent = dark ? NIGHT_GOLD : GOLD;
  const title = dark ? CREAM : RED;

  checkboxRow(p, top, guest, dark);

  // Title
  let y = top;
  if (lang === "gujarati") {
    font(p, compact ? 96 : 112, { weight: "700", family: "gujarati" });
    center(p, info.titleGu, y + (compact ? 132 : 170), title);
    y += compact ? 132 : 170;
  } else {
    font(p, compact ? 116 : 135, { family: "script" });
    center(p, info.titleEn, y + (compact ? 134 : 175), title);
    y += compact ? 134 : 175;
    font(p, compact ? 37 : 40, { weight: "600", family: "gujarati" });
    center(p, info.titleGu, y + (compact ? 56 : 62), accent);
    y += compact ? 56 : 62;
  }

  // Tagline
  font(p, lang === "gujarati" ? 33 : 35, { weight: "500", italic: lang === "english" });
  center(p, lang === "gujarati" ? info.taglineGu : info.taglineEn, y + (compact ? 54 : 60), soft);
  y += compact ? 54 : 60;

  // Date + time
  const timeText = key === "marriage" ? (lang === "gujarati" ? settings.marriageTimeGu : settings.marriageTimeEn) : lang === "gujarati" ? info.timeGu : info.timeEn;
  if (lang === "gujarati" || compact) {
    const dateText =
      lang === "gujarati"
        ? info.dateGu
        : `${info.weekdayEn.charAt(0) + info.weekdayEn.slice(1).toLowerCase()}, ${info.dayNumber} ${
            info.monthYearEn.charAt(0) + info.monthYearEn.split(" ")[0].slice(1).toLowerCase()
          } ${info.monthYearEn.split(" ")[1]}`;
    font(p, 44, { weight: "600" });
    center(p, dateText, y + (compact ? 88 : 95), ink);
    font(p, 38, { weight: "600" });
    center(p, timeText, y + (compact ? 146 : 160), accent);
    y += compact ? 146 : 160;
  } else {
    // Editorial split date block
    const cx = PAGE_W / 2;
    const blockTop = y + 60;
    ctx.save();
    font(p, 150, { weight: "600" });
    ctx.fillStyle = ink;
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(info.dayNumber, cx - 40, blockTop + 120);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, blockTop + 5);
    ctx.lineTo(cx, blockTop + 135);
    ctx.stroke();
    ctx.textAlign = "left";
    font(p, 40, { weight: "600" });
    setTracking(p, 5);
    ctx.fillText(info.monthYearEn.split(" ")[0], cx + 40, blockTop + 46);
    ctx.fillText(info.monthYearEn.split(" ")[1], cx + 40, blockTop + 94);
    ctx.fillText(info.weekdayEn, cx + 40, blockTop + 140);
    setTracking(p, 0);
    ctx.restore();
    font(p, 40, { weight: "600" });
    center(p, timeText, blockTop + 235, accent, 2);
    y = blockTop + 235;
  }

  // Venue — compact pages skip the ornament rule to stay above the artwork.
  if (!compact) ornamentRule(p, y + 68, accent);
  font(p, compact ? 38 : 40, { weight: "600" });
  center(p, lang === "gujarati" ? VENUE.nameGu : VENUE.nameEn, y + (compact ? 70 : 135), ink);
  font(p, 29, { weight: "500" });
  center(p, lang === "gujarati" ? VENUE.addressGu : VENUE.addressEn, y + (compact ? 118 : 185), dark ? NIGHT_SOFT : INK);

  const pinY = y + (compact ? 176 : 250);
  font(p, 29, { weight: "600" });
  const label = lang === "gujarati" ? "📍 લોકેશન જુઓ" : "📍 View Location";
  center(p, label, pinY, dark ? NIGHT_GOLD : RED);
  const labelW = ctx.measureText(label).width;

  return {
    canvas,
    links: [{ x: (PAGE_W - labelW) / 2 - 20, y: pinY - 38, w: labelW + 40, h: 58, url: VENUE.mapsUrl }],
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
      center(p, item, y, INK);
      y += lineStep;
    }
    y += sectionGap;
  };

  section(lang === "gujarati" ? TEXTS.awaitingGu : TEXTS.awaitingEn, awaiting);
  section(lang === "gujarati" ? TEXTS.withLoveGu : TEXTS.withLoveEn, withLove);
  section(lang === "gujarati" ? TEXTS.bestWishesGu : TEXTS.bestWishesEn, wishes);

  ornamentRule(p, y);
  font(p, lang === "gujarati" ? 35 : 38, { weight: "600", italic: lang === "english" });
  centerWrapped(p, lang === "gujarati" ? TEXTS.closingGu : TEXTS.closingEn, y + 74, RED, 720, 54);

  return { canvas, links: [] };
}

// ---------------------------------------------------------------------------
// Public API
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
      return paintCover(guest, scale);
    case "invitation":
      return paintInvitation(guest, scale);
    case "event":
      return paintEvent(guest, spec.event, settings, scale);
    case "family":
      return paintFamily(guest, settings, scale);
  }
}
