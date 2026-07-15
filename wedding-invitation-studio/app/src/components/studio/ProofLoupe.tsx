import { useEffect, useRef, useState } from "react";

import type { Guest, WeddingSettings } from "../../lib/invite/types";
import { renderPreviewPage } from "../../lib/invite/pdf";


const EVENT_NAMES: Record<Guest["events"][number], string> = {
  mandvo: "Mandvo",
  haldi: "Haldi",
  sanji: "Sanji",
  marriage: "Marriage",
};

const PAGE_LABELS = (guest: Guest): string[] => [
  "Cover",
  "Invitation",
  ...guest.events.map((e) => EVENT_NAMES[e]),
  "Family",
];

/** The proofing loupe: a live canvas-rendered preview of the guest's actual PDF pages. */
export function ProofLoupe({ guest, settings }: { guest: Guest; settings: WeddingSettings }) {
  const [page, setPage] = useState(0);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestRef = useRef(0);

  const labels = PAGE_LABELS(guest);
  const total = labels.length;

  useEffect(() => {
    setPage(0);
  }, [guest.id, guest.language, guest.inviteType, guest.events.join(",")]);

  useEffect(() => {
    const ticket = ++requestRef.current;
    setBusy(true);
    renderPreviewPage(guest, page, settings)
      .then(({ dataUrl: url }) => {
        if (requestRef.current === ticket) setDataUrl(url);
      })
      .catch(() => {
        if (requestRef.current === ticket) setDataUrl(null);
      })
      .finally(() => {
        if (requestRef.current === ticket) setBusy(false);
      });
  }, [guest, page, settings]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-full max-w-[340px] overflow-hidden"
        style={{
          aspectRatio: "1080 / 1920",
          border: "1px solid rgba(140,106,47,0.5)",
          boxShadow: "0 0 0 6px var(--st-card), 0 0 0 7px rgba(140,106,47,0.3), 0 24px 48px -20px rgba(35,61,53,0.45)",
          background: "var(--st-card)",
        }}
      >
        {dataUrl ? (
          <img src={dataUrl} alt={`Invitation page ${page + 1}: ${labels[page]}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--st-sage)" }}>
            Preparing proof…
          </div>
        )}
        {busy && (
          <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden">
            <div className="h-full w-full" style={{ background: "var(--st-gold)", animation: "st-shimmer 1s linear infinite" }} />
          </div>
        )}
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => setPage((p) => (p - 1 + total) % total)}
          className="st-icon-btn absolute left-2 top-1/2 -translate-y-1/2"
          style={{ background: "rgba(251,246,234,0.85)" }}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next page"
          onClick={() => setPage((p) => (p + 1) % total)}
          className="st-icon-btn absolute right-2 top-1/2 -translate-y-1/2"
          style={{ background: "rgba(251,246,234,0.85)" }}
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-2">
        {labels.map((label, i) => (
          <button
            key={label + i}
            type="button"
            aria-label={`Show ${label} page`}
            onClick={() => setPage(i)}
            className="h-2.5 w-2.5 rounded-full transition-transform"
            style={{
              background: i === page ? "var(--st-red)" : "rgba(140,106,47,0.35)",
              transform: i === page ? "scale(1.25)" : undefined,
            }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--st-sage)" }}>
        Page {page + 1} of {total} · {labels[page]}
      </p>
    </div>
  );
}
