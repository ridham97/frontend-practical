// Runs on WhatsApp Web. If the background has a pending job for this tab, it
// waits for the chat to open, attaches the PDF via a synthetic paste, fills
// the caption with the personalized message and sends it. Sending tries the
// send button first and falls back to pressing Enter, which WhatsApp always
// accepts for attachments, so it keeps working across WhatsApp redesigns.
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

  const visible = (el) => !!el && el.offsetParent !== null;

  // Every editable box currently on screen (composer, caption, search...).
  const editables = () => [...document.querySelectorAll('div[contenteditable="true"]')].filter(visible);

  // Language-neutral send-button hunt: icon names first, aria-labels second.
  const findSendButton = () => {
    const selectors = [
      'span[data-icon="send"]',
      'span[data-icon="wds-ic-send-filled"]',
      'span[data-icon="wds-ic-send"]',
      'span[data-icon*="send"]',
      '[data-testid="send"]',
      'button[aria-label="Send"]',
      'div[role="button"][aria-label="Send"]',
    ];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const btn = el.closest('[role="button"], button') || el;
        if (visible(btn)) return btn;
      }
    }
    return null;
  };

  const pressEnter = (target) => {
    const opts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
    target.dispatchEvent(new KeyboardEvent("keydown", opts));
    target.dispatchEvent(new KeyboardEvent("keypress", opts));
    target.dispatchEvent(new KeyboardEvent("keyup", opts));
  };

  const banner = document.createElement("div");
  banner.textContent = "Amee ♥ Ridham studio: sending invitation to " + job.phone + "…";
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:99999;background:#233D35;color:#F7F1E5;padding:8px 14px;font:13px sans-serif;text-align:center";
  document.documentElement.appendChild(banner);

  try {
    // 1. Wait for the conversation composer (chat open + logged in).
    const composer = await waitFor(
      () => document.querySelector('footer div[contenteditable="true"]'),
      120000,
      600
    );
    if (!composer) throw new Error("WhatsApp chat did not open. Make sure WhatsApp Web is logged in.");
    await sleep(1800);
    const editablesBefore = editables().length;

    // 2. Attach the PDF by simulating a paste of the file into the composer.
    const bytes = Uint8Array.from(atob(job.pdfBase64), (c) => c.charCodeAt(0));
    const file = new File([bytes], job.filename || "invitation.pdf", { type: "application/pdf" });
    const dt = new DataTransfer();
    dt.items.add(file);
    composer.focus();
    const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: dt });
    composer.dispatchEvent(paste);

    // 3. Wait for the attachment preview: a send button OR a new caption box.
    const previewReady = await waitFor(
      () => (findSendButton() || editables().length > editablesBefore ? true : null),
      30000
    );
    if (!previewReady) throw new Error("The attachment preview did not appear. Try once more, or check the WhatsApp Web tab.");
    await sleep(900);

    // 4. Best effort: type the personalized message into the caption box.
    let captionTarget = null;
    try {
      const boxes = editables().filter((el) => el !== composer);
      captionTarget = boxes[boxes.length - 1] || null;
      if (captionTarget && job.message) {
        captionTarget.focus();
        document.execCommand("insertText", false, job.message);
        await sleep(500);
      }
    } catch (e) {}

    // 5. Send: click the button if we can find it, otherwise press Enter
    //    (WhatsApp sends the attachment on Enter from the caption box).
    const sendBtn = findSendButton();
    if (sendBtn) {
      sendBtn.click();
    } else {
      pressEnter(captionTarget || document.activeElement || composer);
    }
    await sleep(2500);

    // 6. If a send control is still on screen the preview did not close; try
    //    Enter once more before giving up.
    if (findSendButton()) {
      pressEnter(document.activeElement || captionTarget || composer);
      await sleep(2000);
    }
    if (findSendButton()) {
      throw new Error("WhatsApp did not confirm the send. Please check the tab and press its send button once.");
    }

    // 7. If the caption never went in, send the message as a follow-up text.
    if (!captionTarget && job.message) {
      const chatBox = await waitFor(() => document.querySelector('footer div[contenteditable="true"]'), 15000);
      if (chatBox) {
        chatBox.focus();
        document.execCommand("insertText", false, job.message);
        await sleep(600);
        const textSend = findSendButton();
        if (textSend) textSend.click();
        else pressEnter(chatBox);
        await sleep(1500);
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
