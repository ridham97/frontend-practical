import { useRef, useState } from "react";

import type { ParseResult } from "../../lib/invite/types";
import { downloadTemplate, parseGuestSheet } from "../../lib/invite/excel";

export function UploadDrawer({
  onParsed,
  guestCount,
}: {
  onParsed: (result: ParseResult) => void;
  guestCount: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<ParseResult["issues"]>([]);
  const [lastFile, setLastFile] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const result = await parseGuestSheet(file);
      setIssues(result.issues);
      setLastFile(file.name);
      onParsed(result);
    } catch {
      setIssues([{ row: 0, message: "Could not read that file. Please upload a .xlsx or .csv sheet." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="st-panel p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="st-serif text-2xl font-semibold" style={{ color: "var(--st-ink)" }}>
          1 · The guest sheet
        </h3>
        <button type="button" className="st-cta-ledger" onClick={() => void downloadTemplate()}>
          ⤓ Download Excel template
        </button>
      </div>
      <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--st-ink-soft)" }}>
        Fill the template with each guest's name, WhatsApp number, who the invite addresses
        (Mr. / Mr. &amp; Mrs. / Family), the PDF language (English or Gujarati) and which of the
        four events they are invited to. Then drop it here.
      </p>

      <div
        className={"st-drop mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 px-6 py-12 text-center" + (dragging ? " active" : "")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        role="button"
        aria-label="Upload guest sheet"
      >
        <span className="text-3xl" aria-hidden>
          🗂
        </span>
        <span className="st-serif text-xl font-semibold" style={{ color: "var(--st-ink)" }}>
          {busy ? "Reading the sheet…" : "Drop the guest sheet here, or click to browse"}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--st-sage)" }}>
          .xlsx · .xls · .csv
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {lastFile && (
        <p className="mt-4 text-sm" style={{ color: "var(--st-sage)" }}>
          Loaded <strong style={{ color: "var(--st-ink)" }}>{lastFile}</strong>: {guestCount} guest
          {guestCount === 1 ? "" : "s"} in the ledger.
        </p>
      )}

      {issues.length > 0 && (
        <div
          className="mt-4 border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(164,74,63,0.4)", background: "rgba(164,74,63,0.06)", color: "var(--st-red)" }}
        >
          <p className="font-semibold">Sheet notes ({issues.length}):</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {issues.slice(0, 8).map((issue, i) => (
              <li key={i}>
                {issue.row > 0 ? `Row ${issue.row}: ` : ""}
                {issue.message}
              </li>
            ))}
            {issues.length > 8 && <li>…and {issues.length - 8} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
