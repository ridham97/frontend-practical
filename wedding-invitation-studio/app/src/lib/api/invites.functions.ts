import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { bindings } from "../bindings.server";
import type { Guest, WeddingSettings } from "../invite/types";
import { DEFAULT_SETTINGS } from "../invite/wedding-data";

const eventKey = z.enum(["mandvo", "haldi", "sanji", "marriage"]);

const guestDraftSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().regex(/^\d{0,12}$/),
  inviteType: z.enum(["mr", "mrmrs", "family"]),
  language: z.enum(["english", "gujarati"]),
  events: z.array(eventKey).min(1),
  pdfName: z.string().max(120).nullable(),
});

const guestRowSchema = guestDraftSchema.extend({
  id: z.string().min(1),
  status: z.enum(["pending", "sent"]),
  sentAt: z.string().nullable(),
});

interface GuestRow {
  id: string;
  name: string;
  phone: string;
  invite_type: Guest["inviteType"];
  language: Guest["language"];
  events: string;
  pdf_name: string | null;
  status: Guest["status"];
  sent_at: string | null;
}

function rowToGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    inviteType: row.invite_type,
    language: row.language,
    events: row.events.split(",").filter(Boolean) as Guest["events"],
    pdfName: row.pdf_name,
    status: row.status,
    sentAt: row.sent_at,
  };
}

export const listGuests = createServerFn({ method: "GET" }).handler(async (): Promise<{ ok: boolean; guests: Guest[] }> => {
  const { DB } = bindings();
  if (!DB) return { ok: false, guests: [] };
  const res = await DB.prepare("SELECT * FROM guests ORDER BY created_at, name").all<GuestRow>();
  return { ok: true, guests: (res.results ?? []).map(rowToGuest) };
});

/** Replace the whole guest list (used after an Excel upload). */
export const replaceGuests = createServerFn({ method: "POST" })
  .inputValidator(z.object({ guests: z.array(guestRowSchema).max(2000) }))
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Database not available" };
    const statements = [
      DB.prepare("DELETE FROM guests"),
      ...data.guests.map((g) =>
        DB.prepare(
          "INSERT INTO guests (id, name, phone, invite_type, language, events, pdf_name, status, sent_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        ).bind(g.id, g.name, g.phone, g.inviteType, g.language, g.events.join(","), g.pdfName, g.status, g.sentAt),
      ),
    ];
    await DB.batch(statements);
    return { ok: true as const };
  });

export const upsertGuest = createServerFn({ method: "POST" })
  .inputValidator(guestRowSchema)
  .handler(async ({ data: g }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Database not available" };
    await DB.prepare(
      `INSERT INTO guests (id, name, phone, invite_type, language, events, pdf_name, status, sent_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
       ON CONFLICT(id) DO UPDATE SET name=?2, phone=?3, invite_type=?4, language=?5, events=?6, pdf_name=?7, status=?8, sent_at=?9`,
    )
      .bind(g.id, g.name, g.phone, g.inviteType, g.language, g.events.join(","), g.pdfName, g.status, g.sentAt)
      .run();
    return { ok: true as const };
  });

export const deleteGuest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Database not available" };
    await DB.prepare("DELETE FROM guests WHERE id = ?1").bind(data.id).run();
    return { ok: true as const };
  });

export const markSent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1), sent: z.boolean() }))
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Database not available" };
    await DB.prepare("UPDATE guests SET status = ?2, sent_at = ?3 WHERE id = ?1")
      .bind(data.id, data.sent ? "sent" : "pending", data.sent ? new Date().toISOString() : null)
      .run();
    return { ok: true as const };
  });

const settingsSchema = z.object({
  marriageTimeEn: z.string().max(80),
  marriageTimeGu: z.string().max(80),
  awaitingEn: z.array(z.string().max(160)).max(20),
  awaitingGu: z.array(z.string().max(160)).max(20),
  withLoveEn: z.array(z.string().max(160)).max(20),
  withLoveGu: z.array(z.string().max(160)).max(20),
  bestWishesEn: z.array(z.string().max(160)).max(20),
  bestWishesGu: z.array(z.string().max(160)).max(20),
  waToken: z.string().max(600),
  waPhoneId: z.string().max(60),
});

export const getSettings = createServerFn({ method: "GET" }).handler(async (): Promise<{ ok: boolean; settings: WeddingSettings }> => {
  const { DB } = bindings();
  if (!DB) return { ok: false, settings: DEFAULT_SETTINGS };
  const row = await DB.prepare("SELECT value FROM settings WHERE key = 'wedding'").first<{ value: string }>();
  if (!row) return { ok: true, settings: DEFAULT_SETTINGS };
  try {
    return { ok: true, settings: { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value) as Partial<WeddingSettings>) } };
  } catch {
    return { ok: true, settings: DEFAULT_SETTINGS };
  }
});

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator(settingsSchema)
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Database not available" };
    await DB.prepare(
      "INSERT INTO settings (key, value) VALUES ('wedding', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1",
    )
      .bind(JSON.stringify(data))
      .run();
    return { ok: true as const };
  });
