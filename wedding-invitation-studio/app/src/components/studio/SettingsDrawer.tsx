import { useEffect, useState } from "react";

import type { WeddingSettings } from "../../lib/invite/types";

function ListField({
  id,
  label,
  value,
  onChange,
  gujarati,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  gujarati?: boolean;
}) {
  return (
    <div>
      <label className="st-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={"st-input min-h-[110px]" + (gujarati ? " st-gujarati" : "")}
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        placeholder="One name per line"
      />
    </div>
  );
}

export function SettingsDrawer({
  settings,
  onSave,
  saving,
}: {
  settings: WeddingSettings;
  onSave: (next: WeddingSettings) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<WeddingSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const set = <K extends keyof WeddingSettings>(key: K, value: WeddingSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const clean = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);

  return (
    <div className="st-panel p-6 sm:p-8">
      <h3 className="st-serif text-2xl font-semibold" style={{ color: "var(--st-ink)" }}>
        4 · Wedding details
      </h3>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--st-ink-soft)" }}>
        The family names below appear on the last page of every invitation. They are placeholders
        for now. Replace them with the real list whenever you are ready. The marriage muhurat time
        is also editable here.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <label className="st-label" htmlFor="set-mt-en">Marriage time (English PDFs)</label>
          <input id="set-mt-en" className="st-input" value={draft.marriageTimeEn} onChange={(e) => set("marriageTimeEn", e.target.value)} />
        </div>
        <div>
          <label className="st-label" htmlFor="set-mt-gu">Marriage time (Gujarati PDFs)</label>
          <input id="set-mt-gu" className="st-input st-gujarati" value={draft.marriageTimeGu} onChange={(e) => set("marriageTimeGu", e.target.value)} />
        </div>
        <ListField id="set-aw-en" label="Awaiting your presence (English)" value={draft.awaitingEn} onChange={(v) => set("awaitingEn", v)} />
        <ListField id="set-aw-gu" label="દર્શનાભિલાષી (Gujarati)" value={draft.awaitingGu} onChange={(v) => set("awaitingGu", v)} gujarati />
        <ListField id="set-wl-en" label="With love (English)" value={draft.withLoveEn} onChange={(v) => set("withLoveEn", v)} />
        <ListField id="set-wl-gu" label="મધુર ટહુકો (Gujarati)" value={draft.withLoveGu} onChange={(v) => set("withLoveGu", v)} gujarati />
        <ListField id="set-bw-en" label="Best wishes (English)" value={draft.bestWishesEn} onChange={(v) => set("bestWishesEn", v)} />
        <ListField id="set-bw-gu" label="શુભેચ્છક (Gujarati)" value={draft.bestWishesGu} onChange={(v) => set("bestWishesGu", v)} gujarati />
      </div>

      <div className="mt-8 border-t pt-6" style={{ borderColor: "rgba(140,106,47,0.25)" }}>
        <p className="st-eyebrow mb-2">Automatic sending (optional)</p>
        <p className="max-w-2xl text-sm" style={{ color: "var(--st-ink-soft)" }}>
          Out of the box, the WhatsApp button opens the chat with the message ready and the PDF
          downloaded (on phones it shares the PDF directly). For fully automatic delivery from your
          own number, connect a free Meta WhatsApp Business Cloud API account and paste its
          credentials here.
        </p>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <label className="st-label" htmlFor="set-wa-id">WhatsApp phone number ID</label>
            <input id="set-wa-id" className="st-input" value={draft.waPhoneId} onChange={(e) => set("waPhoneId", e.target.value)} placeholder="e.g. 123456789012345" />
          </div>
          <div>
            <label className="st-label" htmlFor="set-wa-token">Permanent access token</label>
            <input id="set-wa-token" className="st-input" type="password" value={draft.waToken} onChange={(e) => set("waToken", e.target.value)} placeholder="EAAG…" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="st-cta-generate"
          disabled={saving}
          onClick={() =>
            onSave({
              ...draft,
              awaitingEn: clean(draft.awaitingEn),
              awaitingGu: clean(draft.awaitingGu),
              withLoveEn: clean(draft.withLoveEn),
              withLoveGu: clean(draft.withLoveGu),
              bestWishesEn: clean(draft.bestWishesEn),
              bestWishesGu: clean(draft.bestWishesGu),
            })
          }
        >
          {saving && <span className="shimmer" aria-hidden />}
          {saving ? "Saving…" : "Save wedding details"}
        </button>
      </div>
    </div>
  );
}
