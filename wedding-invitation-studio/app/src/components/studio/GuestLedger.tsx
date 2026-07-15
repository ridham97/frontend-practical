import { useState } from "react";

import type { EventKey, Guest, InviteType, Lang } from "../../lib/invite/types";
import { EVENT_KEYS } from "../../lib/invite/types";
import { EVENTS, SALUTATIONS, guestLine } from "../../lib/invite/wedding-data";
import { normalizePhone } from "../../lib/invite/excel";

const EVENT_INITIALS: Record<EventKey, string> = {
  mandvo: "M",
  haldi: "H",
  sanji: "S",
  marriage: "L",
};

function formatPhone(phone: string): string {
  if (phone.length !== 12) return phone || "(none)";
  return `+${phone.slice(0, 2)} ${phone.slice(2, 7)} ${phone.slice(7)}`;
}

export interface LedgerActions {
  onPreview: (guest: Guest) => void;
  onDownload: (guest: Guest) => void;
  onSend: (guest: Guest) => void;
  onToggleSent: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
  onAdd: (draft: { name: string; phone: string; inviteType: InviteType; language: Lang; events: EventKey[] }) => void;
  onDownloadAll: () => void;
  onSendNext: () => void;
  busyGuestId: string | null;
  zipBusy: boolean;
}

export function GuestLedger({ guests, actions }: { guests: Guest[]; actions: LedgerActions }) {
  const pending = guests.filter((g) => g.status === "pending").length;

  return (
    <div className="st-panel p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="st-serif text-2xl font-semibold" style={{ color: "var(--st-ink)" }}>
            2 · The guest ledger
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--st-ink-soft)" }}>
            {guests.length} guest{guests.length === 1 ? "" : "s"} · {pending} awaiting dispatch
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="st-cta-ledger" onClick={actions.onDownloadAll} disabled={!guests.length || actions.zipBusy}>
            {actions.zipBusy ? "Bundling…" : "⤓ Download all PDFs (zip)"}
          </button>
          <button type="button" className="st-cta-wa" onClick={actions.onSendNext} disabled={pending === 0}>
            ➤ Send next pending
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="st-table min-w-[860px]">
          <thead>
            <tr>
              <th>Guest</th>
              <th>WhatsApp</th>
              <th>Invite for</th>
              <th>Language</th>
              <th>Events</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm" style={{ color: "var(--st-sage)" }}>
                  The ledger is empty. Upload a guest sheet or add a guest below.
                </td>
              </tr>
            )}
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td>
                  <div className="font-semibold" style={{ color: "var(--st-ink)" }}>
                    {guest.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--st-sage)" }}>
                    {guestLine(guest.name, guest.inviteType, guest.language)}
                  </div>
                </td>
                <td style={{ color: "var(--st-ink-soft)" }}>{formatPhone(guest.phone)}</td>
                <td>
                  <span className="st-chip">{guest.inviteType === "family" ? "Family" : SALUTATIONS[guest.inviteType].en}</span>
                </td>
                <td>
                  <span className={"st-chip " + (guest.language === "gujarati" ? "red" : "sage")}>
                    {guest.language === "gujarati" ? "ગુજરાતી" : "English"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1" title={guest.events.map((e) => EVENTS[e].titleEn).join(", ")}>
                    {EVENT_KEYS.map((key) => {
                      const active = guest.events.includes(key);
                      return (
                        <span
                          key={key}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            background: active ? "var(--st-gold)" : "rgba(140,106,47,0.12)",
                            color: active ? "var(--st-card)" : "rgba(140,106,47,0.5)",
                          }}
                        >
                          {EVENT_INITIALS[key]}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => actions.onToggleSent(guest)}
                    className="st-chip"
                    style={
                      guest.status === "sent"
                        ? { borderColor: "rgba(31,122,83,0.5)", background: "rgba(31,122,83,0.1)", color: "var(--st-wa)" }
                        : undefined
                    }
                    title="Click to toggle sent / pending"
                  >
                    {guest.status === "sent" ? "✓ Sent" : "Pending"}
                  </button>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" className="st-icon-btn" title="Preview in the proof loupe" onClick={() => actions.onPreview(guest)}>
                      👁
                    </button>
                    <button type="button" className="st-icon-btn" title="Download this PDF" onClick={() => actions.onDownload(guest)}>
                      ⤓
                    </button>
                    <button
                      type="button"
                      className="st-cta-wa"
                      disabled={!guest.phone || actions.busyGuestId === guest.id}
                      onClick={() => actions.onSend(guest)}
                      title={guest.phone ? "Send this invitation on WhatsApp" : "No valid phone number"}
                    >
                      {actions.busyGuestId === guest.id ? "…" : "WhatsApp"}
                    </button>
                    <button type="button" className="st-icon-btn danger" title="Remove guest" onClick={() => actions.onDelete(guest)}>
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddGuestRow onAdd={actions.onAdd} />
    </div>
  );
}

