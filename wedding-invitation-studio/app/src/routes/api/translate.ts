// English → Gujarati helper for the customization form. Uses the public
// Google Translate web endpoint (no key needed) via the server so the browser
// never hits a CORS wall. The result is only a first draft — every Gujarati
// field in the form stays manually editable.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let text = "";
        try {
          const body = (await request.json()) as { text?: string };
          text = String(body.text ?? "").slice(0, 1500);
        } catch {
          return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
        }
        if (!text.trim()) return Response.json({ ok: true, text: "" });

        // Primary: Google's public web endpoint. Fallback: MyMemory (also free).
        try {
          const url =
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=gu&dt=t&q=" +
            encodeURIComponent(text);
          const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          });
          if (res.ok) {
            const data = (await res.json()) as unknown[];
            const segments = Array.isArray(data?.[0]) ? (data[0] as unknown[][]) : [];
            const translated = segments
              .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
              .join("");
            if (translated.trim()) return Response.json({ ok: true, text: translated });
          }
        } catch {
          // fall through to MyMemory
        }

        try {
          // MyMemory takes one line at a time; translate line-by-line so name
          // lists convert cleanly.
          const lines = text.split("\n");
          const out: string[] = [];
          for (const line of lines) {
            if (!line.trim()) {
              out.push("");
              continue;
            }
            const res = await fetch(
              "https://api.mymemory.translated.net/get?langpair=en%7Cgu&q=" + encodeURIComponent(line.slice(0, 490)),
            );
            if (!res.ok) throw new Error(`fallback returned ${res.status}`);
            const data = (await res.json()) as { responseData?: { translatedText?: string } };
            out.push(data.responseData?.translatedText ?? "");
          }
          const translated = out.join("\n");
          if (!translated.trim()) throw new Error("empty result");
          return Response.json({ ok: true, text: translated });
        } catch {
          return Response.json(
            { ok: false, error: "Translation services are busy right now. Please try again in a minute or type the Gujarati manually." },
            { status: 502 },
          );
        }
      },
    },
  },
});
