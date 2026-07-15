import { useEffect, useState } from "react";

import type { EventKey, WeddingSettings } from "../../lib/invite/types";
import { EVENT_KEYS } from "../../lib/invite/types";

async function translateToGujarati(text: string): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const body = (await res.json()) as { ok: boolean; text?: string; error?: string };
  if (!body.ok) throw new Error(body.error ?? "Translation failed");
  return body.text ?? "";
}

/** English + Gujarati pair with a one-click auto-convert button. */
function PairField({
  id,
  label,
  en,
  gu,
  onEn,
  onGu,
  multiline,
  onBusy,
}: {
  id: string;
  label: string;
  en: string;
  gu: string;
  onEn: (v: string) => void;
  onGu: (v: string) => void;
  multiline?: boolean;
  onBusy: (msg: string | null) => void;
}) {
  const [translating, setTranslating] = useState(false);

  const autoFill = async () => {
    if (!en.trim()) return;
    setTranslating(true);
    onBusy(`Converting "${label}" to Gujarati…`);
    try {
      onGu(await translateToGujarati(en));
      onBusy(null);
    } catch (err) {
      onBusy(`Could not auto-convert "${label}": ${(err as Error).message}`);
    } finally {
      setTranslating(false);
    }
  };

  const Input = multiline ? "textarea" : "input";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="st-label" htmlFor={id + "-en"}>
          {label} (English)
        </label>
        <Input
          id={id + "-en"}
          className={"st-input" + (multiline ? " min-h-[90px]" : "")}
          value={en}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onEn(e.target.value)}
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="st-label" htmlFor={id + "-gu"}>
            {label} (ગુજરાતી)
          </label>
          <button
            type="button"
            className="st-cta-ledger"
            style={{ fontSize: "0.72rem", paddingBottom: 0 }}
            onClick={() => void autoFill()}
            disabled={translating || !en.trim()}
            title="Auto-convert the English text to Gujarati (you can still edit it)"
          >
            {translating ? "…" : "⇄ Auto ગુજરાતી"}
          </button>
        </div>
        <Input
          id={id + "-gu"}
          className={"st-input st-gujarati" + (multiline ? " min-h-[90px]" : "")}
          value={gu}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onGu(e.target.value)}
        />
      </div>
    </div>
  );
}

function ListPairField({
  id,
  label,
  en,
  gu,
  onEn,
  onGu,
  onBusy,
}: {
  id: string;
  label: string;
  en: string[];
  gu: string[];
  onEn: (v: string[]) => void;
  onGu: (v: string[]) => void;
  onBusy: (msg: string | null) => void;
}) {
  const [translating, setTranslating] = useState(false);
  const autoFill = async () => {
    const items = en.map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    setTranslating(true);
    onBusy(`Converting "${label}" list to Gujarati…`);
    try {
      const joined = await translateToGujarati(items.join("\n"));
      onGu(joined.split("\n").map((s) => s.trim()).filter(Boolean));
      onBusy(null);
    } catch (err) {
      onBusy(`Could not auto-convert "${label}": ${(err as Error).message}`);
    } finally {
      setTranslating(false);
    }
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="st-label" htmlFor={id + "-en"}>
          {label} (English) — one per line
        </label>
        <textarea
          id={id + "-en"}
          className="st-input min-h-[110px]"
          value={en.join("\n")}
          onChange={(e) => onEn(e.target.value.split("\n"))}
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="st-label" htmlFor={id + "-gu"}>
            {label} (ગુજરાતી)
          </label>
          <button
            type="button"
            className="st-cta-ledger"
            style={{ fontSize: "0.72rem", paddingBottom: 0 }}
            onClick={() => void autoFill()}
            disabled={translating}
          >
            {translating ? "…" : "⇄ Auto ગુજરાતી"}
          </button>
        </div>
        <textarea
          id={id + "-gu"}
          className="st-input st-gujarati min-h-[110px]"
          value={gu.join("\n")}
          onChange={(e) => onGu(e.target.value.split("\n"))}
        />
      </div>
    </div>
  );
}

