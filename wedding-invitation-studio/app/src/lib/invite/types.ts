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

export interface WeddingSettings {
  marriageTimeEn: string;
  marriageTimeGu: string;
  awaitingEn: string[];
  awaitingGu: string[];
  withLoveEn: string[];
  withLoveGu: string[];
  bestWishesEn: string[];
  bestWishesGu: string[];
  waToken: string;
  waPhoneId: string;
}

export const EVENT_KEYS: EventKey[] = ["mandvo", "haldi", "sanji", "marriage"];
