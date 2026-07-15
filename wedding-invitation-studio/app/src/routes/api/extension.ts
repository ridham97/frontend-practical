// Serves the WhatsApp sender extension zip as an explicit file download, so
// it works even in webviews or browsers that mishandle static zip links.
import { createFileRoute } from "@tanstack/react-router";

import { EXTENSION_ZIP_BASE64 } from "../../lib/extension-zip.server";

export const Route = createFileRoute("/api/extension")({
  server: {
    handlers: {
      GET: async () => {
        const bytes = Uint8Array.from(atob(EXTENSION_ZIP_BASE64), (c) => c.charCodeAt(0));
        return new Response(bytes, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": 'attachment; filename="amee-ridham-whatsapp-sender.zip"',
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
