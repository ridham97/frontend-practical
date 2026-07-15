export type EventKey = "mandvo" | "haldi" | "sanji" | "marriage";
export type InviteType = "mr" | "mrmrs" | "family";
export type Lang = "english" | "gujarati";
export type SendStatus = "pending" | "sent";

export interface Guest {
  id: string;
  name: string;
  phone: string; // normalized digits, e.g. "919998575131"
  inviteType: InviteType;
  language: Lang;
  events: EventKey[];
  pdfName: string | null;
  status: SendStatus;
  sentAt: string | null;
}

export interface GuestDraft {
  name: string;
  phone: string;
  inviteType: InviteType;
  language: Lang;
  events: EventKey[];
  pdfName: string | null;
}

export interface RowIssue {
  row: number;
  message: string;
}

export interface ParseResult {
  guests: GuestDraft[];
  issues: RowIssue[];
}

/** Per-event editable content, English + Gujarati. */
export interface EventContent {
  titleEn: string;
  titleGu: string;
  taglineEn: string;
  taglineGu: string;
  dateEn: string;
  dateGu: string;
  timeEn: string;
  timeGu: string;
}

/**
 * Everything printed on the invitation is editable and persisted here.
 * English fields can be auto-converted to Gujarati in the form; the Gujarati
 * fields always stay manually editable.
 */
export interface WeddingSettings {
  // couple
  brideEn: string;
  brideGu: string;
  groomEn: string;
  groomGu: string;
  brideFirst: boolean; // name order everywhere: bride ♥ groom vs groom ♥ bride
  brideParentsEn: string;
  brideParentsGu: string;
  groomParentsEn: string;
  groomParentsGu: string;
  // dates + place
  datesEn: string;
  datesGu: string;
  cityEn: string;
  cityGu: string;
  // venue
  venueNameEn: string;
  venueNameGu: string;
  venueAddressEn: string;
  venueAddressGu: string;
  mapsUrl: string;
  // long texts
  blessingEn: string;
  blessingGu: string;
  poemEn: string;
  poemGu: string;
  closingEn: string;
  closingGu: string;
  // events
  events: Record<EventKey, EventContent>;
  // family page lists
  awaitingEn: string[];
  awaitingGu: string[];
  withLoveEn: string[];
  withLoveGu: string[];
  bestWishesEn: string[];
  bestWishesGu: string[];
  // optional WhatsApp Cloud API
  waToken: string;
  waPhoneId: string;
}

export const EVENT_KEYS: EventKey[] = ["mandvo", "haldi", "sanji", "marriage"];
