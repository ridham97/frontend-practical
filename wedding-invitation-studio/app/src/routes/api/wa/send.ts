// Optional true-automation path: WhatsApp Business Cloud API (Meta).
// Requires the couple's own access token + phone number id, saved in Settings.
// Flow: upload the PDF as media, then send it as a document message with the
// personalized caption.
import { createFileRoute } from "@tanstack/react-router";

import { bindings } from "../../../lib/bindings.server";

const GRAPH = "https://graph.facebook.com/v21.0";

async function readCreds(): Promise<{ token: string; phoneId: string } | null> {
  const { DB } = bindings();
  if (!DB) return null;
  const row = await DB.prepare("SELECT value FROM settings WHERE key = 'wedding'").first<{ value: string }>();
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { waToken?: string; waPhoneId?: string };
    if (parsed.waToken && parsed.waPhoneId) return { token: parsed.waToken, phoneId: parsed.waPhoneId };
  } catch {
    return null;
  }
  return null;
}

export const Route = createFileRoute("/api/wa/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const creds = await readCreds();
        if (!creds) {
          return Response.json(
            { ok: false, error: "WhatsApp Cloud API is not configured. Add the token and phone number id in Settings." },
            { status: 400 },
          );
        }

        const form = await request.formData();
        const file = form.get("file");
        const phone = String(form.get("phone") ?? "");
        const message = String(form.get("message") ?? "");
        const filename = String(form.get("filename") ?? "invitation.pdf");
        if (!(file instanceof File) || !/^\d{11,13}$/.test(phone)) {
          return Response.json({ ok: false, error: "Missing PDF or invalid phone number" }, { status: 400 });
        }

        // 1. Upload the PDF as WhatsApp media.
        const media = new FormData();
        media.append("messaging_product", "whatsapp");
        media.append("type", "application/pdf");
        media.append("file", new File([await file.arrayBuffer()], filename, { type: "application/pdf" }));
        const uploadRes = await fetch(`${GRAPH}/${creds.phoneId}/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${creds.token}` },
          body: media,
        });
        const uploadBody = (await uploadRes.json()) as { id?: string; error?: { message?: string } };
        if (!uploadRes.ok || !uploadBody.id) {
          return Response.json(
            { ok: false, error: uploadBody.error?.message ?? `Media upload failed (${uploadRes.status})` },
            { status: 502 },
          );
        }

        // 2. Send the document message with the caption.
        const sendRes = await fetch(`${GRAPH}/${creds.phoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${creds.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "document",
            document: { id: uploadBody.id, filename, caption: message },
          }),
        });
        const sendBody = (await sendRes.json()) as { messages?: unknown; error?: { message?: string } };
        if (!sendRes.ok) {
          return Response.json(
            { ok: false, error: sendBody.error?.message ?? `Send failed (${sendRes.status})` },
            { status: 502 },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
