// Runs on the Invitation Studio page. Relays send requests from the page to
// the extension background, and results back to the page.
let port = null;

function getPort() {
  if (!port) {
    port = chrome.runtime.connect({ name: "arwa" });
    port.onMessage.addListener((msg) => {
      if (msg && msg.type === "result") {
        window.postMessage({ type: "ARWA_RESULT", id: msg.id, ok: msg.ok, error: msg.error }, "*");
      }
    });
    port.onDisconnect.addListener(() => {
      port = null;
    });
  }
  return port;
}

window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data) return;
  if (e.data.type === "ARWA_PING") {
    window.postMessage({ type: "ARWA_PONG" }, "*");
  }
  if (e.data.type === "ARWA_SEND") {
    const { id, phone, message, filename, pdfBase64 } = e.data;
    try {
      getPort().postMessage({ type: "send", id, phone, message, filename, pdfBase64 });
    } catch (err) {
      window.postMessage({ type: "ARWA_RESULT", id, ok: false, error: "Extension was reloaded. Refresh the page and try again." }, "*");
    }
  }
});

window.postMessage({ type: "ARWA_PONG" }, "*");
