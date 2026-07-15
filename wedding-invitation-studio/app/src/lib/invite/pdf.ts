// Assemble a guest's personalized invitation PDF from the canvas pages.
import type { Guest, Lang, WeddingSettings } from "./types";
import { PAGE_H, PAGE_W, pageSpecs, renderPage } from "./renderer";

const RENDER_SCALE = 1.5; // 1620 x 2880 px pages — crisp on phones, WhatsApp-friendly size
const JPEG_QUALITY = 0.85;

export function pdfFileName(guest: Guest): string {
  if (guest.pdfName) {
    return guest.pdfName.toLowerCase().endsWith(".pdf") ? guest.pdfName : guest.pdfName + ".pdf";
  }
  const safe = guest.name.replace(/[^\p{L}\p{N} ]/gu, "").trim().replace(/\s+/g, "_");
  const langTag = guest.language === "gujarati" ? "Gujarati" : "English";
  return `${safe}_Amee_Ridham_Wedding_Invitation_${langTag}.pdf`;
}

export async function buildGuestPdf(
  guest: Guest,
  settings: WeddingSettings,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const specs = pageSpecs(guest);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [PAGE_W, PAGE_H],
    compress: true,
  });

  for (let i = 0; i < specs.length; i++) {
    const { canvas, links } = await renderPage(guest, specs[i], settings, RENDER_SCALE);
    const data = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], "portrait");
    pdf.addImage(data, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
    for (const link of links) {
      pdf.link(link.x, link.y, link.w, link.h, { url: link.url });
    }
    onProgress?.(i + 1, specs.length);
  }

  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function buildAllPdfsZip(
  guests: Guest[],
  settings: WeddingSettings,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (let i = 0; i < guests.length; i++) {
    const blob = await buildGuestPdf(guests[i], settings);
    zip.file(pdfFileName(guests[i]), blob);
    onProgress?.(i + 1, guests.length);
  }
  return zip.generateAsync({ type: "blob" });
}

/** Preview-quality data URL for a single page (used by the proof loupe). */
export async function renderPreviewPage(
  guest: Guest,
  pageIndex: number,
  settings: WeddingSettings,
): Promise<{ dataUrl: string; total: number }> {
  const specs = pageSpecs(guest);
  const index = Math.max(0, Math.min(pageIndex, specs.length - 1));
  const { canvas } = await renderPage(guest, specs[index], settings, 0.5);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), total: specs.length };
}

export type { Guest, Lang, WeddingSettings };
