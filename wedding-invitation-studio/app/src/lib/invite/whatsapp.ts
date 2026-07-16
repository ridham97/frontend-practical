// WhatsApp dispatch. Four tiers, best available wins:
// 1. The Studio's own Chrome extension (no API, no business account): the
//    studio hands the PDF to the extension, which opens the guest's chat on
//    WhatsApp Web, attaches the PDF with the personalized caption and presses
//    send — from whatever personal number is logged into WhatsApp Web.
// 2. Optional WhatsApp Business Cloud API when credentials are configured.
// 3. Mobile: Web Share API shares the actual PDF straight into WhatsApp.
// 4. Desktop fallback: opens wa.me chat with the message and downloads the
//    PDF next to it, ready to attach.
import type { Guest, WeddingSettings } from "./types";
import { whatsappMessage } from "./wedding-data";
import { buildGuestPdf, downloadBlob, pdfFileName } from "./pdf";

export function waLink(guest: Guest, settings: WeddingSettings): string {
  const message = whatsappMessage(guest.name, guest.inviteType, guest.language, settings);
  return `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`;
}

export interface SendOutcome {
  method: "extension" | "cloud-api" | "shared" | "walink";
  detail: string;
}

export const LATEST_EXTENSION_VERSION = "1.2.1";

/**
 * Version of the studio's WhatsApp sender extension active on this page, or
 * null when the extension is not installed / not running on this domain.
 */
export function pingExtension(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, 450);
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; version?: string };
      if (e.source === window && d?.type === "ARWA_PONG") {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(d.version || "1.0.0");
      }
    };
    window.addEventListener("message", onMessage);
    window.postMessage({ type: "ARWA_PING" }, "*");
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the PDF"));
    reader.readAsDataURL(blob);
  });
}

async function sendViaExtension(guest: Guest, blob: Blob, filename: string, message: string): Promise<void> {
  const pdfBase64 = await blobToBase64(blob);
  const id = crypto.randomUUID();
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("The WhatsApp tab did not confirm within 3 minutes. Check the WhatsApp Web tab."));
    }, 180000);
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; id?: string; ok?: boolean; error?: string };
      if (e.source === window && d?.type === "ARWA_RESULT" && d.id === id) {
        cleanup();
        if (d.ok) resolve();
        else reject(new Error(d.error || "The extension could not complete the send"));
      }
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };
    window.addEventListener("message", onMessage);
    window.postMessage({ type: "ARWA_SEND", id, phone: guest.phone, message, filename, pdfBase64 }, "*");
  });
}

export async function sendViaWhatsApp(guest: Guest, settings: WeddingSettings): Promise<SendOutcome> {
  const blob = await buildGuestPdf(guest, settings);
  const filename = pdfFileName(guest);
  const message = whatsappMessage(guest.name, guest.inviteType, guest.language, settings);

  // Tier 1 — the studio's own extension: direct automated send, no API.
  if (await pingExtension()) {
    await sendViaExtension(guest, blob, filename, message);
    return { method: "extension", detail: `Sent to ${guest.name} through WhatsApp Web automatically.` };
  }

  // Tier 2 — Cloud API when configured.
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

  // Tier 3 — native share sheet (Android/iOS): attaches the real PDF.
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

  // Tier 4 — wa.me chat + local download for manual attach.
  downloadBlob(blob, filename);
  window.open(waLink(guest, settings), "_blank", "noopener");
  return {
    method: "walink",
    detail:
      "NOT automatic: the extension is not active on this page, so the chat was opened with the message and the PDF was downloaded. Attach it manually, or install/reload the extension and refresh this page.",
  };
}
