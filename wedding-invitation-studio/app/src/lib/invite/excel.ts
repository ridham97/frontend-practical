// Excel template generation and guest-sheet parsing (SheetJS, client-side only).
import type { EventKey, GuestDraft, InviteType, Lang, ParseResult } from "./types";
import { EVENT_KEYS } from "./types";

export const SHEET_COLUMNS = ["Name", "Phone", "Invite For", "Language", "Events", "PDF Name"] as const;

const SAMPLE_ROWS = [
  ["Rameshbhai Sherathiya", "9998575131", "family", "gujarati", "all", ""],
  ["Kishor Kasondra", "9998575131", "mr & mrs", "gujarati", "mandvo, sanji, marriage", ""],
  ["Rahul Mehta", "9998575131", "mr", "english", "sanji, marriage", ""],
  ["Priya Shah", "9998575131", "family", "english", "all", "Priya_Shah_Invite"],
];

export async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[...SHEET_COLUMNS], ...SAMPLE_ROWS]);
  ws["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws, "Guests");

  const help = XLSX.utils.aoa_to_sheet([
    ["Column", "What to enter"],
    ["Name", "Guest name exactly as it should be printed on the invitation"],
    ["Phone", "WhatsApp number, 10 digits (or with +91)"],
    ["Invite For", "1 or mr = Mr. only | 2 or mr & mrs = couple | all or family = whole family"],
    ["Language", "english or gujarati (also accepts en / gu / e / g)"],
    ["Events", "all = every event, or a list: mandvo, haldi, sanji, marriage (numbers 1-4 also work)"],
    ["PDF Name", "Optional custom file name for the PDF. Leave blank for automatic naming"],
  ]);
  help["!cols"] = [{ wch: 14 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, help, "How to fill");
  XLSX.writeFile(wb, "Amee_Ridham_Guest_List_Template.xlsx");
}

function normalizeInviteType(raw: string, row: number, issues: ParseResult["issues"]): InviteType {
  const v = raw.trim().toLowerCase().replace(/[.\s&]+/g, "");
  if (["1", "mr", "shri", "gents"].includes(v)) return "mr";
  if (["2", "mrmrs", "mrandmrs", "couple", "shrimati"].includes(v)) return "mrmrs";
  if (["all", "family", "3", "sahparivar", "saparivar", ""].includes(v)) return "family";
  issues.push({ row, message: `Unknown "Invite For" value "${raw}" — using Family` });
  return "family";
}

function normalizeLang(raw: string, row: number, issues: ParseResult["issues"]): Lang {
  const v = raw.trim().toLowerCase();
  if (["english", "eng", "en", "e"].includes(v)) return "english";
  if (["gujarati", "guj", "gu", "g", "ગુજરાતી"].includes(v)) return "gujarati";
  if (v === "") return "english";
  issues.push({ row, message: `Unknown "Language" value "${raw}" — using English` });
  return "english";
}

const EVENT_ALIASES: Record<string, EventKey> = {
  "1": "mandvo", mandvo: "mandvo", mandvo1: "mandvo", mandap: "mandvo", "માંડવો": "mandvo",
  "2": "haldi", haldi: "haldi", haldee: "haldi", pithi: "haldi", "હળદી": "haldi",
  "3": "sanji", sanji: "sanji", sangeet: "sanji", garba: "sanji", "સાંજી": "sanji",
  "4": "marriage", marriage: "marriage", wedding: "marriage", lagna: "marriage", lagan: "marriage", "લગ્ન": "marriage", hastmelap: "marriage",
};

function normalizeEvents(raw: string, row: number, issues: ParseResult["issues"]): EventKey[] {
  const v = raw.trim().toLowerCase();
  if (v === "" || v === "all" || v === "બધા") return [...EVENT_KEYS];
  const picked = new Set<EventKey>();
  for (const token of v.split(/[,;|/+\s]+/).filter(Boolean)) {
    const match = EVENT_ALIASES[token];
    if (match) picked.add(match);
    else issues.push({ row, message: `Unknown event "${token}" — skipped` });
  }
  if (picked.size === 0) {
    issues.push({ row, message: "No valid events found — inviting to all four" });
    return [...EVENT_KEYS];
  }
  // preserve canonical order
  return EVENT_KEYS.filter((k) => picked.has(k));
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
  return null;
}

export async function parseGuestSheet(file: File): Promise<ParseResult> {
  const XLSX = await import("xlsx");
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  const issues: ParseResult["issues"] = [];
  const guests: GuestDraft[] = [];

  const val = (row: Record<string, unknown>, ...names: string[]): string => {
    for (const key of Object.keys(row)) {
      const k = key.trim().toLowerCase().replace(/[_\s]+/g, "");
      if (names.some((n) => k === n || k.startsWith(n))) return String(row[key] ?? "").trim();
    }
    return "";
  };

  rows.forEach((row, i) => {
    const rowNo = i + 2; // 1-based + header
    const name = val(row, "name", "guestname", "guest");
    const phoneRaw = val(row, "phone", "mobile", "whatsapp", "number", "contact");
    if (!name && !phoneRaw) return; // blank row
    if (!name) {
      issues.push({ row: rowNo, message: "Missing name — row skipped" });
      return;
    }
    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      issues.push({ row: rowNo, message: `Invalid phone "${phoneRaw}" for ${name} — row kept, sending disabled` });
    }
    guests.push({
      name,
      phone: phone ?? "",
      inviteType: normalizeInviteType(val(row, "invitefor", "invitetype", "invite", "salutation", "type"), rowNo, issues),
      language: normalizeLang(val(row, "language", "lang", "pdftype", "pdf"), rowNo, issues),
      events: normalizeEvents(val(row, "events", "event", "functions", "invitedto"), rowNo, issues),
      pdfName: val(row, "pdfname", "filename", "file") || null,
    });
  });

  return { guests, issues };
}
