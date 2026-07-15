// Background service worker: opens a WhatsApp Web tab per send job and
// shuttles the job to the automation content script.
const jobsByTab = new Map(); // tabId -> { job, port }

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "arwa") return;
  port.onMessage.addListener((msg) => {
    if (msg && msg.type === "send") {
      const url = "https://web.whatsapp.com/send?phone=" + encodeURIComponent(msg.phone);
      chrome.tabs.create({ url, active: true }, (tab) => {
        jobsByTab.set(tab.id, { job: msg, port });
        // Safety timeout: report failure if the tab never confirms.
        setTimeout(() => {
          if (jobsByTab.has(tab.id)) {
            const { job, port: p } = jobsByTab.get(tab.id);
            jobsByTab.delete(tab.id);
            try {
              p.postMessage({ type: "result", id: job.id, ok: false, error: "Timed out waiting for WhatsApp Web. Is it logged in?" });
            } catch (e) {}
          }
        }, 170000);
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab && sender.tab.id;
  if (!tabId || !jobsByTab.has(tabId)) {
    if (msg && msg.type === "arwa_get_job") sendResponse(null);
    return;
  }
  const entry = jobsByTab.get(tabId);
  if (msg.type === "arwa_get_job") {
    sendResponse({
      id: entry.job.id,
      phone: entry.job.phone,
      message: entry.job.message,
      filename: entry.job.filename,
      pdfBase64: entry.job.pdfBase64,
    });
    return;
  }
  if (msg.type === "arwa_done") {
    jobsByTab.delete(tabId);
    try {
      entry.port.postMessage({ type: "result", id: entry.job.id, ok: !!msg.ok, error: msg.error });
    } catch (e) {}
    if (msg.ok) {
      setTimeout(() => chrome.tabs.remove(tabId, () => chrome.runtime.lastError), 3500);
    }
    sendResponse({});
  }
});