const EVENT_LABEL: Record<EventKey, string> = {
  mandvo: "Mandvo",
  haldi: "Haldi",
  sanji: "Sanji",
  marriage: "Marriage",
};

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
  const [busyNote, setBusyNote] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const set = <K extends keyof WeddingSettings>(key: K, value: WeddingSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setEvent = (key: EventKey, patch: Partial<WeddingSettings["events"][EventKey]>) =>
    setDraft((d) => ({ ...d, events: { ...d.events, [key]: { ...d.events[key], ...patch } } }));

  const clean = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);

  const pair = (id: string, label: string, enKey: keyof WeddingSettings, guKey: keyof WeddingSettings, multiline = false) => (
    <PairField
      id={id}
      label={label}
      en={draft[enKey] as string}
      gu={draft[guKey] as string}
      onEn={(v) => set(enKey, v as never)}
      onGu={(v) => set(guKey, v as never)}
      multiline={multiline}
      onBusy={setBusyNote}
    />
  );

  return (
    <div className="st-panel p-6 sm:p-8" id="settings">
      <h3 className="st-serif text-2xl font-semibold" style={{ color: "var(--st-ink)" }}>
        4 · Wedding details — customise everything
      </h3>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--st-ink-soft)" }}>
        Every word printed on the invitation is editable here, in both languages. Type in English
        and press <strong>⇄ Auto ગુજરાતી</strong> to convert; the Gujarati text stays fully
        editable. Saved details persist and apply to every PDF you generate.
      </p>

      {/* couple */}
      <p className="st-eyebrow mt-8 mb-3">The couple</p>
      <div className="space-y-5">
        {pair("set-bride", "Bride's name", "brideEn", "brideGu")}
        {pair("set-groom", "Groom's name", "groomEn", "groomGu")}
        <div>
          <span className="st-label">Name order on the invitation</span>
          <div className="flex gap-2 pt-1">
            {[true, false].map((first) => (
              <button
                key={String(first)}
                type="button"
                className="st-chip"
                style={
                  draft.brideFirst === first
                    ? { background: "var(--st-gold)", color: "var(--st-card)", borderColor: "var(--st-gold)" }
                    : { opacity: 0.6 }
                }
                onClick={() => set("brideFirst", first)}
              >
                {first
                  ? `${draft.brideEn || "Bride"} ♥ ${draft.groomEn || "Groom"}`
                  : `${draft.groomEn || "Groom"} ♥ ${draft.brideEn || "Bride"}`}
              </button>
            ))}
          </div>
        </div>
        {pair("set-bp", "Bride's parents line", "brideParentsEn", "brideParentsGu")}
        {pair("set-gp", "Groom's parents line", "groomParentsEn", "groomParentsGu")}
      </div>

      {/* dates + venue */}
      <p className="st-eyebrow mt-10 mb-3">Dates &amp; venue</p>
      <div className="space-y-5">
        {pair("set-dates", "Wedding dates line", "datesEn", "datesGu")}
        {pair("set-city", "City", "cityEn", "cityGu")}
        {pair("set-vn", "Venue name", "venueNameEn", "venueNameGu")}
        {pair("set-va", "Venue address", "venueAddressEn", "venueAddressGu")}
        <div>
          <label className="st-label" htmlFor="set-maps">
            "View Location" link (Google Maps)
          </label>
          <input id="set-maps" className="st-input" value={draft.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} placeholder="https://maps.app.goo.gl/…" />
        </div>
      </div>

      {/* texts */}
      <p className="st-eyebrow mt-10 mb-3">Invitation wording</p>
      <div className="space-y-5">
        {pair("set-bless", "Blessing / invitation text", "blessingEn", "blessingGu", true)}
        {pair("set-poem", "Poem line (page 2 footer)", "poemEn", "poemGu", true)}
        {pair("set-close", "Closing line (last page)", "closingEn", "closingGu")}
      </div>

      {/* events */}
      <p className="st-eyebrow mt-10 mb-3">The four events</p>
      <div className="space-y-6">
        {EVENT_KEYS.map((key) => {
          const ev = draft.events[key];
          return (
            <div key={key} className="border p-4" style={{ borderColor: "rgba(140,106,47,0.3)", background: "rgba(140,106,47,0.04)" }}>
              <p className="st-serif mb-4 text-lg font-semibold" style={{ color: "var(--st-red)" }}>
                {EVENT_LABEL[key]} · {ev.titleGu}
              </p>
              <div className="space-y-4">
                <PairField id={`ev-${key}-title`} label="Event name" en={ev.titleEn} gu={ev.titleGu} onEn={(v) => setEvent(key, { titleEn: v })} onGu={(v) => setEvent(key, { titleGu: v })} onBusy={setBusyNote} />
                <PairField id={`ev-${key}-tag`} label="Tagline" en={ev.taglineEn} gu={ev.taglineGu} onEn={(v) => setEvent(key, { taglineEn: v })} onGu={(v) => setEvent(key, { taglineGu: v })} onBusy={setBusyNote} />
                <PairField id={`ev-${key}-date`} label="Date line" en={ev.dateEn} gu={ev.dateGu} onEn={(v) => setEvent(key, { dateEn: v })} onGu={(v) => setEvent(key, { dateGu: v })} onBusy={setBusyNote} />
                <PairField id={`ev-${key}-time`} label="Time line" en={ev.timeEn} gu={ev.timeGu} onEn={(v) => setEvent(key, { timeEn: v })} onGu={(v) => setEvent(key, { timeGu: v })} onBusy={setBusyNote} />
              </div>
            </div>
          );
        })}
      </div>

      {/* family lists */}
      <p className="st-eyebrow mt-10 mb-3">Family page</p>
      <div className="space-y-5">
        <ListPairField id="set-aw" label="Awaiting your presence" en={draft.awaitingEn} gu={draft.awaitingGu} onEn={(v) => set("awaitingEn", v)} onGu={(v) => set("awaitingGu", v)} onBusy={setBusyNote} />
        <ListPairField id="set-wl" label="With love" en={draft.withLoveEn} gu={draft.withLoveGu} onEn={(v) => set("withLoveEn", v)} onGu={(v) => set("withLoveGu", v)} onBusy={setBusyNote} />
        <ListPairField id="set-bw" label="Best wishes" en={draft.bestWishesEn} gu={draft.bestWishesGu} onEn={(v) => set("bestWishesEn", v)} onGu={(v) => set("bestWishesGu", v)} onBusy={setBusyNote} />
      </div>

      {/* whatsapp cloud api */}
      <div className="mt-10 border-t pt-6" style={{ borderColor: "rgba(140,106,47,0.25)" }}>
        <p className="st-eyebrow mb-2">WhatsApp Business API (optional)</p>
        <p className="max-w-2xl text-sm" style={{ color: "var(--st-ink-soft)" }}>
          Not needed if you use the Studio's Chrome extension (see the dispatch section above).
          These fields are only for people who already have a Meta business account.
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

      {busyNote && (
        <p className="mt-4 text-sm font-medium" style={{ color: "var(--st-red)" }}>
          {busyNote}
        </p>
      )}

      <div className="mt-8">
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
        <p className="mt-2 text-xs" style={{ color: "var(--st-sage)" }}>
          Saved details are stored permanently and used for every PDF and preview.
        </p>
      </div>
    </div>
  );
}
