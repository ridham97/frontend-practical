import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GuestLedger } from "../components/studio/GuestLedger";
import { ProofLoupe } from "../components/studio/ProofLoupe";
import { SettingsDrawer } from "../components/studio/SettingsDrawer";
import { UploadDrawer } from "../components/studio/UploadDrawer";
import {
  deleteGuest,
  getSettings,
  listGuests,
  markSent,
  replaceGuests,
  saveSettings,
  upsertGuest,
} from "../lib/api/invites.functions";
import type { Guest, ParseResult, WeddingSettings } from "../lib/invite/types";
import { buildAllPdfsZip, buildGuestPdf, downloadBlob, pdfFileName } from "../lib/invite/pdf";
import { sendViaWhatsApp } from "../lib/invite/whatsapp";
import { ASSETS, DEFAULT_SETTINGS, EVENTS } from "../lib/invite/wedding-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Amee ♥ Ridham | Invitation Studio" },
      {
        name: "description",
        content:
          "Personalized bilingual wedding invitation PDFs for Amee & Ridham, 28-29 January 2027, OTB Rajkot, generated per guest and dispatched on WhatsApp.",
      },
    ],
    links: [{ rel: "canonical", href: "https://amee-ridham-invites.higgsfield.app/" }],
  }),
  component: Studio,
});

const DEMO_GUEST: Guest = {
  id: "demo",
  name: "Rameshbhai Sherathiya",
  phone: "919998575131",
  inviteType: "family",
  language: "english",
  events: ["mandvo", "haldi", "sanji", "marriage"],
  pdfName: null,
  status: "pending",
  sentAt: null,
};

type Toast = { message: string; tone: "ok" | "warn" | "err" } | null;

