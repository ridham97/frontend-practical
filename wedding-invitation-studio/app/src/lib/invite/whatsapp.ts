// WhatsApp dispatch helpers. Three tiers:
// 1. Mobile: Web Share API shares the actual PDF straight into WhatsApp.
// 2. Desktop: opens wa.me chat with the personalized message and downloads
//    the PDF next to it, ready to attach.
// 3. Optional: WhatsApp Business Cloud API (Meta) credentials in Settings turn
//    on true automatic document sending from the couple's registered number.
import type { Guest, WeddingSettings } from "./types";
import { whatsappMessage } from "./wedding-data";
import { buildGuestPdf, downloadBlob, pdfFileName } from "./pdf";

export function waLink(guest: Guest): string {
  const message = whatsappMessage(guest.name, guest.inviteType, guest.language);
  return `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`;
}

export interface SendOutcome {
  method: "shared" | "walink" | "cloud-api";
  detail: string;
}

export async function sendViaWhatsApp(guest: Guest, settings: WeddingSettings): Promise<SendOutcome> {
  const blob = await buildGuestPdf(guest, settings);
  const filename = pdfFileName(guest);
  const message = whatsappMessage(guest.name, guest.inviteType, guest.language);

  // Tier 3 — Cloud API when configured: fully automatic.
  if (settings.waToken && settings.waPhoneId) {
    const form = new FormData();
    form.append("file", new File([blob], filename, { type: "application/pdf" }));
    form.append("phone", guest.phone);
    form.append("message", message);
    form.append("filename", filename);
    const res = await fetch("/api/wa/send", { method: "POST", body: form });
    const body = (await res.json()) as { ok: boolean; error?: string };
    if (!body.ok) throw new Error(body.error ?? "WhatsApp Cloud API send failed");
    return { method: "cloud-api", detail: "Delivered automatically via WhatsApp Business API" };
  }

  // Tier 1 — native share sheet (Android/iOS): attaches the real PDF.
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: message });
      return { method: "shared", detail: "Shared via the phone's share sheet" };
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      // fall through to wa.me
    }
  }

  // Tier 2 — wa.me chat + local download for manual attach.
  downloadBlob(blob, filename);
  window.open(waLink(guest), "_blank", "noopener");
  return {
    method: "walink",
    detail: "Chat opened with the message. Attach the downloaded PDF and press send.",
  };
}
