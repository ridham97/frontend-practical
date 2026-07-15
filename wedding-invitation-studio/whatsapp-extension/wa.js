// Runs on WhatsApp Web. If the background has a pending job for this tab, it
// waits for the chat to open, attaches the PDF via a synthetic paste, fills
// the caption with the personalized message and presses send.
(async () => {
  const job = await new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: "arwa_get_job" }, (res) => {
      void chrome.runtime.lastError;
      resolve(res || null);
    })
  );
  if (!job) return; // normal WhatsApp browsing, stay inert

  const report = (ok, error) =>
    chrome.runtime.sendMessage({ type: "arwa_done", ok, error }, () => void chrome.runtime.lastError);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitFor = async (finder, timeoutMs, stepMs = 400) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const el = finder();
        if (el) return el;
      } catch (e) {}
      await sleep(stepMs);
    }
    return null;
  };

  const banner = document.createElement("div");
  banner.textContent = "Amee ♥ Ridham studio: sending invitation to " + job.phone + "…";
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:99999;background:#233D35;color:#F7F1E5;padding:8px 14px;font:13px sans-serif;text-align:center";
  document.documentElement.appendChild(banner);

  try {
    // 1. Wait for the conversation composer (means chat is open + logged in).
    const composer = await waitFor(
      () => document.querySelector('footer div[contenteditable="true"]'),
      120000,
      600
    );
    if (!composer) throw new Error("WhatsApp chat did not open. Make sure WhatsApp Web is logged in.");
    await sleep(1800);

    // 2. Attach the PDF by simulating a paste of the file into the composer.
    const bytes = Uint8Array.from(atob(job.pdfBase64), (c) => c.charCodeAt(0));
    const file = new File([bytes], job.filename || "invitation.pdf", { type: "application/pdf" });
    const dt = new DataTransfer();
    dt.items.add(file);
    composer.focus();
    const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: dt });
    composer.dispatchEvent(paste);

    // 3. Wait for the attachment preview's send button.
    const findSendButton = () => {
      const icons = document.querySelectorAll('span[data-icon="send"], span[data-icon="wds-ic-send-filled"], [aria-label="Send"]');
      for (const el of icons) {
        const btn = el.closest('[role="button"], button') || el;
        if (btn && btn.offsetParent !== null) return btn;
      }
      return null;
    };
    const sendBtn = await waitFor(findSendButton, 30000);
    if (!sendBtn) throw new Error("Could not find the send button after attaching the PDF. WhatsApp may have updated its layout.");

    // 4. Best effort: type the personalized message into the caption box.
    let captionDone = false;
    try {
      const editables = [...document.querySelectorAll('div[contenteditable="true"]')].filter(
        (el) => el.offsetParent !== null && el !== composer
      );
      const caption = editables[editables.length - 1];
      if (caption && job.message) {
        caption.focus();
        document.execCommand("insertText", false, job.message);
        await sleep(500);
        captionDone = true;
      }
    } catch (e) {}

    sendBtn.click();
    await sleep(2500);

    // 5. If the caption could not be set, send the message as a follow-up text.
    if (!captionDone && job.message) {
      const chatBox = await waitFor(() => document.querySelector('footer div[contenteditable="true"]'), 15000);
      if (chatBox) {
        chatBox.focus();
        document.execCommand("insertText", false, job.message);
        await sleep(600);
        const textSend = findSendButton();
        if (textSend) {
          textSend.click();
          await sleep(1500);
        }
      }
    }

    banner.textContent = "Invitation sent ✓ — this tab will close by itself.";
    banner.style.background = "#1F7A53";
    report(true);
  } catch (err) {
    banner.textContent = "Could not send automatically: " + (err && err.message ? err.message : err);
    banner.style.background = "#A44A3F";
    report(false, err && err.message ? err.message : String(err));
  }
})();