function Studio() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [settings, setSettings] = useState<WeddingSettings>(DEFAULT_SETTINGS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyGuestId, setBusyGuestId] = useState<string | null>(null);
  const [zipBusy, setZipBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [previewLang, setPreviewLang] = useState<"english" | "gujarati">("english");

  const note = useCallback((message: string, tone: "ok" | "warn" | "err" = "ok") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast((t) => (t?.message === message ? null : t)), 6000);
  }, []);

  useEffect(() => {
    void listGuests()
      .then((res) => {
        if (res.ok && res.guests.length) setGuests(res.guests);
      })
      .catch(() => undefined);
    void getSettings()
      .then((res) => {
        if (res.ok) setSettings(res.settings);
      })
      .catch(() => undefined);
  }, []);

  const selected = useMemo(() => {
    const found = guests.find((g) => g.id === selectedId) ?? guests[0];
    if (found) return found;
    return { ...DEMO_GUEST, language: previewLang };
  }, [guests, selectedId, previewLang]);

  const persistAll = useCallback(
    (next: Guest[]) => {
      replaceGuests({ data: { guests: next } })
        .then((res) => {
          if (!res.ok) note("Saved locally. The online ledger is unavailable right now.", "warn");
        })
        .catch(() => note("Saved locally. The online ledger is unavailable right now.", "warn"));
    },
    [note],
  );

  const handleParsed = useCallback(
    (result: ParseResult) => {
      const next: Guest[] = result.guests.map((draft) => ({
        ...draft,
        id: crypto.randomUUID(),
        status: "pending" as const,
        sentAt: null,
      }));
      setGuests(next);
      setSelectedId(next[0]?.id ?? null);
      persistAll(next);
      note(`Guest sheet loaded: ${next.length} invitation${next.length === 1 ? "" : "s"} ready to proof.`);
    },
    [note, persistAll],
  );

  const handleAdd: Parameters<typeof GuestLedger>[0]["actions"]["onAdd"] = (draft) => {
    const guest: Guest = { ...draft, pdfName: null, id: crypto.randomUUID(), status: "pending", sentAt: null };
    setGuests((prev) => [...prev, guest]);
    setSelectedId(guest.id);
    void upsertGuest({ data: guest }).catch(() => undefined);
    note(`${guest.name} added to the ledger.`);
  };

  const handleDownload = async (guest: Guest) => {
    setBusyGuestId(guest.id);
    try {
      const blob = await buildGuestPdf(guest, settings);
      downloadBlob(blob, pdfFileName(guest));
      note(`${pdfFileName(guest)} downloaded.`);
    } catch (err) {
      note(`Could not build the PDF: ${(err as Error).message}`, "err");
    } finally {
      setBusyGuestId(null);
    }
  };

  const handleSend = async (guest: Guest) => {
    setBusyGuestId(guest.id);
    try {
      const outcome = await sendViaWhatsApp(guest, settings);
      note(outcome.detail);
      const updated = { ...guest, status: "sent" as const, sentAt: new Date().toISOString() };
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? updated : g)));
      void markSent({ data: { id: guest.id, sent: true } }).catch(() => undefined);
    } catch (err) {
      if ((err as Error).name !== "AbortError") note(`WhatsApp send failed: ${(err as Error).message}`, "err");
    } finally {
      setBusyGuestId(null);
    }
  };

  const handleToggleSent = (guest: Guest) => {
    const sent = guest.status !== "sent";
    const updated = {
      ...guest,
      status: sent ? ("sent" as const) : ("pending" as const),
      sentAt: sent ? new Date().toISOString() : null,
    };
    setGuests((prev) => prev.map((g) => (g.id === guest.id ? updated : g)));
    void markSent({ data: { id: guest.id, sent } }).catch(() => undefined);
  };

  const handleDelete = (guest: Guest) => {
    setGuests((prev) => prev.filter((g) => g.id !== guest.id));
    if (selectedId === guest.id) setSelectedId(null);
    void deleteGuest({ data: { id: guest.id } }).catch(() => undefined);
    note(`${guest.name} removed.`);
  };

  const handleDownloadAll = async () => {
    if (!guests.length) return;
    setZipBusy(true);
    try {
      const blob = await buildAllPdfsZip(guests, settings, (done, total) =>
        note(`Preparing PDFs… ${done} of ${total}`, "ok"),
      );
      downloadBlob(blob, "Amee_Ridham_Wedding_Invitations.zip");
      note("All invitations bundled and downloaded.");
    } catch (err) {
      note(`Bundle failed: ${(err as Error).message}`, "err");
    } finally {
      setZipBusy(false);
    }
  };

  const handleSendNext = () => {
    const next = guests.find((g) => g.status === "pending" && g.phone);
    if (next) {
      setSelectedId(next.id);
      void handleSend(next);
    }
  };

  const handleSaveSettings = (next: WeddingSettings) => {
    setSaving(true);
    setSettings(next);
    saveSettings({ data: next })
      .then((res) =>
        note(
          res.ok ? "Wedding details saved." : "Saved for this session. The online store is unavailable.",
          res.ok ? "ok" : "warn",
        ),
      )
      .catch(() => note("Saved for this session. The online store is unavailable.", "warn"))
      .finally(() => setSaving(false));
  };

  return (
    <main
      className="min-h-dvh"
      style={{ background: "var(--st-parchment)", color: "var(--st-ink)", fontFamily: "var(--st-sans)" }}
    >
      {/* ------------------------------------------------ hero */}
      <div className="relative h-24 w-full overflow-hidden sm:h-32" aria-hidden>
        <img src={ASSETS.banner} alt="" className="h-full w-full object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(247,241,229,0.1), var(--st-parchment))" }}
        />
      </div>
      <header className="relative overflow-hidden" id="top-proof">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="st-eyebrow">The stationer's desk of</p>
            <h1
              className="st-serif mt-4 text-5xl font-semibold leading-[1.05] sm:text-6xl"
              style={{ color: "var(--st-ink)" }}
            >
              Amee <span style={{ color: "var(--st-red)" }}>♥</span> Ridham
              <span className="mt-2 block text-3xl font-medium italic sm:text-4xl" style={{ color: "var(--st-gold)" }}>
                Invitation Studio
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed" style={{ color: "var(--st-ink-soft)" }}>
              Upload the guest sheet once. Every guest receives their own invitation, addressed by
              name, in English or Gujarati, with only the events they are invited to: Mandvo, Haldi,
              Sanji and the Marriage. Proof it here, then dispatch it on WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a href="#studio" className="st-cta-seal">
                <span className="seal-dot" aria-hidden />
                Open the studio
              </a>
              <span className="text-sm" style={{ color: "var(--st-sage)" }}>
                28 &amp; 29 January 2027 · OTB, Rajkot
              </span>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {(["mandvo", "haldi", "sanji", "marriage"] as const).map((key) => (
                <span key={key} className="st-chip" title={EVENTS[key].taglineEn}>
                  {EVENTS[key].titleEn} · {EVENTS[key].titleGu}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--st-sage)" }}>
                Live proof
              </span>
              {guests.length === 0 && (
                <span className="flex overflow-hidden rounded-full border" style={{ borderColor: "rgba(140,106,47,0.4)" }}>
                  {(["english", "gujarati"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPreviewLang(lang)}
                      className="px-3 py-1 text-xs font-semibold"
                      style={
                        previewLang === lang
                          ? { background: "var(--st-gold)", color: "var(--st-card)" }
                          : { color: "var(--st-gold)" }
                      }
                    >
                      {lang === "english" ? "English" : "ગુજરાતી"}
                    </button>
                  ))}
                </span>
              )}
            </div>
            <ProofLoupe guest={selected} settings={settings} />
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ studio */}
      <section id="studio" className="mx-auto max-w-6xl space-y-10 px-6 pb-16">
        <div className="st-rule st-eyebrow">The studio</div>

        <UploadDrawer onParsed={handleParsed} guestCount={guests.length} />

        <GuestLedger
          guests={guests}
          actions={{
            onPreview: (g) => {
              setSelectedId(g.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            },
            onDownload: (g) => void handleDownload(g),
            onSend: (g) => void handleSend(g),
            onToggleSent: handleToggleSent,
            onDelete: handleDelete,
            onAdd: handleAdd,
            onDownloadAll: () => void handleDownloadAll(),
            onSendNext: handleSendNext,
            busyGuestId,
            zipBusy,
          }}
        />

        <div className="st-panel p-6 sm:p-8">
          <h3 className="st-serif text-2xl font-semibold" style={{ color: "var(--st-ink)" }}>
            3 · Dispatch on WhatsApp
          </h3>
          <div className="mt-4 grid gap-6 text-sm leading-relaxed md:grid-cols-3" style={{ color: "var(--st-ink-soft)" }}>
            <div>
              <p className="font-semibold" style={{ color: "var(--st-ink)" }}>
                On a phone
              </p>
              <p className="mt-1">
                The WhatsApp button opens your share sheet with the PDF attached: pick WhatsApp,
                pick the guest, send. The personalized message travels with it.
              </p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--st-ink)" }}>
                On a computer
              </p>
              <p className="mt-1">
                The button opens the guest's chat in WhatsApp Web with the message typed in, and the
                PDF downloads beside it. Drop the file into the chat and press send.
              </p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--st-ink)" }}>
                Fully automatic
              </p>
              <p className="mt-1">
                Connect the free Meta WhatsApp Business Cloud API in the settings below and the
                button delivers each PDF by itself, from your own registered number.
              </p>
            </div>
          </div>
        </div>

        <SettingsDrawer settings={settings} onSave={handleSaveSettings} saving={saving} />
      </section>

      {/* ------------------------------------------------ footer */}
      <footer className="border-t px-6 py-10 text-center" style={{ borderColor: "rgba(140,106,47,0.3)" }}>
        <img
          src={ASSETS.monogram}
          alt="Amee and Ridham monogram"
          className="mx-auto h-16 w-16 rounded-full object-cover"
          style={{ border: "1px solid var(--st-gold-soft)" }}
        />
        <p className="st-serif mt-3 text-lg italic" style={{ color: "var(--st-gold)" }}>
          Your presence and blessings are our greatest gift.
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--st-sage)" }}>
          Amee ♥ Ridham · 28 &amp; 29 January 2027 · OTB, Nyari Dam 1 Road, Kalavad Road, Rajkot
        </p>
      </footer>

      {/* ------------------------------------------------ toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-5 py-3 text-sm font-medium shadow-lg"
          style={{
            background: toast.tone === "err" ? "var(--st-red)" : toast.tone === "warn" ? "var(--st-gold)" : "var(--st-ink)",
            color: "#fdf6ec",
            borderRadius: 3,
            maxWidth: "min(92vw, 560px)",
          }}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