function AddGuestRow({ onAdd }: { onAdd: LedgerActions["onAdd"] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteType, setInviteType] = useState<InviteType>("family");
  const [language, setLanguage] = useState<Lang>("english");
  const [events, setEvents] = useState<EventKey[]>([...EVENT_KEYS]);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) {
      setError("Please enter the guest's name.");
      return;
    }
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Please enter a valid 10-digit WhatsApp number.");
      return;
    }
    if (!events.length) {
      setError("Pick at least one event.");
      return;
    }
    onAdd({ name: name.trim(), phone: normalized, inviteType, language, events });
    setName("");
    setPhone("");
    setEvents([...EVENT_KEYS]);
    setError(null);
  };

  return (
    <div className="mt-8 border-t pt-6" style={{ borderColor: "rgba(140,106,47,0.25)" }}>
      <p className="st-eyebrow mb-4">Add a guest by hand</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <label className="st-label" htmlFor="add-name">Name</label>
          <input id="add-name" className="st-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" />
        </div>
        <div>
          <label className="st-label" htmlFor="add-phone">WhatsApp number</label>
          <input id="add-phone" className="st-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="99985 75131" inputMode="tel" />
        </div>
        <div>
          <label className="st-label" htmlFor="add-type">Invite for</label>
          <select id="add-type" className="st-input" value={inviteType} onChange={(e) => setInviteType(e.target.value as InviteType)}>
            <option value="mr">Mr. only</option>
            <option value="mrmrs">Mr. &amp; Mrs.</option>
            <option value="family">Whole family</option>
          </select>
        </div>
        <div>
          <label className="st-label" htmlFor="add-lang">PDF language</label>
          <select id="add-lang" className="st-input" value={language} onChange={(e) => setLanguage(e.target.value as Lang)}>
            <option value="english">English</option>
            <option value="gujarati">Gujarati</option>
          </select>
        </div>
        <div>
          <span className="st-label">Events</span>
          <div className="flex flex-wrap gap-2 pt-1">
            {EVENT_KEYS.map((key) => {
              const active = events.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  className="st-chip"
                  style={
                    active
                      ? { background: "var(--st-gold)", color: "var(--st-card)", borderColor: "var(--st-gold)" }
                      : { opacity: 0.55 }
                  }
                  onClick={() => setEvents((prev) => (active ? prev.filter((k) => k !== key) : [...EVENT_KEYS.filter((k) => prev.includes(k) || k === key)]))}
                >
                  {EVENTS[key].titleEn}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm font-medium" style={{ color: "var(--st-red)" }}>
          {error}
        </p>
      )}
      <div className="mt-4">
        <button type="button" className="st-cta-seal" onClick={submit}>
          <span className="seal-dot" aria-hidden />
          Add to ledger
        </button>
      </div>
    </div>
  );
}
